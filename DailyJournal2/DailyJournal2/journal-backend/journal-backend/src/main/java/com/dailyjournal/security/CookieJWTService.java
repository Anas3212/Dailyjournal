package com.dailyjournal.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.Optional;

/**
 * Enhanced JWT Service for Cookie-based Authentication
 * Implements production-ready security with access and refresh tokens
 */
@Service
@Slf4j
public class CookieJWTService {

    private final Key key;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;
    
    // Cookie names
    public static final String ACCESS_TOKEN_COOKIE = "access_token";
    public static final String REFRESH_TOKEN_COOKIE = "refresh_token";
    
    // Cookie settings
    private static final String COOKIE_PATH = "/";
    private static final boolean COOKIE_HTTP_ONLY = true;
    private static final boolean COOKIE_SECURE = false; // Set to true in production with HTTPS
    private static final String COOKIE_SAME_SITE = "Lax";

    public CookieJWTService(@Value("${jwt.secret}") String secret,
                           @Value("${jwt.access-token-expiration:900000}") long accessTokenExpiration, // 15 minutes
                           @Value("${jwt.refresh-token-expiration:2592000000}") long refreshTokenExpiration) { // 30 days
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    /**
     * Generate short-lived access token (15 minutes)
     */
    public String generateAccessToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + accessTokenExpiration))
                .claim("type", "access")
                .signWith(key)
                .compact();
    }

    /**
     * Generate long-lived refresh token (30 days)
     */
    public String generateRefreshToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshTokenExpiration))
                .claim("type", "refresh")
                .signWith(key)
                .compact();
    }

    /**
     * Extract username from any token type
     */
    public String extractUsername(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Failed to extract username from token: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Validate token and check if it's not expired
     * Supports both legacy tokens (without type claim) and new tokens (with type claim)
     */
    public boolean isTokenValid(String token, String userEmail) {
        try {
            final String username = extractUsername(token);
            return username != null && username.equals(userEmail) && !isTokenExpired(token);
        } catch (Exception e) {
            log.debug("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Check if token is expired
     */
    private boolean isTokenExpired(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getExpiration()
                    .before(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return true;
        }
    }

    /**
     * Validate that token is a refresh token
     * Legacy tokens (without type claim) are considered access tokens
     */
    public boolean isRefreshToken(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            // If no type claim exists (legacy token), it's not a refresh token
            Object type = claims.get("type");
            return type != null && "refresh".equals(type);
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Extract access token from HttpOnly cookie
     */
    public Optional<String> extractAccessTokenFromCookies(HttpServletRequest request) {
        return extractTokenFromCookies(request, ACCESS_TOKEN_COOKIE);
    }

    /**
     * Extract refresh token from HttpOnly cookie
     */
    public Optional<String> extractRefreshTokenFromCookies(HttpServletRequest request) {
        return extractTokenFromCookies(request, REFRESH_TOKEN_COOKIE);
    }

    /**
     * Extract token from specific cookie
     */
    private Optional<String> extractTokenFromCookies(HttpServletRequest request, String cookieName) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (cookieName.equals(cookie.getName())) {
                    return Optional.of(cookie.getValue());
                }
            }
        }
        return Optional.empty();
    }

    /**
     * Set access token as HttpOnly cookie
     */
    public void setAccessTokenCookie(HttpServletResponse response, String token) {
        setTokenCookie(response, ACCESS_TOKEN_COOKIE, token, (int) (accessTokenExpiration / 1000));
    }

    /**
     * Set refresh token as HttpOnly cookie
     */
    public void setRefreshTokenCookie(HttpServletResponse response, String token) {
        setTokenCookie(response, REFRESH_TOKEN_COOKIE, token, (int) (refreshTokenExpiration / 1000));
    }

    /**
     * Set token cookie with security settings
     */
    private void setTokenCookie(HttpServletResponse response, String name, String value, int maxAge) {
        Cookie cookie = new Cookie(name, value);
        cookie.setHttpOnly(COOKIE_HTTP_ONLY);
        cookie.setSecure(COOKIE_SECURE);
        cookie.setPath(COOKIE_PATH);
        cookie.setMaxAge(maxAge);
        
        // Add SameSite attribute manually (Spring Boot 2.6+ supports this natively)
        String cookieHeader = String.format("%s=%s; Path=%s; Max-Age=%d; HttpOnly; SameSite=%s%s",
                name, value, COOKIE_PATH, maxAge, COOKIE_SAME_SITE,
                COOKIE_SECURE ? "; Secure" : "");
        
        response.addHeader("Set-Cookie", cookieHeader);
    }

    /**
     * Clear authentication cookies (logout)
     */
    public void clearAuthCookies(HttpServletResponse response) {
        clearCookie(response, ACCESS_TOKEN_COOKIE);
        clearCookie(response, REFRESH_TOKEN_COOKIE);
    }

    /**
     * Clear specific cookie
     */
    private void clearCookie(HttpServletResponse response, String cookieName) {
        Cookie cookie = new Cookie(cookieName, "");
        cookie.setHttpOnly(COOKIE_HTTP_ONLY);
        cookie.setSecure(COOKIE_SECURE);
        cookie.setPath(COOKIE_PATH);
        cookie.setMaxAge(0);
        
        String cookieHeader = String.format("%s=; Path=%s; Max-Age=0; HttpOnly; SameSite=%s%s",
                cookieName, COOKIE_PATH, COOKIE_SAME_SITE,
                COOKIE_SECURE ? "; Secure" : "");
        
        response.addHeader("Set-Cookie", cookieHeader);
    }

    /**
     * Get access token expiration time in milliseconds
     */
    public long getAccessTokenExpiration() {
        return accessTokenExpiration;
    }

    /**
     * Get refresh token expiration time in milliseconds
     */
    public long getRefreshTokenExpiration() {
        return refreshTokenExpiration;
    }
}
