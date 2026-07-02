package com.dailyjournal.dto;

import com.dailyjournal.entity.Report.ReportReason;
import com.dailyjournal.entity.Report.ReportStatus;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReportResponse {

    private Long id;
    private Long reporterId;
    private String reporterName;
    private String reporterEmail;
    private Long reportedJournalId;
    private String reportedJournalTitle;
    private Long reportedUserId;
    private String reportedUserName;
    private String reportedUserEmail;
    private ReportReason reason;
    private String reasonDisplayName;
    private String description;
    private ReportStatus status;
    private String statusDisplayName;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    private Long reviewedById;
    private String reviewedByName;
    private String adminNotes;
}
