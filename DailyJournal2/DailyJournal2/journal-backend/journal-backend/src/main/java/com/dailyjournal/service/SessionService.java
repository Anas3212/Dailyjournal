package com.dailyjournal.service;

import com.dailyjournal.entity.UserSession;
import com.dailyjournal.repository.UserSessionRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Enterprise-grade Session Management Service
 * Provides robust session tracking, security, and management capabilities
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SessionService {
    
    private final UserSessionRepository sessionRepository;
    private final SecureRandom secureRandom = new SecureRandom();
    
    // Configuration properties with defaults
    @Value("${app.session.cookie-name:dj_session}")
    private String sessionCookieName;
    
    @Value("${app.session.timeout-hours:8}")
    private int sessionTimeoutHours;
    
    @Value("${app.session.max-sessions-per-user:10}")
    private int maxSessionsPerUser;
    
    @Value("${app.session.cookie.secure:false}")
    private boolean secureCookie;
    
    @Value("${app.session.cookie.same-site:Lax}")
    private String sameSite;
    
    @Value("${app.session.cookie.http-only:true}")
    private boolean httpOnly;
    
    /**
     * Create new session for user with comprehensive tracking
     */
    @Transactional
    public UserSession createSession(Long userId, String jwtToken, HttpServletRequest request, HttpServletResponse response) {
        try {
            // Generate unique session ID
            String sessionId = generateSecureSessionId();
            
            // Hash JWT token for secure storage
            String jwtHash = hashToken(jwtToken);
            
            // Extract request metadata
            String ipAddress = extractClientIpAddress(request);
            String userAgent = extractUserAgent(request);
            String deviceType = determineDeviceType(userAgent);
            String location = determineLocation(ipAddress);
            
            // Calculate expiration
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime expiresAt = now.plusHours(sessionTimeoutHours);
            
            // Create session entity
            UserSession session = UserSession.builder()
                    .sessionId(sessionId)
                    .userId(userId)
                    .jwtTokenHash(jwtHash)
                    .createdAt(now)
                    .expiresAt(expiresAt)
                    .lastAccessedAt(now)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .deviceType(deviceType)
                    .location(location)
                    .isActive(true)
                    .build();
            
            // Enforce session limits before creating new session
            enforceSessionLimits(userId);
            
            // Save session
            session = sessionRepository.save(session);
            
            // Set secure session cookie
            setSecureSessionCookie(response, sessionId);
            
            log.info("Created session {} for user {} from IP {} ({})", 
                    sessionId, userId, ipAddress, deviceType);
            
            return session;
            
        } catch (Exception e) {
            log.error("Failed to create session for user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Session creation failed", e);
        }
    }
    
    /**
     * Validate session with comprehensive security checks and sliding expiration
     */
    @Transactional
    public Optional<UserSession> validateSession(String sessionId) {
        return validateSession(sessionId, true);
    }
    
    /**
     * Validate session with optional sliding expiration
     */
    @Transactional
    public Optional<UserSession> validateSession(String sessionId, boolean enableSlidingExpiration) {
        if (sessionId == null || sessionId.trim().isEmpty()) {
            log.debug("Invalid session ID provided: null or empty");
            return Optional.empty();
        }
        
        try {
            Optional<UserSession> sessionOpt = sessionRepository.findBySessionIdAndIsActiveTrue(sessionId);
            
            if (sessionOpt.isEmpty()) {
                log.debug("Session not found or inactive: {}", sessionId);
                return Optional.empty();
            }
            
            UserSession session = sessionOpt.get();
            LocalDateTime now = LocalDateTime.now();
            
            // Check if session is expired
            if (session.isExpired()) {
                log.info("Session expired: {} (expired at: {}, current time: {})", 
                        sessionId, session.getExpiresAt(), now);
                revokeSession(sessionId, "Session expired");
                return Optional.empty();
            }
            
            // Check if session is close to expiry and extend if sliding expiration is enabled
            if (enableSlidingExpiration && isSessionNearExpiry(session)) {
                extendSessionExpiration(session);
                log.debug("Extended session {} due to activity (new expiry: {})", 
                        sessionId, session.getExpiresAt());
            }
            
            // Update last accessed time efficiently
            sessionRepository.updateLastAccessedTime(sessionId, now);
            session.setLastAccessedAt(now);
            
            log.trace("Valid session: {} for user {} (expires: {})", 
                    sessionId, session.getUserId(), session.getExpiresAt());
            return Optional.of(session);
            
        } catch (Exception e) {
            log.error("Error validating session {}: {}", sessionId, e.getMessage(), e);
            return Optional.empty();
        }
    }
    
    /**
     * Validate session by JWT token hash with sliding expiration
     */
    @Transactional
    public Optional<UserSession> validateSessionByJwt(String jwtToken) {
        if (jwtToken == null || jwtToken.trim().isEmpty()) {
            log.debug("Invalid JWT token provided: null or empty");
            return Optional.empty();
        }
        
        try {
            String jwtHash = hashToken(jwtToken);
            Optional<UserSession> sessionOpt = sessionRepository.findByJwtTokenHashAndIsActiveTrue(jwtHash);
            
            if (sessionOpt.isEmpty()) {
                log.debug("Session not found for JWT hash");
                return Optional.empty();
            }
            
            UserSession session = sessionOpt.get();
            LocalDateTime now = LocalDateTime.now();
            
            if (session.isExpired()) {
                log.info("JWT session expired: {} (expired at: {}, current time: {})", 
                        session.getSessionId(), session.getExpiresAt(), now);
                revokeSession(session.getSessionId(), "Session expired");
                return Optional.empty();
            }
            
            // Check if session is close to expiry and extend
            if (isSessionNearExpiry(session)) {
                extendSessionExpiration(session);
                log.debug("Extended JWT session {} due to activity (new expiry: {})", 
                        session.getSessionId(), session.getExpiresAt());
            }
            
            // Update last accessed time
            sessionRepository.updateLastAccessedTime(session.getSessionId(), now);
            session.setLastAccessedAt(now);
            
            log.trace("Valid JWT session: {} for user {}", session.getSessionId(), session.getUserId());
            return Optional.of(session);
            
        } catch (Exception e) {
            log.error("Error validating session by JWT: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }
    
    /**
     * Update session JWT token hash when token is refreshed
     */
    @Transactional
    public boolean updateSessionJwt(String sessionId, String newJwtToken) {
        try {
            String newJwtHash = hashToken(newJwtToken);
            int updated = sessionRepository.updateSessionJwtHash(sessionId, newJwtHash, LocalDateTime.now());
            
            if (updated > 0) {
                log.debug("Updated JWT hash for session: {}", sessionId);
                return true;
            } else {
                log.warn("Failed to update JWT hash for session: {}", sessionId);
                return false;
            }
            
        } catch (Exception e) {
            log.error("Error updating session JWT for {}: {}", sessionId, e.getMessage());
            return false;
        }
    }
    
    /**
     * Revoke specific session
     */
    @Transactional
    public boolean revokeSession(String sessionId, String reason) {
        try {
            Optional<UserSession> sessionOpt = sessionRepository.findBySessionIdAndIsActiveTrue(sessionId);
            
            if (sessionOpt.isEmpty()) {
                log.debug("Cannot revoke non-existent or inactive session: {}", sessionId);
                return false;
            }
            
            UserSession session = sessionOpt.get();
            session.revoke(reason);
            sessionRepository.save(session);
            
            log.info("Revoked session {} for user {} - Reason: {}", 
                    sessionId, session.getUserId(), reason);
            return true;
            
        } catch (Exception e) {
            log.error("Error revoking session {}: {}", sessionId, e.getMessage());
            return false;
        }
    }
    
    /**
     * Revoke all sessions for user
     */
    @Transactional
    public int revokeAllUserSessions(Long userId, String reason) {
        try {
            int count = sessionRepository.revokeAllUserSessions(userId, LocalDateTime.now(), reason);
            log.info("Revoked {} sessions for user {} - Reason: {}", count, userId, reason);
            return count;
        } catch (Exception e) {
            log.error("Error revoking all sessions for user {}: {}", userId, e.getMessage());
            return 0;
        }
    }
    
    /**
     * Revoke all sessions except current one
     */
    @Transactional
    public int revokeAllUserSessionsExcept(Long userId, String currentSessionId, String reason) {
        try {
            int count = sessionRepository.revokeAllUserSessionsExcept(
                    userId, currentSessionId, LocalDateTime.now(), reason);
            log.info("Revoked {} other sessions for user {} - Reason: {}", count, userId, reason);
            return count;
        } catch (Exception e) {
            log.error("Error revoking other sessions for user {}: {}", userId, e.getMessage());
            return 0;
        }
    }
    
    /**
     * Get user's active sessions
     */
    public List<UserSession> getUserActiveSessions(Long userId) {
        try {
            return sessionRepository.findActiveSessionsByUserId(userId);
        } catch (Exception e) {
            log.error("Error fetching active sessions for user {}: {}", userId, e.getMessage());
            return Collections.emptyList();
        }
    }
    
    /**
     * Get user's session history
     */
    public List<UserSession> getUserSessionHistory(Long userId, int days) {
        try {
            LocalDateTime startDate = LocalDateTime.now().minusDays(days);
            return sessionRepository.findUserSessionHistory(userId, startDate);
        } catch (Exception e) {
            log.error("Error fetching session history for user {}: {}", userId, e.getMessage());
            return Collections.emptyList();
        }
    }
    
    /**
     * Extract session ID from request cookies
     */
    public Optional<String> extractSessionId(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        
        return Arrays.stream(request.getCookies())
                .filter(cookie -> sessionCookieName.equals(cookie.getName()))
                .map(Cookie::getValue)
                .filter(value -> value != null && !value.trim().isEmpty())
                .findFirst();
    }
    
    /**
     * Clear session cookie
     */
    public void clearSessionCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(sessionCookieName, null);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        cookie.setHttpOnly(httpOnly);
        cookie.setSecure(secureCookie);
        response.addCookie(cookie);
        
        log.debug("Cleared session cookie");
    }
    
    /**
     * Extend session expiration
     */
    @Transactional
    public boolean extendSession(String sessionId, int hours) {
        try {
            Optional<UserSession> sessionOpt = sessionRepository.findBySessionIdAndIsActiveTrue(sessionId);
            
            if (sessionOpt.isEmpty()) {
                return false;
            }
            
            UserSession session = sessionOpt.get();
            session.extendExpiration(hours);
            sessionRepository.save(session);
            
            log.debug("Extended session {} by {} hours", sessionId, hours);
            return true;
            
        } catch (Exception e) {
            log.error("Error extending session {}: {}", sessionId, e.getMessage());
            return false;
        }
    }
    
    /**
     * Get session statistics
     */
    public Map<String, Object> getSessionStats() {
        try {
            long activeCount = sessionRepository.countActiveSessions();
            long totalCount = sessionRepository.countTotalSessions();
            
            return Map.of(
                    "activeSessions", activeCount,
                    "totalSessions", totalCount,
                    "inactiveSessions", totalCount - activeCount,
                    "timestamp", LocalDateTime.now()
            );
        } catch (Exception e) {
            log.error("Error fetching session statistics: {}", e.getMessage());
            return Map.of("error", "Failed to fetch statistics");
        }
    }
    
    /**
     * Scheduled cleanup of expired sessions - runs every 30 minutes
     */
    @Scheduled(cron = "0 */30 * * * *") // Every 30 minutes
    @Transactional
    public void cleanupExpiredSessions() {
        try {
            LocalDateTime now = LocalDateTime.now();
            
            // Find and revoke expired active sessions in batches
            List<UserSession> expiredSessions = sessionRepository.findExpiredActiveSessions(now);
            int revokedCount = 0;
            
            for (UserSession session : expiredSessions) {
                try {
                    session.revoke("Automatic cleanup - expired");
                    sessionRepository.save(session);
                    revokedCount++;
                    
                    log.debug("Revoked expired session: {} for user {} (expired at: {})", 
                            session.getSessionId(), session.getUserId(), session.getExpiresAt());
                } catch (Exception e) {
                    log.error("Failed to revoke expired session {}: {}", session.getSessionId(), e.getMessage());
                }
            }
            
            // Delete old revoked sessions (older than 30 days) in batches
            LocalDateTime cutoffDate = now.minusDays(30);
            int deletedCount = 0;
            
            try {
                deletedCount = sessionRepository.deleteOldRevokedSessions(cutoffDate);
            } catch (Exception e) {
                log.error("Failed to delete old sessions: {}", e.getMessage());
            }
            
            // Additional cleanup: sessions that should have been revoked but weren't
            int orphanedCount = cleanupOrphanedSessions(now);
            
            if (revokedCount > 0 || deletedCount > 0 || orphanedCount > 0) {
                log.info("Session cleanup completed: revoked {} expired sessions, deleted {} old sessions, cleaned {} orphaned sessions", 
                        revokedCount, deletedCount, orphanedCount);
            } else {
                log.debug("Session cleanup completed: no sessions required cleanup");
            }
            
        } catch (Exception e) {
            log.error("Error during session cleanup: {}", e.getMessage(), e);
        }
    }
    
    // ===== PRIVATE HELPER METHODS =====
    
    /**
     * Generate cryptographically secure session ID
     */
    private String generateSecureSessionId() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
    
    /**
     * Hash token using SHA-256
     */
    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash token", e);
        }
    }
    
    /**
     * Extract real client IP address
     */
    private String extractClientIpAddress(HttpServletRequest request) {
        String[] headerNames = {
            "X-Forwarded-For", "X-Real-IP", "X-Originating-IP", 
            "CF-Connecting-IP", "True-Client-IP"
        };
        
        for (String headerName : headerNames) {
            String ip = request.getHeader(headerName);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                // Handle comma-separated IPs (take first one)
                if (ip.contains(",")) {
                    ip = ip.split(",")[0].trim();
                }
                if (ip.length() <= 45) { // IPv6 max length
                    return ip;
                }
            }
        }
        
        String remoteAddr = request.getRemoteAddr();
        return (remoteAddr != null && remoteAddr.length() <= 45) ? remoteAddr : "unknown";
    }
    
    /**
     * Extract and sanitize user agent
     */
    private String extractUserAgent(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        if (userAgent == null) {
            return "unknown";
        }
        
        // Truncate if too long
        if (userAgent.length() > 500) {
            userAgent = userAgent.substring(0, 500);
        }
        
        return userAgent;
    }
    
    /**
     * Determine device type from user agent
     */
    private String determineDeviceType(String userAgent) {
        if (userAgent == null) {
            return "unknown";
        }
        
        String ua = userAgent.toLowerCase();
        
        if (ua.contains("mobile") || ua.contains("android") || ua.contains("iphone")) {
            return "mobile";
        } else if (ua.contains("tablet") || ua.contains("ipad")) {
            return "tablet";
        } else if (ua.contains("bot") || ua.contains("crawler") || ua.contains("spider")) {
            return "bot";
        } else {
            return "desktop";
        }
    }
    
    /**
     * Determine location from IP (placeholder for future GeoIP integration)
     */
    private String determineLocation(String ipAddress) {
        // Placeholder - could integrate with GeoIP service
        if ("127.0.0.1".equals(ipAddress) || "::1".equals(ipAddress)) {
            return "localhost";
        }
        return "unknown";
    }
    
    /**
     * Enforce session limits per user
     */
    private void enforceSessionLimits(Long userId) {
        try {
            long activeCount = sessionRepository.countActiveSessionsByUserId(userId);
            
            if (activeCount >= maxSessionsPerUser) {
                // Get oldest sessions to revoke
                List<UserSession> activeSessions = sessionRepository.findActiveSessionsByUserId(userId);
                
                // Calculate how many to revoke
                int toRevoke = (int) (activeCount - maxSessionsPerUser + 1);
                
                // Revoke oldest sessions
                for (int i = activeSessions.size() - toRevoke; i < activeSessions.size(); i++) {
                    UserSession oldSession = activeSessions.get(i);
                    oldSession.revoke("Session limit exceeded");
                    sessionRepository.save(oldSession);
                    log.debug("Revoked old session {} for user {} due to session limit", 
                            oldSession.getSessionId(), userId);
                }
            }
        } catch (Exception e) {
            log.error("Error enforcing session limits for user {}: {}", userId, e.getMessage());
        }
    }
    
    // ===== NEW HELPER METHODS =====
    
    /**
     * Check if session is near expiry (within 1 hour)
     */
    private boolean isSessionNearExpiry(UserSession session) {
        if (session == null || session.getExpiresAt() == null) {
            return false;
        }
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime nearExpiryThreshold = now.plusHours(1);
        
        return session.getExpiresAt().isBefore(nearExpiryThreshold);
    }
    
    /**
     * Extend session expiration by configured timeout hours
     */
    private void extendSessionExpiration(UserSession session) {
        if (session != null) {
            LocalDateTime newExpiry = LocalDateTime.now().plusHours(sessionTimeoutHours);
            session.setExpiresAt(newExpiry);
            sessionRepository.save(session);
        }
    }
    
    /**
     * Clean up orphaned sessions that should have been revoked
     */
    private int cleanupOrphanedSessions(LocalDateTime now) {
        try {
            // Find sessions that are expired but still marked as active
            List<UserSession> orphanedSessions = sessionRepository.findExpiredActiveSessions(now);
            int cleanedCount = 0;
            
            for (UserSession session : orphanedSessions) {
                try {
                    session.revoke("Cleanup - orphaned expired session");
                    sessionRepository.save(session);
                    cleanedCount++;
                } catch (Exception e) {
                    log.error("Failed to clean orphaned session {}: {}", session.getSessionId(), e.getMessage());
                }
            }
            
            return cleanedCount;
        } catch (Exception e) {
            log.error("Error cleaning orphaned sessions: {}", e.getMessage());
            return 0;
        }
    }
    
    /**
     * Get sessions expiring soon (for proactive notifications)
     */
    public List<UserSession> getSessionsExpiringSoon(int minutesAhead) {
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime threshold = now.plusMinutes(minutesAhead);
            return sessionRepository.findSessionsExpiringSoon(now, threshold);
        } catch (Exception e) {
            log.error("Error fetching sessions expiring soon: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
    
    /**
     * Validate and refresh session if needed
     */
    @Transactional
    public Optional<UserSession> validateAndRefreshSession(String sessionId) {
        Optional<UserSession> sessionOpt = validateSession(sessionId, true);
        
        if (sessionOpt.isPresent()) {
            UserSession session = sessionOpt.get();
            
            // If session was extended, save the changes
            if (isSessionNearExpiry(session)) {
                sessionRepository.save(session);
            }
        }
        
        return sessionOpt;
    }
    
    /**
     * Set secure session cookie with all security attributes
     */
    private void setSecureSessionCookie(HttpServletResponse response, String sessionId) {
        int maxAge = sessionTimeoutHours * 3600; // Convert to seconds
        
        // Build cookie header manually to support SameSite
        StringBuilder cookieHeader = new StringBuilder();
        cookieHeader.append(sessionCookieName).append("=").append(sessionId);
        cookieHeader.append("; Path=/");
        cookieHeader.append("; Max-Age=").append(maxAge);
        
        if (httpOnly) {
            cookieHeader.append("; HttpOnly");
        }
        
        if (secureCookie) {
            cookieHeader.append("; Secure");
        }
        
        cookieHeader.append("; SameSite=").append(sameSite);
        
        response.addHeader("Set-Cookie", cookieHeader.toString());
        
        log.debug("Set secure session cookie: {} (expires in {} hours)", sessionId, sessionTimeoutHours);
    }
}
