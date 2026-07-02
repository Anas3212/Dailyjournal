package com.dailyjournal.repository;

import com.dailyjournal.entity.JournalFolder;
import com.dailyjournal.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JournalFolderRepository extends JpaRepository<JournalFolder, Long> {

    /**
     * Find all folders for a specific user
     */
    List<JournalFolder> findByUserOrderByCreatedAtDesc(User user);

    /**
     * Find all folders for a specific user with pagination
     */
    Page<JournalFolder> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    /**
     * Find folder by ID and user (for security)
     */
    Optional<JournalFolder> findByIdAndUser(Long id, User user);

    /**
     * Find folder by name and user (to prevent duplicates)
     */
    Optional<JournalFolder> findByNameAndUser(String name, User user);

    /**
     * Count folders for a user
     */
    long countByUser(User user);

    /**
     * Search folders by name for a user
     */
    @Query("SELECT f FROM JournalFolder f WHERE f.user = :user AND LOWER(f.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) ORDER BY f.createdAt DESC")
    List<JournalFolder> searchByNameAndUser(@Param("searchTerm") String searchTerm, @Param("user") User user);

    /**
     * Get folders with journal counts
     */
    @Query("SELECT f, COUNT(j) as journalCount FROM JournalFolder f LEFT JOIN f.journals j WHERE f.user = :user GROUP BY f ORDER BY f.createdAt DESC")
    List<Object[]> findFoldersWithJournalCounts(@Param("user") User user);

    /**
     * Find folders that have journals
     */
    @Query("SELECT DISTINCT f FROM JournalFolder f JOIN f.journals j WHERE f.user = :user ORDER BY f.createdAt DESC")
    List<JournalFolder> findFoldersWithJournals(@Param("user") User user);

    /**
     * Find empty folders (no journals)
     */
    @Query("SELECT f FROM JournalFolder f WHERE f.user = :user AND f.id NOT IN (SELECT DISTINCT j.folder.id FROM JournalEntry j WHERE j.folder IS NOT NULL) ORDER BY f.createdAt DESC")
    List<JournalFolder> findEmptyFolders(@Param("user") User user);
}
