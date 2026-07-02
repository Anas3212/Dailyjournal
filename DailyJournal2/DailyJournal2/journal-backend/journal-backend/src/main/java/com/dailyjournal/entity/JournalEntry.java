package com.dailyjournal.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class JournalEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Lob
    private String content;

    private LocalDate date;

    private String mood;

    private String tags; // comma-separated e.g. "#Work,#Happy"
    
    @JsonProperty("isPrivate")
    private boolean isPrivate = false; // Default to public
    
    @JsonProperty("isPublished")
    private boolean isPublished = false; // Default to not published
    
    @JsonProperty("everPublished")
    private boolean everPublished = false; // Track if journal was ever published for admin view
    
    @JsonProperty("hiddenByAdmin")
    private boolean hiddenByAdmin = false; // Track if journal was hidden by admin vs unpublished by user

    @ElementCollection
    @CollectionTable(
            name = "journal_media_paths", // ✅ Table name to store media list
            joinColumns = @JoinColumn(name = "journal_id") // ✅ FK to journal_entry.id
    )
    @Column(name = "media_path") // ✅ Column for individual file paths
    private List<String> mediaPaths;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // Optional link to a team for collaborative journals
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    // Optional link to a folder for organization
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id")
    private JournalFolder folder;
}
