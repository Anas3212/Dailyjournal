package com.dailyjournal.repository;

import com.dailyjournal.entity.JournalEditor;
import com.dailyjournal.entity.JournalEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JournalEditorRepository extends JpaRepository<JournalEditor, Long> {

    /**
     * Find all active journal editors for a specific journal
     */
    @Query("SELECT je FROM JournalEditor je WHERE je.journal.id = :journalId AND je.isActive = true")
    List<JournalEditor> findActiveEditorsByJournalId(@Param("journalId") Long journalId);

    /**
     * Find all active journals that a user can edit
     */
    @Query("SELECT je FROM JournalEditor je WHERE je.user.id = :userId AND je.isActive = true")
    List<JournalEditor> findActiveJournalsByUserId(@Param("userId") Long userId);

    /**
     * Check if a user is assigned as editor for a specific journal
     */
    @Query("SELECT je FROM JournalEditor je WHERE je.journal.id = :journalId AND je.user.id = :userId AND je.isActive = true")
    Optional<JournalEditor> findActiveEditorByJournalAndUser(@Param("journalId") Long journalId, @Param("userId") Long userId);

    /**
     * Find all journal editors assigned by a specific user (team master)
     */
    @Query("SELECT je FROM JournalEditor je WHERE je.assignedBy.id = :assignedByUserId AND je.isActive = true")
    List<JournalEditor> findActiveEditorsByAssignedBy(@Param("assignedByUserId") Long assignedByUserId);

    /**
     * Find all journal editors for a specific team's journals
     */
    @Query("SELECT je FROM JournalEditor je WHERE je.journal.team.id = :teamId AND je.isActive = true")
    List<JournalEditor> findActiveEditorsByTeamId(@Param("teamId") Long teamId);

    /**
     * Find paginated journal editors for a specific team
     */
    @Query("SELECT je FROM JournalEditor je WHERE je.journal.team.id = :teamId AND je.isActive = true")
    Page<JournalEditor> findActiveEditorsByTeamId(@Param("teamId") Long teamId, Pageable pageable);

    /**
     * Check if any editor assignment exists for a journal and user (active or inactive)
     */
    @Query("SELECT je FROM JournalEditor je WHERE je.journal.id = :journalId AND je.user.id = :userId")
    Optional<JournalEditor> findEditorByJournalAndUser(@Param("journalId") Long journalId, @Param("userId") Long userId);

    /**
     * Count active editors for a journal
     */
    @Query("SELECT COUNT(je) FROM JournalEditor je WHERE je.journal.id = :journalId AND je.isActive = true")
    Long countActiveEditorsByJournalId(@Param("journalId") Long journalId);

    /**
     * Find all journals where user is assigned as editor (with journal details)
     */
    @Query("SELECT je.journal FROM JournalEditor je WHERE je.user.id = :userId AND je.isActive = true")
    List<JournalEntry> findEditableJournalsByUserId(@Param("userId") Long userId);

    /**
     * Remove all editor assignments for a journal (soft delete by setting isActive = false)
     */
    @Query("UPDATE JournalEditor je SET je.isActive = false WHERE je.journal.id = :journalId")
    void deactivateAllEditorsByJournalId(@Param("journalId") Long journalId);

    /**
     * Remove specific editor assignment (soft delete)
     */
    @Query("UPDATE JournalEditor je SET je.isActive = false WHERE je.journal.id = :journalId AND je.user.id = :userId")
    void deactivateEditorByJournalAndUser(@Param("journalId") Long journalId, @Param("userId") Long userId);
}
