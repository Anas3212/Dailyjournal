package com.dailyjournal.controller;

import com.dailyjournal.dto.WorkshopFileRequest;
import com.dailyjournal.dto.WorkshopFileResponse;
import com.dailyjournal.dto.WorkshopStatsResponse;
import com.dailyjournal.entity.User;
import com.dailyjournal.entity.WorkshopFile.FileType;
import com.dailyjournal.service.WorkshopFileService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/workshop")
public class WorkshopFileController {

    @Autowired
    private WorkshopFileService workshopFileService;

    // Create a new workshop file
    @PostMapping("/files")
    public ResponseEntity<WorkshopFileResponse> createFile(
            @Valid @RequestBody WorkshopFileRequest request,
            Authentication authentication) {
        
        User user = (User) authentication.getPrincipal();
        Long userId = user.getId();
        WorkshopFileResponse response = workshopFileService.createFile(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Get user's files with pagination and filtering
    @GetMapping("/files")
    public ResponseEntity<Page<WorkshopFileResponse>> getUserFiles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "updatedAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String fileType,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            Authentication authentication) {
        
        User user = (User) authentication.getPrincipal();
        Long userId = user.getId();
        Page<WorkshopFileResponse> files;
        
        if (search != null && !search.trim().isEmpty()) {
            files = workshopFileService.searchFiles(userId, search.trim(), page, size);
        } else if (fileType != null && !fileType.trim().isEmpty()) {
            FileType type = FileType.valueOf(fileType.toUpperCase());
            files = workshopFileService.getFilesByType(userId, type, page, size);
        } else if (category != null && !category.trim().isEmpty()) {
            files = workshopFileService.getFilesByCategory(userId, category, page, size);
        } else {
            files = workshopFileService.getUserFiles(userId, page, size, sortBy, sortDir);
        }
        
        return ResponseEntity.ok(files);
    }

    // Get file by ID
    @GetMapping("/files/{fileId}")
    public ResponseEntity<WorkshopFileResponse> getFile(
            @PathVariable Long fileId,
            Authentication authentication) {
        
        User user = (User) authentication.getPrincipal();
        Long userId = user.getId();
        WorkshopFileResponse file = workshopFileService.getFileById(fileId, userId);
        return ResponseEntity.ok(file);
    }

    // Get shared file by token (public endpoint)
    @GetMapping("/shared/{shareToken}")
    public ResponseEntity<WorkshopFileResponse> getSharedFile(@PathVariable String shareToken) {
        WorkshopFileResponse file = workshopFileService.getSharedFile(shareToken);
        return ResponseEntity.ok(file);
    }

    // Update file
    @PutMapping("/files/{fileId}")
    public ResponseEntity<WorkshopFileResponse> updateFile(
            @PathVariable Long fileId,
            @Valid @RequestBody WorkshopFileRequest request,
            Authentication authentication) {
        
        User user = (User) authentication.getPrincipal();
        Long userId = user.getId();
        WorkshopFileResponse updatedFile = workshopFileService.updateFile(fileId, request, userId);
        return ResponseEntity.ok(updatedFile);
    }

    // Delete file
    @DeleteMapping("/files/{fileId}")
    public ResponseEntity<Void> deleteFile(
            @PathVariable Long fileId,
            Authentication authentication) {
        
        User user = (User) authentication.getPrincipal();
        Long userId = user.getId();
        workshopFileService.deleteFile(fileId, userId);
        return ResponseEntity.noContent().build();
    }

    // Duplicate file
    @PostMapping("/files/{fileId}/duplicate")
    public ResponseEntity<WorkshopFileResponse> duplicateFile(
            @PathVariable Long fileId,
            Authentication authentication) {
        
        User user = (User) authentication.getPrincipal();
        Long userId = user.getId();
        WorkshopFileResponse duplicatedFile = workshopFileService.duplicateFile(fileId, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(duplicatedFile);
    }

    // Export file
    @GetMapping("/files/{fileId}/export")
    public ResponseEntity<String> exportFile(
            @PathVariable Long fileId,
            @RequestParam(defaultValue = "txt") String format,
            Authentication authentication) {
        
        User user = (User) authentication.getPrincipal();
        Long userId = user.getId();
        String exportedContent = workshopFileService.exportFile(fileId, userId, format);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(getMediaTypeForFormat(format));
        headers.setContentDispositionFormData("attachment", "export." + format);
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(exportedContent);
    }

    // Get user's categories
    @GetMapping("/categories")
    public ResponseEntity<List<String>> getUserCategories(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Long userId = user.getId();
        List<String> categories = workshopFileService.getUserCategories(userId);
        return ResponseEntity.ok(categories);
    }

    // Get file statistics
    @GetMapping("/stats")
    public ResponseEntity<WorkshopStatsResponse> getFileStatistics(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Long userId = user.getId();
        WorkshopStatsResponse stats = workshopFileService.getFileStatistics(userId);
        return ResponseEntity.ok(stats);
    }

    // Get recent files
    @GetMapping("/recent")
    public ResponseEntity<List<WorkshopFileResponse>> getRecentFiles(
            @RequestParam(defaultValue = "5") int limit,
            Authentication authentication) {
        
        User user = (User) authentication.getPrincipal();
        Long userId = user.getId();
        List<WorkshopFileResponse> recentFiles = workshopFileService.getRecentFiles(userId, limit);
        return ResponseEntity.ok(recentFiles);
    }

    // Get available file types
    @GetMapping("/file-types")
    public ResponseEntity<List<FileTypeInfo>> getFileTypes() {
        List<FileTypeInfo> fileTypes = Arrays.stream(FileType.values())
                .map(type -> new FileTypeInfo(
                        type.name(),
                        type.getDisplayName(),
                        type.getExtension(),
                        type.getMimeType()
                ))
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(fileTypes);
    }

    // Helper method to get media type for export format
    private MediaType getMediaTypeForFormat(String format) {
        switch (format.toLowerCase()) {
            case "json":
                return MediaType.APPLICATION_JSON;
            case "xml":
                return MediaType.APPLICATION_XML;
            case "csv":
                return MediaType.parseMediaType("text/csv");
            default:
                return MediaType.TEXT_PLAIN;
        }
    }

    // Inner class for file type information
    public static class FileTypeInfo {
        private String name;
        private String displayName;
        private String extension;
        private String mimeType;

        public FileTypeInfo(String name, String displayName, String extension, String mimeType) {
            this.name = name;
            this.displayName = displayName;
            this.extension = extension;
            this.mimeType = mimeType;
        }

        // Getters
        public String getName() { return name; }
        public String getDisplayName() { return displayName; }
        public String getExtension() { return extension; }
        public String getMimeType() { return mimeType; }
    }
}
