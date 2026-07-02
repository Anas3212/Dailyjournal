package com.dailyjournal.dto;

import com.dailyjournal.entity.Report.ReportReason;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportRequest {

    @NotNull(message = "Journal ID is required")
    private Long journalId;

    @NotNull(message = "Report reason is required")
    private ReportReason reason;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;
}
