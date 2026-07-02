package com.dailyjournal.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class DiscussionResponse {
    private Long id;
    private String title;
    private String content;
    private Long journalId;
    private String journalTitle;
    private Long authorId;
    private String authorName;
    private String authorEmail;
    private String authorProfilePicture;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isEdited;
    private Boolean isPinned;
    private Boolean isLocked;
    private String status;
    private Long viewCount;
    private Long answerCount;
    private Long voteScore;
    private String userVoteType; // UPVOTE, DOWNVOTE, or null
    private Boolean canEdit;
    private Boolean canDelete;
    private Boolean canPin;
    private Boolean canLock;
    private Boolean canAcceptAnswers;
    private List<DiscussionAnswerResponse> topAnswers;
}
