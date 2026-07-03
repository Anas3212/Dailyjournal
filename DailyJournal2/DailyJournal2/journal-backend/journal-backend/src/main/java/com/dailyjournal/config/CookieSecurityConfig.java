package com.dailyjournal.config;

import com.dailyjournal.security.CookieJWTFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import java.util.Arrays;
import java.util.List;

/**
 * Enhanced Security Configuration supporting Cookie-based JWT Authentication
 * Maintains backward compatibility with existing header-based authentication
 */
// @Configuration - DISABLED to avoid bean conflicts
// @EnableMethodSecurity
@RequiredArgsConstructor
public class CookieSecurityConfig {

    private final CookieJWTFilter cookieJWTFilter;

    @Value("${app.cors.allowed-origins}")
    private String corsAllowedOrigins;

    // @Bean - DISABLED to avoid bean conflicts
    // @Primary
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
                                "/api/auth/**",           // Both old and new auth endpoints
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/api/users/profile-photo/**",
                                "/uploads/**",
                                "/api/journals/media/**",
                                "/api/reports/reasons",
                                "/error"
                        ).permitAll()
                        
                        // Authenticated endpoints
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
                                "/api/workshop/**"
                        ).authenticated()
                        
                        // Admin-only endpoints
                        .requestMatchers(
                                "/api/users/all", 
                                "/api/users/{id}", 
                                "/api/journals/admin/**",
                                "/api/admin/**"
                        ).hasRole("ADMIN")
                        
                        // All other requests require authentication
                        .anyRequest().authenticated()
                )
                // Return 401 Unauthorized instead of 403 Forbidden for missing credentials
                .exceptionHandling(e -> e.authenticationEntryPoint(new org.springframework.security.web.authentication.HttpStatusEntryPoint(org.springframework.http.HttpStatus.UNAUTHORIZED)))
                // Use the enhanced filter that supports both cookie and header authentication
                .addFilterBefore(cookieJWTFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }


    // @Bean - DISABLED to avoid bean conflicts
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        
        // Allow credentials for cookie-based authentication
        config.setAllowCredentials(true);
        
        // Allow specific origins from application.properties
        config.setAllowedOriginPatterns(Arrays.asList(corsAllowedOrigins.split(",")));
        
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
