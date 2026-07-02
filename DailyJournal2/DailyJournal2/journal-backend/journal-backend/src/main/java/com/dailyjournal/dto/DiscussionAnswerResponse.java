package com.dailyjournal.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class DiscussionAnswerResponse {
    private Long id;
    private String content;
    private Long discussionId;
    private Long authorId;
    private String authorName;
    private String authorEmail;
    private String authorProfilePicture;
    private Long parentAnswerId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isEdited;
    private Boolean isAccepted;
    private Boolean isDeleted;
    private Long voteScore;
    private Long replyCount;
    private String userVoteType; // UPVOTE, DOWNVOTE, or null
    private Boolean canEdit;
    private Boolean canDelete;
    private Boolean canAccept;
    private List<DiscussionAnswerResponse> replies;
}
