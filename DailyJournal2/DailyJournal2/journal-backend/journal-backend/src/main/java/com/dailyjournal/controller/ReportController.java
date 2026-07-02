package com.dailyjournal.controller;

import com.dailyjournal.dto.ReportRequest;
import com.dailyjournal.dto.ReportResponse;
import com.dailyjournal.dto.ReportUpdateRequest;
import com.dailyjournal.entity.Report.ReportStatus;
import com.dailyjournal.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createReport(@Valid @RequestBody ReportRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            ReportResponse reportResponse = reportService.createReport(request);
            response.put("success", true);
            response.put("message", "Report submitted successfully");
            response.put("data", reportResponse);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error creating report: {}", e.getMessage());
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> getMyReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Map<String, Object> response = new HashMap<>();
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<ReportResponse> reports = reportService.getMyReports(pageable);
            response.put("success", true);
            response.put("data", reports);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error getting user reports: {}", e.getMessage());
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) ReportStatus status) {
        Map<String, Object> response = new HashMap<>();
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<ReportResponse> reports;
            
            if (status != null) {
                reports = reportService.getReportsByStatus(status, pageable);
            } else {
                reports = reportService.getAllReports(pageable);
            }
            
            response.put("success", true);
            response.put("data", reports);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error getting all reports: {}", e.getMessage());
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }
    }

    @GetMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getReportById(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            ReportResponse report = reportService.getReportById(id);
            response.put("success", true);
            response.put("data", report);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error getting report by ID: {}", e.getMessage());
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> updateReportStatus(
            @PathVariable Long id,
            @Valid @RequestBody ReportUpdateRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            ReportResponse reportResponse = reportService.updateReportStatus(id, request);
            response.put("success", true);
            response.put("message", "Report status updated successfully");
            response.put("data", reportResponse);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error updating report status: {}", e.getMessage());
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/admin/journal/{journalId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getReportsForJournal(@PathVariable Long journalId) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<ReportResponse> reports = reportService.getReportsForJournal(journalId);
            response.put("success", true);
            response.put("data", reports);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error getting reports for journal: {}", e.getMessage());
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getReportStats() {
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> stats = new HashMap<>();
            stats.put("total", reportService.getReportCount(null));
            stats.put("pending", reportService.getReportCount(ReportStatus.PENDING));
            stats.put("underReview", reportService.getReportCount(ReportStatus.UNDER_REVIEW));
            stats.put("resolved", reportService.getReportCount(ReportStatus.RESOLVED));
            stats.put("dismissed", reportService.getReportCount(ReportStatus.DISMISSED));
            stats.put("escalated", reportService.getReportCount(ReportStatus.ESCALATED));
            
            response.put("success", true);
            response.put("data", stats);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error getting report stats: {}", e.getMessage());
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }
    }

    @GetMapping("/reasons")
    public ResponseEntity<Map<String, Object>> getReportReasons() {
        Map<String, Object> response = new HashMap<>();
        
        List<Map<String, String>> reasons = List.of(
            Map.of("value", "INAPPROPRIATE_CONTENT", "label", "Inappropriate Content"),
            Map.of("value", "SPAM", "label", "Spam"),
            Map.of("value", "HARASSMENT", "label", "Harassment"),
            Map.of("value", "HATE_SPEECH", "label", "Hate Speech"),
            Map.of("value", "VIOLENCE", "label", "Violence or Threats"),
            Map.of("value", "PRIVACY_VIOLATION", "label", "Privacy Violation"),
            Map.of("value", "COPYRIGHT_INFRINGEMENT", "label", "Copyright Infringement"),
            Map.of("value", "MISINFORMATION", "label", "Misinformation"),
            Map.of("value", "OTHER", "label", "Other")
        );
        
        response.put("data", reasons);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/journal/{journalId}")
    public ResponseEntity<ReportResponse> getMyReportForJournal(@PathVariable Long journalId) {
        try {
            ReportResponse report = reportService.getMyReportForJournal(journalId);
            return ResponseEntity.ok(report);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{reportId}")
    public ResponseEntity<Void> deleteMyReport(@PathVariable Long reportId) {
        try {
            reportService.deleteReport(reportId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/my-journal/{journalId}")
    public ResponseEntity<List<ReportResponse>> getReportsForMyJournal(@PathVariable Long journalId) {
        try {
            List<ReportResponse> reports = reportService.getReportsForJournal(journalId);
            return ResponseEntity.ok(reports);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteReportAdmin(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            // This would be implemented if needed - for now just return not implemented
            response.put("success", false);
            response.put("message", "Delete functionality not implemented");
            return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(response);
        } catch (Exception e) {
            log.error("Error deleting report: {}", e.getMessage());
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
