package com.dailyjournal.dto;

import com.dailyjournal.entity.Report.ReportStatus;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportUpdateRequest {

    @NotNull(message = "Status is required")
    private ReportStatus status;

    @Size(max = 1000, message = "Admin notes cannot exceed 1000 characters")
    private String adminNotes;
}
