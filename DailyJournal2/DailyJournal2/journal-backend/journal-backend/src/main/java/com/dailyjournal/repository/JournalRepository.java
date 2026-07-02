package com.dailyjournal.repository;

import com.dailyjournal.entity.JournalEntry;
import com.dailyjournal.entity.JournalFolder;
import com.dailyjournal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface JournalRepository extends JpaRepository<JournalEntry, Long> {
    List<JournalEntry> findByUserId(Long userId);
    List<JournalEntry> findByUserIdAndMoodContainingIgnoreCase(Long userId, String mood);
    List<JournalEntry> findByUserIdAndTagsContainingIgnoreCase(Long userId, String tag);
    List<JournalEntry> findByUserIdAndDate(Long userId, LocalDate date);
    List<JournalEntry> findByUserIdOrderByDateAsc(Long userId);
    List<JournalEntry> findByUserIdOrderByDateDesc(Long userId);
    List<JournalEntry> findByUserIdAndDateBetween(Long userId, LocalDate start, LocalDate end);

    // Team journals
    List<JournalEntry> findByTeam_Id(Long teamId);

    // Media access: find journal by media filename
    @Query("SELECT je FROM JournalEntry je JOIN je.mediaPaths mp WHERE mp = :filename")
    Optional<JournalEntry> findByMediaFilename(@Param("filename") String filename);

    // ✅ Admin filter support
    List<JournalEntry> findByUser_NameContainingIgnoreCaseOrUser_EmailContainingIgnoreCase(String name, String email);

    @Query("""
    SELECT j FROM JournalEntry j 
    WHERE (:query IS NULL OR LOWER(j.user.name) LIKE LOWER(CONCAT('%', :query, '%')) 
                       OR LOWER(j.user.email) LIKE LOWER(CONCAT('%', :query, '%')))
      AND (:mood IS NULL OR LOWER(j.mood) LIKE LOWER(CONCAT('%', :mood, '%')))
      AND (:tags IS NULL OR LOWER(j.tags) LIKE LOWER(CONCAT('%', :tags, '%')))
      AND (:date IS NULL OR j.date = :date)
""")
    List<JournalEntry> searchAdminJournals(
            @Param("query") String query,
            @Param("mood") String mood,
            @Param("tags") String tags,
            @Param("date") LocalDate date
    );


    @Query("""
    SELECT j FROM JournalEntry j
    WHERE j.user.id = :userId
      
      AND (:mood IS NULL OR LOWER(j.mood) LIKE LOWER(CONCAT('%', :mood, '%')))
      AND (:tags IS NULL OR LOWER(j.tags) LIKE LOWER(CONCAT('%', :tags, '%')))
      AND (:date IS NULL OR j.date = :date)
      AND (
         :search IS NULL 
         OR LOWER(j.title) LIKE LOWER(CONCAT('%', :search, '%'))
         OR LOWER(j.tags) LIKE LOWER(CONCAT('%', :search, '%'))
      )
""")
    List<JournalEntry> filterUserJournals(
            @Param("userId") Long userId,
            @Param("search") String search,
            @Param("mood") String mood,
            @Param("tags") String tags,
            @Param("date") LocalDate date
    );

    // Public journals search (non-private only)
    @Query("""
    SELECT j FROM JournalEntry j
    WHERE j.user.id = :userId
      AND j.isPrivate = false
      AND (:mood IS NULL OR LOWER(j.mood) LIKE LOWER(CONCAT('%', :mood, '%')))
      AND (:tags IS NULL OR LOWER(j.tags) LIKE LOWER(CONCAT('%', :tags, '%')))
      AND (:date IS NULL OR j.date = :date)
      AND (
         :search IS NULL 
         OR LOWER(j.title) LIKE LOWER(CONCAT('%', :search, '%'))
         OR LOWER(j.tags) LIKE LOWER(CONCAT('%', :search, '%'))
      )
""")
    List<JournalEntry> filterPublicJournals(
            @Param("userId") Long userId,
            @Param("search") String search,
            @Param("mood") String mood,
            @Param("tags") String tags,
            @Param("date") LocalDate date
    );

    // Get only public journals for a user
    List<JournalEntry> findByUserIdAndIsPrivateFalse(Long userId);
    
    // Get public journals ordered by date
    List<JournalEntry> findByUserIdAndIsPrivateFalseOrderByDateDesc(Long userId);
    List<JournalEntry> findByUserIdAndIsPrivateFalseOrderByDateAsc(Long userId);
    
    // Get public journals by date range
    List<JournalEntry> findByUserIdAndIsPrivateFalseAndDateBetween(Long userId, LocalDate start, LocalDate end);
    
    // Published journals methods
    @Query("SELECT j FROM JournalEntry j JOIN FETCH j.user WHERE j.isPublished = true ORDER BY j.date DESC")
    List<JournalEntry> findByIsPublishedTrueOrderByDateDesc();
    
    @Query("SELECT j FROM JournalEntry j JOIN FETCH j.user WHERE j.isPublished = true")
    List<JournalEntry> findByIsPublishedTrue();
    
    // Search published journals
    @Query("""
    SELECT j FROM JournalEntry j JOIN FETCH j.user
    WHERE j.isPublished = true
      AND (:mood IS NULL OR LOWER(j.mood) LIKE LOWER(CONCAT('%', :mood, '%')))
      AND (:tags IS NULL OR LOWER(j.tags) LIKE LOWER(CONCAT('%', :tags, '%')))
      AND (:date IS NULL OR j.date = :date)
      AND (
         :search IS NULL 
         OR LOWER(j.title) LIKE LOWER(CONCAT('%', :search, '%'))
         OR j.content LIKE CONCAT('%', :search, '%')
         OR LOWER(j.tags) LIKE LOWER(CONCAT('%', :search, '%'))
         OR LOWER(j.user.name) LIKE LOWER(CONCAT('%', :search, '%'))
      )
    ORDER BY j.date DESC
""")
    List<JournalEntry> searchPublishedJournals(
            @Param("search") String search,
            @Param("mood") String mood,
            @Param("tags") String tags,
            @Param("date") LocalDate date
    );
    
    // Count team journals
    @Query("SELECT COUNT(j) FROM JournalEntry j WHERE j.team.id = :teamId")
    Integer countByTeam_Id(@Param("teamId") Long teamId);
    
    // Delete team journals
    @Modifying
    @Transactional
    @Query("DELETE FROM JournalEntry j WHERE j.team.id = :teamId")
    void deleteByTeamId(@Param("teamId") Long teamId);
    
    // Bulk ownership transfer methods for team ownership changes
    @Modifying
    @Transactional
    @Query("UPDATE JournalEntry j SET j.user.id = :newOwnerId WHERE j.team.id = :teamId")
    void transferTeamJournalsOwnership(@Param("teamId") Long teamId, @Param("newOwnerId") Long newOwnerId);
    
    // Alternative method name for backward compatibility
    @Query("SELECT COUNT(j) FROM JournalEntry j WHERE j.team.id = :teamId")
    Long countTeamJournals(@Param("teamId") Long teamId);
    
    @Query("SELECT j FROM JournalEntry j WHERE j.team.id = :teamId")
    List<JournalEntry> findTeamJournals(@Param("teamId") Long teamId);

    // Admin methods to fetch all journals that were ever published (including hidden ones)
    @Query("SELECT j FROM JournalEntry j JOIN FETCH j.user WHERE j.everPublished = true ORDER BY j.date DESC")
    List<JournalEntry> findAllEverPublishedJournalsForAdmin();
    
    // Search all ever-published journals for admin (including hidden ones)
    @Query("""
    SELECT j FROM JournalEntry j JOIN FETCH j.user
    WHERE j.everPublished = true
      AND (:mood IS NULL OR LOWER(j.mood) LIKE LOWER(CONCAT('%', :mood, '%')))
      AND (:tags IS NULL OR LOWER(j.tags) LIKE LOWER(CONCAT('%', :tags, '%')))
      AND (:date IS NULL OR j.date = :date)
      AND (
         :search IS NULL 
         OR LOWER(j.title) LIKE LOWER(CONCAT('%', :search, '%'))
         OR j.content LIKE CONCAT('%', :search, '%')
         OR LOWER(j.tags) LIKE LOWER(CONCAT('%', :search, '%'))
         OR LOWER(j.user.name) LIKE LOWER(CONCAT('%', :search, '%'))
      )
    ORDER BY j.date DESC
    """)
    List<JournalEntry> searchAllEverPublishedJournalsForAdmin(
            @Param("search") String search,
            @Param("mood") String mood,
            @Param("tags") String tags,
            @Param("date") LocalDate date
    );

    // Folder-related methods
    List<JournalEntry> findByFolder(JournalFolder folder);
    
    List<JournalEntry> findByFolderOrderByDateDesc(JournalFolder folder);
    
    Optional<JournalEntry> findByIdAndUser(Long id, User user);
    
    List<JournalEntry> findByUserAndFolderIsNullOrderByDateDesc(User user);
    
    List<JournalEntry> findByUserAndFolderOrderByDateDesc(User user, JournalFolder folder);
    
    // Count methods for performance
    Long countByFolder(JournalFolder folder);
    
    // Additional folder-related queries for better performance
    @Query("SELECT COUNT(j) FROM JournalEntry j WHERE j.user = :user AND j.folder IS NULL")
    Long countByUserAndFolderIsNull(@Param("user") User user);
    
    @Query("SELECT COUNT(j) FROM JournalEntry j WHERE j.user = :user AND j.folder = :folder")
    Long countByUserAndFolder(@Param("user") User user, @Param("folder") JournalFolder folder);

}
