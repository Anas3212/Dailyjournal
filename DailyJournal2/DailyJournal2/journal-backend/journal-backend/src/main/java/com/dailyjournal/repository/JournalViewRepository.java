package com.dailyjournal.repository;

import com.dailyjournal.entity.JournalView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

public interface JournalViewRepository extends JpaRepository<JournalView, Long> {

    boolean existsByJournal_IdAndUser_IdAndViewDate(Long journalId, Long userId, LocalDate viewDate);

    long countByJournal_Id(Long journalId);

    @Query("SELECT COUNT(DISTINCT v.user.id) FROM JournalView v WHERE v.journal.id = :journalId")
    long countUniqueUsers(@Param("journalId") Long journalId);
}
