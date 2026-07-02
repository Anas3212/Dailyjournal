package com.dailyjournal.config;

import com.dailyjournal.security.CookieJWTFilter;
import com.dailyjournal.security.SessionAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Enhanced Security Configuration with JWT + Session Management
 * Provides dual-layer security with JWT tokens and session tracking
 */
@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    // Primary JWT authentication filter
    private final CookieJWTFilter cookieJWTFilter;
    
    // Session management filter for enhanced security
    private final SessionAuthenticationFilter sessionAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // OPTIONS requests for CORS
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        
                        // Public endpoints
                        .requestMatchers(
                                "/api/auth/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/api/users/profile-photo/**",
                                "/uploads/**",
                                "/api/reports/reasons"
                        ).permitAll()
                        // Media endpoints - allow both authenticated and unauthenticated access
                        .requestMatchers("/api/journals/media/**").permitAll()
                        .requestMatchers(
                                "/api/users/upload-photo",
                                "/api/users/me",
                                "/api/users/update",
                                "/api/users/search",
                                "/api/users/community-members",
                                "/api/users/community-members/**",
                                "/api/users/search-communities",
                                "/api/journals/**",
                                "/api/friends/**",
                                "/api/teams/**",
                                "/api/comments/**",
                                "/api/discussions/**",
                                "/api/reports/**",
                                "/api/workshop/**",
                                "/api/sessions/**"
                        ).authenticated()
                        .requestMatchers(
                                "/api/users/all", 
                                "/api/users/{id}", 
                                "/api/journals/admin/**",
                                "/api/admin/**"
                        ).hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                // Add JWT authentication filter first
                .addFilterBefore(cookieJWTFilter, UsernamePasswordAuthenticationFilter.class)
                // Add session management filter after JWT authentication
                .addFilterAfter(sessionAuthenticationFilter, CookieJWTFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        
        // Allow credentials for cookie-based authentication
        config.setAllowCredentials(true);
        
        // Allow specific origins from environment
        config.setAllowedOriginPatterns(Arrays.asList(allowedOrigins.split(",")));
        
        // Allow all HTTP methods
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        
        // Allow all headers
        config.setAllowedHeaders(List.of("*"));
        
        // Expose headers that the frontend might need
        config.setExposedHeaders(List.of(
                "Authorization", 
                "Set-Cookie", 
                "X-Total-Count",
                "Access-Control-Allow-Origin",
                "Access-Control-Allow-Credentials"
        ));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
