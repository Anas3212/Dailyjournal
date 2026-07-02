package com.dailyjournal.repository;

import com.dailyjournal.entity.TeamConnection;
import com.dailyjournal.entity.TeamConnection.TeamConnectionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TeamConnectionRepository extends JpaRepository<TeamConnection, Long> {
    
    // Find connection between two teams (either direction)
    @Query("SELECT tc FROM TeamConnection tc WHERE " +
           "(tc.requesterTeam.id = :teamId1 AND tc.targetTeam.id = :teamId2) OR " +
           "(tc.requesterTeam.id = :teamId2 AND tc.targetTeam.id = :teamId1)")
    Optional<TeamConnection> findConnectionBetweenTeams(@Param("teamId1") Long teamId1, @Param("teamId2") Long teamId2);
    
    // Find all connections for a team (both sent and received)
    @Query("SELECT tc FROM TeamConnection tc WHERE " +
           "tc.requesterTeam.id = :teamId OR tc.targetTeam.id = :teamId " +
           "ORDER BY tc.createdAt DESC")
    Page<TeamConnection> findAllConnectionsForTeam(@Param("teamId") Long teamId, Pageable pageable);
    
    // Find connections by status for a team
    @Query("SELECT tc FROM TeamConnection tc WHERE " +
           "(tc.requesterTeam.id = :teamId OR tc.targetTeam.id = :teamId) AND tc.status = :status " +
           "ORDER BY tc.createdAt DESC")
    Page<TeamConnection> findConnectionsForTeamByStatus(@Param("teamId") Long teamId, 
                                                       @Param("status") TeamConnectionStatus status, 
                                                       Pageable pageable);
    
    // Find pending connections received by a team
    @Query("SELECT tc FROM TeamConnection tc WHERE " +
           "tc.targetTeam.id = :teamId AND tc.status = 'PENDING' " +
           "ORDER BY tc.createdAt DESC")
    List<TeamConnection> findPendingConnectionsForTeam(@Param("teamId") Long teamId);
    
    // Find sent connections by a team
    @Query("SELECT tc FROM TeamConnection tc WHERE " +
           "tc.requesterTeam.id = :teamId " +
           "ORDER BY tc.createdAt DESC")
    Page<TeamConnection> findSentConnectionsByTeam(@Param("teamId") Long teamId, Pageable pageable);
    
    // Find accepted connections for a team (connected teams)
    @Query("SELECT tc FROM TeamConnection tc WHERE " +
           "(tc.requesterTeam.id = :teamId OR tc.targetTeam.id = :teamId) AND tc.status = 'ACCEPTED' " +
           "ORDER BY tc.updatedAt DESC")
    List<TeamConnection> findConnectedTeams(@Param("teamId") Long teamId);
    
    // Count connections by status for a team
    @Query("SELECT COUNT(tc) FROM TeamConnection tc WHERE " +
           "(tc.requesterTeam.id = :teamId OR tc.targetTeam.id = :teamId) AND tc.status = :status")
    Long countConnectionsByStatus(@Param("teamId") Long teamId, @Param("status") TeamConnectionStatus status);
    
    // Delete all connections for a team (used when deleting a team)
    @Modifying
    @Query("DELETE FROM TeamConnection tc WHERE tc.requesterTeam.id = :teamId OR tc.targetTeam.id = :teamId")
    void deleteByRequesterTeamIdOrTargetTeamId(@Param("teamId") Long teamId);
}
