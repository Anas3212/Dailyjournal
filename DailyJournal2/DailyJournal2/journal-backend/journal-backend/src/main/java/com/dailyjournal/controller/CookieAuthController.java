package com.dailyjournal.controller;

import com.dailyjournal.dto.AuthRequest;
import com.dailyjournal.dto.RegisterRequest;
import com.dailyjournal.service.CookieAuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Cookie-based Authentication Controller
 * Provides secure authentication using HttpOnly cookies
 */
@RestController
@RequestMapping("/api/auth/cookie")
@RequiredArgsConstructor
@Slf4j
public class CookieAuthController {

    private final CookieAuthService cookieAuthService;

    /**
     * Register new user with cookie-based authentication
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response) {
        
        log.info("Cookie-based registration attempt for email: {}", request.getEmail());
        
        Map<String, Object> result = cookieAuthService.register(request, response);
        
        log.info("Cookie-based registration successful for email: {}", request.getEmail());
        
        return ResponseEntity.ok(result);
    }

    /**
     * Login user with cookie-based authentication
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @Valid @RequestBody AuthRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {
        
        log.info("Cookie-based login attempt for email: {}", request.getEmail());
        
        Map<String, Object> result = cookieAuthService.login(request, httpRequest, response);
        
        log.info("Cookie-based login successful for email: {}", request.getEmail());
        
        return ResponseEntity.ok(result);
    }

    /**
     * Refresh access token using refresh token from cookie
     */
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refresh(
            HttpServletRequest request,
            HttpServletResponse response) {
        
        log.debug("Token refresh request received");
        
        Map<String, Object> result = cookieAuthService.refreshToken(request, response);
        
        log.debug("Token refresh successful");
        
        return ResponseEntity.ok(result);
    }

    /**
     * Logout user and clear authentication cookies
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, Object>> logout(
            HttpServletRequest request,
            HttpServletResponse response) {
        
        log.info("Cookie-based logout request");
        
        Map<String, Object> result = cookieAuthService.logout(request, response);
        
        log.info("Cookie-based logout successful");
        
        return ResponseEntity.ok(result);
    }

    /**
     * Check authentication status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getAuthStatus(HttpServletRequest request) {
        
        Map<String, Object> result = cookieAuthService.getAuthStatus(request);
        
        return ResponseEntity.ok(result);
    }

    /**
     * Validate current session
     */
    @GetMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateSession(HttpServletRequest request) {
        
        Map<String, Object> result = cookieAuthService.validateSession(request);
        
        return ResponseEntity.ok(result);
    }
}
