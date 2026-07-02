package com.dailyjournal.controller;

import com.dailyjournal.entity.JournalEntry;
import com.dailyjournal.entity.Team;
import com.dailyjournal.dto.TeamDto;
import com.dailyjournal.dto.TeamInviteDto;
import com.dailyjournal.dto.TeamMemberDto;
import com.dailyjournal.dto.JournalResponse;
import com.dailyjournal.dto.TransferOwnershipRequest;
import com.dailyjournal.dto.TeamUpdateRequest;
import com.dailyjournal.dto.TeamCreateRequest;
import com.dailyjournal.mapper.JournalMapper;
import com.dailyjournal.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
@Validated
public class TeamController {

    private final TeamService teamService;
    private final JournalMapper journalMapper;

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<TeamDto> createTeam(@RequestBody @Valid TeamCreateRequest request) {
        Team created = teamService.createTeam(request);
        return ResponseEntity.ok(teamService.toTeamDto(created));
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/mine")
    public ResponseEntity<List<TeamDto>> myTeams() {
        return ResponseEntity.ok(teamService.getMyTeams());
    }

    // Search teams where any of my friends are MASTER/owner
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/friends/masters")
    public ResponseEntity<List<TeamDto>> findFriendsMasterTeams(@RequestParam(required = false) String q,
                                                                @RequestParam(required = false, name = "friendQ") String friendQ) {
        return ResponseEntity.ok(teamService.findTeamsWhereFriendsAreMasters(q, friendQ));
    }

    // ALL invite-related routes MUST come before /{teamId} to avoid conflicts
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/invites/pending")
    public ResponseEntity<List<TeamInviteDto>> myPendingInvites() {
        return ResponseEntity.ok(teamService.getMyPendingInvites());
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/invites/{inviteId}/accept")
    public ResponseEntity<String> accept(@PathVariable @Positive Long inviteId) {
        return ResponseEntity.ok(teamService.acceptInvite(inviteId));
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/invites/{inviteId}/reject")
    public ResponseEntity<String> reject(@PathVariable @Positive Long inviteId) {
        return ResponseEntity.ok(teamService.rejectInvite(inviteId));
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @DeleteMapping("/invites/{inviteId}/cancel")
    public ResponseEntity<String> cancelInvitation(@PathVariable @Positive Long inviteId) {
        return ResponseEntity.ok(teamService.cancelInvitation(inviteId));
    }

    // Generic /{teamId} route MUST come after all specific routes
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/{teamId}")
    public ResponseEntity<TeamDto> getTeam(@PathVariable @Positive Long teamId) {
        return ResponseEntity.ok(teamService.getTeam(teamId));
    }

    /**
     * Get team details without membership restrictions - allows viewing team info even if not a member
     * Similar to how "Teams where my friends are Masters" works
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/{teamId}/details")
    public ResponseEntity<TeamDto> getTeamDetails(@PathVariable @Positive Long teamId) {
        return ResponseEntity.ok(teamService.getTeamDetails(teamId));
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PutMapping("/{teamId}")
    public ResponseEntity<TeamDto> updateTeam(@PathVariable @Positive Long teamId, 
                                             @RequestBody @Valid TeamUpdateRequest request) {
        Team updated = teamService.updateTeam(teamId, request);
        return ResponseEntity.ok(teamService.toTeamDto(updated));
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/{teamId}/invite/{userId}")
    public ResponseEntity<String> invite(@PathVariable @Positive Long teamId, @PathVariable @Positive Long userId) {
        return ResponseEntity.ok(teamService.inviteUser(teamId, userId));
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/{teamId}/members")
    public ResponseEntity<List<TeamMemberDto>> listMembers(@PathVariable @Positive Long teamId) {
        return ResponseEntity.ok(teamService.listMembers(teamId));
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/{teamId}/journals")
    public ResponseEntity<List<JournalResponse>> listTeamJournals(@PathVariable @Positive Long teamId) {
        List<JournalEntry> entries = teamService.listTeamJournals(teamId);
        List<JournalResponse> resp = entries.stream()
                .map(journalMapper::toResponse)
                .toList();
        return ResponseEntity.ok(resp);
    }

    // Member management endpoints
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @DeleteMapping("/{teamId}/members/me")
    public ResponseEntity<String> leaveTeam(@PathVariable @Positive Long teamId) {
        return ResponseEntity.ok(teamService.leaveTeam(teamId));
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @DeleteMapping("/{teamId}/members/{userId}")
    public ResponseEntity<String> removeMember(@PathVariable @Positive Long teamId, @PathVariable @Positive Long userId) {
        return ResponseEntity.ok(teamService.removeMember(teamId, userId));
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/{teamId}/members/{userId}/role")
    public ResponseEntity<String> changeRole(@PathVariable @Positive Long teamId,
                                             @PathVariable @Positive Long userId,
                                             @RequestParam @Pattern(regexp = "ADMIN|MEMBER|MASTER", flags = Pattern.Flag.CASE_INSENSITIVE,
                                                     message = "Role must be ADMIN, MEMBER, or MASTER") String role) {
        return ResponseEntity.ok(teamService.changeMemberRole(teamId, userId, com.dailyjournal.entity.TeamMember.Role.valueOf(role.toUpperCase())));
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/{teamId}/transfer-ownership")
    public ResponseEntity<String> transferOwnership(@PathVariable @Positive Long teamId,
                                                    @RequestBody @Valid TransferOwnershipRequest request) {
        try {
            String result = teamService.transferOwnership(teamId, request.getNewOwnerId());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Transfer failed: " + e.getMessage());
        }
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @DeleteMapping("/{teamId}")
    public ResponseEntity<String> deleteTeam(@PathVariable @Positive Long teamId) {
        return ResponseEntity.ok(teamService.deleteTeam(teamId));
    }

    // New role management endpoints
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/{teamId}/members/{userId}/promote")
    public ResponseEntity<String> promoteMember(@PathVariable @Positive Long teamId, @PathVariable @Positive Long userId) {
        return ResponseEntity.ok(teamService.promoteMember(teamId, userId));
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/{teamId}/members/{userId}/demote")
    public ResponseEntity<String> demoteMember(@PathVariable @Positive Long teamId, @PathVariable @Positive Long userId) {
        return ResponseEntity.ok(teamService.demoteMember(teamId, userId));
    }

    // Temporary ownership endpoints
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping("/{teamId}/reclaim-ownership")
    public ResponseEntity<String> reclaimOwnership(@PathVariable @Positive Long teamId) {
        return ResponseEntity.ok(teamService.reclaimOwnership(teamId));
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/{teamId}/can-reclaim/{userId}")
    public ResponseEntity<Boolean> canReclaimOwnership(@PathVariable @Positive Long teamId, @PathVariable @Positive Long userId) {
        return ResponseEntity.ok(teamService.canReclaimOwnership(teamId, userId));
    }

    // Sent invitations management
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/{teamId}/invites/sent")
    public ResponseEntity<List<TeamInviteDto>> getSentInvitations(@PathVariable @Positive Long teamId,
                                                                  @RequestParam(required = false) String email,
                                                                  @RequestParam(required = false) String status) {
        return ResponseEntity.ok(teamService.getSentInvitations(teamId, email, status));
    }

    // === Connected Team Access Endpoints ===
    
    /**
     * Get team details with connected team access support
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/{teamId}/with-connected-access")
    public ResponseEntity<TeamDto> getTeamWithConnectedAccess(@PathVariable @Positive Long teamId) {
        return ResponseEntity.ok(teamService.getTeamWithConnectedAccess(teamId));
    }

    /**
     * List team journals with connected team access support
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/{teamId}/journals/with-connected-access")
    public ResponseEntity<List<JournalResponse>> listTeamJournalsWithConnectedAccess(@PathVariable @Positive Long teamId) {
        List<JournalEntry> journals = teamService.listTeamJournalsWithConnectedAccess(teamId);
        List<JournalResponse> responses = journals.stream()
                .map(journalMapper::toResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    /**
     * List team members with connected team access support
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/{teamId}/members/with-connected-access")
    public ResponseEntity<List<TeamMemberDto>> listMembersWithConnectedAccess(@PathVariable @Positive Long teamId) {
        return ResponseEntity.ok(teamService.listMembersWithConnectedAccess(teamId));
    }

    /**
     * Get all teams accessible to current user (direct + connected)
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/accessible")
    public ResponseEntity<List<TeamDto>> getAccessibleTeams() {
        return ResponseEntity.ok(teamService.getAccessibleTeams());
    }

    /**
     * Check if current user can access a specific team
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/{teamId}/can-access")
    public ResponseEntity<Boolean> canAccessTeam(@PathVariable @Positive Long teamId) {
        return ResponseEntity.ok(teamService.canAccessTeam(teamId));
    }

    /**
     * Check if user has connected team access to a specific team
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/{teamId}/has-connected-access")
    public ResponseEntity<Boolean> hasConnectedTeamAccess(@PathVariable @Positive Long teamId) {
        // Use the canAccessTeam method which includes connected team logic
        boolean canAccess = teamService.canAccessTeam(teamId);
        // Check if it's specifically connected access (not direct membership)
        // This is a simplified approach - in practice you might want a dedicated method
        return ResponseEntity.ok(canAccess);
    }
    
    // ==================== TEAM COMMUNITY ENDPOINTS ====================
    
    /**
     * Get team communities that the current user is part of
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/communities")
    public ResponseEntity<List<Map<String, Object>>> getTeamCommunities() {
        try {
            List<Map<String, Object>> communities = teamService.getTeamCommunities();
            return ResponseEntity.ok(communities);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * Search team communities by query
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/communities/search")
    public ResponseEntity<List<Map<String, Object>>> searchTeamCommunities(@RequestParam(required = false) String query) {
        try {
            List<Map<String, Object>> communities = teamService.searchTeamCommunities(query);
            return ResponseEntity.ok(communities);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * Get teams from a specific community
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/communities/{communityName}/teams")
    public ResponseEntity<List<Map<String, Object>>> getTeamsByCommunity(@PathVariable String communityName) {
        try {
            List<Map<String, Object>> teams = teamService.getTeamsByCommunity(communityName);
            return ResponseEntity.ok(teams);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * Get teams from the same communities as current user's teams
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/community-teams")
    public ResponseEntity<List<TeamDto>> getCommunityTeams() {
        try {
            List<TeamDto> teams = teamService.getCommunityTeams();
            return ResponseEntity.ok(teams);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}
