package com.dailyjournal.controller;

import com.dailyjournal.dto.TeamConnectionDto;
import com.dailyjournal.entity.TeamConnection;
import com.dailyjournal.entity.TeamConnection.TeamConnectionStatus;
import com.dailyjournal.service.TeamConnectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teams/{teamId}/connections")
@RequiredArgsConstructor
public class TeamConnectionController {

    private final TeamConnectionService teamConnectionService;

    /**
     * Request connection to another team
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Map<String, String>> requestConnection(
            @PathVariable Long teamId,
            @RequestBody ConnectionRequest request) {
        String result = teamConnectionService.requestConnectionFromTeam(teamId, request.targetTeamId, request.message);
        return ResponseEntity.ok(Map.of("message", result));
    }

    /**
     * Respond to a connection request (accept/reject)
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PutMapping("/{connectionId}")
    public ResponseEntity<Map<String, String>> respondToConnection(
            @PathVariable Long teamId,
            @PathVariable Long connectionId,
            @RequestBody ConnectionResponse response) {
        String result = teamConnectionService.respondToConnection(connectionId, response.accept);
        return ResponseEntity.ok(Map.of("message", result));
    }

    /**
     * Remove/disconnect teams
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @DeleteMapping("/{connectionId}")
    public ResponseEntity<Map<String, String>> removeConnection(
            @PathVariable Long teamId,
            @PathVariable Long connectionId) {
        String result = teamConnectionService.removeConnection(connectionId);
        return ResponseEntity.ok(Map.of("message", result));
    }

    /**
     * Remove/disconnect teams by connected team ID
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @DeleteMapping("/team/{connectedTeamId}")
    public ResponseEntity<Map<String, String>> disconnectTeam(
            @PathVariable Long teamId,
            @PathVariable Long connectedTeamId) {
        String result = teamConnectionService.disconnectByTeamIds(teamId, connectedTeamId);
        return ResponseEntity.ok(Map.of("message", result));
    }

    /**
     * Get all connections for a team (paginated)
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<Page<TeamConnectionDto>> getConnections(
            @PathVariable Long teamId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<TeamConnectionDto> connections = teamConnectionService.getTeamConnections(teamId, pageable);
        return ResponseEntity.ok(connections);
    }

    /**
     * Get connections by status for a team
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/status/{status}")
    public ResponseEntity<Page<TeamConnection>> getTeamConnectionsByStatus(
            @PathVariable Long teamId,
            @PathVariable TeamConnectionStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<TeamConnection> connections = teamConnectionService.getTeamConnectionsByStatus(teamId, status, pageable);
        return ResponseEntity.ok(connections);
    }

    /**
     * Get pending connection requests for a team
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/pending")
    public ResponseEntity<List<TeamConnection>> getPendingRequests(@PathVariable Long teamId) {
        List<TeamConnection> pending = teamConnectionService.getPendingRequests(teamId);
        return ResponseEntity.ok(pending);
    }

    /**
     * Get connected teams
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/connected")
    public ResponseEntity<List<TeamConnection>> getConnectedTeams(@PathVariable Long teamId) {
        List<TeamConnection> connected = teamConnectionService.getConnectedTeams(teamId);
        return ResponseEntity.ok(connected);
    }

    /**
     * Get connection statistics for a team
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getConnectionStats(@PathVariable Long teamId) {
        Map<String, Long> stats = teamConnectionService.getConnectionStats(teamId);
        return ResponseEntity.ok(stats);
    }

    /**
     * Get user's teams where they can request connections (MASTER/ADMIN role)
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/eligible-teams")
    public ResponseEntity<List<Map<String, Object>>> getEligibleTeamsForConnection() {
        List<Map<String, Object>> teams = teamConnectionService.getEligibleTeamsForConnection();
        return ResponseEntity.ok(teams);
    }

    /**
     * Check if two teams are connected
     */
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/check/{otherTeamId}")
    public ResponseEntity<Map<String, Boolean>> checkConnection(
            @PathVariable Long teamId,
            @PathVariable Long otherTeamId) {
        boolean connected = teamConnectionService.areTeamsConnected(teamId, otherTeamId);
        return ResponseEntity.ok(Map.of("connected", connected));
    }

    // DTOs for request/response
    public static class ConnectionRequest {
        public Long targetTeamId;
        public String message;
    }

    public static class ConnectionResponse {
        public boolean accept;
    }
}
