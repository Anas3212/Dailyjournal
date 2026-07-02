package com.dailyjournal.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransferOwnershipRequest {
    
    @NotNull(message = "New owner ID is required")
    @Positive(message = "New owner ID must be positive")
    private Long newOwnerId;
    
    @Size(max = 500, message = "Reason cannot exceed 500 characters")
    private String reason;
    
    private Boolean notifyMembers = true;
}
