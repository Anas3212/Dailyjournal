package com.dailyjournal.dto;

import com.dailyjournal.entity.TeamConnection;
import com.dailyjournal.entity.TeamConnection.TeamConnectionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamConnectionDto {
    private Long id;
    private SimpleTeamDto requesterTeam;
    private SimpleTeamDto targetTeam;
    private SimpleUserDto createdBy;
    private TeamConnectionStatus status;
    private String message;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SimpleTeamDto {
        private Long id;
        private String name;
        private String ownerName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SimpleUserDto {
        private Long id;
        private String name;
        private String email;
    }

    public static TeamConnectionDto fromEntity(TeamConnection entity) {
        return TeamConnectionDto.builder()
                .id(entity.getId())
                .requesterTeam(SimpleTeamDto.builder()
                        .id(entity.getRequesterTeam().getId())
                        .name(entity.getRequesterTeam().getName())
                        .ownerName(entity.getRequesterTeam().getOwner() != null ? 
                                  entity.getRequesterTeam().getOwner().getName() : "Unknown")
                        .build())
                .targetTeam(SimpleTeamDto.builder()
                        .id(entity.getTargetTeam().getId())
                        .name(entity.getTargetTeam().getName())
                        .ownerName(entity.getTargetTeam().getOwner() != null ? 
                                  entity.getTargetTeam().getOwner().getName() : "Unknown")
                        .build())
                .createdBy(SimpleUserDto.builder()
                        .id(entity.getCreatedBy().getId())
                        .name(entity.getCreatedBy().getName())
                        .email(entity.getCreatedBy().getEmail())
                        .build())
                .status(entity.getStatus())
                .message(entity.getMessage())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
