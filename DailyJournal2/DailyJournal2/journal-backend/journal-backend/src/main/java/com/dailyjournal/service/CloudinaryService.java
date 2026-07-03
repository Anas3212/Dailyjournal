package com.dailyjournal.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * CloudinaryService — persists media files to Cloudinary cloud storage.
 * Cloudinary is required for all media storage.
 */
@Service
@Slf4j
public class CloudinaryService {

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    private Cloudinary cloudinary;
    private boolean cloudinaryEnabled = false;

    @PostConstruct
    public void init() {
        if (cloudName != null && !cloudName.isBlank()
                && apiKey != null && !apiKey.isBlank()
                && apiSecret != null && !apiSecret.isBlank()) {
            try {
                cloudinary = new Cloudinary(ObjectUtils.asMap(
                        "cloud_name", cloudName,
                        "api_key", apiKey,
                        "api_secret", apiSecret,
                        "secure", true
                ));
                cloudinaryEnabled = true;
                log.info("Cloudinary storage enabled (cloud: {})", cloudName);
            } catch (Exception e) {
                log.error("Failed to initialise Cloudinary: {}", e.getMessage());
                throw new RuntimeException("Cloudinary configuration is required. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.");
            }
        } else {
            log.error("Cloudinary credentials not set. Cloudinary is required for media storage. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.");
            throw new RuntimeException("Cloudinary configuration is required. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.");
        }
    }

    /**
     * Upload a file and return its Cloudinary secure URL.
     */
    public String upload(MultipartFile file) throws IOException {
        return uploadToCloudinary(file);
    }

    /**
     * Delete a file by its stored Cloudinary URL.
     */
    public void delete(String storedPath) {
        deleteFromCloudinary(storedPath);
    }

    /**
     * Whether Cloudinary storage is active.
     */
    public boolean isCloudinaryEnabled() {
        return cloudinaryEnabled;
    }

    public String getCloudName() {
        return cloudName;
    }

    // ---- private helpers ----

    private String uploadToCloudinary(MultipartFile file) throws IOException {
        String originalName = file.getOriginalFilename();
        // Derive folder and resource type
        String resourceType = "auto";
        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "resource_type", resourceType,
                        "folder", "dailyjournal",
                        "use_filename", false,
                        "unique_filename", true
                )
        );
        // Return the Cloudinary secure URL as the stored path
        String secureUrl = (String) uploadResult.get("secure_url");
        log.debug("Cloudinary upload: {} -> {}", originalName, secureUrl);
        return secureUrl;
    }

    private void deleteFromCloudinary(String storedPath) {
        try {
            // storedPath may be a full https://res.cloudinary.com/... URL
            // Extract public_id from it
            String publicId = extractPublicId(storedPath);
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.debug("Cloudinary deleted: {}", publicId);
        } catch (Exception e) {
            log.warn("Failed to delete from Cloudinary: {} — {}", storedPath, e.getMessage());
        }
    }

    /**
     * Extracts the Cloudinary public_id from a full secure URL.
     * e.g. https://res.cloudinary.com/mycloud/image/upload/v123/dailyjournal/abc123 -> dailyjournal/abc123
     */
    private String extractPublicId(String url) {
        if (url == null) return "";
        // Pattern: .../<version>/public_id.<ext>
        int uploadIdx = url.indexOf("/upload/");
        if (uploadIdx == -1) return url; // fallback
        String afterUpload = url.substring(uploadIdx + "/upload/".length());
        // Skip version segment (e.g. "v1234567/")
        if (afterUpload.startsWith("v") && afterUpload.contains("/")) {
            afterUpload = afterUpload.substring(afterUpload.indexOf('/') + 1);
        }
        // Remove file extension
        int dotIdx = afterUpload.lastIndexOf('.');
        if (dotIdx > 0) {
            afterUpload = afterUpload.substring(0, dotIdx);
        }
        return afterUpload;
    }

    /**
     * Download content from a Cloudinary URL to proxy it through the backend.
     * This avoids CORS issues when the frontend uses withCredentials: true.
     */
    public byte[] downloadFromUrl(String url) throws IOException {
        java.net.URI cloudinaryUri = java.net.URI.create(url);
        try (java.io.InputStream in = cloudinaryUri.toURL().openStream()) {
            return in.readAllBytes();
        }
    }
}
