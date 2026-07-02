package com.dailyjournal.service;

import com.dailyjournal.entity.JournalEditor;
import com.dailyjournal.entity.JournalEntry;
import com.dailyjournal.entity.User;
import com.dailyjournal.entity.TeamMember;
import com.dailyjournal.dto.JournalEditorResponse;
import com.dailyjournal.repository.JournalEditorRepository;
import com.dailyjournal.repository.JournalRepository;
import com.dailyjournal.repository.UserRepository;
import com.dailyjournal.repository.TeamMemberRepository;
import com.dailyjournal.exception.ForbiddenException;
import com.dailyjournal.exception.NotFoundException;
import com.dailyjournal.exception.BadRequestException;
import com.dailyjournal.exception.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class JournalEditorService {

    private final JournalEditorRepository journalEditorRepository;
    private final JournalRepository journalRepository;
    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Object principal = auth.getPrincipal();
        if (principal instanceof User user) {
            return user;
        }
        throw new UnauthorizedException("Unauthorized access");
    }

    /**
     * Assign an admin to edit a specific journal (only team masters can do this)
     */
    public JournalEditorResponse assignEditor(Long journalId, Long adminUserId) {
        User currentUser = getCurrentUser();
        
        // Get the journal
        JournalEntry journal = journalRepository.findById(journalId)
                .orElseThrow(() -> new NotFoundException("Journal not found"));
        
        // Check if journal belongs to a team
        if (journal.getTeam() == null) {
            throw new BadRequestException("Cannot assign editors to personal journals");
        }
        
        // Check if current user is team master
        Optional<TeamMember> currentUserMembership = teamMemberRepository
                .findByTeamIdAndUserId(journal.getTeam().getId(), currentUser.getId());
        
        if (currentUserMembership.isEmpty() || 
            currentUserMembership.get().getRole() != TeamMember.Role.MASTER) {
            throw new ForbiddenException("Only team masters can assign journal editors");
        }
        
        // Get the admin user
        User adminUser = userRepository.findById(adminUserId)
                .orElseThrow(() -> new NotFoundException("Admin user not found"));
        
        // Check if admin user is actually an admin in the team
        Optional<TeamMember> adminMembership = teamMemberRepository
                .findByTeamIdAndUserId(journal.getTeam().getId(), adminUserId);
        
        if (adminMembership.isEmpty() || 
            adminMembership.get().getRole() != TeamMember.Role.ADMIN) {
            throw new BadRequestException("User must be a team admin to be assigned as journal editor");
        }
        
        // Check if assignment already exists
        Optional<JournalEditor> existingEditor = journalEditorRepository
                .findEditorByJournalAndUser(journalId, adminUserId);
        
        if (existingEditor.isPresent()) {
            // Reactivate if it was deactivated
            JournalEditor editor = existingEditor.get();
            if (!editor.isActive()) {
                editor.setActive(true);
                JournalEditor savedEditor = journalEditorRepository.save(editor);
                return convertToResponse(savedEditor);
            } else {
                throw new BadRequestException("Admin is already assigned to this journal");
            }
        }
        
        // Create new assignment
        JournalEditor journalEditor = JournalEditor.builder()
                .journal(journal)
                .user(adminUser)
                .assignedBy(currentUser)
                .isActive(true)
                .build();
        
        JournalEditor savedEditor = journalEditorRepository.save(journalEditor);
        return convertToResponse(savedEditor);
    }

    /**
     * Remove an admin from editing a specific journal
     */
    public void removeEditor(Long journalId, Long adminUserId) {
        User currentUser = getCurrentUser();
        
        // Get the journal
        JournalEntry journal = journalRepository.findById(journalId)
                .orElseThrow(() -> new NotFoundException("Journal not found"));
        
        // Check if journal belongs to a team
        if (journal.getTeam() == null) {
            throw new BadRequestException("Cannot remove editors from personal journals");
        }
        
        // Check if current user is team master
        Optional<TeamMember> currentUserMembership = teamMemberRepository
                .findByTeamIdAndUserId(journal.getTeam().getId(), currentUser.getId());
        
        if (currentUserMembership.isEmpty() || 
            currentUserMembership.get().getRole() != TeamMember.Role.MASTER) {
            throw new ForbiddenException("Only team masters can remove journal editors");
        }
        
        // Find and deactivate the editor assignment
        Optional<JournalEditor> editor = journalEditorRepository
                .findActiveEditorByJournalAndUser(journalId, adminUserId);
        
        if (editor.isEmpty()) {
            throw new NotFoundException("Editor assignment not found");
        }
        
        JournalEditor journalEditor = editor.get();
        journalEditor.setActive(false);
        journalEditorRepository.save(journalEditor);
    }

    /**
     * Get all editors assigned to a journal
     */
    public List<JournalEditorResponse> getJournalEditors(Long journalId) {
        User currentUser = getCurrentUser();
        
        // Get the journal
        JournalEntry journal = journalRepository.findById(journalId)
                .orElseThrow(() -> new NotFoundException("Journal not found"));
        
        // Check if user has access to view this information
        if (journal.getTeam() == null) {
            throw new BadRequestException("Personal journals don't have assigned editors");
        }
        
        // Check if current user is team member
        Optional<TeamMember> membership = teamMemberRepository
                .findByTeamIdAndUserId(journal.getTeam().getId(), currentUser.getId());
        
        if (membership.isEmpty()) {
            throw new ForbiddenException("Only team members can view journal editors");
        }
        
        List<JournalEditor> editors = journalEditorRepository.findActiveEditorsByJournalId(journalId);
        return editors.stream()
                .map(this::convertToResponse)
                .toList();
    }

    /**
     * Get all journals that a user can edit
     */
    public List<JournalEntry> getEditableJournals(Long userId) {
        User currentUser = getCurrentUser();
        
        // Users can only view their own editable journals or admin can view any
        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        
        if (!currentUser.getId().equals(userId) && !isAdmin) {
            throw new ForbiddenException("Cannot view other user's editable journals");
        }
        
        return journalEditorRepository.findEditableJournalsByUserId(userId);
    }

    /**
     * Check if a user can edit a specific journal based on journal editor assignments
     */
    public boolean canEditJournal(Long journalId, Long userId) {
        // Get the journal
        Optional<JournalEntry> journalOpt = journalRepository.findById(journalId);
        if (journalOpt.isEmpty()) {
            return false;
        }
        
        JournalEntry journal = journalOpt.get();
        
        // Personal journals: only owner can edit
        if (journal.getTeam() == null) {
            return journal.getUser().getId().equals(userId);
        }
        
        // Get user
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return false;
        }
        
        User user = userOpt.get();
        boolean isAppAdmin = user.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        
        // App admins always have access
        if (isAppAdmin) {
            return true;
        }
        
        // Check if user is assigned editor
        Optional<JournalEditor> editor = journalEditorRepository
                .findActiveEditorByJournalAndUser(journalId, userId);
        if (editor.isPresent()) {
            return true;
        }
        
        // Check if user is team master
        Optional<TeamMember> teamMember = teamMemberRepository
                .findByTeamIdAndUserId(journal.getTeam().getId(), userId);
        boolean isTeamMaster = teamMember
                .map(member -> member.getRole() == TeamMember.Role.MASTER)
                .orElse(false);
        
        if (isTeamMaster) {
            return true;
        }
        
        // Check if user is team admin
        boolean isTeamAdmin = teamMember
                .map(member -> member.getRole() == TeamMember.Role.ADMIN)
                .orElse(false);
        
        // Fallback: Allow team admins if no editor is assigned to this journal
        if (isTeamAdmin) {
            List<JournalEditor> allEditors = journalEditorRepository.findActiveEditorsByJournalId(journalId);
            // If no editors are assigned at all, allow team admins
            return allEditors.isEmpty();
        }
        
        return false;
    }

    /**
     * Get all journal editors for a team (only team masters can view this)
     */
    public List<JournalEditorResponse> getTeamJournalEditors(Long teamId) {
        User currentUser = getCurrentUser();
        
        // Check if current user is team master
        Optional<TeamMember> membership = teamMemberRepository
                .findByTeamIdAndUserId(teamId, currentUser.getId());
        
        if (membership.isEmpty() || 
            membership.get().getRole() != TeamMember.Role.MASTER) {
            throw new ForbiddenException("Only team masters can view all journal editors");
        }
        
        List<JournalEditor> editors = journalEditorRepository.findActiveEditorsByTeamId(teamId);
        return editors.stream()
                .map(this::convertToResponse)
                .toList();
    }

    /**
     * Convert JournalEditor entity to DTO response
     */
    private JournalEditorResponse convertToResponse(JournalEditor editor) {
        return JournalEditorResponse.builder()
                .id(editor.getId())
                .journalId(editor.getJournal().getId())
                .journalTitle(editor.getJournal().getTitle())
                .user(JournalEditorResponse.UserSummary.builder()
                        .id(editor.getUser().getId())
                        .username(editor.getUser().getName())
                        .email(editor.getUser().getEmail())
                        .build())
                .assignedBy(JournalEditorResponse.UserSummary.builder()
                        .id(editor.getAssignedBy().getId())
                        .username(editor.getAssignedBy().getName())
                        .email(editor.getAssignedBy().getEmail())
                        .build())
                .assignedAt(editor.getAssignedAt())
                .isActive(editor.isActive())
                .build();
    }
}
