package com.dailyjournal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TeamUpdateRequest {
    @NotBlank(message = "Team name is required")
    @Size(max = 255, message = "Team name must not exceed 255 characters")
    private String name;
    
    @Size(max = 255, message = "Community name must not exceed 255 characters")
    private String community;
}
