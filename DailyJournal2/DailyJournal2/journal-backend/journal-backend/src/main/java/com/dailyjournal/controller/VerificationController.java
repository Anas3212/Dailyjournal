package com.dailyjournal.controller;

import com.dailyjournal.entity.UserVerification;
import com.dailyjournal.entity.User;
import com.dailyjournal.service.UserVerificationService;
import com.dailyjournal.dto.UserVerificationDto;
import com.dailyjournal.mapper.UserVerificationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class VerificationController {

    private final UserVerificationService verificationService;

    @GetMapping("/me/verifications")
    public ResponseEntity<List<UserVerificationDto>> getMyVerifications() {
        Long userId = getCurrentUserId();
        List<UserVerification> verifications = verificationService.getMyVerifications(userId);
        List<UserVerificationDto> dtos = verifications.stream()
                .map(UserVerificationMapper::toDto)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/users/{userId}/verifications")
    public ResponseEntity<List<UserVerificationDto>> getUserVerifications(@PathVariable Long userId) {
        Long viewerId = getCurrentUserId();
        List<UserVerification> verifications = verificationService.getPublicVerifications(userId, viewerId);
        List<UserVerificationDto> dtos = verifications.stream()
                .map(UserVerificationMapper::toDto)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @PostMapping(value = "/me/verifications", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createVerification(
            @RequestParam("type") String type,
            @RequestParam("title") String title,
            @RequestParam(value = "issuer", required = false) String issuer,
            @RequestParam(value = "issueDate", required = false) String issueDate,
            @RequestParam(value = "expiryDate", required = false) String expiryDate,
            @RequestParam(value = "credentialId", required = false) String credentialId,
            @RequestParam(value = "credentialUrl", required = false) String credentialUrl,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "visibility", defaultValue = "PUBLIC") String visibility,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        
        try {
            Long userId = getCurrentUserId();
            
            UserVerification verification = UserVerification.builder()
                    .type(UserVerification.VerificationType.valueOf(type.toUpperCase()))
                    .title(title)
                    .issuer(issuer)
                    .issueDate(parseDate(issueDate))
                    .expiryDate(parseDate(expiryDate))
                    .credentialId(credentialId)
                    .credentialUrl(credentialUrl)
                    .description(description)
                    .visibility(UserVerification.VerificationVisibility.valueOf(visibility.toUpperCase()))
                    .build();

            UserVerification created = verificationService.createVerification(userId, verification, file);
            return ResponseEntity.ok(UserVerificationMapper.toDto(created));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating verification: " + e.getMessage());
        }
    }

    @PutMapping(value = "/me/verifications/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateVerification(
            @PathVariable Long id,
            @RequestParam("type") String type,
            @RequestParam("title") String title,
            @RequestParam(value = "issuer", required = false) String issuer,
            @RequestParam(value = "issueDate", required = false) String issueDate,
            @RequestParam(value = "expiryDate", required = false) String expiryDate,
            @RequestParam(value = "credentialId", required = false) String credentialId,
            @RequestParam(value = "credentialUrl", required = false) String credentialUrl,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "visibility", defaultValue = "PUBLIC") String visibility,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        
        try {
            Long userId = getCurrentUserId();
            
            UserVerification verification = UserVerification.builder()
                    .type(UserVerification.VerificationType.valueOf(type.toUpperCase()))
                    .title(title)
                    .issuer(issuer)
                    .issueDate(parseDate(issueDate))
                    .expiryDate(parseDate(expiryDate))
                    .credentialId(credentialId)
                    .credentialUrl(credentialUrl)
                    .description(description)
                    .visibility(UserVerification.VerificationVisibility.valueOf(visibility.toUpperCase()))
                    .build();

            UserVerification updated = verificationService.updateVerification(userId, id, verification, file);
            return ResponseEntity.ok(UserVerificationMapper.toDto(updated));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating verification: " + e.getMessage());
        }
    }

    @DeleteMapping("/me/verifications/{id}")
    public ResponseEntity<?> deleteVerification(@PathVariable Long id) {
        try {
            Long userId = getCurrentUserId();
            verificationService.deleteVerification(userId, id);
            return ResponseEntity.ok().body("Verification deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error deleting verification: " + e.getMessage());
        }
    }

    @GetMapping("/verifications/{id}/file")
    public ResponseEntity<byte[]> getVerificationFile(@PathVariable Long id) {
        try {
            Long currentUserId = getCurrentUserId();
            Optional<UserVerification> verificationOpt = verificationService.getVerificationById(id);
            
            if (verificationOpt.isEmpty() || !verificationOpt.get().hasFile()) {
                return ResponseEntity.notFound().build();
            }

            UserVerification verification = verificationOpt.get();
            
            // Check if user has permission to view this file
            if (!verification.getUser().getId().equals(currentUserId) && 
                verification.getVisibility() == UserVerification.VerificationVisibility.PRIVATE) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(verification.getFileType()));
            headers.setContentLength(verification.getFileSize());
            
            // For PDFs and images, use inline disposition so they open in browser
            if (verificationService.isPdfFile(verification.getFileType()) || 
                verificationService.isImageFile(verification.getFileType())) {
                headers.setContentDispositionFormData("inline", verification.getFileName());
            } else {
                headers.setContentDispositionFormData("attachment", verification.getFileName());
            }
            
            // Add cache headers
            headers.setCacheControl("public, max-age=3600");

            return new ResponseEntity<>(verification.getFileData(), headers, HttpStatus.OK);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return user.getId();
        }
        throw new RuntimeException("Invalid authentication principal");
    }

    private LocalDate parseDate(String dateString) {
        if (dateString == null || dateString.trim().isEmpty()) {
            return null;
        }
        try {
            return LocalDate.parse(dateString);
        } catch (DateTimeParseException e) {
            throw new RuntimeException("Invalid date format. Use YYYY-MM-DD format.");
        }
    }
}
