package com.dailyjournal.service;

import com.dailyjournal.entity.User;
import com.dailyjournal.entity.UserVerification;
import com.dailyjournal.entity.UserVerification.VerificationVisibility;
import com.dailyjournal.repository.UserRepository;
import com.dailyjournal.repository.UserVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class UserVerificationService {

    private final UserVerificationRepository verificationRepository;
    private final UserRepository userRepository;
    private final FriendshipService friendshipService;

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final int MAX_IMAGE_WIDTH = 1920;
    private static final int MAX_IMAGE_HEIGHT = 1080;
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );
    private static final Set<String> ALLOWED_PDF_TYPES = Set.of("application/pdf");

    public List<UserVerification> getMyVerifications(Long userId) {
        return verificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<UserVerification> getPublicVerifications(Long userId, Long viewerId) {
        if (userId.equals(viewerId)) {
            // Owner can see all their verifications
            return verificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }
        
        // For other users, only show PUBLIC verifications (and FRIENDS if they are friends)
        // PRIVATE verifications should never be visible to other users
        List<VerificationVisibility> allowedVisibilities = friendshipService.areUsersFriends(userId, viewerId) 
                ? Arrays.asList(VerificationVisibility.PUBLIC, VerificationVisibility.FRIENDS) 
                : Arrays.asList(VerificationVisibility.PUBLIC);
                
        List<UserVerification> visibleVerifications = verificationRepository.findByUserIdAndVisibilityInOrderByCreatedAtDesc(
                userId, allowedVisibilities
        );
        
        // Additional safety check to ensure no PRIVATE verifications leak through
        return visibleVerifications.stream()
                .filter(v -> allowedVisibilities.contains(v.getVisibility()))
                .toList();
    }

    public UserVerification createVerification(Long userId, UserVerification verification, MultipartFile file) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        verification.setUser(user);
        
        if (file != null && !file.isEmpty()) {
            validateAndSetFile(verification, file);
        }

        return verificationRepository.save(verification);
    }

    public UserVerification updateVerification(Long userId, Long verificationId, UserVerification updatedVerification, MultipartFile file) {
        UserVerification existing = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new RuntimeException("Verification not found"));

        if (!existing.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized to update this verification");
        }

        // Update fields
        existing.setType(updatedVerification.getType());
        existing.setTitle(updatedVerification.getTitle());
        existing.setIssuer(updatedVerification.getIssuer());
        existing.setIssueDate(updatedVerification.getIssueDate());
        existing.setExpiryDate(updatedVerification.getExpiryDate());
        existing.setCredentialId(updatedVerification.getCredentialId());
        existing.setCredentialUrl(updatedVerification.getCredentialUrl());
        existing.setDescription(updatedVerification.getDescription());
        existing.setVisibility(updatedVerification.getVisibility());

        if (file != null && !file.isEmpty()) {
            validateAndSetFile(existing, file);
        }

        return verificationRepository.save(existing);
    }

    public void deleteVerification(Long userId, Long verificationId) {
        UserVerification verification = verificationRepository.findById(verificationId)
                .orElseThrow(() -> new RuntimeException("Verification not found"));

        if (!verification.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this verification");
        }

        verificationRepository.delete(verification);
    }

    public Optional<UserVerification> getVerificationById(Long id) {
        return verificationRepository.findById(id);
    }

    private void validateAndSetFile(UserVerification verification, MultipartFile file) {
        try {
            // Validate file size
            if (file.getSize() > MAX_FILE_SIZE) {
                throw new RuntimeException("File size exceeds 10MB limit");
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || 
                (!ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase()) && 
                 !ALLOWED_PDF_TYPES.contains(contentType.toLowerCase()))) {
                throw new RuntimeException("File type not allowed. Only images (JPEG, PNG, GIF, WebP) and PDF files are supported");
            }

            // Optimize and set file data
            byte[] fileData;
            if (isImageFile(contentType)) {
                fileData = compressImage(file);
            } else {
                fileData = file.getBytes(); // Keep PDFs as-is
            }
            
            verification.setFileName(file.getOriginalFilename());
            verification.setFileType(contentType);
            verification.setFileSize((long) fileData.length); // Update size after compression
            verification.setFileData(fileData);

        } catch (IOException e) {
            throw new RuntimeException("Failed to process file: " + e.getMessage());
        }
    }

    public boolean isImageFile(String fileType) {
        return fileType != null && ALLOWED_IMAGE_TYPES.contains(fileType.toLowerCase());
    }

    public boolean isPdfFile(String fileType) {
        return fileType != null && ALLOWED_PDF_TYPES.contains(fileType.toLowerCase());
    }

    private byte[] compressImage(MultipartFile image) throws IOException {
        // For GIF images, don't compress to preserve animation
        if ("image/gif".equals(image.getContentType())) {
            return image.getBytes();
        }

        try {
            BufferedImage originalImage = ImageIO.read(new ByteArrayInputStream(image.getBytes()));
            if (originalImage == null) {
                return image.getBytes(); // Fallback to original if can't read
            }

            // Resize if image is too large
            BufferedImage resizedImage = resizeImageIfNeeded(originalImage);
            
            // Compress JPEG images
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            String format = getImageFormat(image.getContentType());
            
            if ("jpeg".equals(format) || "jpg".equals(format)) {
                // Use JPEG compression for better file size
                ImageIO.write(resizedImage, "jpeg", outputStream);
            } else {
                // Keep original format for PNG/WebP
                ImageIO.write(resizedImage, format, outputStream);
            }
            
            byte[] compressedData = outputStream.toByteArray();
            
            // Return compressed version only if it's smaller
            return compressedData.length < image.getSize() ? compressedData : image.getBytes();
            
        } catch (Exception e) {
            // Fallback to original image if compression fails
            return image.getBytes();
        }
    }

    private BufferedImage resizeImageIfNeeded(BufferedImage originalImage) {
        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();
        
        // Check if resizing is needed
        if (originalWidth <= MAX_IMAGE_WIDTH && originalHeight <= MAX_IMAGE_HEIGHT) {
            return originalImage;
        }
        
        // Calculate new dimensions maintaining aspect ratio
        double widthRatio = (double) MAX_IMAGE_WIDTH / originalWidth;
        double heightRatio = (double) MAX_IMAGE_HEIGHT / originalHeight;
        double ratio = Math.min(widthRatio, heightRatio);
        
        int newWidth = (int) (originalWidth * ratio);
        int newHeight = (int) (originalHeight * ratio);
        
        // Create resized image
        BufferedImage resizedImage = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = resizedImage.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.drawImage(originalImage, 0, 0, newWidth, newHeight, null);
        g2d.dispose();
        
        return resizedImage;
    }

    private String getImageFormat(String contentType) {
        if (contentType == null) return "jpeg";
        return switch (contentType.toLowerCase()) {
            case "image/png" -> "png";
            case "image/gif" -> "gif";
            case "image/webp" -> "webp";
            default -> "jpeg";
        };
    }
}
