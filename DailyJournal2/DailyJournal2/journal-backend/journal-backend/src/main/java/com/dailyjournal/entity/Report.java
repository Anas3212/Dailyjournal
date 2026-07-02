package com.dailyjournal.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_journal_id", nullable = false)
    private JournalEntry reportedJournal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_user_id", nullable = false)
    private User reportedUser;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReportReason reason;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReportStatus status = ReportStatus.PENDING;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column
    private LocalDateTime reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_id")
    private User reviewedBy;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String adminNotes;

    public enum ReportReason {
        INAPPROPRIATE_CONTENT("Inappropriate Content"),
        SPAM("Spam"),
        HARASSMENT("Harassment"),
        HATE_SPEECH("Hate Speech"),
        VIOLENCE("Violence or Threats"),
        PRIVACY_VIOLATION("Privacy Violation"),
        COPYRIGHT_INFRINGEMENT("Copyright Infringement"),
        MISINFORMATION("Misinformation"),
        OTHER("Other");

        private final String displayName;

        ReportReason(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    public enum ReportStatus {
        PENDING("Pending Review"),
        UNDER_REVIEW("Under Review"),
        RESOLVED("Resolved"),
        DISMISSED("Dismissed"),
        ESCALATED("Escalated");

        private final String displayName;

        ReportStatus(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}
