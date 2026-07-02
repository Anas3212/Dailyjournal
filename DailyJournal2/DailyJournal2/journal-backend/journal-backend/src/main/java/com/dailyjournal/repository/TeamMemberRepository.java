package com.dailyjournal.repository;

import com.dailyjournal.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findByTeam_Id(Long teamId);

    @Query("SELECT CASE WHEN COUNT(tm) > 0 THEN true ELSE false END FROM TeamMember tm WHERE tm.team.id = :teamId AND tm.user.id = :userId")
    boolean isUserInTeam(@Param("teamId") Long teamId, @Param("userId") Long userId);

    @Query("SELECT tm FROM TeamMember tm WHERE tm.team.id = :teamId AND tm.user.id = :userId")
    Optional<TeamMember> findByTeamIdAndUserId(@Param("teamId") Long teamId, @Param("userId") Long userId);

    @Query("SELECT tm.team.id FROM TeamMember tm WHERE tm.user.id = :userId")
    List<Long> findTeamIdsByUserId(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(tm) FROM TeamMember tm WHERE tm.team.id = :teamId")
    Integer countByTeam_Id(@Param("teamId") Long teamId);
    
    @Modifying
    @Query("DELETE FROM TeamMember tm WHERE tm.team.id = :teamId")
    void deleteByTeamId(@Param("teamId") Long teamId);

    // Find MASTER members for a team among a given list of user IDs
    @Query("SELECT tm FROM TeamMember tm WHERE tm.team.id = :teamId AND tm.role = com.dailyjournal.entity.TeamMember.Role.MASTER AND tm.user.id IN :userIds")
    List<TeamMember> findMasterMembersByTeamAndUserIds(@Param("teamId") Long teamId, @Param("userIds") List<Long> userIds);
    
    // Find all team memberships for a user
    @Query("SELECT tm FROM TeamMember tm WHERE tm.user.id = :userId")
    List<TeamMember> findByUserId(@Param("userId") Long userId);
}
