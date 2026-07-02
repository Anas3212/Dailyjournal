package com.dailyjournal.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "discussion_votes", 
       uniqueConstraints = {
           @UniqueConstraint(columnNames = {"user_id", "discussion_id"}),
           @UniqueConstraint(columnNames = {"user_id", "answer_id"})
       })
public class DiscussionVote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discussion_id")
    @JsonBackReference
    private Discussion discussion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "answer_id")
    @JsonBackReference
    private DiscussionAnswer answer;

    @Enumerated(EnumType.STRING)
    @Column(name = "vote_type", nullable = false)
    private VoteType voteType;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public enum VoteType {
        UPVOTE, DOWNVOTE
    }

    // Validation: Either discussion or answer must be set, but not both
    @PrePersist
    @PreUpdate
    private void validateVoteTarget() {
        if ((discussion == null && answer == null) || (discussion != null && answer != null)) {
            throw new IllegalStateException("Vote must target either a discussion or an answer, but not both");
        }
    }

    // Helper methods
    public boolean isDiscussionVote() {
        return discussion != null;
    }

    public boolean isAnswerVote() {
        return answer != null;
    }

    public boolean isUpvote() {
        return VoteType.UPVOTE.equals(voteType);
    }

    public boolean isDownvote() {
        return VoteType.DOWNVOTE.equals(voteType);
    }

    public int getVoteValue() {
        return isUpvote() ? 1 : -1;
    }
}
