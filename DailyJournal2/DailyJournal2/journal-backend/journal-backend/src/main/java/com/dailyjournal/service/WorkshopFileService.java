package com.dailyjournal.service;

import com.dailyjournal.dto.WorkshopFileRequest;
import com.dailyjournal.dto.WorkshopFileResponse;
import com.dailyjournal.dto.WorkshopStatsResponse;
import com.dailyjournal.entity.User;
import com.dailyjournal.entity.WorkshopFile;
import com.dailyjournal.entity.WorkshopFile.FileType;
import com.dailyjournal.exception.NotFoundException;
import com.dailyjournal.exception.UnauthorizedException;
import com.dailyjournal.mapper.WorkshopFileMapper;
import com.dailyjournal.repository.WorkshopFileRepository;
import com.dailyjournal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class WorkshopFileService {

    @Autowired
    private WorkshopFileRepository workshopFileRepository;

    @Autowired
    private WorkshopFileMapper workshopFileMapper;

    @Autowired
    private UserRepository userRepository;

    // Create a new workshop file
    public WorkshopFileResponse createFile(WorkshopFileRequest request, Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        
        // Check if file name already exists for this user
        if (workshopFileRepository.existsByUserIdAndFileName(userId, request.getFileName())) {
            throw new IllegalArgumentException("A file with this name already exists");
        }

        WorkshopFile workshopFile = workshopFileMapper.toEntity(request, user);
        
        // Generate share token if file is shared
        if (workshopFile.getIsShared()) {
            workshopFile.setShareToken(generateShareToken());
        }

        WorkshopFile savedFile = workshopFileRepository.save(workshopFile);
        return workshopFileMapper.toResponse(savedFile);
    }

    // Get file by ID
    public WorkshopFileResponse getFileById(Long fileId, Long userId) {
        WorkshopFile workshopFile = workshopFileRepository.findById(fileId)
            .orElseThrow(() -> new NotFoundException("Workshop file not found"));

        // Check if user owns the file or if it's shared
        if (!workshopFile.getUser().getId().equals(userId) && !workshopFile.getIsShared()) {
            throw new UnauthorizedException("You don't have permission to access this file");
        }

        return workshopFileMapper.toResponse(workshopFile);
    }

    // Get file by share token
    public WorkshopFileResponse getSharedFile(String shareToken) {
        WorkshopFile workshopFile = workshopFileRepository.findByShareTokenAndIsSharedTrue(shareToken)
            .orElseThrow(() -> new NotFoundException("Shared file not found"));

        return workshopFileMapper.toResponse(workshopFile);
    }

    // Get user's files with pagination
    public Page<WorkshopFileResponse> getUserFiles(Long userId, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<WorkshopFile> files = workshopFileRepository.findByUserIdOrderByUpdatedAtDesc(userId, pageable);
        
        return files.map(workshopFileMapper::toResponseWithoutContent);
    }

    // Get files by type
    public Page<WorkshopFileResponse> getFilesByType(Long userId, FileType fileType, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        Page<WorkshopFile> files = workshopFileRepository.findByUserIdAndFileTypeOrderByUpdatedAtDesc(userId, fileType, pageable);
        
        return files.map(workshopFileMapper::toResponseWithoutContent);
    }

    // Get files by category
    public Page<WorkshopFileResponse> getFilesByCategory(Long userId, String category, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        Page<WorkshopFile> files = workshopFileRepository.findByUserIdAndCategoryOrderByUpdatedAtDesc(userId, category, pageable);
        
        return files.map(workshopFileMapper::toResponseWithoutContent);
    }

    // Search files
    public Page<WorkshopFileResponse> searchFiles(Long userId, String searchTerm, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<WorkshopFile> files = workshopFileRepository.searchFilesByUser(userId, searchTerm, pageable);
        
        return files.map(workshopFileMapper::toResponseWithoutContent);
    }

    // Update file
    public WorkshopFileResponse updateFile(Long fileId, WorkshopFileRequest request, Long userId) {
        WorkshopFile workshopFile = workshopFileRepository.findById(fileId)
            .orElseThrow(() -> new NotFoundException("Workshop file not found"));

        // Check ownership
        if (!workshopFile.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("You don't have permission to update this file");
        }

        // Check if new file name conflicts with existing files
        if (!workshopFile.getFileName().equals(request.getFileName()) &&
            workshopFileRepository.existsByUserIdAndFileName(userId, request.getFileName())) {
            throw new IllegalArgumentException("A file with this name already exists");
        }

        workshopFileMapper.updateEntityFromRequest(workshopFile, request);

        // Handle sharing
        if (request.getIsShared() != null) {
            if (request.getIsShared() && workshopFile.getShareToken() == null) {
                workshopFile.setShareToken(generateShareToken());
            } else if (!request.getIsShared()) {
                workshopFile.setShareToken(null);
            }
        }

        WorkshopFile updatedFile = workshopFileRepository.save(workshopFile);
        return workshopFileMapper.toResponse(updatedFile);
    }

    // Delete file
    public void deleteFile(Long fileId, Long userId) {
        WorkshopFile workshopFile = workshopFileRepository.findById(fileId)
            .orElseThrow(() -> new NotFoundException("Workshop file not found"));

        // Check ownership
        if (!workshopFile.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("You don't have permission to delete this file");
        }

        workshopFileRepository.delete(workshopFile);
    }

    // Get user's categories
    public List<String> getUserCategories(Long userId) {
        return workshopFileRepository.findDistinctCategoriesByUserId(userId);
    }

    // Get file statistics
    public WorkshopStatsResponse getFileStatistics(Long userId) {
        long totalFiles = workshopFileRepository.countByUserId(userId);
        long totalSize = workshopFileRepository.getTotalFileSizeByUserId(userId);
        
        WorkshopStatsResponse stats = new WorkshopStatsResponse(totalFiles, totalSize);
        
        // Get file type statistics
        List<Object[]> typeStats = workshopFileRepository.getFileStatisticsByUserId(userId);
        Map<String, Long> fileTypeStats = new HashMap<>();
        Map<String, Long> fileSizeStats = new HashMap<>();
        
        for (Object[] stat : typeStats) {
            FileType fileType = (FileType) stat[0];
            Long count = (Long) stat[1];
            Long size = (Long) stat[2];
            
            fileTypeStats.put(fileType.getDisplayName(), count);
            fileSizeStats.put(fileType.getDisplayName(), size != null ? size : 0L);
        }
        
        stats.setFileTypeStats(fileTypeStats);
        stats.setFileSizeStats(fileSizeStats);
        
        // Get recent files count (last 7 days)
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        List<WorkshopFile> recentFiles = workshopFileRepository.findRecentFilesByUserId(userId, weekAgo);
        stats.setRecentFilesCount(recentFiles.size());
        
        return stats;
    }

    // Get recent files
    public List<WorkshopFileResponse> getRecentFiles(Long userId, int limit) {
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        List<WorkshopFile> recentFiles = workshopFileRepository.findRecentFilesByUserId(userId, weekAgo);
        
        return recentFiles.stream()
            .limit(limit)
            .map(workshopFileMapper::toResponseWithoutContent)
            .collect(Collectors.toList());
    }

    // Duplicate file
    public WorkshopFileResponse duplicateFile(Long fileId, Long userId) {
        WorkshopFile originalFile = workshopFileRepository.findById(fileId)
            .orElseThrow(() -> new NotFoundException("Workshop file not found"));

        // Check ownership
        if (!originalFile.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("You don't have permission to duplicate this file");
        }

        // Create duplicate with modified name
        String newFileName = generateDuplicateName(originalFile.getFileName(), userId);
        
        WorkshopFile duplicateFile = new WorkshopFile();
        duplicateFile.setFileName(newFileName);
        duplicateFile.setFileType(originalFile.getFileType());
        duplicateFile.setContent(originalFile.getContent());
        duplicateFile.setDescription(originalFile.getDescription());
        duplicateFile.setCategory(originalFile.getCategory());
        duplicateFile.setTags(originalFile.getTags());
        duplicateFile.setUser(originalFile.getUser());
        duplicateFile.setIsShared(false); // Duplicates are not shared by default

        WorkshopFile savedDuplicate = workshopFileRepository.save(duplicateFile);
        return workshopFileMapper.toResponse(savedDuplicate);
    }

    // Export file content
    public String exportFile(Long fileId, Long userId, String format) {
        WorkshopFile workshopFile = workshopFileRepository.findById(fileId)
            .orElseThrow(() -> new NotFoundException("Workshop file not found"));

        // Check ownership or sharing
        if (!workshopFile.getUser().getId().equals(userId) && !workshopFile.getIsShared()) {
            throw new UnauthorizedException("You don't have permission to export this file");
        }

        // Return content based on format
        switch (format.toLowerCase()) {
            case "json":
                return convertToJson(workshopFile);
            case "xml":
                return convertToXml(workshopFile);
            case "csv":
                return convertToCsv(workshopFile);
            default:
                return workshopFile.getContent();
        }
    }

    // Private helper methods
    private String generateShareToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private String generateDuplicateName(String originalName, Long userId) {
        String baseName = originalName;
        String extension = "";
        
        int lastDotIndex = originalName.lastIndexOf('.');
        if (lastDotIndex > 0) {
            baseName = originalName.substring(0, lastDotIndex);
            extension = originalName.substring(lastDotIndex);
        }
        
        int counter = 1;
        String newName;
        
        do {
            newName = baseName + " (Copy " + counter + ")" + extension;
            counter++;
        } while (workshopFileRepository.existsByUserIdAndFileName(userId, newName));
        
        return newName;
    }

    private String convertToJson(WorkshopFile file) {
        // Simple JSON conversion - in a real implementation, you might use Jackson
        return String.format(
            "{\"fileName\":\"%s\",\"fileType\":\"%s\",\"content\":\"%s\",\"createdAt\":\"%s\"}",
            file.getFileName(),
            file.getFileType(),
            file.getContent().replace("\"", "\\\"").replace("\n", "\\n"),
            file.getCreatedAt()
        );
    }

    private String convertToXml(WorkshopFile file) {
        return String.format(
            "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<file>\n  <fileName>%s</fileName>\n  <fileType>%s</fileType>\n  <content><![CDATA[%s]]></content>\n  <createdAt>%s</createdAt>\n</file>",
            file.getFileName(),
            file.getFileType(),
            file.getContent(),
            file.getCreatedAt()
        );
    }

    private String convertToCsv(WorkshopFile file) {
        return String.format(
            "FileName,FileType,Content,CreatedAt\n\"%s\",\"%s\",\"%s\",\"%s\"",
            file.getFileName(),
            file.getFileType(),
            file.getContent().replace("\"", "\"\""),
            file.getCreatedAt()
        );
    }
}
