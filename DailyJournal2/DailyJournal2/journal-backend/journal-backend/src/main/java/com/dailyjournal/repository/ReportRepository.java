package com.dailyjournal.repository;

import com.dailyjournal.entity.Report;
import com.dailyjournal.entity.Report.ReportStatus;
import com.dailyjournal.entity.User;
import com.dailyjournal.entity.JournalEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    // Find all reports by status
    Page<Report> findByStatusOrderByCreatedAtDesc(ReportStatus status, Pageable pageable);

    // Find all reports for a specific journal
    List<Report> findByReportedJournalOrderByCreatedAtDesc(JournalEntry journal);
    
    // Find all reports for a specific journal by ID
    List<Report> findByReportedJournalIdOrderByCreatedAtDesc(Long journalId);

    // Find all reports by a specific reporter
    Page<Report> findByReporterOrderByCreatedAtDesc(User reporter, Pageable pageable);

    // Find all reports against a specific user
    Page<Report> findByReportedUserOrderByCreatedAtDesc(User reportedUser, Pageable pageable);

    // Check if a user has already reported a specific journal
    Optional<Report> findByReporterAndReportedJournal(User reporter, JournalEntry journal);

    // Find reports by status and created date range
    @Query("SELECT r FROM Report r WHERE r.status = :status AND r.createdAt BETWEEN :startDate AND :endDate ORDER BY r.createdAt DESC")
    Page<Report> findByStatusAndDateRange(
            @Param("status") ReportStatus status,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    // Find pending reports older than specified days
    @Query("SELECT r FROM Report r WHERE r.status = 'PENDING' AND r.createdAt < :cutoffDate ORDER BY r.createdAt DESC")
    List<Report> findPendingReportsOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);

    // Count reports by status
    long countByStatus(ReportStatus status);

    // Count reports for a specific journal
    long countByReportedJournal(JournalEntry journal);

    // Count reports by a specific user (as reporter)
    long countByReporter(User reporter);

    // Count reports against a specific user
    long countByReportedUser(User reportedUser);

    // Find reports reviewed by a specific admin
    Page<Report> findByReviewedByOrderByReviewedAtDesc(User admin, Pageable pageable);

    // Find reports by multiple statuses
    @Query("SELECT r FROM Report r WHERE r.status IN :statuses ORDER BY r.createdAt DESC")
    Page<Report> findByStatusIn(@Param("statuses") List<ReportStatus> statuses, Pageable pageable);

    // Get report statistics
    @Query("SELECT r.status, COUNT(r) FROM Report r GROUP BY r.status")
    List<Object[]> getReportStatistics();

    // Find recent reports (last N days)
    @Query("SELECT r FROM Report r WHERE r.createdAt >= :sinceDate ORDER BY r.createdAt DESC")
    Page<Report> findRecentReports(@Param("sinceDate") LocalDateTime sinceDate, Pageable pageable);

    // Find all reports ordered by creation date
    Page<Report> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
