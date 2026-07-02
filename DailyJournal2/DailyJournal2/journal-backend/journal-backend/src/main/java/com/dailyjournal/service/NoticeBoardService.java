package com.dailyjournal.service;

import com.dailyjournal.dto.NoticeBoardDto;
import com.dailyjournal.entity.NoticeBoard;
import com.dailyjournal.entity.Team;
import com.dailyjournal.entity.TeamMember;
import com.dailyjournal.entity.User;
import com.dailyjournal.exception.NotFoundException;
import com.dailyjournal.exception.UnauthorizedException;
import com.dailyjournal.repository.NoticeBoardRepository;
import com.dailyjournal.repository.TeamMemberRepository;
import com.dailyjournal.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

// EXIF metadata reader for orientation correction
import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;
import java.awt.geom.AffineTransform;

@Service
@RequiredArgsConstructor
@Transactional
public class NoticeBoardService {

    private final NoticeBoardRepository noticeBoardRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    
    // BLOB Storage Optimization Constants
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final int MAX_IMAGE_WIDTH = 1920;
    private static final int MAX_IMAGE_HEIGHT = 1080;
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Object principal = auth.getPrincipal();
        if (principal instanceof User user) return user;
        throw new RuntimeException("User not authenticated");
    }

    public List<NoticeBoardDto> getTeamNotices(Long teamId) {
        User current = getCurrentUser();
        // Verify user is a member of the team
        teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId())
                .orElseThrow(() -> new UnauthorizedException("You are not a member of this team"));

        List<NoticeBoard> notices = noticeBoardRepository.findByTeamIdOrderByPinnedDescCreatedAtDesc(teamId);
        return notices.stream()
                .map(notice -> {
                    NoticeBoardDto dto = NoticeBoardDto.fromEntity(notice);
                    // Get the author's role in this team
                    TeamMember authorMember = teamMemberRepository.findByTeamIdAndUserId(teamId, notice.getCreatedBy().getId())
                            .orElse(null);
                    if (authorMember != null) {
                        dto.setCreatedByRole(authorMember.getRole().name());
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public NoticeBoardDto createNotice(Long teamId, String title, String content, NoticeBoard.NoticePriority priority) {
        User current = getCurrentUser();
        // Verify user has permission to create notices (MASTER or ADMIN only)
        TeamMember teamMember = teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId())
                .orElseThrow(() -> new UnauthorizedException("You are not a member of this team"));

        if (!canManageNotices(teamMember.getRole())) {
            throw new UnauthorizedException("Only team masters and admins can create notices");
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new NotFoundException("Team not found"));

        NoticeBoard notice = new NoticeBoard();
        notice.setTitle(title);
        notice.setContent(content);
        notice.setPriority(priority != null ? priority : NoticeBoard.NoticePriority.NORMAL);
        notice.setTeam(team);
        notice.setCreatedBy(current);

        NoticeBoard savedNotice = noticeBoardRepository.save(notice);
        return NoticeBoardDto.fromEntity(savedNotice);
    }

    public NoticeBoardDto createNoticeWithImage(Long teamId, String title, String content, 
                                               NoticeBoard.NoticePriority priority, MultipartFile image) throws IOException {
        User current = getCurrentUser();
        // Verify user has permission to create notices (MASTER or ADMIN only)
        TeamMember teamMember = teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId())
                .orElseThrow(() -> new UnauthorizedException("You are not a member of this team"));

        if (!canManageNotices(teamMember.getRole())) {
            throw new UnauthorizedException("Only team masters and admins can create notices");
        }

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new NotFoundException("Team not found"));

        NoticeBoard notice = new NoticeBoard();
        notice.setTitle(title);
        notice.setContent(content);
        notice.setPriority(priority != null ? priority : NoticeBoard.NoticePriority.NORMAL);
        notice.setTeam(team);
        notice.setCreatedBy(current);

        // Handle image if provided
        if (image != null && !image.isEmpty()) {
            validateAndOptimizeImage(image);
            byte[] optimizedImageData = compressImage(image);
            notice.setImageData(optimizedImageData);
            notice.setImageName(image.getOriginalFilename());
            notice.setImageType(image.getContentType());
        }

        NoticeBoard savedNotice = noticeBoardRepository.save(notice);
        return NoticeBoardDto.fromEntity(savedNotice);
    }

    public NoticeBoardDto updateNotice(Long teamId, Long noticeId, String title, String content, NoticeBoard.NoticePriority priority) {
        User current = getCurrentUser();
        // Verify user has permission to update notices
        TeamMember teamMember = teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId())
                .orElseThrow(() -> new UnauthorizedException("You are not a member of this team"));

        if (!canManageNotices(teamMember.getRole())) {
            throw new UnauthorizedException("Only team masters and admins can update notices");
        }

        NoticeBoard notice = noticeBoardRepository.findByIdAndTeamId(noticeId, teamId)
                .orElseThrow(() -> new NotFoundException("Notice not found"));

        notice.setTitle(title);
        notice.setContent(content);
        notice.setPriority(priority != null ? priority : notice.getPriority());

        NoticeBoard updatedNotice = noticeBoardRepository.save(notice);
        return NoticeBoardDto.fromEntity(updatedNotice);
    }

    public NoticeBoardDto updateNoticeWithImage(Long teamId, Long noticeId, String title, String content, 
                                               NoticeBoard.NoticePriority priority, MultipartFile image) throws IOException {
        User current = getCurrentUser();
        // Verify user has permission to update notices
        TeamMember teamMember = teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId())
                .orElseThrow(() -> new UnauthorizedException("You are not a member of this team"));

        if (!canManageNotices(teamMember.getRole())) {
            throw new UnauthorizedException("Only team masters and admins can update notices");
        }

        NoticeBoard notice = noticeBoardRepository.findByIdAndTeamId(noticeId, teamId)
                .orElseThrow(() -> new NotFoundException("Notice not found"));

        notice.setTitle(title);
        notice.setContent(content);
        notice.setPriority(priority != null ? priority : notice.getPriority());

        // Handle image if provided
        if (image != null && !image.isEmpty()) {
            validateAndOptimizeImage(image);
            byte[] optimizedImageData = compressImage(image);
            notice.setImageData(optimizedImageData);
            notice.setImageName(image.getOriginalFilename());
            notice.setImageType(image.getContentType());
        }

        NoticeBoard updatedNotice = noticeBoardRepository.save(notice);
        return NoticeBoardDto.fromEntity(updatedNotice);
    }

    public void deleteNotice(Long teamId, Long noticeId) {
        User current = getCurrentUser();
        // Verify user has permission to delete notices
        TeamMember teamMember = teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId())
                .orElseThrow(() -> new UnauthorizedException("You are not a member of this team"));

        if (!canManageNotices(teamMember.getRole())) {
            throw new UnauthorizedException("Only team masters and admins can delete notices");
        }

        NoticeBoard notice = noticeBoardRepository.findByIdAndTeamId(noticeId, teamId)
                .orElseThrow(() -> new NotFoundException("Notice not found"));

        noticeBoardRepository.delete(notice);
    }

    public NoticeBoardDto togglePinNotice(Long teamId, Long noticeId) {
        User current = getCurrentUser();
        // Verify user has permission to pin/unpin notices
        TeamMember teamMember = teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId())
                .orElseThrow(() -> new UnauthorizedException("You are not a member of this team"));

        if (!canManageNotices(teamMember.getRole())) {
            throw new UnauthorizedException("Only team masters and admins can pin/unpin notices");
        }

        NoticeBoard notice = noticeBoardRepository.findByIdAndTeamId(noticeId, teamId)
                .orElseThrow(() -> new NotFoundException("Notice not found"));

        notice.setPinned(!notice.isPinned());
        NoticeBoard updatedNotice = noticeBoardRepository.save(notice);
        return NoticeBoardDto.fromEntity(updatedNotice);
    }

    public byte[] getNoticeImage(Long teamId, Long noticeId) {
        User current = getCurrentUser();
        // Verify user is a member of the team
        teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId())
                .orElseThrow(() -> new UnauthorizedException("You are not a member of this team"));

        NoticeBoard notice = noticeBoardRepository.findByIdAndTeamId(noticeId, teamId)
                .orElseThrow(() -> new NotFoundException("Notice not found"));

        if (notice.getImageData() == null) {
            throw new NotFoundException("No image found for this notice");
        }

        return notice.getImageData();
    }

    public String getNoticeImageType(Long teamId, Long noticeId) {
        User current = getCurrentUser();
        // Verify user is a member of the team
        teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId())
                .orElseThrow(() -> new UnauthorizedException("You are not a member of this team"));

        NoticeBoard notice = noticeBoardRepository.findByIdAndTeamId(noticeId, teamId)
                .orElseThrow(() -> new NotFoundException("Notice not found"));

        return notice.getImageType() != null ? notice.getImageType() : "image/jpeg";
    }

    private void validateAndOptimizeImage(MultipartFile image) {
        // Validate file size (max 5MB)
        if (image.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Image size must be less than 5MB");
        }

        // Validate file type
        String contentType = image.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Only JPEG, PNG, GIF, and WebP images are allowed");
        }
    }

    private byte[] compressImage(MultipartFile image) throws IOException {
        // For GIF images, don't compress to preserve animation
        if ("image/gif".equals(image.getContentType())) {
            return image.getBytes();
        }

        try {
            byte[] inputBytes = image.getBytes();
            BufferedImage originalImage = ImageIO.read(new ByteArrayInputStream(inputBytes));
            if (originalImage == null) {
                return inputBytes; // Fallback to original if can't read
            }

            // Correct orientation using EXIF (common with mobile uploads)
            BufferedImage orientedImage = applyExifOrientation(inputBytes, originalImage);

            // Resize if image is too large
            BufferedImage resizedImage = resizeImageIfNeeded(orientedImage);
            
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
            return compressedData.length < image.getSize() ? compressedData : inputBytes;
            
        } catch (Exception e) {
            // Fallback to original image if compression fails
            return image.getBytes();
        }
    }

    // Read EXIF orientation and rotate image accordingly
    private BufferedImage applyExifOrientation(byte[] imageBytes, BufferedImage img) {
        try {
            Metadata metadata = ImageMetadataReader.readMetadata(new ByteArrayInputStream(imageBytes));
            ExifIFD0Directory directory = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
            if (directory != null && directory.containsTag(ExifIFD0Directory.TAG_ORIENTATION)) {
                int orientation = directory.getInt(ExifIFD0Directory.TAG_ORIENTATION);
                return rotateAccordingToOrientation(img, orientation);
            }
        } catch (Exception ignored) {
            // Ignore EXIF errors and return original
        }
        return img;
    }

    private BufferedImage rotateAccordingToOrientation(BufferedImage img, int orientation) {
        int angle;
        switch (orientation) {
            case 3: // 180
                angle = 180; break;
            case 6: // 90 CW
                angle = 90; break;
            case 8: // 270 CW
                angle = 270; break;
            default:
                return img;
        }

        double rads = Math.toRadians(angle);
        double sin = Math.abs(Math.sin(rads)), cos = Math.abs(Math.cos(rads));
        int w = img.getWidth();
        int h = img.getHeight();
        int newW = (int) Math.floor(w * cos + h * sin);
        int newH = (int) Math.floor(h * cos + w * sin);

        BufferedImage rotated = new BufferedImage(newW, newH, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = rotated.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);

        AffineTransform at = new AffineTransform();
        at.translate((newW - w) / 2.0, (newH - h) / 2.0);
        at.rotate(rads, w / 2.0, h / 2.0);

        g2d.drawRenderedImage(img, at);
        g2d.dispose();
        return rotated;
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

    private boolean canManageNotices(TeamMember.Role role) {
        return role == TeamMember.Role.MASTER || role == TeamMember.Role.ADMIN;
    }
}
