package com.dailyjournal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing user authentication sessions
 * Provides enhanced security tracking alongside JWT authentication
 */
@Entity
@Table(name = "user_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSession {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 64)
    private String sessionId;
    
    @Column(nullable = false)
    private Long userId;
    
    @Column(nullable = false, length = 64)
    private String jwtTokenHash;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime expiresAt;
    
    @Column(nullable = false)
    private LocalDateTime lastAccessedAt;
    
    @Column(length = 45)
    private String ipAddress;
    
    @Column(length = 500)
    private String userAgent;
    
    @Column(length = 50)
    private String deviceType;
    
    @Column(length = 100)
    private String location;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    @Column
    private LocalDateTime revokedAt;
    
    @Column(length = 100)
    private String revokedReason;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (lastAccessedAt == null) {
            lastAccessedAt = LocalDateTime.now();
        }
        if (isActive == null) {
            isActive = true;
        }
    }
    
    /**
     * Update last accessed timestamp
     */
    public void updateLastAccessed() {
        this.lastAccessedAt = LocalDateTime.now();
    }
    
    /**
     * Check if session is expired
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
    
    /**
     * Check if session is valid (active and not expired)
     */
    public boolean isValid() {
        return isActive && !isExpired();
    }
    
    /**
     * Revoke session with reason
     */
    public void revoke(String reason) {
        this.isActive = false;
        this.revokedAt = LocalDateTime.now();
        this.revokedReason = reason;
    }
    
    /**
     * Extend session expiration
     */
    public void extendExpiration(int hours) {
        this.expiresAt = LocalDateTime.now().plusHours(hours);
        updateLastAccessed();
    }
}
