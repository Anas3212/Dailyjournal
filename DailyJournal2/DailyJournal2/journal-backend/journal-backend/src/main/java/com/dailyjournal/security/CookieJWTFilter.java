package com.dailyjournal.security;

import com.dailyjournal.entity.User;
import com.dailyjournal.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Cookie-based JWT Authentication Filter
 * Handles secure authentication using HttpOnly cookies
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CookieJWTFilter extends OncePerRequestFilter {

    private final CookieJWTService cookieJWTService; // Cookie-based JWT service
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();
        
        // Let CORS filter handle OPTIONS requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // Try cookie-based authentication first
        boolean authenticated = authenticateWithCookie(request);
        
        if (authenticated) {
            log.debug("Authentication successful via cookie for: {}", uri);
        }
        // If not authenticated, check if it's a public endpoint
        else if (isPublicEndpoint(uri) && !uri.startsWith("/api/journals/media/")) {
            // Check if we have expired tokens and should return 401 for refresh, UNLESS it's a GET request to a public endpoint where anonymous is okay
            if (hasExpiredTokens(request) && !request.getMethod().equalsIgnoreCase("GET")) {
                log.debug("Expired tokens found on non-GET public endpoint, returning 401 for refresh: {}", uri);
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.getWriter().write("{\"error\":\"Access token expired\",\"code\":\"TOKEN_EXPIRED\"}");
                response.setContentType("application/json");
                return;
            }
            log.debug("Public endpoint accessed anonymously: {}", uri);
        }
        // If it's a private endpoint and not authenticated, check for expired tokens
        else if (hasExpiredTokens(request)) {
            log.debug("Expired tokens found, returning 401 for refresh: {}", uri);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"Access token expired\",\"code\":\"TOKEN_EXPIRED\"}");
            response.setContentType("application/json");
            return;
        }

        // Proceed with the filter chain

        filterChain.doFilter(request, response);
    }

    /**
     * Authenticate using cookie-based JWT tokens
     */
    private boolean authenticateWithCookie(HttpServletRequest request) {
        try {
            // Extract access token from cookie
            Optional<String> accessTokenOpt = cookieJWTService.extractAccessTokenFromCookies(request);
            
            if (accessTokenOpt.isEmpty()) {
                return false;
            }

            String accessToken = accessTokenOpt.get();
            String userEmail = cookieJWTService.extractUsername(accessToken);

            if (userEmail == null || SecurityContextHolder.getContext().getAuthentication() != null) {
                return false;
            }

            // Get user and validate
            User user = userRepository.findByEmail(userEmail).orElse(null);
            if (user == null || !user.isEnabled()) {
                return false;
            }

            // Validate token
            if (!cookieJWTService.isTokenValid(accessToken, user.getEmail())) {
                log.debug("Invalid or expired access token for user: {}", userEmail);
                return false;
            }

            // Set authentication context
            setAuthenticationContext(user);
            return true;

        } catch (Exception e) {
            log.debug("Cookie authentication failed: {}", e.getMessage());
            return false;
        }
    }


    /**
     * Set authentication context for the user
     */
    private void setAuthenticationContext(User user) {
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                user,
                null,
                user.getRoles().stream()
                        .map(role -> new SimpleGrantedAuthority(role.getName()))
                        .collect(Collectors.toList())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    /**
     * Check if the endpoint is public and doesn't require authentication
     */
    private boolean isPublicEndpoint(String uri) {
        return uri.startsWith("/api/auth/") ||
               uri.startsWith("/swagger-ui/") ||
               uri.startsWith("/v3/api-docs/") ||
               uri.startsWith("/api/users/profile-photo/") ||
               uri.startsWith("/uploads/") ||
               uri.equals("/api/reports/reasons") ||
               uri.startsWith("/api/journals/published") ||
               uri.startsWith("/api/discussions/journal/") ||
               uri.startsWith("/error");
    }

    /**
     * Check if request has expired access tokens that should trigger 401 for refresh
     */
    private boolean hasExpiredTokens(HttpServletRequest request) {
        try {
            // Check if we have access token cookie
            Optional<String> accessTokenOpt = cookieJWTService.extractAccessTokenFromCookies(request);
            
            if (accessTokenOpt.isPresent()) {
                String accessToken = accessTokenOpt.get();
                String userEmail = cookieJWTService.extractUsername(accessToken);
                
                // If we can extract username but token is invalid (likely expired)
                if (userEmail != null) {
                    User user = userRepository.findByEmail(userEmail).orElse(null);
                    if (user != null && !cookieJWTService.isTokenValid(accessToken, user.getEmail())) {
                        // Token exists but is expired - should trigger refresh
                        return true;
                    }
                }
            }
            
            return false;
        } catch (Exception e) {
            log.debug("Error checking for expired tokens: {}", e.getMessage());
            return false;
        }
    }
}
