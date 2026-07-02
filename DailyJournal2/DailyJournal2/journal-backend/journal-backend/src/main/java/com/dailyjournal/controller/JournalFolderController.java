package com.dailyjournal.controller;

import com.dailyjournal.dto.JournalFolderRequest;
import com.dailyjournal.dto.JournalFolderResponse;
import com.dailyjournal.dto.JournalResponse;
import com.dailyjournal.service.JournalFolderService;
import com.dailyjournal.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/folders")
@RequiredArgsConstructor
@Slf4j
public class JournalFolderController {

    private final JournalFolderService folderService;

    /**
     * Create a new folder
     */
    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> createFolder(@Valid @RequestBody JournalFolderRequest request) {
        try {
            // Get user ID from security context (you'll need to implement this based on your auth system)
            Long userId = getCurrentUserId();
            
            JournalFolderResponse folder = folderService.createFolder(userId, request);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Folder created successfully");
            response.put("data", folder);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            log.error("Error creating folder: {}", e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            log.error("Unexpected error creating folder", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "An unexpected error occurred");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get all folders for current user
     */
    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getUserFolders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Long userId = getCurrentUserId();
            
            if (page >= 0 && size > 0) {
                Pageable pageable = PageRequest.of(page, size);
                Page<JournalFolderResponse> folders = folderService.getUserFolders(userId, pageable);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("data", folders.getContent());
                response.put("totalElements", folders.getTotalElements());
                response.put("totalPages", folders.getTotalPages());
                response.put("currentPage", folders.getNumber());
                response.put("pageSize", folders.getSize());
                
                return ResponseEntity.ok(response);
            } else {
                List<JournalFolderResponse> folders = folderService.getUserFolders(userId);
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("data", folders);
                
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            log.error("Error fetching folders", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to fetch folders");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get folder by ID
     */
    @GetMapping("/{folderId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getFolderById(@PathVariable Long folderId) {
        try {
            Long userId = getCurrentUserId();
            
            JournalFolderResponse folder = folderService.getFolderById(userId, folderId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", folder);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error fetching folder: {}", e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            log.error("Unexpected error fetching folder", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "An unexpected error occurred");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Update folder
     */
    @PutMapping("/{folderId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateFolder(@PathVariable Long folderId, @Valid @RequestBody JournalFolderRequest request) {
        try {
            Long userId = getCurrentUserId();
            
            JournalFolderResponse folder = folderService.updateFolder(userId, folderId, request);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Folder updated successfully");
            response.put("data", folder);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error updating folder: {}", e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            log.error("Unexpected error updating folder", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "An unexpected error occurred");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Delete folder
     */
    @DeleteMapping("/{folderId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteFolder(@PathVariable Long folderId) {
        try {
            Long userId = getCurrentUserId();
            
            folderService.deleteFolder(userId, folderId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Folder deleted successfully");
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error deleting folder: {}", e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            log.error("Unexpected error deleting folder", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "An unexpected error occurred");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Search folders
     */
    @GetMapping("/search")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> searchFolders(@RequestParam String q) {
        try {
            Long userId = getCurrentUserId();
            
            List<JournalFolderResponse> folders = folderService.searchFolders(userId, q);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", folders);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error searching folders", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to search folders");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get folder statistics
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getFolderStats() {
        try {
            Long userId = getCurrentUserId();
            
            JournalFolderService.FolderStats stats = folderService.getFolderStats(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", stats);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching folder stats", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to fetch folder statistics");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Move journal to folder
     */
    @PostMapping("/{folderId}/journals/{journalId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> moveJournalToFolder(@PathVariable Long folderId, @PathVariable Long journalId) {
        try {
            Long userId = getCurrentUserId();
            
            folderService.moveJournalToFolder(userId, journalId, folderId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Journal moved to folder successfully");
            response.put("journalId", journalId);
            response.put("folderId", folderId);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Invalid request moving journal to folder: {}", e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            response.put("error", "INVALID_REQUEST");
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (RuntimeException e) {
            log.error("Error moving journal to folder: {}", e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            response.put("error", "OPERATION_FAILED");
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            log.error("Unexpected error moving journal to folder", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "An unexpected error occurred");
            response.put("error", "INTERNAL_ERROR");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Add journal to folder (alternative endpoint)
     */
    @PutMapping("/{folderId}/add-journal/{journalId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> addJournalToFolder(@PathVariable Long folderId, @PathVariable Long journalId) {
        try {
            Long userId = getCurrentUserId();
            
            folderService.moveJournalToFolder(userId, journalId, folderId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Journal added to folder successfully");
            response.put("journalId", journalId);
            response.put("folderId", folderId);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Invalid request adding journal to folder: {}", e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            response.put("error", "INVALID_REQUEST");
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            log.error("Error adding journal to folder", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to add journal to folder");
            response.put("error", "OPERATION_FAILED");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Bulk move journals to folder
     */
    @PostMapping("/{folderId}/journals/bulk")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> bulkMoveJournalsToFolder(@PathVariable Long folderId, @RequestBody Map<String, Object> request) {
        try {
            Long userId = getCurrentUserId();
            
            @SuppressWarnings("unchecked")
            List<Long> journalIds = (List<Long>) request.get("journalIds");
            
            if (journalIds == null || journalIds.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "No journal IDs provided");
                response.put("error", "INVALID_REQUEST");
                
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            int successCount = 0;
            int failureCount = 0;
            List<String> errors = new java.util.ArrayList<>();
            
            for (Long journalId : journalIds) {
                try {
                    folderService.moveJournalToFolder(userId, journalId, folderId);
                    successCount++;
                } catch (Exception e) {
                    failureCount++;
                    errors.add("Journal " + journalId + ": " + e.getMessage());
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", failureCount == 0);
            response.put("message", String.format("Moved %d journals successfully, %d failed", successCount, failureCount));
            response.put("successCount", successCount);
            response.put("failureCount", failureCount);
            response.put("folderId", folderId);
            
            if (!errors.isEmpty()) {
                response.put("errors", errors);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error in bulk move journals to folder", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to move journals to folder");
            response.put("error", "BULK_OPERATION_FAILED");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Remove journal from folder (move to no folder)
     */
    @DeleteMapping("/journals/{journalId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> removeJournalFromFolder(@PathVariable Long journalId) {
        try {
            Long userId = getCurrentUserId();
            
            folderService.moveJournalToFolder(userId, journalId, null);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Journal removed from folder successfully");
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error removing journal from folder: {}", e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        } catch (Exception e) {
            log.error("Unexpected error removing journal from folder", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "An unexpected error occurred");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Get journals in folder
     */
    @GetMapping("/{folderId}/journals")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getJournalsInFolder(@PathVariable Long folderId) {
        try {
            Long userId = getCurrentUserId();
            
            List<JournalResponse> journals = folderService.getJournalsInFolder(userId, folderId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", journals);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error fetching journals in folder: {}", e.getMessage());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            log.error("Unexpected error fetching journals in folder", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "An unexpected error occurred");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Helper method to get current user ID from security context
     */
    private Long getCurrentUserId() {
        return SecurityUtils.getCurrentUserId();
    }
}
