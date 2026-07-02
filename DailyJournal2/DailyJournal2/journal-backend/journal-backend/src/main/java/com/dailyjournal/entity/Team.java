package com.dailyjournal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "teams")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 255)
    private String community;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    // Temporary ownership fields
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "previous_owner_id")
    private User previousOwner;

    @Column(name = "ownership_transfer_date")
    private LocalDateTime ownershipTransferDate;

    @Column(name = "is_temporary_ownership")
    @Builder.Default
    private Boolean isTemporaryOwnership = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
