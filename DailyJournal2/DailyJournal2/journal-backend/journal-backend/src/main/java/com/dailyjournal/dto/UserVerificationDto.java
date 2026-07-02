package com.dailyjournal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;


/**
 * Data Transfer Object for user verifications exposed via REST.
 * Uses String for enum-like fields (type, visibility) to decouple from entity enums.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserVerificationDto {
    /** Unique identifier of the verification */
    private Long id;

    /** Verification type (e.g., CERTIFICATE, AUTHORIZATION, REWARD) */
    private String type;

    /** Title of the verification/credential */
    private String title;

    /** Issuing organization/person */
    private String issuer;

    /** Date when the verification was issued (YYYY-MM-DD) */
    private LocalDate issueDate;

    /** Optional expiry date (YYYY-MM-DD) */
    private LocalDate expiryDate;

    /** Optional credential identifier supplied by the issuer */
    private String credentialId;

    /** Optional URL referencing the credential details/verification page */
    private String credentialUrl;

    /** Free-form description or notes */
    private String description;

    /** Visibility level (PUBLIC, FRIENDS, PRIVATE) */
    private String visibility;

    /** Original uploaded file name (image or PDF) */
    private String fileName;

    /** MIME content type of the uploaded file */
    private String fileType;

    /** Size of the uploaded file in bytes */
    private Long fileSize;

    /** Convenience flag: whether a file is attached */
    private boolean hasFile;

    /** Creation timestamp */
    private LocalDateTime createdAt;

    /** Last update timestamp */
    private LocalDateTime updatedAt;
}
