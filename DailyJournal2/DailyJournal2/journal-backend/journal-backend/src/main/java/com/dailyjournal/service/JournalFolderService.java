package com.dailyjournal.service;

import com.dailyjournal.dto.JournalFolderRequest;
import com.dailyjournal.dto.JournalFolderResponse;
import com.dailyjournal.dto.JournalResponse;
import com.dailyjournal.entity.JournalEntry;
import com.dailyjournal.entity.JournalFolder;
import com.dailyjournal.entity.User;
import com.dailyjournal.mapper.JournalMapper;
import com.dailyjournal.repository.JournalRepository;
import com.dailyjournal.repository.JournalFolderRepository;
import com.dailyjournal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class JournalFolderService {

    private final JournalFolderRepository folderRepository;
    private final JournalRepository journalRepository;
    private final UserRepository userRepository;
    private final JournalMapper journalMapper;

    /**
     * Create a new folder for a user
     */
    public JournalFolderResponse createFolder(Long userId, JournalFolderRequest request) {
        log.info("Creating folder '{}' for user ID: {}", request.getName(), userId);

        // Input validation
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Folder name cannot be null or empty");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        // Check if folder name already exists for this user
        Optional<JournalFolder> existingFolder = folderRepository.findByNameAndUser(request.getName(), user);
        if (existingFolder.isPresent()) {
            throw new IllegalArgumentException("Folder with name '" + request.getName() + "' already exists for user ID: " + userId);
        }

        JournalFolder folder = JournalFolder.builder()
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .color(request.getColor() != null ? request.getColor().trim() : "#2196F3") // Default blue
                .icon(request.getIcon() != null ? request.getIcon().trim() : "folder") // Default folder icon
                .user(user)
                .build();

        JournalFolder savedFolder = folderRepository.save(folder);
        log.info("Successfully created folder with ID: {}", savedFolder.getId());

        return mapToResponse(savedFolder);
    }

    /**
     * Get all folders for a user
     */
    @Transactional(readOnly = true)
    public List<JournalFolderResponse> getUserFolders(Long userId) {
        log.info("Fetching folders for user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        List<JournalFolder> folders = folderRepository.findByUserOrderByCreatedAtDesc(user);
        
        return folders.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get folders with pagination
     */
    @Transactional(readOnly = true)
    public Page<JournalFolderResponse> getUserFolders(Long userId, Pageable pageable) {
        log.info("Fetching folders for user ID: {} with pagination", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        Page<JournalFolder> folders = folderRepository.findByUserOrderByCreatedAtDesc(user, pageable);
        
        return folders.map(this::mapToResponse);
    }

    /**
     * Get folder by ID
     */
    @Transactional(readOnly = true)
    public JournalFolderResponse getFolderById(Long userId, Long folderId) {
        log.info("Fetching folder ID: {} for user ID: {}", folderId, userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        JournalFolder folder = folderRepository.findByIdAndUser(folderId, user)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found with ID: " + folderId + " for user ID: " + userId));

        return mapToResponse(folder);
    }

    /**
     * Update folder
     */
    public JournalFolderResponse updateFolder(Long userId, Long folderId, JournalFolderRequest request) {
        log.info("Updating folder ID: {} for user ID: {}", folderId, userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        JournalFolder folder = folderRepository.findByIdAndUser(folderId, user)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found with ID: " + folderId + " for user ID: " + userId));

        // Check if new name conflicts with existing folder (excluding current folder)
        if (!folder.getName().equals(request.getName().trim())) {
            Optional<JournalFolder> existingFolder = folderRepository.findByNameAndUser(request.getName().trim(), user);
            if (existingFolder.isPresent() && !existingFolder.get().getId().equals(folderId)) {
                throw new IllegalArgumentException("Folder with name '" + request.getName() + "' already exists for user ID: " + userId);
            }
        }

        folder.setName(request.getName().trim());
        folder.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        folder.setColor(request.getColor() != null ? request.getColor().trim() : folder.getColor());
        folder.setIcon(request.getIcon() != null ? request.getIcon().trim() : folder.getIcon());

        JournalFolder updatedFolder = folderRepository.save(folder);
        log.info("Successfully updated folder ID: {}", updatedFolder.getId());

        return mapToResponse(updatedFolder);
    }

    /**
     * Delete folder
     */
    public void deleteFolder(Long userId, Long folderId) {
        log.info("Deleting folder ID: {} for user ID: {}", folderId, userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        JournalFolder folder = folderRepository.findByIdAndUser(folderId, user)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found with ID: " + folderId + " for user ID: " + userId));

        // Move all journals in this folder to no folder (null)
        List<JournalEntry> journalsInFolder = journalRepository.findByFolder(folder);
        if (!journalsInFolder.isEmpty()) {
            journalsInFolder.forEach(journal -> journal.setFolder(null));
            journalRepository.saveAll(journalsInFolder); // Bulk save for better performance
        }

        folderRepository.delete(folder);
        log.info("Successfully deleted folder ID: {} and moved {} journals to no folder", folderId, journalsInFolder.size());
    }

    /**
     * Search folders by name
     */
    @Transactional(readOnly = true)
    public List<JournalFolderResponse> searchFolders(Long userId, String searchTerm) {
        log.info("Searching folders for user ID: {} with term: {}", userId, searchTerm);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        List<JournalFolder> folders = folderRepository.searchByNameAndUser(searchTerm, user);
        
        return folders.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get folder statistics
     */
    @Transactional(readOnly = true)
    public FolderStats getFolderStats(Long userId) {
        log.info("Fetching folder statistics for user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        long totalFolders = folderRepository.countByUser(user);
        List<JournalFolder> foldersWithJournals = folderRepository.findFoldersWithJournals(user);
        List<JournalFolder> emptyFolders = folderRepository.findEmptyFolders(user);

        return FolderStats.builder()
                .totalFolders(totalFolders)
                .foldersWithJournals(foldersWithJournals.size())
                .emptyFolders(emptyFolders.size())
                .build();
    }

    /**
     * Move journal to folder
     */
    public void moveJournalToFolder(Long userId, Long journalId, Long folderId) {
        log.info("Moving journal ID: {} to folder ID: {} for user ID: {}", journalId, folderId, userId);

        // Input validation
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        if (journalId == null) {
            throw new IllegalArgumentException("Journal ID cannot be null");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        JournalEntry journal = journalRepository.findByIdAndUser(journalId, user)
                .orElseThrow(() -> new IllegalArgumentException("Journal not found with ID: " + journalId + " for user ID: " + userId));

        JournalFolder folder = null;
        if (folderId != null) {
            folder = folderRepository.findByIdAndUser(folderId, user)
                    .orElseThrow(() -> new IllegalArgumentException("Folder not found with ID: " + folderId + " for user ID: " + userId));
        }

        journal.setFolder(folder);
        journalRepository.save(journal);

        log.info("Successfully moved journal ID: {} to folder: {}", journalId, 
                folder != null ? folder.getName() : "No folder");
    }

    /**
     * Get journals in folder
     */
    @Transactional(readOnly = true)
    public List<JournalResponse> getJournalsInFolder(Long userId, Long folderId) {
        log.info("Fetching journals in folder ID: {} for user ID: {}", folderId, userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        JournalFolder folder = folderRepository.findByIdAndUser(folderId, user)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found with ID: " + folderId + " for user ID: " + userId));

        List<JournalEntry> entries = journalRepository.findByFolder(folder);
        
        // Transform entities to responses with proper mediaUrls
        return entries.stream()
                .map(journalMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Map entity to response DTO
     */
    private JournalFolderResponse mapToResponse(JournalFolder folder) {
        // Calculate journal count efficiently using count query
        Long journalCount = journalRepository.countByFolder(folder);
        
        return JournalFolderResponse.builder()
                .id(folder.getId())
                .name(folder.getName())
                .description(folder.getDescription())
                .color(folder.getColor())
                .icon(folder.getIcon())
                .createdAt(folder.getCreatedAt())
                .updatedAt(folder.getUpdatedAt())
                .journalCount(journalCount != null ? journalCount.intValue() : 0)
                .userId(folder.getUser().getId())
                .build();
    }

    /**
     * Folder statistics DTO
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class FolderStats {
        private long totalFolders;
        private long foldersWithJournals;
        private long emptyFolders;
    }
}
