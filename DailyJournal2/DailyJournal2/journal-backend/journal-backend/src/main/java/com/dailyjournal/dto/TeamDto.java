package com.dailyjournal.dto;

import lombok.Data;

@Data
public class TeamDto {
    private Long id;
    private String name;
    private String community;
    private Long ownerId;
    private String ownerName;
    private String userRole; // Current user's role in this team
    private Integer memberCount;
    private Integer journalCount;
    
    // Temporary ownership fields
    private Boolean isTemporaryOwnership;
    private Long previousOwnerId;
    private String previousOwnerName;
    private String ownershipTransferDate;
    private Boolean canReclaim;
}
