package com.dailyjournal.security;

import com.dailyjournal.entity.UserSession;
import com.dailyjournal.service.SessionService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

/**
 * Non-intrusive Session Authentication Filter
 * Enhances JWT authentication with session tracking without breaking existing functionality
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SessionAuthenticationFilter extends OncePerRequestFilter {
    
    private final SessionService sessionService;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        try {
            // Only validate session if user is already authenticated by JWT
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication != null && authentication.isAuthenticated() && 
                !"anonymousUser".equals(authentication.getPrincipal())) {
                
                // Try to extract and validate session with sliding expiration
                Optional<String> sessionIdOpt = sessionService.extractSessionId(request);
                
                if (sessionIdOpt.isPresent()) {
                    String sessionId = sessionIdOpt.get();
                    // Use validateAndRefreshSession for automatic sliding expiration
                    Optional<UserSession> sessionOpt = sessionService.validateAndRefreshSession(sessionId);
                    
                    if (sessionOpt.isEmpty()) {
                        // Session is invalid/expired - clear cookie but continue request
                        log.debug("Invalid/expired session {} - clearing cookie", sessionId);
                        sessionService.clearSessionCookie(response);
                        
                        // Add header to indicate session expiry for frontend handling
                        response.addHeader("X-Session-Expired", "true");
                    } else {
                        UserSession session = sessionOpt.get();
                        // Session is valid - add to request attributes for potential use
                        request.setAttribute("userSession", session);
                        
                        // Add session info headers for frontend monitoring
                        response.addHeader("X-Session-Valid", "true");
                        response.addHeader("X-Session-Expires", session.getExpiresAt().toString());
                        
                        log.trace("Valid session {} for request {} (expires: {})", 
                                sessionId, request.getRequestURI(), session.getExpiresAt());
                    }
                } else {
                    // No session cookie but user is authenticated via JWT - this is normal
                    log.trace("No session cookie for authenticated request: {}", request.getRequestURI());
                }
            }
            
        } catch (Exception e) {
            // Log error but never block the request - session is enhancement only
            log.error("Session validation error (continuing): {}", e.getMessage());
        }
        
        // Always continue the filter chain
        filterChain.doFilter(request, response);
    }
    
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        
        // Skip session validation for public endpoints
        return path.startsWith("/api/auth/") || 
               path.startsWith("/api/users/register") ||
               path.startsWith("/api/journals/public/") ||
               path.startsWith("/api/journals/media/") ||
               path.startsWith("/uploads/") ||
               path.startsWith("/error") ||
               path.startsWith("/actuator/") ||
               path.startsWith("/swagger-ui/") ||
               path.startsWith("/v3/api-docs/");
    }
}
