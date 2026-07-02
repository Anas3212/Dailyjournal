package com.dailyjournal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalEditorResponse {
    private Long id;
    private Long journalId;
    private String journalTitle;
    private UserSummary user;
    private UserSummary assignedBy;
    private LocalDateTime assignedAt;
    private boolean isActive;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private Long id;
        private String username;
        private String email;
    }
}
