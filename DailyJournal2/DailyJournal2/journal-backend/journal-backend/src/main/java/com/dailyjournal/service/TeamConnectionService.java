package com.dailyjournal.service;

import com.dailyjournal.dto.TeamConnectionDto;
import com.dailyjournal.entity.Team;
import com.dailyjournal.entity.TeamConnection;
import com.dailyjournal.entity.TeamConnection.TeamConnectionStatus;
import com.dailyjournal.entity.TeamMember;
import com.dailyjournal.entity.User;
import com.dailyjournal.repository.TeamConnectionRepository;
import com.dailyjournal.repository.TeamMemberRepository;
import com.dailyjournal.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TeamConnectionService {

    private final TeamConnectionRepository teamConnectionRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Object principal = auth.getPrincipal();
        if (principal instanceof User user) return user;
        throw new RuntimeException("Unauthorized");
    }

    /**
     * Request a connection between teams (auto-select requester team)
     */
    public String requestConnection(Long targetTeamId, String message) {
        User current = getCurrentUser();
        
        // Find team IDs where current user is a member
        List<Long> teamIds = teamMemberRepository.findTeamIdsByUserId(current.getId());
        if (teamIds.isEmpty()) {
            throw new RuntimeException("You must be a member of a team to request connections");
        }
        
        // Find a team where current user is MASTER or ADMIN
        TeamMember requesterTeamMember = null;
        for (Long teamId : teamIds) {
            Optional<TeamMember> memberOpt = teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId());
            if (memberOpt.isPresent() && 
                (memberOpt.get().getRole() == TeamMember.Role.MASTER || 
                 memberOpt.get().getRole() == TeamMember.Role.ADMIN)) {
                requesterTeamMember = memberOpt.get();
                break;
            }
        }
        
        if (requesterTeamMember == null) {
            throw new RuntimeException("You must be a MASTER or ADMIN of a team to request connections");
        }
        
        Team requesterTeam = requesterTeamMember.getTeam();
        return requestConnectionFromTeam(requesterTeam.getId(), targetTeamId, message);
    }

    /**
     * Request a connection from a specific team
     */
    public String requestConnectionFromTeam(Long requesterTeamId, Long targetTeamId, String message) {
        User current = getCurrentUser();
        
        // Verify user is MASTER or ADMIN of the requester team
        TeamMember requesterTeamMember = teamMemberRepository.findByTeamIdAndUserId(requesterTeamId, current.getId())
                .orElseThrow(() -> new RuntimeException("You are not a member of this team"));
        
        if (requesterTeamMember.getRole() != TeamMember.Role.MASTER && 
            requesterTeamMember.getRole() != TeamMember.Role.ADMIN) {
            throw new RuntimeException("You must be a MASTER or ADMIN to request connections");
        }
        
        Team requesterTeam = teamRepository.findById(requesterTeamId)
                .orElseThrow(() -> new RuntimeException("Requester team not found"));
        Team targetTeam = teamRepository.findById(targetTeamId)
                .orElseThrow(() -> new RuntimeException("Target team not found"));
        
        // Cannot connect to own team
        if (requesterTeam.getId().equals(targetTeamId)) {
            throw new RuntimeException("Cannot connect to your own team");
        }
        
        // Check if connection already exists
        Optional<TeamConnection> existing = teamConnectionRepository
                .findConnectionBetweenTeams(requesterTeam.getId(), targetTeamId);
        
        if (existing.isPresent()) {
            TeamConnection conn = existing.get();
            if (conn.getStatus() == TeamConnectionStatus.PENDING) {
                return "Connection request already pending";
            } else if (conn.getStatus() == TeamConnectionStatus.ACCEPTED) {
                return "Teams are already connected";
            } else {
                // Update rejected connection to pending
                conn.setStatus(TeamConnectionStatus.PENDING);
                conn.setRequesterTeam(requesterTeam);
                conn.setTargetTeam(targetTeam);
                conn.setCreatedBy(current);
                conn.setMessage(message);
                teamConnectionRepository.save(conn);
                return "Connection request sent";
            }
        }
        
        // Create new connection request
        TeamConnection connection = TeamConnection.builder()
                .requesterTeam(requesterTeam)
                .targetTeam(targetTeam)
                .createdBy(current)
                .status(TeamConnectionStatus.PENDING)
                .message(message)
                .build();
        
        teamConnectionRepository.save(connection);
        return "Connection request sent";
    }

    /**
     * Respond to a connection request (accept/reject)
     */
    public String respondToConnection(Long connectionId, boolean accept) {
        User current = getCurrentUser();
        TeamConnection connection = teamConnectionRepository.findById(connectionId)
                .orElseThrow(() -> new RuntimeException("Connection request not found"));
        
        if (connection.getStatus() != TeamConnectionStatus.PENDING) {
            throw new RuntimeException("Connection request is not pending");
        }
        
        // Only MASTER or ADMIN of target team can respond
        TeamMember targetTeamMember = teamMemberRepository
                .findByTeamIdAndUserId(connection.getTargetTeam().getId(), current.getId())
                .orElseThrow(() -> new RuntimeException("You are not a member of the target team"));
        
        if (targetTeamMember.getRole() != TeamMember.Role.MASTER && 
            targetTeamMember.getRole() != TeamMember.Role.ADMIN) {
            throw new RuntimeException("Only MASTER or ADMIN can respond to connection requests");
        }
        
        connection.setStatus(accept ? TeamConnectionStatus.ACCEPTED : TeamConnectionStatus.REJECTED);
        teamConnectionRepository.save(connection);
        
        return accept ? "Connection accepted" : "Connection rejected";
    }

    /**
     * Remove/disconnect teams by team IDs
     */
    public String disconnectByTeamIds(Long teamId, Long connectedTeamId) {
        // Find the connection between the two teams
        Optional<TeamConnection> connection = teamConnectionRepository
                .findConnectionBetweenTeams(teamId, connectedTeamId);
        
        if (connection.isEmpty()) {
            throw new RuntimeException("Connection not found");
        }
        
        return removeConnection(connection.get().getId());
    }

    /**
     * Remove/disconnect teams
     */
    public String removeConnection(Long connectionId) {
        User current = getCurrentUser();
        TeamConnection connection = teamConnectionRepository.findById(connectionId)
                .orElseThrow(() -> new RuntimeException("Connection not found"));
        
        // Only MASTER or ADMIN of either team can remove connection
        boolean canRemove = false;
        
        // Check if user is MASTER/ADMIN of requester team
        Optional<TeamMember> requesterMember = teamMemberRepository
                .findByTeamIdAndUserId(connection.getRequesterTeam().getId(), current.getId());
        if (requesterMember.isPresent() && 
            (requesterMember.get().getRole() == TeamMember.Role.MASTER || 
             requesterMember.get().getRole() == TeamMember.Role.ADMIN)) {
            canRemove = true;
        }
        
        // Check if user is MASTER/ADMIN of target team
        Optional<TeamMember> targetMember = teamMemberRepository
                .findByTeamIdAndUserId(connection.getTargetTeam().getId(), current.getId());
        if (targetMember.isPresent() && 
            (targetMember.get().getRole() == TeamMember.Role.MASTER || 
             targetMember.get().getRole() == TeamMember.Role.ADMIN)) {
            canRemove = true;
        }
        
        if (!canRemove) {
            throw new RuntimeException("Only MASTER or ADMIN of connected teams can remove connections");
        }
        
        teamConnectionRepository.delete(connection);
        return "Connection removed";
    }

    /**
     * Get connections for a team with pagination
     */
    public Page<TeamConnectionDto> getTeamConnections(Long teamId, Pageable pageable) {
        User current = getCurrentUser();
        
        // Verify user is member of the team
        teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId())
                .orElseThrow(() -> new RuntimeException("You are not a member of this team"));
        
        Page<TeamConnection> connections = teamConnectionRepository.findAllConnectionsForTeam(teamId, pageable);
        List<TeamConnectionDto> dtos = connections.stream()
                .map(TeamConnectionDto::fromEntity)
                .collect(Collectors.toList());
        return new PageImpl<>(dtos, pageable, connections.getTotalElements());
    }

    /**
     * Get connections by status for a team
     */
    @Transactional(readOnly = true)
    public Page<TeamConnection> getTeamConnectionsByStatus(Long teamId, TeamConnectionStatus status, Pageable pageable) {
        User current = getCurrentUser();
        
        // Verify user is member of the team
        teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId())
                .orElseThrow(() -> new RuntimeException("You are not a member of this team"));
        
        return teamConnectionRepository.findConnectionsForTeamByStatus(teamId, status, pageable);
    }

    /**
     * Get pending connection requests for a team
     */
    @Transactional(readOnly = true)
    public List<TeamConnection> getPendingRequests(Long teamId) {
        User current = getCurrentUser();
        
        // Verify user is MASTER or ADMIN of the team
        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId())
                .orElseThrow(() -> new RuntimeException("You are not a member of this team"));
        
        if (member.getRole() != TeamMember.Role.MASTER && member.getRole() != TeamMember.Role.ADMIN) {
            throw new RuntimeException("Only MASTER or ADMIN can view pending requests");
        }
        
        return teamConnectionRepository.findPendingConnectionsForTeam(teamId);
    }

    /**
     * Get connected teams for a team
     */
    @Transactional(readOnly = true)
    public List<TeamConnection> getConnectedTeams(Long teamId) {
        User current = getCurrentUser();
        
        // Verify user is member of the team
        teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId())
                .orElseThrow(() -> new RuntimeException("You are not a member of this team"));
        
        return teamConnectionRepository.findConnectedTeams(teamId);
    }

    /**
     * Check if two teams are connected
     */
    @Transactional(readOnly = true)
    public boolean areTeamsConnected(Long teamId1, Long teamId2) {
        Optional<TeamConnection> connection = teamConnectionRepository
                .findConnectionBetweenTeams(teamId1, teamId2);
        return connection.isPresent() && connection.get().getStatus() == TeamConnectionStatus.ACCEPTED;
    }

    /**
     * Get connection statistics for a team
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getConnectionStats(Long teamId) {
        User current = getCurrentUser();
        
        // Verify user is member of the team
        teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId())
                .orElseThrow(() -> new RuntimeException("You are not a member of this team"));
        
        Long connectedCount = teamConnectionRepository.countConnectionsByStatus(teamId, TeamConnectionStatus.ACCEPTED);
        Long pendingCount = teamConnectionRepository.countConnectionsByStatus(teamId, TeamConnectionStatus.PENDING);
        
        return Map.of(
            "connectedCount", connectedCount,
            "pendingCount", pendingCount
        );
    }

    /**
     * Get user's teams where they have MASTER or ADMIN role (eligible for requesting connections)
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getEligibleTeamsForConnection() {
        User current = getCurrentUser();
        
        // Find team IDs where current user is a member
        List<Long> teamIds = teamMemberRepository.findTeamIdsByUserId(current.getId());
        
        return teamIds.stream()
                .map(teamId -> {
                    Optional<TeamMember> memberOpt = teamMemberRepository.findByTeamIdAndUserId(teamId, current.getId());
                    if (memberOpt.isPresent() && 
                        (memberOpt.get().getRole() == TeamMember.Role.MASTER || 
                         memberOpt.get().getRole() == TeamMember.Role.ADMIN)) {
                        
                        Team team = memberOpt.get().getTeam();
                        Map<String, Object> teamInfo = Map.of(
                            "id", team.getId(),
                            "name", team.getName(),
                            "role", memberOpt.get().getRole().toString()
                        );
                        return teamInfo;
                    }
                    return null;
                })
                .filter(team -> team != null)
                .collect(Collectors.toList());
    }

    public static class ConnectionStats {
        public final Long connectedCount;
        public final Long pendingCount;
        
        public ConnectionStats(Long connectedCount, Long pendingCount) {
            this.connectedCount = connectedCount;
            this.pendingCount = pendingCount;
        }
    }
}
