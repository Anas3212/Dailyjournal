package com.dailyjournal.exception;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.Map;
import java.time.OffsetDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // ✅ Handle user not found
    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ApiError> handleUsernameNotFound(UsernameNotFoundException ex, HttpServletRequest req) {
        return build(ApiErrorFactory.notFound(ex.getMessage(), req.getRequestURI()));
    }

    // ✅ Handle invalid credentials
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials(BadCredentialsException ex, HttpServletRequest req) {
        return build(ApiErrorFactory.unauthorized("Invalid email or password", req.getRequestURI()));
    }

    // ✅ Handle disabled (blocked) users
    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiError> handleDisabledUser(DisabledException ex, HttpServletRequest req) {
        return build(ApiErrorFactory.forbidden("User is blocked or disabled", req.getRequestURI()));
    }

    // ✅ Handle Access Denied (403)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(AccessDeniedException ex, HttpServletRequest req) {
        return build(ApiErrorFactory.forbidden("You are not authorized to access this resource", req.getRequestURI()));
    }

    // ✅ Handle validation errors (@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> {
            errors.put(error.getField(), error.getDefaultMessage());
        });
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    // ✅ Handle constraint violations (e.g., from service/DB layer)
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest req) {
        return build(ApiErrorFactory.badRequest(ex.getMessage(), req.getRequestURI()));
    }

    // ✅ Handle all other exceptions (fallback)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneralException(Exception ex, HttpServletRequest req) {
        ex.printStackTrace(); // Optional: log error stack trace
        return build(ApiErrorFactory.internal(ex.getMessage(), req.getRequestURI()));
    }

    // === Custom Exceptions ===
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(NotFoundException ex, HttpServletRequest req) {
        return build(ApiErrorFactory.notFound(ex.getMessage(), req.getRequestURI()));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiError> handleForbidden(ForbiddenException ex, HttpServletRequest req) {
        return build(ApiErrorFactory.forbidden(ex.getMessage(), req.getRequestURI()));
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiError> handleBadRequest(BadRequestException ex, HttpServletRequest req) {
        return build(ApiErrorFactory.badRequest(ex.getMessage(), req.getRequestURI()));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiError> handleUnauthorized(UnauthorizedException ex, HttpServletRequest req) {
        return build(ApiErrorFactory.unauthorized(ex.getMessage(), req.getRequestURI()));
    }

    private ResponseEntity<ApiError> build(ApiError err) {
        return ResponseEntity.status(err.getStatus()).body(err);
    }

    // Small helper to construct ApiError
    static class ApiErrorFactory {
        static ApiError of(HttpStatus status, String message, String path) {
            return new ApiError(OffsetDateTime.now(), status.value(), status.getReasonPhrase(), message, path);
        }
        static ApiError notFound(String message, String path) { return of(HttpStatus.NOT_FOUND, message, path); }
        static ApiError forbidden(String message, String path) { return of(HttpStatus.FORBIDDEN, message, path); }
        static ApiError badRequest(String message, String path) { return of(HttpStatus.BAD_REQUEST, message, path); }
        static ApiError unauthorized(String message, String path) { return of(HttpStatus.UNAUTHORIZED, message, path); }
        static ApiError internal(String message, String path) { return of(HttpStatus.INTERNAL_SERVER_ERROR, message, path); }
    }
}
