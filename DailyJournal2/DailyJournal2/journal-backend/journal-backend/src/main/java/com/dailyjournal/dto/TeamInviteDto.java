package com.dailyjournal.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TeamInviteDto {
    private Long id;
    private Long teamId;
    private String teamName;
    private Long inviterId;
    private String inviterName;
    private String inviterEmail;
    private Long inviteeId;
    private String inviteeName;
    private String inviteeEmail;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;
}
