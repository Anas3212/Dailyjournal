package com.dailyjournal.repository;

import com.dailyjournal.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;

public interface TeamRepository extends JpaRepository<Team, Long> {
    @Query("SELECT t FROM Team t WHERE t.owner.id = :ownerId")
    List<Team> findByOwnerId(@Param("ownerId") Long ownerId);
    
    // Count teams where user is a member
    @Query("SELECT COUNT(DISTINCT tm.team) FROM TeamMember tm WHERE tm.user.id = :userId")
    Long countByMembers_User_Id(@Param("userId") Long userId);
    
    // Get team journals stats for user's teams
    @Query("SELECT new map(t.name as teamName, t.id as teamId, COUNT(je) as journalCount) " +
           "FROM TeamMember tm " +
           "JOIN tm.team t " +
           "LEFT JOIN JournalEntry je ON je.team.id = t.id " +
           "WHERE tm.user.id = :userId " +
           "GROUP BY t.id, t.name")
    List<Map<String, Object>> findTeamJournalsStatsByUserId(@Param("userId") Long userId);

    // Find teams where the owner is in the provided friend IDs or any MASTER member is in those IDs
    @Query("SELECT DISTINCT t FROM Team t " +
           "LEFT JOIN TeamMember tm ON tm.team.id = t.id AND tm.role = com.dailyjournal.entity.TeamMember.Role.MASTER " +
           "WHERE t.owner.id IN :friendIds OR tm.user.id IN :friendIds")
    List<Team> findTeamsWhereFriendIsMaster(@Param("friendIds") List<Long> friendIds);
    
    // Find teams where user is owner or member
    @Query("SELECT DISTINCT t FROM Team t " +
           "LEFT JOIN TeamMember tm ON tm.team.id = t.id " +
           "WHERE t.owner.id = :userId OR tm.user.id = :userId")
    List<Team> findByOwnerIdOrMemberId(@Param("userId") Long userId);
    
    // Team Community Management Methods
    
    // Find teams by community (case-insensitive)
    List<Team> findByCommunityIgnoreCase(String community);
    
    // Find teams by community excluding specific team
    List<Team> findByCommunityIgnoreCaseAndIdNot(String community, Long teamId);
    
    // Count teams by community
    Long countByCommunityIgnoreCase(String community);
    
    // Find all distinct team communities
    @Query("SELECT DISTINCT t.community FROM Team t WHERE t.community IS NOT NULL AND t.community != ''")
    List<String> findDistinctTeamCommunities();
    
    // Find teams by community with member counts
    @Query("SELECT new map(t.id as teamId, t.name as teamName, t.community as community, " +
           "t.owner.name as ownerName, COUNT(tm) as memberCount) " +
           "FROM Team t " +
           "LEFT JOIN TeamMember tm ON tm.team.id = t.id " +
           "WHERE t.community IS NOT NULL AND LOWER(t.community) = LOWER(:community) " +
           "GROUP BY t.id, t.name, t.community, t.owner.name " +
           "ORDER BY t.name")
    List<Map<String, Object>> findTeamsByCommunityWithStats(@Param("community") String community);
    
    // Search teams by community pattern
    @Query("SELECT DISTINCT t FROM Team t WHERE t.community IS NOT NULL AND LOWER(t.community) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Team> searchTeamsByCommunity(@Param("query") String query);
}
