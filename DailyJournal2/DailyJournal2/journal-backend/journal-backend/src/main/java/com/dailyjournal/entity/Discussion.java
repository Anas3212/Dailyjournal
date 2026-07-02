package com.dailyjournal.entity;

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
@Table(name = "discussions")
public class Discussion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_id", nullable = false)
    private JournalEntry journal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_edited", nullable = false)
    private Boolean isEdited = false;

    @Column(name = "is_pinned", nullable = false)
    private Boolean isPinned = false;

    @Column(name = "is_locked", nullable = false)
    private Boolean isLocked = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private DiscussionStatus status = DiscussionStatus.ACTIVE;

    @OneToMany(mappedBy = "discussion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<DiscussionAnswer> answers = new ArrayList<>();

    @OneToMany(mappedBy = "discussion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<DiscussionVote> votes = new ArrayList<>();

    @Column(name = "view_count", nullable = false)
    private Long viewCount = 0L;

    @Column(name = "answer_count", nullable = false)
    private Long answerCount = 0L;

    @Column(name = "vote_score", nullable = false)
    private Long voteScore = 0L;

    public enum DiscussionStatus {
        ACTIVE, CLOSED, ARCHIVED, DELETED
    }

    // Helper methods
    public void incrementViewCount() {
        this.viewCount = (this.viewCount == null ? 0L : this.viewCount) + 1;
    }

    public void incrementAnswerCount() {
        this.answerCount = (this.answerCount == null ? 0L : this.answerCount) + 1;
    }

    public void decrementAnswerCount() {
        this.answerCount = Math.max(0L, (this.answerCount == null ? 0L : this.answerCount) - 1);
    }

    public void updateVoteScore(long newScore) {
        this.voteScore = newScore;
    }
}
