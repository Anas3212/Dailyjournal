package com.dailyjournal.controller;

import com.dailyjournal.entity.JournalEntry;
import com.dailyjournal.dto.JournalEditorResponse;
import com.dailyjournal.service.JournalEditorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/journal-editors")
@RequiredArgsConstructor
public class JournalEditorController {

    private final JournalEditorService journalEditorService;

    /**
     * Assign an admin to edit a specific journal (only team masters can do this)
     */
    @PostMapping("/assign")
    public ResponseEntity<JournalEditorResponse> assignEditor(
            @RequestParam Long journalId,
            @RequestParam Long adminUserId) {
        try {
            JournalEditorResponse journalEditor = journalEditorService.assignEditor(journalId, adminUserId);
            return ResponseEntity.ok(journalEditor);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    /**
     * Remove an admin from editing a specific journal
     */
    @DeleteMapping("/remove")
    public ResponseEntity<Map<String, String>> removeEditor(
            @RequestParam Long journalId,
            @RequestParam Long adminUserId) {
        try {
            journalEditorService.removeEditor(journalId, adminUserId);
            return ResponseEntity.ok(Map.of("message", "Editor removed successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all editors assigned to a journal
     */
    @GetMapping("/journal/{journalId}")
    public ResponseEntity<List<JournalEditorResponse>> getJournalEditors(@PathVariable Long journalId) {
        try {
            List<JournalEditorResponse> editors = journalEditorService.getJournalEditors(journalId);
            return ResponseEntity.ok(editors);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    /**
     * Get all journals that a user can edit
     */
    @GetMapping("/user/{userId}/editable")
    public ResponseEntity<List<JournalEntry>> getEditableJournals(@PathVariable Long userId) {
        try {
            List<JournalEntry> journals = journalEditorService.getEditableJournals(userId);
            return ResponseEntity.ok(journals);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    /**
     * Check if a user can edit a specific journal
     */
    @GetMapping("/can-edit")
    public ResponseEntity<Map<String, Boolean>> canEditJournal(
            @RequestParam Long journalId,
            @RequestParam Long userId) {
        try {
            boolean canEdit = journalEditorService.canEditJournal(journalId, userId);
            return ResponseEntity.ok(Map.of("canEdit", canEdit));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("canEdit", false));
        }
    }

    /**
     * Get all journal editors for a team (only team masters can view this)
     */
    @GetMapping("/team/{teamId}")
    public ResponseEntity<List<JournalEditorResponse>> getTeamJournalEditors(@PathVariable Long teamId) {
        try {
            List<JournalEditorResponse> editors = journalEditorService.getTeamJournalEditors(teamId);
            return ResponseEntity.ok(editors);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
    }

    /**
     * Bulk assign multiple admins to a journal
     */
    @PostMapping("/bulk-assign")
    public ResponseEntity<Map<String, Object>> bulkAssignEditors(
            @RequestParam Long journalId,
            @RequestBody List<Long> adminUserIds) {
        try {
            int successCount = 0;
            int failCount = 0;
            
            for (Long adminUserId : adminUserIds) {
                try {
                    journalEditorService.assignEditor(journalId, adminUserId);
                    successCount++;
                } catch (Exception e) {
                    failCount++;
                }
            }
            
            return ResponseEntity.ok(Map.of(
                    "message", "Bulk assignment completed",
                    "successCount", successCount,
                    "failCount", failCount
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Bulk remove multiple admins from a journal
     */
    @DeleteMapping("/bulk-remove")
    public ResponseEntity<Map<String, Object>> bulkRemoveEditors(
            @RequestParam Long journalId,
            @RequestBody List<Long> adminUserIds) {
        try {
            int successCount = 0;
            int failCount = 0;
            
            for (Long adminUserId : adminUserIds) {
                try {
                    journalEditorService.removeEditor(journalId, adminUserId);
                    successCount++;
                } catch (Exception e) {
                    failCount++;
                }
            }
            
            return ResponseEntity.ok(Map.of(
                    "message", "Bulk removal completed",
                    "successCount", successCount,
                    "failCount", failCount
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
