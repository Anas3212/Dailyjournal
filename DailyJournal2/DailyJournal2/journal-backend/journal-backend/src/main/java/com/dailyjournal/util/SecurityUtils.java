package com.dailyjournal.util;

import com.dailyjournal.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Utility class for Security Context operations
 * Supports both cookie-based and header-based authentication
 */
public class SecurityUtils {

    /**
     * Get the current authenticated user from Security Context
     * Works with both cookie-based and header-based authentication
     * 
     * @return Current authenticated User
     * @throws RuntimeException if no user is authenticated
     */
    public static User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("No authenticated user found");
        }
        
        Object principal = authentication.getPrincipal();
        
        if (principal instanceof User) {
            return (User) principal;
        }
        
        throw new RuntimeException("Invalid authentication principal type");
    }

    /**
     * Get the current authenticated user's email
     * 
     * @return Current user's email
     * @throws RuntimeException if no user is authenticated
     */
    public static String getCurrentUserEmail() {
        return getCurrentUser().getEmail();
    }

    /**
     * Get the current authenticated user's ID
     * 
     * @return Current user's ID
     * @throws RuntimeException if no user is authenticated
     */
    public static Long getCurrentUserId() {
        return getCurrentUser().getId();
    }

    /**
     * Check if a user is currently authenticated
     * 
     * @return true if user is authenticated, false otherwise
     */
    public static boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.isAuthenticated() && 
               authentication.getPrincipal() instanceof User;
    }
}
