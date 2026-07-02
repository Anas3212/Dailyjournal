package com.dailyjournal.repository;

import com.dailyjournal.entity.JournalReaction;
import com.dailyjournal.entity.ReactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface JournalReactionRepository extends JpaRepository<JournalReaction, Long> {

    Optional<JournalReaction> findByJournal_IdAndUser_Id(Long journalId, Long userId);

    long countByJournal_Id(Long journalId);

    long countByJournal_IdAndType(Long journalId, ReactionType type);

    @Query("SELECT r.type FROM JournalReaction r WHERE r.journal.id = :journalId AND r.user.id = :userId")
    ReactionType findUserReaction(@Param("journalId") Long journalId, @Param("userId") Long userId);
}
