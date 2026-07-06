package com.dailyjournal.dto;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

@Data
public class JournalRequest {

    @NotBlank(message = "Title cannot be blank")
    private String title;

    @NotBlank(message = "Content cannot be blank")
    private String content;

    private String mood; // optional

    private String tags; // comma-separated (optional)

    @JsonProperty("isPrivate")
    private boolean isPrivate = false; // Default to public

    @NotNull(message = "Date is required")
    private LocalDate date;

    private List<String> mediaPaths; // ✅ updated to support multiple files

    private List<String> pages = new java.util.ArrayList<>(); // ✅ support multiple description pages

    // Optional: link this journal to a team the user belongs to
    private Long teamId;

}
