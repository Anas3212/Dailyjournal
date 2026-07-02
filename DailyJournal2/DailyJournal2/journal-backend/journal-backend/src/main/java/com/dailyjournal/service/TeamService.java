package com.dailyjournal.service;

import com.dailyjournal.dto.TeamDto;
import com.dailyjournal.dto.TeamInviteDto;
import com.dailyjournal.dto.TeamMemberDto;
import com.dailyjournal.dto.TeamUpdateRequest;
import com.dailyjournal.dto.TeamCreateRequest;
import com.dailyjournal.dto.UserDTO;
import com.dailyjournal.entity.JournalEntry;
import com.dailyjournal.entity.Team;
import com.dailyjournal.entity.TeamInvite;
import com.dailyjournal.entity.TeamMember;
import com.dailyjournal.entity.User;
import com.dailyjournal.repository.JournalRepository;
import com.dailyjournal.repository.TeamInviteRepository;
import com.dailyjournal.repository.TeamMemberRepository;
import com.dailyjournal.repository.TeamRepository;
import com.dailyjournal.repository.TeamConnectionRepository;
import com.dailyjournal.repository.UserRepository;
import com.dailyjournal.entity.TeamConnection;
import com.dailyjournal.entity.TeamConnection.TeamConnectionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamInviteRepository teamInviteRepository;
    private final UserRepository userRepository;
    private final FriendshipService friendshipService;
    private final JournalRepository journalRepository;
    private final TeamConnectionRepository teamConnectionRepository;
    private final com.dailyjournal.repository.NoticeBoardRepository noticeBoardRepository;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Object principal = auth.getPrincipal();
        if (principal instanceof User user) return user;
        throw new RuntimeException("Unauthorized");
    }

    public Team createTeam(TeamCreateRequest request) {
        User current = getCurrentUser();
        Team team = Team.builder()
                .name(request.getName())
                .community(request.getCommunity() != null && !request.getCommunity().trim().isEmpty() ? 
                          request.getCommunity().trim() : null)
                .owner(current)
                .build();
        team = teamRepository.save(team);
        // Add owner as MASTER member
        TeamMember ownerMember = TeamMember.builder()
                .team(team)
                .user(current)
                .role(TeamMember.Role.MASTER)
                .build();
        teamMemberRepository.save(ownerMember);
        return team;
    }

    public Team updateTeam(Long teamId, TeamUpdateRequest request) {
        User current = getCurrentUser();
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));
        
        // Check if current user is the team master (owner or has MASTER role)
        boolean isOwner = team.getOwner().getId().equals(current.getId());
        boolean isMaster = teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId())
                .map(member -> member.getRole() == TeamMember.Role.MASTER)
                .orElse(false);
        
        if (!isOwner && !isMaster) {
            throw new RuntimeException("Only team masters can update team details");
        }
        
        // Update team fields
        team.setName(request.getName());
        if (request.getCommunity() != null) {
            team.setCommunity(request.getCommunity().trim().isEmpty() ? null : request.getCommunity().trim());
        }
        
        return teamRepository.save(team);
    }

    @Transactional(readOnly = true)
    public List<TeamDto> getMyTeams() {
        User current = getCurrentUser();
        // Owned
        List<Team> owned = teamRepository.findByOwnerId(current.getId());
        // Member of
        List<Long> teamIds = teamMemberRepository.findTeamIdsByUserId(current.getId());
        List<Team> memberOf = teamIds.isEmpty() ? List.of() : teamRepository.findAllById(teamIds);
        // Merge distinct
        var map = owned.stream()
                .collect(java.util.stream.Collectors.toMap(Team::getId, t -> t, (a,b)->a));
        for (Team t : memberOf) {
            map.putIfAbsent(t.getId(), t);
        }

        // Pre-fetch all memberships for the current user in one query to avoid N+1
        List<TeamMember> myMemberships = teamMemberRepository.findByUserId(current.getId());
        Map<Long, TeamMember> membershipByTeamId = myMemberships.stream()
                .collect(Collectors.toMap(tm -> tm.getTeam().getId(), tm -> tm, (a, b) -> a));

        return map.values().stream()
                .map(t -> toTeamDto(t, current, membershipByTeamId))
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TeamDto getTeam(Long teamId) {
        User current = getCurrentUser();
        Team team = teamRepository.findById(teamId).orElseThrow(() -> new RuntimeException("Team not found"));
        
        // Check if user is owner or member
        boolean isOwner = team.getOwner().getId().equals(current.getId());
        Optional<TeamMember> memberOpt = teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId());
        
        // If not owner or direct member, check connected team access
        if (!isOwner && memberOpt.isEmpty()) {
            boolean hasConnectedAccess = hasConnectedTeamAccess(current.getId(), teamId);
            if (!hasConnectedAccess) {
                throw new RuntimeException("You are not a member of this team");
            }
        }
        
        return toTeamDto(team);
    }

    /**
     * Get team details without membership restrictions - allows viewing team info even if not a member
     * Similar to how "Teams where my friends are Masters" works
     */
    @Transactional(readOnly = true)
    public TeamDto getTeamDetails(Long teamId) {
        Team team = teamRepository.findById(teamId).orElseThrow(() -> new RuntimeException("Team not found"));
        return toTeamDto(team);
    }

    public String inviteUser(Long teamId, Long inviteeUserId) {
        User current = getCurrentUser();
        Team team = teamRepository.findById(teamId).orElseThrow(() -> new RuntimeException("Team not found"));
        
        // Only team master/owner can invite
        TeamMember inviterMember = teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId())
                .orElseThrow(() -> new RuntimeException("You are not a member of this team"));
        if (!inviterMember.getRole().canManageMembers() && !team.getOwner().getId().equals(current.getId())) {
            throw new RuntimeException("Only team masters can invite friends");
        }
        
        // Only invite friends
        if (!friendshipService.areUsersFriends(current.getId(), inviteeUserId)) {
            throw new RuntimeException("You can only invite friends to team");
        }
        
        // Do not invite team owner
        if (team.getOwner() != null && team.getOwner().getId().equals(inviteeUserId)) {
            return "User already joined"; // owner is inherently part of team
        }

        // Check if user is already a team member
        if (teamMemberRepository.isUserInTeam(teamId, inviteeUserId)) {
            return "User already joined";
        }
        
        User invitee = userRepository.findById(inviteeUserId).orElseThrow(() -> new RuntimeException("Invitee not found"));
        
        // Check for any existing invitation (regardless of status)
        List<TeamInvite> existingInvites = teamInviteRepository.findInvitesByTeamAndInvitee(teamId, inviteeUserId);
        
        if (!existingInvites.isEmpty()) {
            // Find if there's a pending invitation
            TeamInvite pendingInvite = existingInvites.stream()
                    .filter(invite -> invite.getStatus() == TeamInvite.Status.PENDING)
                    .findFirst()
                    .orElse(null);
            
            if (pendingInvite != null) {
                return "Request already sent";
            }
            
            // If user was previously a member (has ACCEPTED invitation) but is no longer in team,
            // create a fresh invitation
            boolean wasPreviousMember = existingInvites.stream()
                    .anyMatch(invite -> invite.getStatus() == TeamInvite.Status.ACCEPTED);
            
            if (wasPreviousMember && !teamMemberRepository.isUserInTeam(teamId, inviteeUserId)) {
                // Create a new invitation for the removed member
                TeamInvite newInvite = TeamInvite.builder()
                        .team(team)
                        .inviter(current)
                        .invitee(invitee)
                        .status(TeamInvite.Status.PENDING)
                        .build();
                teamInviteRepository.save(newInvite);
                return "Invite sent";
            }
            
            // For other cases, update the most recent invitation
            TeamInvite existingInvite = existingInvites.get(existingInvites.size() - 1);
            existingInvite.setStatus(TeamInvite.Status.PENDING);
            existingInvite.setInviter(current);
            existingInvite.setRespondedAt(null);
            teamInviteRepository.save(existingInvite);
            return "Invite sent";
        } else {
            // Create new invite for first-time invitee
            TeamInvite invite = TeamInvite.builder()
                    .team(team)
                    .inviter(current)
                    .invitee(invitee)
                    .status(TeamInvite.Status.PENDING)
                    .build();
            teamInviteRepository.save(invite);
            return "Invite sent";
        }
    }

    public String acceptInvite(Long inviteId) {
        User current = getCurrentUser();
        TeamInvite invite = teamInviteRepository.findById(inviteId)
                .orElseThrow(() -> new RuntimeException("Invite not found"));
        if (!invite.getInvitee().getId().equals(current.getId())) {
            throw new RuntimeException("Not authorized to accept this invite");
        }
        if (invite.getStatus() != TeamInvite.Status.PENDING) {
            return "Invite not pending";
        }
        invite.setStatus(TeamInvite.Status.ACCEPTED);
        teamInviteRepository.save(invite);
        // add as member
        if (!teamMemberRepository.isUserInTeam(invite.getTeam().getId(), current.getId())) {
            teamMemberRepository.save(TeamMember.builder()
                    .team(invite.getTeam())
                    .user(current)
                    .role(TeamMember.Role.MEMBER)
                    .build());
        }
        return "Invite accepted";
    }

    public String rejectInvite(Long inviteId) {
        User current = getCurrentUser();
        TeamInvite invite = teamInviteRepository.findById(inviteId)
                .orElseThrow(() -> new RuntimeException("Invite not found"));
        if (!invite.getInvitee().getId().equals(current.getId())) {
            throw new RuntimeException("Not authorized to reject this invite");
        }
        if (invite.getStatus() != TeamInvite.Status.PENDING) {
            return "Invite not pending";
        }
        invite.setStatus(TeamInvite.Status.REJECTED);
        teamInviteRepository.save(invite);
        return "Invite rejected";
    }

    @Transactional(readOnly = true)
    public List<TeamInviteDto> getMyPendingInvites() {
        User current = getCurrentUser();
        return teamInviteRepository.findPendingInvitesForUser(current.getId())
                .stream().map(this::toInviteDto).toList();
    }

    @Transactional(readOnly = true)
    public List<TeamMemberDto> listMembers(Long teamId) {
        User current = getCurrentUser();

        boolean isMember = teamMemberRepository.isUserInTeam(teamId, current.getId());
        if (!isMember) {
            boolean hasConnectedAccess = hasConnectedTeamAccess(current.getId(), teamId);
            if (!hasConnectedAccess) {
                throw new AccessDeniedException("You must be a member or connected team member to view this team's members");
            }
        }

        return teamMemberRepository.findByTeam_Id(teamId).stream()
                .map(this::toMemberDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<JournalEntry> listTeamJournals(Long teamId) {
        User current = getCurrentUser();
        List<JournalEntry> allJournals = journalRepository.findByTeam_Id(teamId);
        
        // Check if user is a member of this team
        boolean isMember = teamMemberRepository.isUserInTeam(teamId, current.getId());
        
        // If not a direct member, check connected team access
        if (!isMember) {
            isMember = hasConnectedTeamAccess(current.getId(), teamId);
        }
        
        if (isMember) {
            // Members (direct or through connected teams) get full access to all journals
            return allJournals;
        } else {
            // Non-members only see public journals (isPrivate = false)
            return allJournals.stream()
                    .filter(journal -> !journal.isPrivate())
                    .toList();
        }
    }

    // === Member management ===
    public String leaveTeam(Long teamId) {
        User current = getCurrentUser();
        Team team = teamRepository.findById(teamId).orElseThrow(() -> new RuntimeException("Team not found"));
        if (team.getOwner().getId().equals(current.getId())) {
            throw new RuntimeException("Owner must transfer ownership or delete team before leaving");
        }
        TeamMember tm = teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId())
                .orElseThrow(() -> new RuntimeException("Not a member"));
        teamMemberRepository.delete(tm);
        return "Left team";
    }

    public String removeMember(Long teamId, Long userId) {
        User current = getCurrentUser();
        Team team = teamRepository.findById(teamId).orElseThrow(() -> new RuntimeException("Team not found"));
        // Only owner, master, or admin can remove others; lower roles cannot remove higher roles
        TeamMember actor = teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId())
                .orElseThrow(() -> new RuntimeException("Not a member"));
        boolean isOwner = team.getOwner().getId().equals(current.getId());
        if (!isOwner && !actor.getRole().canManageMembers()) {
            throw new RuntimeException("Only team masters can remove members");
        }
        if (userId.equals(team.getOwner().getId())) throw new RuntimeException("Cannot remove owner");
        TeamMember tm = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new RuntimeException("User is not a member"));
        teamMemberRepository.delete(tm);
        return "Member removed";
    }

    public String changeMemberRole(Long teamId, Long userId, TeamMember.Role role) {
        User current = getCurrentUser();
        Team team = teamRepository.findById(teamId).orElseThrow(() -> new RuntimeException("Team not found"));
        
        TeamMember actor = teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId())
                .orElseThrow(() -> new RuntimeException("Not a member"));
        
        boolean isOwner = team.getOwner().getId().equals(current.getId());
        
        // Only MASTER can promote/demote, owner has all permissions
        if (!isOwner && !actor.getRole().canPromoteMembers()) {
            throw new RuntimeException("Only team masters can change member roles");
        }
        
        if (userId.equals(team.getOwner().getId())) {
            throw new RuntimeException("Owner role cannot be changed");
        }
        
        TeamMember targetMember = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new RuntimeException("User is not a member"));
        
        // Check if actor can perform this role change
        if (!isOwner && !actor.getRole().canPromote(role) && !actor.getRole().canDemote(targetMember.getRole())) {
            throw new RuntimeException("Insufficient permissions to change to this role");
        }
        
        targetMember.setRole(role);
        teamMemberRepository.save(targetMember);
        return "Role updated to " + role.name();
    }

    public String promoteMember(Long teamId, Long userId) {
        TeamMember targetMember = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new RuntimeException("User is not a member"));

        TeamMember.Role newRole = switch (targetMember.getRole()) {
            case MEMBER -> TeamMember.Role.ADMIN;
            case ADMIN  -> TeamMember.Role.MASTER;  // ADMIN can be promoted to MASTER
            case MASTER -> throw new RuntimeException("Master is already the highest role and cannot be promoted further");
        };

        return changeMemberRole(teamId, userId, newRole);
    }

    public String demoteMember(Long teamId, Long userId) {
        TeamMember targetMember = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new RuntimeException("User is not a member"));
        
        TeamMember.Role newRole = switch (targetMember.getRole()) {
            case ADMIN -> TeamMember.Role.MEMBER;
            case MEMBER -> throw new RuntimeException("Member is already the lowest role");
            case MASTER -> throw new RuntimeException("Master cannot be demoted by another master");
        };
        
        return changeMemberRole(teamId, userId, newRole);
    }

    @Transactional
    public String transferOwnership(Long teamId, Long newOwnerId) {
        try {
            User current = getCurrentUser();
            Team team = teamRepository.findById(teamId).orElseThrow(() -> new RuntimeException("Team not found"));
            
            // Only current owner can transfer ownership
            if (!team.getOwner().getId().equals(current.getId())) {
                throw new RuntimeException("Only current owner can transfer ownership");
            }
            
            // NEW: Check if team is in reclaim period - prevent further transfers
            if (Boolean.TRUE.equals(team.getIsTemporaryOwnership()) && 
                team.getOwnershipTransferDate() != null &&
                team.getOwnershipTransferDate().plusDays(7).isAfter(LocalDateTime.now())) {
                
                LocalDateTime reclaimExpiry = team.getOwnershipTransferDate().plusDays(7);
                throw new RuntimeException("Cannot transfer ownership during reclaim period. " +
                    "Original owner can reclaim until " + reclaimExpiry.toLocalDate() + 
                    ". Please wait until the reclaim period expires.");
            }
            
            // Prevent self-transfer
            if (current.getId().equals(newOwnerId)) {
                throw new RuntimeException("Cannot transfer ownership to yourself");
            }
            
            // New owner must be a team member
            TeamMember newOwnerMember = teamMemberRepository.findByTeamIdAndUserId(teamId, newOwnerId)
                    .orElseThrow(() -> new RuntimeException("New owner must be a team member"));
            
            User newOwner = newOwnerMember.getUser();
            
            // Set up temporary ownership (7-day reclaim period)
            team.setPreviousOwner(current);
            team.setOwnershipTransferDate(LocalDateTime.now());
            team.setIsTemporaryOwnership(true);
            team.setOwner(newOwner);
            
            // Promote new owner to MASTER role
            newOwnerMember.setRole(TeamMember.Role.MASTER);
            
            // Demote previous owner to ADMIN role
            TeamMember currentOwnerMember = teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId())
                    .orElseThrow(() -> new RuntimeException("Current owner not found in team members"));
            currentOwnerMember.setRole(TeamMember.Role.ADMIN);
            
            // Transfer team journals ownership to new owner
            Long journalCount = journalRepository.countTeamJournals(teamId);
            if (journalCount > 0) {
                journalRepository.transferTeamJournalsOwnership(teamId, newOwnerId);
            }
            
            // Save all changes
            teamRepository.save(team);
            teamMemberRepository.save(newOwnerMember);
            teamMemberRepository.save(currentOwnerMember);
            
            String message = "Ownership transferred successfully (7-day reclaim period active)";
            if (journalCount > 0) {
                message += ". " + journalCount + " team journal(s) transferred to new owner.";
            }
            return message;
        } catch (Exception e) {
            throw new RuntimeException("Transfer ownership failed: " + e.getMessage(), e);
        }
    }

    @Transactional
    public String reclaimOwnership(Long teamId) {
        try {
            User current = getCurrentUser();
            Team team = teamRepository.findById(teamId).orElseThrow(() -> new RuntimeException("Team not found"));
            
            // Only previous owner can reclaim during temporary period
            if (!Boolean.TRUE.equals(team.getIsTemporaryOwnership()) || team.getPreviousOwner() == null || 
                !team.getPreviousOwner().getId().equals(current.getId())) {
                throw new RuntimeException("You cannot reclaim ownership of this team");
            }
            
            // Check if 7-day period has expired
            LocalDateTime transferDate = team.getOwnershipTransferDate();
            if (transferDate == null || transferDate.plusDays(7).isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Reclaim period has expired (7 days)");
            }
            
            User currentOwner = team.getOwner();
            
            // Restore original ownership
            team.setOwner(current);
            team.setPreviousOwner(null);
            team.setOwnershipTransferDate(null);
            team.setIsTemporaryOwnership(false);
            
            // Restore roles
            TeamMember originalOwnerMember = teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId())
                    .orElseThrow(() -> new RuntimeException("Original owner not found in team members"));
            originalOwnerMember.setRole(TeamMember.Role.MASTER);
            
            TeamMember temporaryOwnerMember = teamMemberRepository.findByTeamIdAndUserId(teamId, currentOwner.getId())
                    .orElseThrow(() -> new RuntimeException("Temporary owner not found in team members"));
            temporaryOwnerMember.setRole(TeamMember.Role.ADMIN);
            
            // Transfer team journals ownership back to previous owner
            Long journalCount = journalRepository.countTeamJournals(teamId);
            if (journalCount > 0) {
                journalRepository.transferTeamJournalsOwnership(teamId, current.getId());
            }
            
            // Save all changes
            teamRepository.save(team);
            teamMemberRepository.save(originalOwnerMember);
            teamMemberRepository.save(temporaryOwnerMember);
            
            String message = "Ownership reclaimed successfully";
            if (journalCount > 0) {
                message += ". " + journalCount + " team journal(s) transferred back to original owner.";
            }
            return message;
        } catch (Exception e) {
            throw new RuntimeException("Reclaim ownership failed: " + e.getMessage(), e);
        }
    }

    public boolean canReclaimOwnership(Long teamId, Long userId) {
        Team team = teamRepository.findById(teamId).orElse(null);
        if (team == null || !Boolean.TRUE.equals(team.getIsTemporaryOwnership()) || team.getPreviousOwner() == null) {
            return false;
        }
        
        if (!team.getPreviousOwner().getId().equals(userId)) {
            return false;
        }
        
        LocalDateTime transferDate = team.getOwnershipTransferDate();
        return transferDate != null && transferDate.plusDays(7).isAfter(LocalDateTime.now());
    }

    @Transactional
    public String deleteTeam(Long teamId) {
        User current = getCurrentUser();
        Team team = teamRepository.findById(teamId).orElseThrow(() -> new RuntimeException("Team not found"));
        if (!team.getOwner().getId().equals(current.getId())) {
            throw new RuntimeException("Only owner can delete team");
        }

        // Collect media file paths before deleting DB records (journals deleted below)
        List<String> mediaPathsToDelete = journalRepository.findByTeam_Id(teamId).stream()
                .filter(j -> j.getMediaPaths() != null)
                .flatMap(j -> j.getMediaPaths().stream())
                .collect(Collectors.toList());

        // Delete all related data in correct order to avoid foreign key constraints
        // 1. Delete team connections (both sent and received)
        teamConnectionRepository.deleteByRequesterTeamIdOrTargetTeamId(teamId);

        // 2. Delete team invites
        teamInviteRepository.deleteByTeamId(teamId);

        // 3. Delete team members
        teamMemberRepository.deleteByTeamId(teamId);

        // 4. Delete team journals (DB records)
        journalRepository.deleteByTeamId(teamId);

        // 5. Delete notice board entries associated with the team
        noticeBoardRepository.deleteByTeamId(teamId);

        // 6. Finally delete the team
        teamRepository.delete(team);

        // 7. Delete physical media files from disk (after DB records are gone)
        String uploadDir = "uploads/";
        int deleted = 0, failed = 0;
        for (String mediaPath : mediaPathsToDelete) {
            try {
                // mediaPath may be a filename or a relative path like "uploads/filename.jpg"
                String filename = mediaPath.contains("/") ? mediaPath.substring(mediaPath.lastIndexOf('/') + 1) : mediaPath;
                Path filePath = Paths.get(uploadDir).resolve(filename);
                if (Files.deleteIfExists(filePath)) {
                    deleted++;
                }
            } catch (IOException e) {
                log.warn("Could not delete media file '{}' for deleted team {}: {}", mediaPath, teamId, e.getMessage());
                failed++;
            }
        }
        if (deleted > 0 || failed > 0) {
            log.info("Team {} deletion: {} media files deleted, {} failed to delete", teamId, deleted, failed);
        }

        return "Team deleted";
    }

    // === DTO Mappers ===

    /**
     * Maps a single Team to TeamDto. Resolves the current user from SecurityContext each call.
     * Use the batch overload toTeamDto(team, currentUser, membershipMap) when mapping lists.
     */
    public TeamDto toTeamDto(Team t) {
        if (t == null) {
            throw new IllegalArgumentException("Team cannot be null");
        }
        User current = getCurrentUser();
        List<TeamMember> myMemberships = teamMemberRepository.findByUserId(current.getId());
        Map<Long, TeamMember> membershipByTeamId = myMemberships.stream()
                .collect(Collectors.toMap(tm -> tm.getTeam().getId(), tm -> tm, (a, b) -> a));
        return toTeamDto(t, current, membershipByTeamId);
    }

    /**
     * Batch-friendly overload: maps a Team to TeamDto using pre-fetched user and membership map.
     * Eliminates N+1 DB queries when called inside a stream over a list of teams.
     */
    private TeamDto toTeamDto(Team t, User current, Map<Long, TeamMember> membershipByTeamId) {
        if (t == null) {
            throw new IllegalArgumentException("Team cannot be null");
        }

        TeamDto dto = new TeamDto();
        dto.setId(t.getId());
        dto.setName(t.getName());
        dto.setCommunity(t.getCommunity());

        // Safe owner information extraction
        if (t.getOwner() != null) {
            dto.setOwnerId(t.getOwner().getId());
            dto.setOwnerName(t.getOwner().getName());
        }

        // Use pre-fetched membership — no per-team DB call
        TeamMember myMembership = membershipByTeamId.get(t.getId());
        if (myMembership != null) {
            dto.setUserRole(myMembership.getRole().name());
        } else {
            dto.setUserRole("NONE");
        }

        try {
            dto.setMemberCount(teamMemberRepository.countByTeam_Id(t.getId()));
            dto.setJournalCount(journalRepository.countByTeam_Id(t.getId()));
        } catch (Exception e) {
            log.warn("Error fetching team statistics for team {}: {}", t.getId(), e.getMessage());
            dto.setMemberCount(0);
            dto.setJournalCount(0);
        }

        // Temporary ownership fields
        dto.setIsTemporaryOwnership(Boolean.TRUE.equals(t.getIsTemporaryOwnership()));
        if (t.getPreviousOwner() != null) {
            dto.setPreviousOwnerId(t.getPreviousOwner().getId());
            dto.setPreviousOwnerName(t.getPreviousOwner().getName());
        }
        if (t.getOwnershipTransferDate() != null) {
            dto.setOwnershipTransferDate(t.getOwnershipTransferDate().toString());
        }

        // Reclaim check uses the pre-fetched user ID — no extra DB call
        try {
            dto.setCanReclaim(canReclaimOwnership(t.getId(), current.getId()));
        } catch (Exception e) {
            log.warn("Error checking reclaim ownership for team {}: {}", t.getId(), e.getMessage());
            dto.setCanReclaim(false);
        }

        return dto;
    }

    private TeamMemberDto toMemberDto(TeamMember tm) {
        TeamMemberDto dto = new TeamMemberDto();
        if (tm.getUser() != null) {
            dto.setUserId(tm.getUser().getId());
            dto.setUserName(tm.getUser().getName());
            dto.setUserEmail(tm.getUser().getEmail());
        }
        dto.setRole(tm.getRole().name());
        dto.setJoinedAt(tm.getJoinedAt());
        
        // Enhanced reclaim ownership logic
        boolean canReclaim = canReclaimOwnership(tm.getTeam().getId(), tm.getUser().getId());
        dto.setCanReclaim(canReclaim);
        dto.setShowReclaimAlert(canReclaim);
        
        // Calculate remaining days for reclaim period
        if (canReclaim && tm.getTeam().getOwnershipTransferDate() != null) {
            LocalDateTime transferDate = tm.getTeam().getOwnershipTransferDate();
            LocalDateTime expiryDate = transferDate.plusDays(7);
            long daysRemaining = java.time.Duration.between(LocalDateTime.now(), expiryDate).toDays();
            dto.setReclaimDaysRemaining(Math.max(0, daysRemaining));
            dto.setOwnershipTransferDate(transferDate);
        } else {
            dto.setReclaimDaysRemaining(0L);
        }
        
        return dto;
    }

    private TeamInviteDto toInviteDto(TeamInvite inv) {
        TeamInviteDto dto = new TeamInviteDto();
        dto.setId(inv.getId());
        if (inv.getTeam() != null) {
            dto.setTeamId(inv.getTeam().getId());
            dto.setTeamName(inv.getTeam().getName());
        }
        if (inv.getInviter() != null) {
            dto.setInviterId(inv.getInviter().getId());
            dto.setInviterName(inv.getInviter().getName());
            dto.setInviterEmail(inv.getInviter().getEmail());
        }
        if (inv.getInvitee() != null) {
            dto.setInviteeId(inv.getInvitee().getId());
            dto.setInviteeName(inv.getInvitee().getName());
            dto.setInviteeEmail(inv.getInvitee().getEmail());
        }
        dto.setStatus(inv.getStatus().name());
        dto.setCreatedAt(inv.getCreatedAt());
        dto.setRespondedAt(inv.getRespondedAt());
        return dto;
    }

    public List<TeamInviteDto> getSentInvitations(Long teamId, String email, String status) {
        User current = getCurrentUser();
        Team team = teamRepository.findById(teamId).orElseThrow(() -> new RuntimeException("Team not found"));
        
        // Only team master/owner can view sent invitations
        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId())
                .orElseThrow(() -> new RuntimeException("You are not a member of this team"));
        if (!member.getRole().canManageMembers() && !team.getOwner().getId().equals(current.getId())) {
            throw new RuntimeException("Only team masters can view sent invitations");
        }
        
        List<TeamInvite> sentInvites = teamInviteRepository.findByTeamId(teamId);
        
        // Apply filters
        return sentInvites.stream()
                .filter(invite -> email == null || 
                    (invite.getInvitee() != null && invite.getInvitee().getEmail().toLowerCase().contains(email.toLowerCase())))
                .filter(invite -> status == null || invite.getStatus().name().equalsIgnoreCase(status))
                .map(this::toInviteDto)
                .collect(java.util.stream.Collectors.toList());
    }

    public String cancelInvitation(Long inviteId) {
        User current = getCurrentUser();
        TeamInvite invite = teamInviteRepository.findById(inviteId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));
        
        // Only the inviter or team master can cancel
        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(invite.getTeam().getId(), current.getId())
                .orElseThrow(() -> new RuntimeException("You are not a member of this team"));
        
        if (!invite.getInviter().getId().equals(current.getId()) && 
            !member.getRole().canManageMembers() && 
            !invite.getTeam().getOwner().getId().equals(current.getId())) {
            throw new RuntimeException("You can only cancel invitations you sent or if you're a team master");
        }
        
        if (invite.getStatus() != TeamInvite.Status.PENDING) {
            return "Can only cancel pending invitations";
        }
        
        invite.setStatus(TeamInvite.Status.REJECTED);
        invite.setRespondedAt(LocalDateTime.now());
        teamInviteRepository.save(invite);
        return "Invitation cancelled";
    }

    @Transactional(readOnly = true)
    public List<TeamDto> findTeamsWhereFriendsAreMasters(String q, String friendQ) {
        User current = getCurrentUser();
        // Get friends list
        List<UserDTO> friends = friendshipService.getFriends(current.getId());
        if (friends == null || friends.isEmpty()) {
            return List.of();
        }
        // Optional filter friends by name/email
        if (friendQ != null && !friendQ.isBlank()) {
            String fneedle = friendQ.toLowerCase();
            friends = friends.stream()
                    .filter(u -> (u.getName() != null && u.getName().toLowerCase().contains(fneedle))
                              || (u.getEmail() != null && u.getEmail().toLowerCase().contains(fneedle)))
                    .toList();
            if (friends.isEmpty()) return List.of();
        }
        List<Long> friendIds = friends.stream().map(UserDTO::getId).toList();
        // Query teams where owner or a MASTER member is in friendIds
        List<Team> teams = teamRepository.findTeamsWhereFriendIsMaster(friendIds);
        // Optional filter by name (case-insensitive contains)
        if (q != null && !q.isBlank()) {
            String needle = q.toLowerCase();
            teams = teams.stream()
                    .filter(t -> t.getName() != null && t.getName().toLowerCase().contains(needle))
                    .toList();
        }
        return teams.stream().map(this::toTeamDto).toList();
    }

    // === Connected Team Access Methods ===
    
    /**
     * Check if a user has access to a team through connected teams
     */
    @Transactional(readOnly = true)
    public boolean hasConnectedTeamAccess(Long userId, Long targetTeamId) {
        // Get all teams where the user is a member
        List<TeamMember> userMemberships = teamMemberRepository.findByUserId(userId);
        
        for (TeamMember membership : userMemberships) {
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
     * Get team details with connected team access support
     */
    @Transactional(readOnly = true)
    public TeamDto getTeamWithConnectedAccess(Long teamId) {
        User current = getCurrentUser();
        Team team = teamRepository.findById(teamId).orElseThrow(() -> new RuntimeException("Team not found"));
        
        // Check if user is owner or direct member
        boolean isOwner = team.getOwner().getId().equals(current.getId());
        Optional<TeamMember> memberOpt = teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId());
        
        // If not owner or direct member, check connected team access
        if (!isOwner && memberOpt.isEmpty()) {
            boolean hasConnectedAccess = hasConnectedTeamAccess(current.getId(), teamId);
            if (!hasConnectedAccess) {
                throw new RuntimeException("You are not a member of this team or connected teams");
            }
        }
        
        return toTeamDto(team);
    }

    /**
     * List team journals with connected team access support
     */
    @Transactional(readOnly = true)
    public List<JournalEntry> listTeamJournalsWithConnectedAccess(Long teamId) {
        User current = getCurrentUser();
        List<JournalEntry> allJournals = journalRepository.findByTeam_Id(teamId);
        
        // Check if user is a direct member of this team
        boolean isMember = teamMemberRepository.isUserInTeam(teamId, current.getId());
        
        // If not a direct member, check connected team access
        if (!isMember) {
            isMember = hasConnectedTeamAccess(current.getId(), teamId);
        }
        
        if (isMember) {
            // Members (direct or through connected teams) get full access to all journals
            return allJournals;
        } else {
            // Non-members only see public journals (isPrivate = false)
            return allJournals.stream()
                    .filter(journal -> !journal.isPrivate())
                    .toList();
        }
    }

    /**
     * List team members with connected team access support
     */
    @Transactional(readOnly = true)
    public List<TeamMemberDto> listMembersWithConnectedAccess(Long teamId) {
        User current = getCurrentUser();
        
        // Check if user is a direct member or has connected team access
        boolean isMember = teamMemberRepository.isUserInTeam(teamId, current.getId());
        if (!isMember) {
            boolean hasConnectedAccess = hasConnectedTeamAccess(current.getId(), teamId);
            if (!hasConnectedAccess) {
                throw new RuntimeException("You are not a member of this team or connected teams");
            }
        }
        
        return teamMemberRepository.findByTeam_Id(teamId).stream()
                .map(this::toMemberDto)
                .toList();
    }

    /**
     * Get all teams accessible to current user (direct membership + connected teams)
     */
    @Transactional(readOnly = true)
    public List<TeamDto> getAccessibleTeams() {
        User current = getCurrentUser();
        
        // Get directly accessible teams
        List<Team> directTeams = teamRepository.findByOwnerIdOrMemberId(current.getId());
        
        // Get teams accessible through connections
        List<TeamMember> userMemberships = teamMemberRepository.findByUserId(current.getId());
        List<Team> connectedTeams = userMemberships.stream()
                .flatMap(membership -> {
                    Long userTeamId = membership.getTeam().getId();
                    return teamConnectionRepository.findConnectedTeams(userTeamId).stream()
                            .filter(connection -> connection.getStatus() == TeamConnectionStatus.ACCEPTED)
                            .map(connection -> {
                                // Get the other team in the connection
                                return connection.getRequesterTeam().getId().equals(userTeamId) 
                                    ? connection.getTargetTeam() 
                                    : connection.getRequesterTeam();
                            });
                })
                .distinct()
                .toList();
        
        // Combine and deduplicate
        List<Team> allAccessibleTeams = directTeams.stream()
                .distinct()
                .toList();
        
        // Add connected teams that aren't already in direct teams
        List<Long> directTeamIds = directTeams.stream().map(Team::getId).toList();
        List<Team> additionalConnectedTeams = connectedTeams.stream()
                .filter(team -> !directTeamIds.contains(team.getId()))
                .toList();
        
        List<Team> finalList = new java.util.ArrayList<>(allAccessibleTeams);
        finalList.addAll(additionalConnectedTeams);
        
        return finalList.stream().map(this::toTeamDto).toList();
    }

    /**
     * Check if current user can access a specific team (direct or connected)
     */
    @Transactional(readOnly = true)
    public boolean canAccessTeam(Long teamId) {
        User current = getCurrentUser();
        
        // Check direct access (owner or member)
        Team team = teamRepository.findById(teamId).orElse(null);
        if (team == null) return false;
        
        boolean isOwner = team.getOwner().getId().equals(current.getId());
        boolean isMember = teamMemberRepository.isUserInTeam(teamId, current.getId());
        
        if (isOwner || isMember) {
            return true;
        }
        
        // Check connected team access
        return hasConnectedTeamAccess(current.getId(), teamId);
    }
    
    // ==================== TEAM COMMUNITY MANAGEMENT ====================
    
    /**
     * Get all teams from the same community as the current user's teams
     */
    public List<Map<String, Object>> getTeamCommunities() {
        User currentUser = getCurrentUser();
        
        // Get all teams where user is owner or member
        List<Team> userTeams = teamRepository.findByOwnerIdOrMemberId(currentUser.getId());
        
        // Get all distinct communities from user's teams
        Set<String> userCommunities = userTeams.stream()
                .map(Team::getCommunity)
                .filter(Objects::nonNull)
                .filter(community -> !community.trim().isEmpty())
                .collect(Collectors.toSet());
        
        List<Map<String, Object>> communities = new ArrayList<>();
        
        for (String community : userCommunities) {
            Long teamCount = teamRepository.countByCommunityIgnoreCase(community);
            
            Map<String, Object> communityData = new HashMap<>();
            communityData.put("name", community);
            communityData.put("teamCount", teamCount);
            communityData.put("description", generateTeamCommunityDescription(community));
            
            communities.add(communityData);
        }
        
        // Sort by team count (descending)
        communities.sort((a, b) -> Long.compare((Long) b.get("teamCount"), (Long) a.get("teamCount")));
        
        return communities;
    }
    
    /**
     * Search team communities by query
     */
    public List<Map<String, Object>> searchTeamCommunities(String query) {
        List<Map<String, Object>> communities = new ArrayList<>();
        
        // Get all distinct communities
        List<String> allCommunities = teamRepository.findDistinctTeamCommunities();
        
        // Filter communities based on query
        List<String> filteredCommunities;
        if (query == null || query.trim().isEmpty()) {
            filteredCommunities = allCommunities;
        } else {
            String searchQuery = query.toLowerCase().trim();
            filteredCommunities = allCommunities.stream()
                    .filter(community -> community.toLowerCase().contains(searchQuery))
                    .collect(Collectors.toList());
        }
        
        // Build community data with team counts
        for (String community : filteredCommunities) {
            Long teamCount = teamRepository.countByCommunityIgnoreCase(community);
            
            Map<String, Object> communityData = new HashMap<>();
            communityData.put("name", community);
            communityData.put("teamCount", teamCount);
            communityData.put("description", generateTeamCommunityDescription(community));
            
            communities.add(communityData);
        }
        
        // Sort by team count (descending)
        communities.sort((a, b) -> Long.compare((Long) b.get("teamCount"), (Long) a.get("teamCount")));
        
        return communities;
    }
    
    /**
     * Get teams from a specific community with detailed information
     */
    public List<Map<String, Object>> getTeamsByCommunity(String communityName) {
        if (communityName == null || communityName.trim().isEmpty()) {
            return new ArrayList<>();
        }
        
        return teamRepository.findTeamsByCommunityWithStats(communityName.trim());
    }
    
    /**
     * Get teams from the same community as the current user's teams
     */
    public List<TeamDto> getCommunityTeams() {
        User currentUser = getCurrentUser();
        
        // Get all teams where user is owner or member
        List<Team> userTeams = teamRepository.findByOwnerIdOrMemberId(currentUser.getId());
        
        // Get all distinct communities from user's teams
        Set<String> userCommunities = userTeams.stream()
                .map(Team::getCommunity)
                .filter(Objects::nonNull)
                .filter(community -> !community.trim().isEmpty())
                .collect(Collectors.toSet());
        
        List<TeamDto> communityTeams = new ArrayList<>();
        
        for (String community : userCommunities) {
            List<Team> teams = teamRepository.findByCommunityIgnoreCase(community);
            
            for (Team team : teams) {
                TeamDto dto = toTeamDto(team);
                communityTeams.add(dto);
            }
        }
        
        // Remove duplicates and sort by name
        return communityTeams.stream()
                .distinct()
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .collect(Collectors.toList());
    }
    
    /**
     * Generate appropriate description for team community
     */
    private String generateTeamCommunityDescription(String community) {
        String lowerCommunity = community.toLowerCase();
        
        if (lowerCommunity.contains("university") || lowerCommunity.contains("college") || 
            lowerCommunity.contains("institute") || lowerCommunity.contains("school")) {
            return "Academic teams from " + community;
        } else if (lowerCommunity.contains("inc") || lowerCommunity.contains("corp") || 
                   lowerCommunity.contains("ltd") || lowerCommunity.contains("llc") ||
                   lowerCommunity.contains("company") || lowerCommunity.contains("technologies")) {
            return "Corporate teams from " + community;
        } else if (lowerCommunity.contains("department") || lowerCommunity.contains("division") || 
                   lowerCommunity.contains("unit") || lowerCommunity.contains("branch")) {
            return "Organizational teams from " + community;
        } else if (lowerCommunity.contains("city") || lowerCommunity.contains("town") || 
                   lowerCommunity.contains("area") || lowerCommunity.contains("region")) {
            return "Regional teams from " + community;
        } else {
            return "Teams from the " + community + " community";
        }
    }
}
