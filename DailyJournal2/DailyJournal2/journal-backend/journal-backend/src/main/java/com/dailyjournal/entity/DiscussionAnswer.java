package com.dailyjournal.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "discussion_answers")
public class DiscussionAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discussion_id", nullable = false)
    @JsonBackReference
    private Discussion discussion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_answer_id")
    @JsonBackReference
    private DiscussionAnswer parentAnswer;

    @OneToMany(mappedBy = "parentAnswer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<DiscussionAnswer> replies = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_edited", nullable = false)
    private Boolean isEdited = false;

    @Column(name = "is_accepted", nullable = false)
    private Boolean isAccepted = false;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @OneToMany(mappedBy = "answer", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<DiscussionVote> votes = new ArrayList<>();

    @Column(name = "vote_score", nullable = false)
    private Long voteScore = 0L;

    @Column(name = "reply_count", nullable = false)
    private Long replyCount = 0L;

    // Helper methods
    public void incrementReplyCount() {
        this.replyCount = (this.replyCount == null ? 0L : this.replyCount) + 1;
    }

    public void decrementReplyCount() {
        this.replyCount = Math.max(0L, (this.replyCount == null ? 0L : this.replyCount) - 1);
    }

    public void updateVoteScore(long newScore) {
        this.voteScore = newScore;
    }

    public boolean isReply() {
        return this.parentAnswer != null;
    }

    public boolean isTopLevel() {
        return this.parentAnswer == null;
    }
}
