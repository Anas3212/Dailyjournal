package com.dailyjournal.service;

import com.dailyjournal.dto.ReportRequest;
import com.dailyjournal.dto.ReportResponse;
import com.dailyjournal.dto.ReportUpdateRequest;
import com.dailyjournal.entity.Report;
import com.dailyjournal.entity.Report.ReportStatus;
import com.dailyjournal.entity.JournalEntry;
import com.dailyjournal.entity.User;
import com.dailyjournal.repository.ReportRepository;
import com.dailyjournal.repository.JournalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReportService {

    private final ReportRepository reportRepository;
    private final JournalRepository journalRepository;

    public ReportResponse createReport(ReportRequest request) {
        User reporter = getCurrentUser();
        
        // Get the journal being reported
        JournalEntry journal = journalRepository.findById(request.getJournalId())
                .orElseThrow(() -> new RuntimeException("Journal not found"));

        // Check if user has already reported this journal
        Optional<Report> existingReport = reportRepository.findByReporterAndReportedJournal(reporter, journal);
        if (existingReport.isPresent()) {
            // Return the existing report instead of throwing an error
            return convertToResponse(existingReport.get());
        }

        // Users cannot report their own journals
        if (journal.getUser().getId().equals(reporter.getId())) {
            throw new RuntimeException("You cannot report your own journal");
        }

        // Create the report
        Report report = Report.builder()
                .reporter(reporter)
                .reportedJournal(journal)
                .reportedUser(journal.getUser())
                .reason(request.getReason())
                .description(request.getDescription())
                .status(ReportStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        report = reportRepository.save(report);
        log.info("Report created: ID={}, Reporter={}, Journal={}, Reason={}", 
                report.getId(), reporter.getEmail(), journal.getId(), request.getReason());

        return convertToResponse(report);
    }

    public void deleteReport(Long reportId) {
        User currentUser = getCurrentUser();
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        
        // Only allow users to delete their own reports
        if (!report.getReporter().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only delete your own reports");
        }
        
        reportRepository.delete(report);
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> getReportsForJournal(Long journalId) {
        User currentUser = getCurrentUser();
        
        // Verify that the current user is the owner of the journal
        JournalEntry journal = journalRepository.findById(journalId)
                .orElseThrow(() -> new RuntimeException("Journal not found"));
        
        if (!journal.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only view reports for your own journals");
        }
        
        List<Report> reports = reportRepository.findByReportedJournalIdOrderByCreatedAtDesc(journalId);
        return reports.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<ReportResponse> getAllReports(Pageable pageable) {
        requireAdminRole();
        return reportRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::convertToResponse);
    }

    @Transactional(readOnly = true)
    public Page<ReportResponse> getReportsByStatus(ReportStatus status, Pageable pageable) {
        requireAdminRole();
        return reportRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                .map(this::convertToResponse);
    }

    @Transactional(readOnly = true)
    public ReportResponse getReportById(Long id) {
        requireAdminRole();
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found"));
        return convertToResponse(report);
    }

    public ReportResponse updateReportStatus(Long id, ReportUpdateRequest request) {
        requireAdminRole();
        User admin = getCurrentUser();
        
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Report not found"));

        report.setStatus(request.getStatus());
        report.setAdminNotes(request.getAdminNotes());
        report.setReviewedAt(LocalDateTime.now());
        report.setReviewedBy(admin);

        Report updatedReport = reportRepository.save(report);
        log.info("Report updated: ID={}, Status={}, Admin={}", 
                id, request.getStatus(), admin.getEmail());

        return convertToResponse(updatedReport);
    }

    @Transactional(readOnly = true)
    public Page<ReportResponse> getMyReports(Pageable pageable) {
        User user = getCurrentUser();
        return reportRepository.findByReporterOrderByCreatedAtDesc(user, pageable)
                .map(this::convertToResponse);
    }

    @Transactional(readOnly = true)
    public ReportResponse getMyReportForJournal(Long journalId) {
        User reporter = getCurrentUser();
        JournalEntry journal = journalRepository.findById(journalId)
                .orElseThrow(() -> new RuntimeException("Journal not found"));
        
        Optional<Report> existingReport = reportRepository.findByReporterAndReportedJournal(reporter, journal);
        return existingReport.map(this::convertToResponse).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<ReportResponse> getReportsForJournalAdmin(Long journalId) {
        requireAdminRole();
        JournalEntry journal = journalRepository.findById(journalId)
                .orElseThrow(() -> new RuntimeException("Journal not found"));
        
        return reportRepository.findByReportedJournalOrderByCreatedAtDesc(journal)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getReportCount(ReportStatus status) {
        requireAdminRole();
        if (status == null) {
            return reportRepository.count();
        }
        return reportRepository.countByStatus(status);
    }

    private ReportResponse convertToResponse(Report report) {
        return ReportResponse.builder()
                .id(report.getId())
                .reporterId(report.getReporter().getId())
                .reporterName(report.getReporter().getName())
                .reporterEmail(report.getReporter().getEmail())
                .reportedJournalId(report.getReportedJournal().getId())
                .reportedJournalTitle(report.getReportedJournal().getTitle())
                .reportedUserId(report.getReportedUser().getId())
                .reportedUserName(report.getReportedUser().getName())
                .reportedUserEmail(report.getReportedUser().getEmail())
                .reason(report.getReason())
                .reasonDisplayName(report.getReason().getDisplayName())
                .description(report.getDescription())
                .status(report.getStatus())
                .statusDisplayName(report.getStatus().getDisplayName())
                .createdAt(report.getCreatedAt())
                .reviewedAt(report.getReviewedAt())
                .reviewedById(report.getReviewedBy() != null ? report.getReviewedBy().getId() : null)
                .reviewedByName(report.getReviewedBy() != null ? report.getReviewedBy().getName() : null)
                .adminNotes(report.getAdminNotes())
                .build();
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Object principal = auth.getPrincipal();
        if (principal instanceof User user) return user;
        throw new RuntimeException("User not found");
    }

    private void requireAdminRole() {
        User user = getCurrentUser();
        boolean isAdmin = user.getRoles().stream()
                .anyMatch(role -> "ADMIN".equals(role.getName()));
        
        if (!isAdmin) {
            throw new RuntimeException("Admin access required");
        }
    }
}
