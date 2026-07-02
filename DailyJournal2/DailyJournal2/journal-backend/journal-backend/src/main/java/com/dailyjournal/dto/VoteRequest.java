package com.dailyjournal.dto;

import lombok.Data;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

@Data
public class VoteRequest {
    @NotNull(message = "Vote type is required")
    @Pattern(regexp = "UPVOTE|DOWNVOTE", message = "Vote type must be UPVOTE or DOWNVOTE")
    private String voteType;
}
