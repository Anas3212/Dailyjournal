// src/main/java/com/dailyjournal/dto/JournalResponse.java
package com.dailyjournal.dto;

import lombok.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class JournalResponse {
    private Long id;
    private String title;
    private String content;
    private String mood;
    private String tags;
    private LocalDate date;
    @JsonProperty("isPrivate")
    private boolean isPrivate;
    @JsonProperty("isPublished")
    private boolean isPublished;
    @JsonProperty("everPublished")
    private boolean everPublished;
    private boolean hiddenByAdmin;
    private List<String> mediaUrls; // ✅ Multiple media preview URLs

    private Long userId;      // ✅ Added
    private String userName;  // ✅ Added
    private String userEmail; // ✅ NEW FIELD
    private String userProfilePicture; // ✅ Added for profile photos

    // Team linkage (optional)
    private Long teamId;
    private String teamName;
}
