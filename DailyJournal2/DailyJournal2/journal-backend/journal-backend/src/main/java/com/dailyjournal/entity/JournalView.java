package com.dailyjournal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "journal_views", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"journal_id", "user_id", "view_date"})
})
public class JournalView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_id", nullable = false)
    private JournalEntry journal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "view_date", nullable = false)
    private LocalDate viewDate; // for unique per day views per user

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
