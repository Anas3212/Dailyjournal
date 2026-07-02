package com.dailyjournal.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "workshop_files")
public class WorkshopFile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private FileType fileType;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String content;

    @Column
    private String description;

    @Column
    private String category;

    @Column
    private String tags;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "is_shared")
    private Boolean isShared = false;

    @Column(name = "share_token")
    private String shareToken;

    // Constructors
    public WorkshopFile() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public WorkshopFile(String fileName, FileType fileType, String content, User user) {
        this();
        this.fileName = fileName;
        this.fileType = fileType;
        this.content = content;
        this.user = user;
        this.fileSize = content != null ? (long) content.length() : 0L;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public FileType getFileType() {
        return fileType;
    }

    public void setFileType(FileType fileType) {
        this.fileType = fileType;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
        this.fileSize = content != null ? (long) content.length() : 0L;
        this.updatedAt = LocalDateTime.now();
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public Boolean getIsShared() {
        return isShared;
    }

    public void setIsShared(Boolean isShared) {
        this.isShared = isShared;
    }

    public String getShareToken() {
        return shareToken;
    }

    public void setShareToken(String shareToken) {
        this.shareToken = shareToken;
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum FileType {
        TEXT("Text File", ".txt", "text/plain"),
        DOCUMENT("Document", ".doc", "application/msword"),
        SPREADSHEET("Spreadsheet", ".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        PRESENTATION("Presentation", ".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"),
        MARKDOWN("Markdown", ".md", "text/markdown"),
        CODE("Code File", ".code", "text/plain"),
        JSON("JSON Data", ".json", "application/json"),
        CSV("CSV Data", ".csv", "text/csv");

        private final String displayName;
        private final String extension;
        private final String mimeType;

        FileType(String displayName, String extension, String mimeType) {
            this.displayName = displayName;
            this.extension = extension;
            this.mimeType = mimeType;
        }

        public String getDisplayName() {
            return displayName;
        }

        public String getExtension() {
            return extension;
        }

        public String getMimeType() {
            return mimeType;
        }
    }
}
