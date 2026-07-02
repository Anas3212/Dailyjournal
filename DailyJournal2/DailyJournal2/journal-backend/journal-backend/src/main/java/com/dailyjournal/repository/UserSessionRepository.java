package com.dailyjournal.repository;

import com.dailyjournal.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for UserSession entity with optimized queries
 * Provides enterprise-grade session management operations
 */
@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    
    /**
     * Find session by session ID
     */
    Optional<UserSession> findBySessionIdAndIsActiveTrue(String sessionId);
    
    /**
     * Find session by JWT token hash
     */
    Optional<UserSession> findByJwtTokenHashAndIsActiveTrue(String jwtTokenHash);
    
    /**
     * Find all active sessions for a user (ordered by most recent)
     */
    @Query("SELECT s FROM UserSession s WHERE s.userId = :userId AND s.isActive = true ORDER BY s.lastAccessedAt DESC")
    List<UserSession> findActiveSessionsByUserId(@Param("userId") Long userId);
    
    /**
     * Find session history for a user within date range
     */
    @Query("SELECT s FROM UserSession s WHERE s.userId = :userId AND s.createdAt >= :startDate ORDER BY s.createdAt DESC")
    List<UserSession> findUserSessionHistory(@Param("userId") Long userId, @Param("startDate") LocalDateTime startDate);
    
    /**
     * Count active sessions for a user
     */
    @Query("SELECT COUNT(s) FROM UserSession s WHERE s.userId = :userId AND s.isActive = true")
    long countActiveSessionsByUserId(@Param("userId") Long userId);
    
    /**
     * Find sessions expiring within time window
     */
    @Query("SELECT s FROM UserSession s WHERE s.isActive = true AND s.expiresAt BETWEEN :now AND :threshold")
    List<UserSession> findSessionsExpiringSoon(@Param("now") LocalDateTime now, @Param("threshold") LocalDateTime threshold);
    
    /**
     * Find expired but still active sessions (cleanup candidates)
     */
    @Query("SELECT s FROM UserSession s WHERE s.isActive = true AND s.expiresAt < :now")
    List<UserSession> findExpiredActiveSessions(@Param("now") LocalDateTime now);
    
    /**
     * Bulk revoke all active sessions for a user
     */
    @Modifying
    @Query("UPDATE UserSession s SET s.isActive = false, s.revokedAt = :now, s.revokedReason = :reason WHERE s.userId = :userId AND s.isActive = true")
    int revokeAllUserSessions(@Param("userId") Long userId, @Param("now") LocalDateTime now, @Param("reason") String reason);
    
    /**
     * Bulk revoke sessions except current one
     */
    @Modifying
    @Query("UPDATE UserSession s SET s.isActive = false, s.revokedAt = :now, s.revokedReason = :reason WHERE s.userId = :userId AND s.sessionId != :currentSessionId AND s.isActive = true")
    int revokeAllUserSessionsExcept(@Param("userId") Long userId, @Param("currentSessionId") String currentSessionId, @Param("now") LocalDateTime now, @Param("reason") String reason);
    
    /**
     * Delete old expired sessions (cleanup)
     */
    @Modifying
    @Query("DELETE FROM UserSession s WHERE s.isActive = false AND s.revokedAt < :cutoffDate")
    int deleteOldRevokedSessions(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    /**
     * Get session statistics
     */
    @Query("SELECT COUNT(s) FROM UserSession s WHERE s.isActive = true")
    long countActiveSessions();
    
    @Query("SELECT COUNT(s) FROM UserSession s")
    long countTotalSessions();
    
    /**
     * Find sessions by IP address (security monitoring)
     */
    @Query("SELECT s FROM UserSession s WHERE s.ipAddress = :ipAddress AND s.isActive = true ORDER BY s.lastAccessedAt DESC")
    List<UserSession> findActiveSessionsByIpAddress(@Param("ipAddress") String ipAddress);
    
    /**
     * Find sessions by device type
     */
    @Query("SELECT s FROM UserSession s WHERE s.deviceType = :deviceType AND s.isActive = true ORDER BY s.lastAccessedAt DESC")
    List<UserSession> findActiveSessionsByDeviceType(@Param("deviceType") String deviceType);
    
    /**
     * Find concurrent sessions for security analysis
     */
    @Query("SELECT s FROM UserSession s WHERE s.userId = :userId AND s.isActive = true AND s.lastAccessedAt >= :recentThreshold")
    List<UserSession> findRecentActiveSessionsByUserId(@Param("userId") Long userId, @Param("recentThreshold") LocalDateTime recentThreshold);
    
    /**
     * Update last accessed time for session
     */
    @Modifying
    @Query("UPDATE UserSession s SET s.lastAccessedAt = :now WHERE s.sessionId = :sessionId AND s.isActive = true")
    int updateLastAccessedTime(@Param("sessionId") String sessionId, @Param("now") LocalDateTime now);
    
    /**
     * Update JWT token hash for session
     */
    @Modifying
    @Query("UPDATE UserSession s SET s.jwtTokenHash = :newJwtHash, s.lastAccessedAt = :now WHERE s.sessionId = :sessionId AND s.isActive = true")
    int updateSessionJwtHash(@Param("sessionId") String sessionId, @Param("newJwtHash") String newJwtHash, @Param("now") LocalDateTime now);
    
    /**
     * Update session expiration time
     */
    @Modifying
    @Query("UPDATE UserSession s SET s.expiresAt = :newExpiry, s.lastAccessedAt = :now WHERE s.sessionId = :sessionId AND s.isActive = true")
    int updateSessionExpiration(@Param("sessionId") String sessionId, @Param("newExpiry") LocalDateTime newExpiry, @Param("now") LocalDateTime now);
    
    /**
     * Find sessions that will expire within a specific time window (for notifications)
     */
    @Query("SELECT s FROM UserSession s WHERE s.isActive = true AND s.expiresAt BETWEEN :now AND :threshold ORDER BY s.expiresAt ASC")
    List<UserSession> findSessionsExpiringWithinWindow(@Param("now") LocalDateTime now, @Param("threshold") LocalDateTime threshold);
    
    /**
     * Count sessions by device type for analytics
     */
    @Query("SELECT s.deviceType, COUNT(s) FROM UserSession s WHERE s.isActive = true GROUP BY s.deviceType")
    List<Object[]> countSessionsByDeviceType();
    
    /**
     * Find sessions with suspicious activity (multiple IPs for same user)
     */
    @Query("SELECT s FROM UserSession s WHERE s.userId = :userId AND s.isActive = true AND s.ipAddress != :currentIp ORDER BY s.lastAccessedAt DESC")
    List<UserSession> findSuspiciousSessionsForUser(@Param("userId") Long userId, @Param("currentIp") String currentIp);
}
