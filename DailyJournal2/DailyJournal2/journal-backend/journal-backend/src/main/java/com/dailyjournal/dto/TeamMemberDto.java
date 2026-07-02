package com.dailyjournal.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TeamMemberDto {
    private Long userId;
    private String userName;
    private String userEmail;
    private String role;
    private LocalDateTime joinedAt;
    private Boolean canReclaim;
    private Boolean showReclaimAlert;
    private Long reclaimDaysRemaining;
    private LocalDateTime ownershipTransferDate;
}
