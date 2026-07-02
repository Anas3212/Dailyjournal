package com.dailyjournal.repository;

import com.dailyjournal.entity.TeamInvite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TeamInviteRepository extends JpaRepository<TeamInvite, Long> {
    @Query("SELECT ti FROM TeamInvite ti WHERE ti.invitee.id = :userId AND ti.status = 'PENDING'")
    List<TeamInvite> findPendingInvitesForUser(@Param("userId") Long userId);

    @Query("SELECT ti FROM TeamInvite ti WHERE ti.team.id = :teamId")
    List<TeamInvite> findByTeamId(@Param("teamId") Long teamId);
    
    @Query("SELECT ti FROM TeamInvite ti WHERE ti.team.id = :teamId AND ti.invitee.id = :inviteeId AND ti.status = 'PENDING'")
    List<TeamInvite> findPendingInvitesByTeamAndInvitee(@Param("teamId") Long teamId, @Param("inviteeId") Long inviteeId);
    
    @Query("SELECT ti FROM TeamInvite ti WHERE ti.team.id = :teamId AND ti.invitee.id = :inviteeId")
    List<TeamInvite> findInvitesByTeamAndInvitee(@Param("teamId") Long teamId, @Param("inviteeId") Long inviteeId);
    
    @Modifying
    @Query("DELETE FROM TeamInvite ti WHERE ti.team.id = :teamId")
    void deleteByTeamId(@Param("teamId") Long teamId);
}
