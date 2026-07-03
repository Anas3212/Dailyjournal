package com.dailyjournal.controller;

import com.dailyjournal.dto.JournalRequest;
import com.dailyjournal.dto.JournalResponse;
import com.dailyjournal.dto.PublishedStatsResponse;
import com.dailyjournal.dto.IdsRequest;
import com.dailyjournal.entity.ReactionType;
import com.dailyjournal.entity.JournalEntry;
import com.dailyjournal.mapper.JournalMapper;
import com.dailyjournal.repository.JournalRepository;
import com.dailyjournal.repository.UserRepository;
import com.dailyjournal.util.SecurityUtils;
import com.dailyjournal.service.JournalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.io.IOException;
import java.net.URI;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/journals")
@RequiredArgsConstructor
public class JournalController {

    private final JournalService journalService;
    private final JournalMapper journalMapper; // ✅ Injected instance
    private final UserRepository userRepo;
    private final JournalRepository journalRepo;
    private final com.dailyjournal.service.CloudinaryService cloudinaryService;

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/create/{userId}")
    public ResponseEntity<JournalResponse> create(@PathVariable Long userId,
                                                  @Valid @RequestBody JournalRequest req) {
        JournalEntry entry = journalService.create(userId, req);
        return ResponseEntity.ok(journalMapper.toResponse(entry)); // ✅ instance method
    }



    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<JournalResponse>> getAll(@PathVariable Long userId, HttpServletRequest request) {
        // ✅ Get current user from Security Context (works with cookies)
        Long currentUserId = SecurityUtils.getCurrentUserId();
        
        List<JournalEntry> entries = journalService.getAllByUser(userId);
        
        // If the current user is not the owner of the journals and not an admin, filter out private journals
        if (!currentUserId.equals(userId) && 
            !userRepo.findById(currentUserId).orElseThrow().getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_ADMIN"))) {
            entries = entries.stream()
                    .filter(entry -> !entry.isPrivate())
                    .collect(Collectors.toList());
        }
        
        List<JournalResponse> response = entries.stream()
                .map(journalMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        journalService.delete(id);
        return ResponseEntity.ok("Journal entry deleted successfully.");
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<JournalResponse> update(@PathVariable Long id, @RequestBody JournalRequest req) {
        JournalEntry entry = journalService.update(id, req);
        return ResponseEntity.ok(journalMapper.toResponse(entry)); // ✅
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<JournalResponse> getById(@PathVariable Long id) {
        JournalEntry entry = journalService.getById(id);
        return ResponseEntity.ok(journalMapper.toResponse(entry)); // ✅
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/search")
    public ResponseEntity<List<JournalResponse>> search(
            @RequestParam Long userId,
            @RequestParam(required = false) String mood,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String sort) {

        List<JournalEntry> entries = journalService.search(userId, mood, tag, date, sort);
        List<JournalResponse> response = entries.stream()
                .map(journalMapper::toResponse) // ✅
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/calendar")
    public ResponseEntity<List<JournalResponse>> getByDateRange(
            @RequestParam Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {

        List<JournalEntry> entries = journalService.getByDateRange(userId, start, end);
        List<JournalResponse> response = entries.stream()
                .map(journalMapper::toResponse) // ✅
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<String> baseAccess() {
        return ResponseEntity.ok("JWT authentication and role-based access successful.");
    }

    // ===== PUBLIC JOURNAL ENDPOINTS =====
    // These endpoints return only public journals for user search and viewing
    
    @GetMapping("/public/user/{userId}")
    public ResponseEntity<List<JournalResponse>> getPublicJournalsByUser(@PathVariable Long userId) {
        List<JournalEntry> entries = journalService.getPublicJournalsByUser(userId);
        List<JournalResponse> response = entries.stream()
                .map(journalMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/public/search")
    public ResponseEntity<List<JournalResponse>> searchPublicJournals(
            @RequestParam Long userId,
            @RequestParam(required = false) String mood,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String sort) {

        List<JournalEntry> entries = journalService.searchPublicJournals(userId, mood, tag, date, sort);
        List<JournalResponse> response = entries.stream()
                .map(journalMapper::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/public/calendar")
    public ResponseEntity<List<JournalResponse>> getPublicJournalsByDateRange(
            @RequestParam Long userId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {

        List<JournalEntry> entries = journalService.getPublicJournalsByDateRange(userId, start, end);
        List<JournalResponse> response = entries.stream()
                .map(journalMapper::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/media/{filename:.+}")
    public ResponseEntity<?> getMedia(@PathVariable String filename) throws IOException {
        // Enforce access: owner, admin, public, or team member of the journal containing this media
        journalService.assertCanAccessMediaByFilename(filename);

        // If the stored path is a full Cloudinary URL, redirect to it
        if (filename.startsWith("http://") || filename.startsWith("https://")) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(filename))
                    .build();
        }

        // Fallback: serve from local disk (local dev mode)
        Path path = Paths.get("uploads").resolve(filename);
        Resource resource = new UrlResource(path.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            if (cloudinaryService.isCloudinaryEnabled()) {
                String cloudName = cloudinaryService.getCloudName();
                if (cloudName != null) {
                    String ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
                    String resourceType = (ext.equals("mp4") || ext.equals("webm") || ext.equals("ogg")) ? "video" : "image";
                    // Note: If Cloudinary uploaded it in a specific folder, e.g. "journal-media", we prepend it here.
                    // The old upload logic used "journal-media" folder.
                    String publicIdPath = filename;
                    if (!filename.contains("/")) {
                        publicIdPath = "journal-media/" + filename;
                    }
                    String cUrl = "https://res.cloudinary.com/" + cloudName + "/" + resourceType + "/upload/" + publicIdPath;
                    return ResponseEntity.status(HttpStatus.FOUND)
                            .location(URI.create(cUrl))
                            .build();
                }
            }
            return ResponseEntity.notFound().build();
        }

        // Determine content type based on file extension
        String contentType = "application/octet-stream";
        String extension = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
        
        switch (extension) {
            case "pdf":
                contentType = "application/pdf";
                break;
            case "jpg":
            case "jpeg":
                contentType = "image/jpeg";
                break;
            case "png":
                contentType = "image/png";
                break;
            case "gif":
                contentType = "image/gif";
                break;
            case "mp4":
                contentType = "video/mp4";
                break;
            case "mp3":
                contentType = "audio/mpeg";
                break;
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/{journalId}/upload")
    public ResponseEntity<?> uploadMultipleFiles(@PathVariable Long journalId,
                                                 @RequestParam("files") MultipartFile[] files) {
        try {
            if (files == null || files.length == 0) {
                return ResponseEntity.badRequest().body("No files provided.");
            }

            List<String> filenames = journalService.uploadMultipleMedia(journalId, files);

            // Cloudinary uploads return full https:// URLs — return them as-is.
            // Local-disk uploads return just a filename — wrap with /api/journals/media/.
            List<String> urls = filenames.stream()
                    .map(stored -> stored.startsWith("http") ? stored : "/api/journals/media/" + stored)
                    .toList();

            return ResponseEntity.ok(urls);
        } catch (RuntimeException e) {
            return ResponseEntity.internalServerError().body("Upload failed: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/filter")
    public ResponseEntity<List<JournalResponse>> filterMyJournals(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String mood,
            @RequestParam(required = false) String tags,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            HttpServletRequest request
    ) {
        // ✅ Get current user from Security Context (works with cookies)
        Long userId = SecurityUtils.getCurrentUserId();

        // Get filtered journal entries
        List<JournalEntry> entries = journalRepo.filterUserJournals(userId, search, mood, tags, date);

        // Map to DTO
        List<JournalResponse> response = entries.stream()
                .map(journalMapper::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @DeleteMapping({ "/{journalId}/media/{filename:.+}", "/{journalId}/media" })
    public ResponseEntity<?> deleteMedia(
            @PathVariable Long journalId,
            @PathVariable(required = false) String filename,
            @RequestParam(value = "fileUrl", required = false) String fileUrl
    ) {
        try {
            String targetFile = fileUrl != null ? fileUrl : filename;
            if (targetFile == null || targetFile.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("File URL or filename is required.");
            }
            journalService.deleteMediaFromJournal(journalId, targetFile);
            return ResponseEntity.ok("Media file deleted successfully.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Something went wrong: " + e.getMessage());
        }
    }

    // ===== PUBLISHED JOURNAL ENDPOINTS =====
    // These endpoints handle published journals that any authenticated user can view
    
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/published")
    public ResponseEntity<List<JournalResponse>> getAllPublishedJournals() {
        List<JournalEntry> entries = journalService.getAllPublishedJournals();
        List<JournalResponse> response = entries.stream()
                .map(journalMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
    
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/published/search")
    public ResponseEntity<List<JournalResponse>> searchPublishedJournals(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String mood,
            @RequestParam(required = false) String tags,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        List<JournalEntry> entries = journalService.searchPublishedJournals(search, mood, tags, date);
        List<JournalResponse> response = entries.stream()
                .map(journalMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
    
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/{journalId}/publish")
    public ResponseEntity<JournalResponse> publishJournal(@PathVariable Long journalId) {
        JournalEntry entry = journalService.publishJournal(journalId);
        return ResponseEntity.ok(journalMapper.toResponse(entry));
    }
    
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/{journalId}/unpublish")
    public ResponseEntity<JournalResponse> unpublishJournal(@PathVariable Long journalId) {
        JournalEntry entry = journalService.unpublishJournal(journalId);
        return ResponseEntity.ok(journalMapper.toResponse(entry));
    }

    // ===== PUBLISHED JOURNAL VIEW/REACTION ENDPOINTS =====
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/published/{journalId}/view")
    public ResponseEntity<PublishedStatsResponse> recordPublishedView(@PathVariable Long journalId) {
        PublishedStatsResponse stats = journalService.recordPublishedView(journalId);
        return ResponseEntity.ok(stats);
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/published/{journalId}/react")
    public ResponseEntity<PublishedStatsResponse> toggleReaction(
            @PathVariable Long journalId,
            @RequestParam("type") ReactionType type
    ) {
        PublishedStatsResponse stats = journalService.toggleReaction(journalId, type);
        return ResponseEntity.ok(stats);
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/published/{journalId}/stats")
    public ResponseEntity<PublishedStatsResponse> getPublishedStats(@PathVariable Long journalId) {
        PublishedStatsResponse stats = journalService.getPublishedStats(journalId);
        return ResponseEntity.ok(stats);
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/published/batch-stats")
    public ResponseEntity<Map<Long, PublishedStatsResponse>> getBatchPublishedStats(@RequestBody IdsRequest request) {
        Map<Long, PublishedStatsResponse> stats = journalService.getBatchPublishedStats(request.getIds());
        return ResponseEntity.ok(stats);
    }
    
    // ===== ADMIN ENDPOINTS FOR ALL EVER-PUBLISHED JOURNALS =====
    // These endpoints show all journals that were ever published (including hidden ones) for admin moderation
    
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/published")
    public ResponseEntity<List<JournalResponse>> getAllEverPublishedJournalsForAdmin() {
        List<JournalEntry> entries = journalService.getAllEverPublishedJournalsForAdmin();
        List<JournalResponse> response = entries.stream()
                .map(journalMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/published/search")
    public ResponseEntity<List<JournalResponse>> searchAllEverPublishedJournalsForAdmin(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String mood,
            @RequestParam(required = false) String tags,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        List<JournalEntry> entries = journalService.searchAllEverPublishedJournalsForAdmin(search, mood, tags, date);
        List<JournalResponse> response = entries.stream()
                .map(journalMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/{journalId}/restore")
    public ResponseEntity<JournalResponse> restoreJournal(@PathVariable Long journalId) {
        JournalEntry entry = journalService.restoreJournal(journalId);
        return ResponseEntity.ok(journalMapper.toResponse(entry));
    }
    
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/admin/{journalId}/hide")
    public ResponseEntity<JournalResponse> hideJournalByAdmin(@PathVariable Long journalId) {
        JournalEntry entry = journalService.hideJournalByAdmin(journalId);
        return ResponseEntity.ok(journalMapper.toResponse(entry));
    }

    // ===== JOURNAL LOCK ENDPOINTS =====
    // These endpoints handle journal editing locks to prevent concurrent edits
    
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/{journalId}/lock")
    public ResponseEntity<String> acquireJournalLock(@PathVariable Long journalId, @RequestParam String sessionId) {
        // For now, just return success - implement proper locking later if needed
        return ResponseEntity.ok("Lock acquired");
    }
    
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @DeleteMapping("/{journalId}/lock")
    public ResponseEntity<String> releaseJournalLock(@PathVariable Long journalId) {
        // For now, just return success - implement proper locking later if needed
        return ResponseEntity.ok("Lock released");
    }
    
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PutMapping("/{journalId}/lock")
    public ResponseEntity<String> extendJournalLock(@PathVariable Long journalId, @RequestParam String sessionId) {
        // For now, just return success - implement proper locking later if needed
        return ResponseEntity.ok("Lock extended");
    }
    
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/{journalId}/lock/status")
    public ResponseEntity<String> checkJournalLockStatus(@PathVariable Long journalId) {
        // For now, just return unlocked - implement proper locking later if needed
        return ResponseEntity.ok("unlocked");
    }

}
