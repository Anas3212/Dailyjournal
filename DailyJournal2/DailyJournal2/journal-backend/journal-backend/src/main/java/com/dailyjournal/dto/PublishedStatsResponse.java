package com.dailyjournal.dto;

import com.dailyjournal.entity.ReactionType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PublishedStatsResponse {
    private Long journalId;
    private long totalViews;
    private long uniqueViewers;
    private long likes;
    private long dislikes;
    private long hearts;
    private ReactionType userReaction; // null if none
}
