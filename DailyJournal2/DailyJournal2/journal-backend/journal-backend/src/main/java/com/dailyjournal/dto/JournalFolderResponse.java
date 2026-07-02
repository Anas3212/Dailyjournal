package com.dailyjournal.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalFolderResponse {

    private Long id;
    private String name;
    private String description;
    private String color;
    private String icon;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int journalCount;
    private Long userId;
}
