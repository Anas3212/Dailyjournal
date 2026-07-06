package com.dailyjournal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "team_members", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"team_id", "user_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(10)")
    @Builder.Default
    private Role role = Role.MEMBER;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
    }

    public enum Role {
        MEMBER,
        ADMIN,
        MASTER;
        
        public boolean canPromote(Role targetRole) {
            return switch (this) {
                case MASTER -> targetRole == ADMIN || targetRole == MEMBER;
                case ADMIN -> false;
                case MEMBER -> false;
            };
        }
        
        public boolean canDemote(Role targetRole) {
            return switch (this) {
                case MASTER -> targetRole == ADMIN;
                case ADMIN -> false;
                case MEMBER -> false;
            };
        }
        
        public boolean canEditJournals() {
            return this == ADMIN || this == MASTER;
        }
        
        public boolean canReadJournals() {
            return true; // All roles can read
        }
        
        public boolean canManageMembers() {
            return this == MASTER; // Only MASTER can invite/remove friends
        }
        
        public boolean canManageJournals() {
            return this == ADMIN || this == MASTER; // ADMIN and MASTER can manage journals
        }
        
        public boolean canPromoteMembers() {
            return this == MASTER; // Only MASTER can promote/demote
        }
    }
}
