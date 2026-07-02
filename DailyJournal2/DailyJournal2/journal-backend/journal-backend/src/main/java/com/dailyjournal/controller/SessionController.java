package com.dailyjournal.controller;

import com.dailyjournal.entity.UserSession;
import com.dailyjournal.service.SessionService;
import com.dailyjournal.util.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller for managing user sessions
 * Provides comprehensive session management APIs
 */
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Slf4j
public class SessionController {
    
    private final SessionService sessionService;
    
    /**
     * Get current user's active sessions
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<UserSession>> getUserSessions() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<UserSession> sessions = sessionService.getUserActiveSessions(userId);
        return ResponseEntity.ok(sessions);
    }
    
    /**
     * Get current user's session history
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/history")
    public ResponseEntity<List<UserSession>> getUserSessionHistory(
            @RequestParam(defaultValue = "30") int days) {
        Long userId = SecurityUtils.getCurrentUserId();
        List<UserSession> sessions = sessionService.getUserSessionHistory(userId, days);
        return ResponseEntity.ok(sessions);
    }
    
    /**
     * Get current session information
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/current")
    public ResponseEntity<Map<String, Object>> getCurrentSession(HttpServletRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        
        return sessionService.extractSessionId(request)
                .flatMap(sessionService::validateSession)
                .map(session -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("session", session);
                    response.put("userId", userId);
                    response.put("isValid", true);
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("message", "No active session found");
                    response.put("userId", userId);
                    response.put("isValid", false);
                    return ResponseEntity.ok(response);
                });
    }
    
    /**
     * Revoke specific session by ID
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Map<String, Object>> revokeSession(@PathVariable String sessionId) {
        Long userId = SecurityUtils.getCurrentUserId();
        
        // Verify session belongs to current user
        return sessionService.validateSession(sessionId)
                .filter(session -> session.getUserId().equals(userId))
                .map(session -> {
                    boolean revoked = sessionService.revokeSession(sessionId, "User revoked session");
                    Map<String, Object> response = new HashMap<>();
                    if (revoked) {
                        response.put("success", true);
                        response.put("message", "Session revoked successfully");
                        return ResponseEntity.ok(response);
                    } else {
                        response.put("success", false);
                        response.put("message", "Failed to revoke session");
                        return ResponseEntity.badRequest().body(response);
                    }
                })
                .orElseGet(() -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("message", "Session not found or unauthorized");
                    return ResponseEntity.badRequest().body(response);
                });
    }
    
    /**
     * Revoke all sessions for current user (except current session)
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @DeleteMapping("/all")
    public ResponseEntity<Map<String, Object>> revokeAllSessions(HttpServletRequest request) {
        Long userId = SecurityUtils.getCurrentUserId();
        
        // Get current session ID to preserve it
        String currentSessionId = sessionService.extractSessionId(request).orElse(null);
        
        int revokedCount;
        if (currentSessionId != null) {
            revokedCount = sessionService.revokeAllUserSessionsExcept(userId, currentSessionId, "User revoked all other sessions");
        } else {
            revokedCount = sessionService.revokeAllUserSessions(userId, "User revoked all sessions");
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Sessions revoked successfully");
        response.put("revokedCount", revokedCount);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Extend current session expiration
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/extend")
    public ResponseEntity<Map<String, Object>> extendSession(
            HttpServletRequest request,
            @RequestParam(defaultValue = "8") int hours) {
        
        return sessionService.extractSessionId(request)
                .map(sessionId -> {
                    boolean extended = sessionService.extendSession(sessionId, hours);
                    Map<String, Object> response = new HashMap<>();
                    if (extended) {
                        response.put("success", true);
                        response.put("message", "Session extended successfully");
                        response.put("extendedHours", hours);
                        return ResponseEntity.ok(response);
                    } else {
                        response.put("success", false);
                        response.put("message", "Failed to extend session");
                        return ResponseEntity.badRequest().body(response);
                    }
                })
                .orElseGet(() -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("message", "No active session found");
                    return ResponseEntity.badRequest().body(response);
                });
    }
    
    /**
     * Get session statistics (admin only)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSessionStats() {
        Map<String, Object> stats = sessionService.getSessionStats();
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get sessions expiring soon for current user
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/expiring-soon")
    public ResponseEntity<List<UserSession>> getSessionsExpiringSoon(
            @RequestParam(defaultValue = "30") int minutes) {
        List<UserSession> sessions = sessionService.getSessionsExpiringSoon(minutes);
        return ResponseEntity.ok(sessions);
    }
    
    /**
     * Get all active sessions (admin only)
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/all")
    public ResponseEntity<Map<String, Object>> getAllActiveSessions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        // This would require additional repository methods for pagination
        // For now, return basic stats
        Map<String, Object> stats = sessionService.getSessionStats();
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Admin session management - full implementation pending");
        response.put("stats", stats);
        return ResponseEntity.ok(response);
    }
}
