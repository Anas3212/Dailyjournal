package com.dailyjournal.service;

import com.dailyjournal.dto.AuthRequest;
import com.dailyjournal.dto.RegisterRequest;
import com.dailyjournal.entity.Role;
import com.dailyjournal.entity.User;
import com.dailyjournal.repository.RoleRepository;
import com.dailyjournal.repository.UserRepository;
import com.dailyjournal.security.CookieJWTService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Optional;

/**
 * Cookie-based Authentication Service
 * Handles secure authentication using HttpOnly cookies with access and refresh tokens
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CookieAuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final CookieJWTService cookieJWTService;
    private final AuthenticationManager authenticationManager;
    private final SessionService sessionService;

    /**
     * Register new user with cookie-based authentication
     */
    public Map<String, Object> register(RegisterRequest request, HttpServletResponse response) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        // Get default user role
        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("Default role not found"));

        // Create new user
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRoles(new HashSet<>());
        user.getRoles().add(userRole);

        userRepository.save(user);

        // Generate tokens
        String accessToken = cookieJWTService.generateAccessToken(user.getEmail());
        String refreshToken = cookieJWTService.generateRefreshToken(user.getEmail());

        // Set secure cookies
        cookieJWTService.setAccessTokenCookie(response, accessToken);
        cookieJWTService.setRefreshTokenCookie(response, refreshToken);

        // Check if user is admin
        boolean isAdmin = user.getRoles().stream()
                .anyMatch(role -> role.getName().equalsIgnoreCase("ROLE_ADMIN"));

        log.info("User registered successfully: {}", user.getEmail());

        return Map.of(
                "success", true,
                "message", "Registration successful",
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "isAdmin", isAdmin
                ),
                "tokenExpiry", System.currentTimeMillis() + cookieJWTService.getAccessTokenExpiration()
        );
    }

    /**
     * Login user with cookie-based authentication + session creation
     */
    public Map<String, Object> login(AuthRequest request, HttpServletRequest httpRequest, HttpServletResponse response) {
        // Check if user exists and is enabled
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException("Invalid credentials"));

        if (!user.isEnabled()) {
            throw new DisabledException("User is blocked");
        }

        // Authenticate user
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        // Generate tokens
        String accessToken = cookieJWTService.generateAccessToken(user.getEmail());
        String refreshToken = cookieJWTService.generateRefreshToken(user.getEmail());

        // Set secure cookies
        cookieJWTService.setAccessTokenCookie(response, accessToken);
        cookieJWTService.setRefreshTokenCookie(response, refreshToken);

        // Create session for enhanced security
        try {
            sessionService.createSession(user.getId(), accessToken, httpRequest, response);
        } catch (Exception e) {
            // Log but don't fail login if session creation fails
            log.error("Failed to create session for user {}: {}", user.getEmail(), e.getMessage());
        }

        // Check if user is admin
        boolean isAdmin = user.getRoles().stream()
                .anyMatch(role -> role.getName().equalsIgnoreCase("ROLE_ADMIN"));

        log.info("User logged in successfully: {}", user.getEmail());

        return Map.of(
                "success", true,
                "message", "Login successful",
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "isAdmin", isAdmin
                ),
                "tokenExpiry", System.currentTimeMillis() + cookieJWTService.getAccessTokenExpiration()
        );
    }

    /**
     * Refresh access token using refresh token from cookie
     */
    public Map<String, Object> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        // Extract refresh token from cookie
        Optional<String> refreshTokenOpt = cookieJWTService.extractRefreshTokenFromCookies(request);
        
        if (refreshTokenOpt.isEmpty()) {
            throw new com.dailyjournal.exception.UnauthorizedException("Refresh token not found");
        }

        String refreshToken = refreshTokenOpt.get();

        // Validate refresh token
        if (!cookieJWTService.isRefreshToken(refreshToken)) {
            throw new com.dailyjournal.exception.UnauthorizedException("Invalid refresh token type");
        }

        String userEmail = cookieJWTService.extractUsername(refreshToken);
        if (userEmail == null) {
            throw new com.dailyjournal.exception.UnauthorizedException("Invalid refresh token");
        }

        // Get user and validate
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new com.dailyjournal.exception.UnauthorizedException("User not found"));

        if (!user.isEnabled()) {
            throw new DisabledException("User is blocked");
        }

        if (!cookieJWTService.isTokenValid(refreshToken, user.getEmail())) {
            throw new com.dailyjournal.exception.UnauthorizedException("Refresh token expired or invalid");
        }

        // --- NEW: Session validation ---
        Optional<String> sessionIdOpt = sessionService.extractSessionId(request);
        if (sessionIdOpt.isEmpty()) {
            throw new com.dailyjournal.exception.UnauthorizedException("Session required for token refresh");
        }
        
        String sessionId = sessionIdOpt.get();
        Optional<com.dailyjournal.entity.UserSession> sessionOpt = sessionService.validateSession(sessionId);
        
        if (sessionOpt.isEmpty()) {
            cookieJWTService.clearAuthCookies(response);
            sessionService.clearSessionCookie(response);
            throw new com.dailyjournal.exception.UnauthorizedException("Session expired or revoked");
        }
        // --- END NEW ---

        // Generate new access token
        String newAccessToken = cookieJWTService.generateAccessToken(user.getEmail());
        cookieJWTService.setAccessTokenCookie(response, newAccessToken);

        // --- NEW: Update Session JWT Hash ---
        sessionService.updateSessionJwt(sessionId, newAccessToken);
        // --- END NEW ---

        // Check if user is admin
        boolean isAdmin = user.getRoles().stream()
                .anyMatch(role -> role.getName().equalsIgnoreCase("ROLE_ADMIN"));

        log.debug("Access token refreshed for user: {}", user.getEmail());

        return Map.of(
                "success", true,
                "message", "Token refreshed successfully",
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "isAdmin", isAdmin
                ),
                "tokenExpiry", System.currentTimeMillis() + cookieJWTService.getAccessTokenExpiration()
        );
    }

    /**
     * Logout user and clear authentication cookies + revoke session
     */
    public Map<String, Object> logout(HttpServletRequest request, HttpServletResponse response) {
        // Revoke session if exists
        try {
            Optional<String> sessionIdOpt = sessionService.extractSessionId(request);
            if (sessionIdOpt.isPresent()) {
                sessionService.revokeSession(sessionIdOpt.get(), "User logout");
            }
        } catch (Exception e) {
            log.error("Failed to revoke session during logout: {}", e.getMessage());
        }
        
        // Clear authentication cookies
        cookieJWTService.clearAuthCookies(response);
        
        // Clear session cookie
        sessionService.clearSessionCookie(response);

        log.info("User logged out successfully");

        return Map.of(
                "success", true,
                "message", "Logout successful"
        );
    }

    /**
     * Get authentication status
     */
    public Map<String, Object> getAuthStatus(HttpServletRequest request) {
        Optional<String> accessTokenOpt = cookieJWTService.extractAccessTokenFromCookies(request);
        
        if (accessTokenOpt.isEmpty()) {
            return Map.of(
                    "authenticated", false,
                    "message", "No access token found"
            );
        }

        String accessToken = accessTokenOpt.get();
        String userEmail = cookieJWTService.extractUsername(accessToken);
        
        if (userEmail == null) {
            return Map.of(
                    "authenticated", false,
                    "message", "Invalid access token"
            );
        }

        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null || !user.isEnabled()) {
            return Map.of(
                    "authenticated", false,
                    "message", "User not found or disabled"
            );
        }

        if (!cookieJWTService.isTokenValid(accessToken, user.getEmail())) {
            return Map.of(
                    "authenticated", false,
                    "message", "Access token expired or invalid",
                    "needsRefresh", true
            );
        }

        boolean isAdmin = user.getRoles().stream()
                .anyMatch(role -> role.getName().equalsIgnoreCase("ROLE_ADMIN"));

        return Map.of(
                "authenticated", true,
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "isAdmin", isAdmin
                ),
                "tokenExpiry", System.currentTimeMillis() + cookieJWTService.getAccessTokenExpiration()
        );
    }

    /**
     * Validate current session
     */
    public Map<String, Object> validateSession(HttpServletRequest request) {
        Map<String, Object> status = getAuthStatus(request);
        
        if (!(Boolean) status.get("authenticated")) {
            // Check if refresh token is available for potential refresh
            Optional<String> refreshTokenOpt = cookieJWTService.extractRefreshTokenFromCookies(request);
            if (refreshTokenOpt.isPresent()) {
                String refreshToken = refreshTokenOpt.get();
                String userEmail = cookieJWTService.extractUsername(refreshToken);
                
                if (userEmail != null && cookieJWTService.isRefreshToken(refreshToken)) {
                    User user = userRepository.findByEmail(userEmail).orElse(null);
                    if (user != null && user.isEnabled() && 
                        cookieJWTService.isTokenValid(refreshToken, user.getEmail())) {
                        
                        Map<String, Object> result = new HashMap<>(status);
                        result.put("canRefresh", true);
                        result.put("message", "Access token expired but refresh token available");
                        return result;
                    }
                }
            }
        }
        
        return status;
    }
}
