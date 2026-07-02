package com.dailyjournal.dto;

import com.dailyjournal.entity.WorkshopFile.FileType;
import java.time.LocalDateTime;

public class WorkshopFileResponse {
    
    private Long id;
    private String fileName;
    private FileType fileType;
    private String content;
    private String description;
    private String category;
    private String tags;
    private String ownerName;
    private String ownerEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long fileSize;
    private Boolean isShared;
    private String shareToken;
    private String fileTypeDisplayName;
    private String fileExtension;
    private String mimeType;

    // Constructors
    public WorkshopFileResponse() {}

    public WorkshopFileResponse(Long id, String fileName, FileType fileType, String content) {
        this.id = id;
        this.fileName = fileName;
        this.fileType = fileType;
        this.content = content;
        if (fileType != null) {
            this.fileTypeDisplayName = fileType.getDisplayName();
            this.fileExtension = fileType.getExtension();
            this.mimeType = fileType.getMimeType();
        }
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
        if (fileType != null) {
            this.fileTypeDisplayName = fileType.getDisplayName();
            this.fileExtension = fileType.getExtension();
            this.mimeType = fileType.getMimeType();
        }
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
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

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
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

    public String getFileTypeDisplayName() {
        return fileTypeDisplayName;
    }

    public void setFileTypeDisplayName(String fileTypeDisplayName) {
        this.fileTypeDisplayName = fileTypeDisplayName;
    }

    public String getFileExtension() {
        return fileExtension;
    }

    public void setFileExtension(String fileExtension) {
        this.fileExtension = fileExtension;
    }

    public String getMimeType() {
        return mimeType;
    }

    public void setMimeType(String mimeType) {
        this.mimeType = mimeType;
    }
}
