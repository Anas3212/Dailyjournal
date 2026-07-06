package com.dailyjournal.service;

import com.dailyjournal.dto.JournalRequest;
import com.dailyjournal.dto.PublishedStatsResponse;
import com.dailyjournal.entity.JournalEntry;
import com.dailyjournal.entity.JournalView;
import com.dailyjournal.entity.JournalReaction;
import com.dailyjournal.entity.ReactionType;
import com.dailyjournal.entity.User;
import com.dailyjournal.repository.JournalRepository;
import com.dailyjournal.repository.JournalViewRepository;
import com.dailyjournal.repository.JournalReactionRepository;
import com.dailyjournal.repository.UserRepository;
import com.dailyjournal.entity.Team;
import com.dailyjournal.repository.TeamRepository;
import com.dailyjournal.repository.TeamMemberRepository;
import com.dailyjournal.repository.TeamConnectionRepository;
import com.dailyjournal.entity.TeamConnection;
import com.dailyjournal.entity.TeamConnection.TeamConnectionStatus;
import com.dailyjournal.entity.JournalEditor;
import com.dailyjournal.repository.JournalEditorRepository;
import com.dailyjournal.exception.ForbiddenException;
import com.dailyjournal.exception.NotFoundException;
import com.dailyjournal.exception.UnauthorizedException;
import com.dailyjournal.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class JournalService {

    private final JournalRepository journalRepo;
    private final UserRepository userRepo;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamConnectionRepository teamConnectionRepository;
    private final JournalViewRepository journalViewRepository;
    private final JournalReactionRepository journalReactionRepository;
    private final JournalEditorRepository journalEditorRepository;
    private final CloudinaryService cloudinaryService;

    // 🔐 Get the current authenticated user
    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Object principal = auth.getPrincipal();
        if (principal instanceof User user) {
            return user;
        }
        throw new UnauthorizedException("Unauthorized access");
    }

    // May return null if no authenticated principal
    private User getCurrentUserIfAny() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null)
            return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof User user)
            return user;
        return null;
    }

    private void checkOwnershipOrAdmin(User currentUser, User resourceOwner) {
        if (!currentUser.getId().equals(resourceOwner.getId()) &&
                currentUser.getRoles().stream().noneMatch(r -> r.getName().equals("ROLE_ADMIN"))) {
            throw new ForbiddenException("Not authorized to access this resource");
        }
    }

    private boolean isTeamMember(Long teamId, Long userId) {
        return teamId != null && teamMemberRepository.isUserInTeam(teamId, userId);
    }

    /**
     * Check if a user has access to a team through connected teams
     */
    private boolean hasConnectedTeamAccess(Long userId, Long targetTeamId) {
        if (targetTeamId == null)
            return false;

        // Get all teams where the user is a member
        List<com.dailyjournal.entity.TeamMember> userMemberships = teamMemberRepository.findByUserId(userId);

        for (com.dailyjournal.entity.TeamMember membership : userMemberships) {
            Long userTeamId = membership.getTeam().getId();

            // Check if user's team is connected to the target team
            Optional<TeamConnection> connection = teamConnectionRepository
                    .findConnectionBetweenTeams(userTeamId, targetTeamId);

            if (connection.isPresent() && connection.get().getStatus() == TeamConnectionStatus.ACCEPTED) {
                return true;
            }
        }

        return false;
    }

    /**
     * Enhanced team access check that includes connected teams
     */
    private boolean hasTeamAccess(Long teamId, Long userId) {
        if (teamId == null)
            return false;

        // Check direct membership first
        if (teamMemberRepository.isUserInTeam(teamId, userId)) {
            return true;
        }

        // Check connected team access
        return hasConnectedTeamAccess(userId, teamId);
    }

    private void checkOwnerAdminOrTeam(User currentUser, JournalEntry entry) {
        boolean isOwner = currentUser.getId().equals(entry.getUser().getId());
        boolean isAdmin = currentUser.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        Long teamId = entry.getTeam() != null ? entry.getTeam().getId() : null;
        boolean inTeam = hasTeamAccess(teamId, currentUser.getId());

        // NEW: Check if user is assigned as journal editor for this specific journal
        boolean isJournalEditor = false;
        if (entry.getTeam() != null) {
            isJournalEditor = journalEditorRepository
                    .findActiveEditorByJournalAndUser(entry.getId(), currentUser.getId())
                    .isPresent();
        }

        if (!(isOwner || isAdmin || inTeam || isJournalEditor)) {
            throw new ForbiddenException("Not authorized to access this resource");
        }
    }

    /**
     * Check media management permissions with fallback logic:
     * - Personal journals: Owner can manage media freely
     * - Team journals: Assigned admin editors and team masters have priority,
     * regular admins as fallback
     */
    private void checkAdminEditorOrMasterOnly(User currentUser, JournalEntry entry) {
        // Personal journals: Allow owner to manage media without restrictions
        if (entry.getTeam() == null) {
            if (!entry.getUser().getId().equals(currentUser.getId())) {
                throw new ForbiddenException("Only the journal owner can manage media files for personal journals");
            }
            return; // Owner of personal journal can manage media
        }

        // Check if user is app admin (ROLE_ADMIN)
        boolean isAppAdmin = currentUser.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));

        System.out.println("=== MEDIA PERMISSION DEBUG ===");
        System.out.println("User ID: " + currentUser.getId() + ", Email: " + currentUser.getEmail());
        System.out.println("Journal ID: " + entry.getId() + ", Team ID: " + entry.getTeam().getId());
        System.out.println("Is app admin: " + isAppAdmin);

        // App admins always have access
        if (isAppAdmin) {
            System.out.println("ACCESS GRANTED: User is app admin");
            System.out.println("=== END DEBUG ===");
            return;
        }

        boolean isAssignedEditor = false;

        // Check editor assignment for any user (team admin can be assigned as editor)
        Optional<JournalEditor> editorAssignment = journalEditorRepository
                .findActiveEditorByJournalAndUser(entry.getId(), currentUser.getId());
        isAssignedEditor = editorAssignment.isPresent();
        System.out.println("Editor assignment found: " + isAssignedEditor);
        if (isAssignedEditor) {
            System.out.println("Editor assignment ID: " + editorAssignment.get().getId());
        }

        // Check if user is team admin or master
        Optional<com.dailyjournal.entity.TeamMember> teamMember = teamMemberRepository
                .findByTeamIdAndUserId(entry.getTeam().getId(), currentUser.getId());
        boolean isTeamAdmin = teamMember
                .map(member -> member.getRole() == com.dailyjournal.entity.TeamMember.Role.ADMIN)
                .orElse(false);
        boolean isTeamMaster = teamMember
                .map(member -> member.getRole() == com.dailyjournal.entity.TeamMember.Role.MASTER)
                .orElse(false);

        System.out.println("Team member found: " + teamMember.isPresent());
        if (teamMember.isPresent()) {
            com.dailyjournal.entity.TeamMember.Role role = teamMember.get().getRole();
            System.out.println("Team member role: " + role.toString());
        }
        System.out.println("Is team admin: " + isTeamAdmin);
        System.out.println("Is team master: " + isTeamMaster);

        // Team masters always have access regardless of editor assignments
        if (isTeamMaster) {
            System.out.println("ACCESS GRANTED: User is team master");
            System.out.println("=== END DEBUG ===");
            return;
        }

        // Allow if user is assigned editor
        if (isAssignedEditor) {
            System.out.println("ACCESS GRANTED: User is assigned admin editor");
            System.out.println("=== END DEBUG ===");
            return;
        }

        // Fallback: Allow team admins if no editor is assigned to this journal
        if (isTeamAdmin) {
            List<JournalEditor> allEditors = journalEditorRepository.findActiveEditorsByJournalId(entry.getId());
            System.out.println("Total active editors for journal: " + allEditors.size());

            // If no editors are assigned at all, allow team admins
            if (allEditors.isEmpty()) {
                System.out.println("ACCESS GRANTED: Team admin fallback (no editors assigned)");
                System.out.println("=== END DEBUG ===");
                return; // Allow team admin when no editors are assigned
            }
        }

        System.out.println("ACCESS DENIED: No valid permission found");
        System.out.println("=== END DEBUG ===");
        throw new ForbiddenException(
                "Only app admins, assigned editors, team masters, or team admins (when no editor assigned) can manage media files");
    }

    public JournalEntry create(Long userId, JournalRequest req) {
        User currentUser = getCurrentUser();
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        checkOwnershipOrAdmin(currentUser, user);

        JournalEntry entry = new JournalEntry();
        entry.setTitle(req.getTitle());

        if (req.getPages() != null && !req.getPages().isEmpty()) {
            // Validation
            if (req.getPages().size() > 10) {
                throw new com.dailyjournal.exception.BadRequestException("A journal cannot exceed 10 pages.");
            }
            for (String page : req.getPages()) {
                if (page == null || page.isBlank()) {
                    throw new com.dailyjournal.exception.BadRequestException("Page content cannot be empty.");
                }
                if (page.length() > 5000) {
                    throw new com.dailyjournal.exception.BadRequestException(
                            "A single page cannot exceed 5000 characters.");
                }
            }
            entry.setPages(req.getPages());
            entry.setContent(req.getPages().get(0));
        } else {
            // Fallback for legacy clients
            entry.setContent(req.getContent());
            entry.setPages(List.of(req.getContent() != null ? req.getContent() : ""));
        }

        entry.setMood(req.getMood());
        entry.setDate(req.getDate());
        entry.setTags(req.getTags());
        entry.setPrivate(req.isPrivate());
        entry.setMediaPaths(req.getMediaPaths() != null ? req.getMediaPaths() : new ArrayList<>());
        entry.setUser(user);

        // If creating under a team, ensure current user is a member
        if (req.getTeamId() != null) {
            Team team = teamRepository.findById(req.getTeamId())
                    .orElseThrow(() -> new NotFoundException("Team not found"));
            if (!hasTeamAccess(team.getId(), currentUser.getId())) {
                throw new ForbiddenException("You must be a team member to add a team journal");
            }
            entry.setTeam(team);
        }

        return journalRepo.save(entry);
    }

    public List<JournalEntry> getAllByUser(Long userId) {
        User currentUser = getCurrentUser();
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        checkOwnershipOrAdmin(currentUser, user);
        return journalRepo.findByUserId(userId);
    }

    public JournalEntry getById(Long id) {
        JournalEntry entry = journalRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Journal not found"));

        User currentUser = getCurrentUser();
        User journalOwner = entry.getUser();

        // Allow access if:
        // 1. User is the owner of the journal
        // 2. User is an admin
        // 3. Journal is public (not private)
        // 4. For private journals: only direct team members (not connected team
        // members)
        boolean isOwner = currentUser.getId().equals(journalOwner.getId());
        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        boolean isPublic = !entry.isPrivate();
        Long teamId = entry.getTeam() != null ? entry.getTeam().getId() : null;

        // For private journals, only allow direct team membership
        boolean hasDirectTeamAccess = isTeamMember(teamId, currentUser.getId());

        if (!isOwner && !isAdmin && !isPublic && !hasDirectTeamAccess) {
            throw new ForbiddenException("Not authorized to access this private journal");
        }

        return entry;
    }

    public JournalEntry update(Long id, JournalRequest req) {
        JournalEntry entry = journalRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Journal not found"));

        User currentUser = getCurrentUser();

        // Enhanced permission check - allow owner, admin, or assigned journal editor to
        // edit
        boolean isOwner = currentUser.getId().equals(entry.getUser().getId());
        boolean isAdmin = currentUser.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));

        // NEW: Check if user is assigned as journal editor for this specific journal
        boolean isJournalEditor = false;
        if (entry.getTeam() != null) {
            isJournalEditor = journalEditorRepository
                    .findActiveEditorByJournalAndUser(entry.getId(), currentUser.getId())
                    .isPresent();
        }

        if (!isOwner && !isAdmin && !isJournalEditor) {
            throw new ForbiddenException("Insufficient permissions to edit this journal");
        }

        entry.setTitle(req.getTitle());

        if (req.getPages() != null && !req.getPages().isEmpty()) {
            // Validation
            if (req.getPages().size() > 10) {
                throw new com.dailyjournal.exception.BadRequestException("A journal cannot exceed 10 pages.");
            }
            for (String page : req.getPages()) {
                if (page == null || page.isBlank()) {
                    throw new com.dailyjournal.exception.BadRequestException("Page content cannot be empty.");
                }
                if (page.length() > 5000) {
                    throw new com.dailyjournal.exception.BadRequestException(
                            "A single page cannot exceed 5000 characters.");
                }
            }
            entry.setPages(req.getPages());
            entry.setContent(req.getPages().get(0));
        } else {
            // Fallback for legacy clients
            entry.setContent(req.getContent());
            entry.setPages(List.of(req.getContent() != null ? req.getContent() : ""));
        }
        entry.setMood(req.getMood());
        entry.setTags(req.getTags());
        entry.setDate(req.getDate());
        entry.setPrivate(req.isPrivate());

        // Only update media paths if explicitly provided in the request
        // This prevents accidental clearing of existing media files
        if (req.getMediaPaths() != null) {
            entry.setMediaPaths(req.getMediaPaths());
        }
        // If mediaPaths is null in request, preserve existing media paths

        // Allow moving/assigning to a team if user is a team member
        if (req.getTeamId() != null) {
            Team team = teamRepository.findById(req.getTeamId())
                    .orElseThrow(() -> new NotFoundException("Team not found"));

            // Check if user is a member of the target team
            if (!hasTeamAccess(team.getId(), currentUser.getId())) {
                throw new ForbiddenException("You must be a team member to assign a journal to this team");
            }
            entry.setTeam(team);
        }

        return journalRepo.save(entry);
    }

    public void delete(Long id) {
        JournalEntry entry = journalRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Journal not found"));
        checkOwnerAdminOrTeam(getCurrentUser(), entry);
        journalRepo.deleteById(id);
    }

    public List<JournalEntry> search(Long userId, String mood, String tag, LocalDate date, String sort) {
        User currentUser = getCurrentUser();
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        checkOwnershipOrAdmin(currentUser, user);

        if (mood != null)
            return journalRepo.findByUserIdAndMoodContainingIgnoreCase(userId, mood);
        if (tag != null)
            return journalRepo.findByUserIdAndTagsContainingIgnoreCase(userId, tag);
        if (date != null)
            return journalRepo.findByUserIdAndDate(userId, date);
        if ("asc".equalsIgnoreCase(sort))
            return journalRepo.findByUserIdOrderByDateAsc(userId);
        if ("desc".equalsIgnoreCase(sort))
            return journalRepo.findByUserIdOrderByDateDesc(userId);

        return journalRepo.findByUserId(userId);
    }

    public List<JournalEntry> getByDateRange(Long userId, LocalDate start, LocalDate end) {
        User currentUser = getCurrentUser();
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        checkOwnershipOrAdmin(currentUser, user);
        return journalRepo.findByUserIdAndDateBetween(userId, start, end);
    }

    public List<String> uploadMultipleMedia(Long journalId, MultipartFile[] files) {
        JournalEntry entry = journalRepo.findById(journalId)
                .orElseThrow(() -> new NotFoundException("Journal not found"));
        checkAdminEditorOrMasterOnly(getCurrentUser(), entry);

        List<String> uploadedFilenames = new ArrayList<>();

        long totalSize = 0L;
        long maxTotalSize = 10 * 1024 * 1024; // 10 MB
        long maxFileSize = 3 * 1024 * 1024; // 3 MB
        int maxAllowedFiles = 4;

        List<String> existingPaths = entry.getMediaPaths() != null ? entry.getMediaPaths() : new ArrayList<>();
        if ((existingPaths.size() + files.length) > maxAllowedFiles) {
            throw new BadRequestException(
                    "Upload limit reached. Only " + maxAllowedFiles + " files allowed per journal.");
        }

        List<String> allowedExtensions = List.of("jpg", "jpeg", "png", "gif", "pdf", "mp3", "wav", "ogg");

        try {
            for (MultipartFile file : files) {
                if (file.isEmpty())
                    continue;

                String originalFilename = file.getOriginalFilename();
                if (originalFilename == null)
                    throw new BadRequestException("Invalid file name");

                String extension = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
                if (!allowedExtensions.contains(extension)) {
                    throw new BadRequestException("File type not allowed: " + originalFilename);
                }

                if (file.getSize() > maxFileSize) {
                    throw new BadRequestException("File exceeds 3MB: " + originalFilename);
                }

                totalSize += file.getSize();
                if (totalSize > maxTotalSize) {
                    throw new BadRequestException("Total upload size exceeds 10MB.");
                }

                // Upload via CloudinaryService (persists to Cloudinary or local disk)
                String storedPath = cloudinaryService.upload(file);
                uploadedFilenames.add(storedPath);
            }

            existingPaths.addAll(uploadedFilenames);
            entry.setMediaPaths(existingPaths);
            journalRepo.save(entry);

            return uploadedFilenames;

        } catch (IOException e) {
            throw new BadRequestException("Failed to upload file: " + e.getMessage());
        }
    }

    public void deleteMediaFromJournal(Long journalId, String fileIdentifier) {
        JournalEntry entry = journalRepo.findById(journalId)
                .orElseThrow(() -> new NotFoundException("Journal not found"));
        checkAdminEditorOrMasterOnly(getCurrentUser(), entry);

        List<String> mediaPaths = entry.getMediaPaths();
        if (mediaPaths == null) {
            throw new NotFoundException("Media not found in this journal.");
        }

        // Normalize the requested fileIdentifier
        String targetFilename = extractFilename(fileIdentifier);

        String matchedPath = null;
        for (String storedPath : mediaPaths) {
            if (extractFilename(storedPath).equals(targetFilename)) {
                matchedPath = storedPath;
                break;
            }
        }

        if (matchedPath == null) {
            throw new NotFoundException("Media not found in this journal.");
        }

        mediaPaths.remove(matchedPath);
        entry.setMediaPaths(mediaPaths);
        journalRepo.save(entry);

        // Delete from Cloudinary (or local disk in local dev mode)
        cloudinaryService.delete(targetFilename);
    }

    private String extractFilename(String identifier) {
        if (identifier == null)
            return "";
        try {
            String decoded = URLDecoder.decode(identifier, StandardCharsets.UTF_8.name());
            String noQuery = decoded.split("\\?")[0];
            String[] parts = noQuery.split("/");
            return parts[parts.length - 1];
        } catch (Exception e) {
            return identifier;
        }
    }

    // ===== PUBLIC JOURNAL METHODS =====
    // These methods return only public (non-private) journals for user search and
    // viewing

    public List<JournalEntry> getPublicJournalsByUser(Long userId) {
        // No ownership check needed - anyone can view public journals
        return journalRepo.findByUserIdAndIsPrivateFalse(userId);
    }

    public List<JournalEntry> searchPublicJournals(Long userId, String mood, String tag, LocalDate date, String sort) {
        // No ownership check needed - anyone can search public journals
        if ("asc".equalsIgnoreCase(sort)) {
            return journalRepo.findByUserIdAndIsPrivateFalseOrderByDateAsc(userId);
        }
        if ("desc".equalsIgnoreCase(sort)) {
            return journalRepo.findByUserIdAndIsPrivateFalseOrderByDateDesc(userId);
        }
        return journalRepo.findByUserIdAndIsPrivateFalse(userId);
    }

    public List<JournalEntry> getPublicJournalsByDateRange(Long userId, LocalDate start, LocalDate end) {
        // No ownership check needed - anyone can view public journals by date range
        return journalRepo.findByUserIdAndIsPrivateFalseAndDateBetween(userId, start, end);
    }

    // ===== PUBLISHED JOURNAL METHODS =====
    // These methods handle published journals that any user can view

    public List<JournalEntry> getAllPublishedJournals() {
        // No ownership check needed - anyone can view published journals
        return journalRepo.findByIsPublishedTrueOrderByDateDesc();
    }

    public List<JournalEntry> searchPublishedJournals(String search, String mood, String tags, LocalDate date) {
        // No ownership check needed - anyone can search published journals
        return journalRepo.searchPublishedJournals(search, mood, tags, date);
    }

    public JournalEntry publishJournal(Long journalId) {
        User currentUser = getCurrentUser();
        JournalEntry journal = journalRepo.findById(journalId)
                .orElseThrow(() -> new NotFoundException("Journal not found"));

        // Check ownership - only owner can publish their journal
        checkOwnershipOrAdmin(currentUser, journal.getUser());

        journal.setPublished(true);
        journal.setEverPublished(true); // Mark as ever published for admin view
        return journalRepo.save(journal);
    }

    public JournalEntry unpublishJournal(Long journalId) {
        User currentUser = getCurrentUser();
        JournalEntry journal = journalRepo.findById(journalId)
                .orElseThrow(() -> new NotFoundException("Journal not found"));

        // Check ownership - only owner can unpublish their journal (not admin action)
        if (!journal.getUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Access denied. You can only unpublish your own journals.");
        }

        journal.setPublished(false);
        journal.setHiddenByAdmin(false); // When user unpublishes, it's not hidden by admin
        return journalRepo.save(journal);
    }

    public JournalEntry hideJournalByAdmin(Long journalId) {
        User currentUser = getCurrentUser();
        // Only admins can hide journals
        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            throw new ForbiddenException("Access denied. Admin role required.");
        }

        JournalEntry journal = journalRepo.findById(journalId)
                .orElseThrow(() -> new RuntimeException("Journal not found with ID: " + journalId));

        journal.setPublished(false);
        journal.setHiddenByAdmin(true); // Mark as hidden by admin
        return journalRepo.save(journal);
    }

    // Admin methods to get all journals that were ever published (including hidden
    // ones)
    public List<JournalEntry> getAllEverPublishedJournalsForAdmin() {
        User currentUser = getCurrentUser();
        // Only admins can access this
        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            throw new RuntimeException("Access denied. Admin role required.");
        }
        return journalRepo.findAllEverPublishedJournalsForAdmin();
    }

    public List<JournalEntry> searchAllEverPublishedJournalsForAdmin(String search, String mood, String tags,
            LocalDate date) {
        User currentUser = getCurrentUser();
        // Only admins can access this
        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            throw new RuntimeException("Access denied. Admin role required.");
        }
        return journalRepo.searchAllEverPublishedJournalsForAdmin(search, mood, tags, date);
    }

    // Admin method to restore/unhide a journal (set it back to published)
    public JournalEntry restoreJournal(Long journalId) {
        User currentUser = getCurrentUser();
        // Only admins can access this
        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            throw new RuntimeException("Access denied. Admin role required.");
        }

        JournalEntry journal = journalRepo.findById(journalId)
                .orElseThrow(() -> new RuntimeException("Journal not found with ID: " + journalId));

        // Only restore journals that were ever published
        if (!journal.isEverPublished()) {
            throw new BadRequestException("Cannot restore journal that was never published");
        }

        journal.setPublished(true);
        journal.setHiddenByAdmin(false); // Clear admin hide flag when restoring
        return journalRepo.save(journal);
    }

    // Validate access for serving media by filename (local disk mode only —
    // Cloudinary URLs are served directly from Cloudinary, not via this endpoint)
    public JournalEntry assertCanAccessMediaByFilename(String filename) {
        try {
            // Try exact match first (local filename), then try as a URL suffix
            JournalEntry entry = journalRepo.findByMediaFilename(filename)
                    .or(() -> journalRepo.findByMediaFilenameContaining(filename))
                    .orElseThrow(() -> new NotFoundException("Media not found: " + filename));

            User currentUser = getCurrentUserIfAny();
            boolean isPublic = !entry.isPrivate();
            boolean isPublished = entry.isPublished() && !entry.isHiddenByAdmin();

            // Published journals are accessible to everyone
            if (isPublished) {
                return entry;
            }

            if (currentUser == null) {
                if (!isPublic)
                    throw new ForbiddenException("Not authorized to access this media");
                return entry;
            }

            User owner = entry.getUser();
            boolean isOwner = currentUser.getId().equals(owner.getId());
            boolean isAdmin = currentUser.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
            Long teamId = entry.getTeam() != null ? entry.getTeam().getId() : null;
            boolean teamOk = hasTeamAccess(teamId, currentUser.getId());

            if (!(isOwner || isAdmin || isPublic || teamOk)) {
                throw new ForbiddenException("Not authorized to access this media");
            }
            return entry;
        } catch (Exception e) {
            System.out.println("Error in assertCanAccessMediaByFilename: " + e.getMessage());
            e.printStackTrace();
            throw new NotFoundException("Media not found: " + filename);
        }
    }

    // ===== VIEWS & REACTIONS FOR PUBLISHED JOURNALS =====
    private JournalEntry ensurePublishedVisible(Long journalId) {
        JournalEntry journal = journalRepo.findById(journalId)
                .orElseThrow(() -> new NotFoundException("Journal not found"));
        if (!journal.isPublished() || journal.isHiddenByAdmin()) {
            throw new ForbiddenException("Journal is not publicly available");
        }
        return journal;
    }

    public PublishedStatsResponse recordPublishedView(Long journalId) {
        JournalEntry journal = ensurePublishedVisible(journalId);
        User currentUser = getCurrentUserIfAny();
        if (currentUser != null) {
            java.time.LocalDate today = java.time.LocalDate.now();
            boolean exists = journalViewRepository.existsByJournal_IdAndUser_IdAndViewDate(journal.getId(),
                    currentUser.getId(), today);
            if (!exists) {
                JournalView view = new JournalView();
                view.setJournal(journal);
                view.setUser(currentUser);
                view.setViewDate(today);
                view.setCreatedAt(java.time.LocalDateTime.now());
                journalViewRepository.save(view);
            }
        }
        return getPublishedStats(journalId);
    }

    public PublishedStatsResponse toggleReaction(Long journalId, ReactionType type) {
        JournalEntry journal = ensurePublishedVisible(journalId);
        User currentUser = getCurrentUser();

        java.util.Optional<JournalReaction> existing = journalReactionRepository
                .findByJournal_IdAndUser_Id(journal.getId(), currentUser.getId());
        if (existing.isPresent()) {
            JournalReaction r = existing.get();
            if (r.getType() == type) {
                // Toggle off
                journalReactionRepository.delete(r);
            } else {
                // Update to new type
                r.setType(type);
                r.setUpdatedAt(java.time.LocalDateTime.now());
                journalReactionRepository.save(r);
            }
        } else {
            JournalReaction r = new JournalReaction();
            r.setJournal(journal);
            r.setUser(currentUser);
            r.setType(type);
            r.setCreatedAt(java.time.LocalDateTime.now());
            r.setUpdatedAt(java.time.LocalDateTime.now());
            journalReactionRepository.save(r);
        }
        return getPublishedStats(journalId);
    }

    public PublishedStatsResponse getPublishedStats(Long journalId) {
        JournalEntry journal = ensurePublishedVisible(journalId);
        long totalViews = journalViewRepository.countByJournal_Id(journal.getId());
        long uniqueViewers = journalViewRepository.countUniqueUsers(journal.getId());
        long likes = journalReactionRepository.countByJournal_IdAndType(journal.getId(), ReactionType.LIKE);
        long dislikes = journalReactionRepository.countByJournal_IdAndType(journal.getId(), ReactionType.DISLIKE);
        long hearts = journalReactionRepository.countByJournal_IdAndType(journal.getId(), ReactionType.HEART);

        User currentUser = getCurrentUserIfAny();
        ReactionType userReaction = null;
        if (currentUser != null) {
            userReaction = journalReactionRepository.findUserReaction(journal.getId(), currentUser.getId());
        }
        return new PublishedStatsResponse(journal.getId(), totalViews, uniqueViewers, likes, dislikes, hearts,
                userReaction);
    }

    public Map<Long, PublishedStatsResponse> getBatchPublishedStats(List<Long> journalIds) {
        User currentUser = getCurrentUserIfAny();
        Map<Long, PublishedStatsResponse> statsMap = new HashMap<>();

        for (Long journalId : journalIds) {
            try {
                JournalEntry journal = journalRepo.findById(journalId).orElse(null);
                if (journal == null || !journal.isPublished() || journal.isHiddenByAdmin()) {
                    continue;
                }

                long totalViews = journalViewRepository.countByJournal_Id(journalId);
                long uniqueViewers = journalViewRepository.countUniqueUsers(journalId);
                long likes = journalReactionRepository.countByJournal_IdAndType(journalId, ReactionType.LIKE);
                long dislikes = journalReactionRepository.countByJournal_IdAndType(journalId, ReactionType.DISLIKE);
                long hearts = journalReactionRepository.countByJournal_IdAndType(journalId, ReactionType.HEART);

                ReactionType userReaction = null;
                if (currentUser != null) {
                    userReaction = journalReactionRepository.findUserReaction(journalId, currentUser.getId());
                }

                statsMap.put(journalId, new PublishedStatsResponse(journalId, totalViews, uniqueViewers, likes,
                        dislikes, hearts, userReaction));
            } catch (Exception e) {
                // Skip journals that cause errors
                continue;
            }
        }

        return statsMap;
    }
}
