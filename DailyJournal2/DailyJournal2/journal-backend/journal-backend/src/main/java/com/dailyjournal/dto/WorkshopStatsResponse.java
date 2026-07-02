package com.dailyjournal.dto;

import java.util.Map;

public class WorkshopStatsResponse {
    
    private long totalFiles;
    private long totalSize;
    private Map<String, Long> fileTypeStats;
    private Map<String, Long> fileSizeStats;
    private long recentFilesCount;
    private String formattedTotalSize;

    // Constructors
    public WorkshopStatsResponse() {}

    public WorkshopStatsResponse(long totalFiles, long totalSize) {
        this.totalFiles = totalFiles;
        this.totalSize = totalSize;
        this.formattedTotalSize = formatFileSize(totalSize);
    }

    // Getters and Setters
    public long getTotalFiles() {
        return totalFiles;
    }

    public void setTotalFiles(long totalFiles) {
        this.totalFiles = totalFiles;
    }

    public long getTotalSize() {
        return totalSize;
    }

    public void setTotalSize(long totalSize) {
        this.totalSize = totalSize;
        this.formattedTotalSize = formatFileSize(totalSize);
    }

    public Map<String, Long> getFileTypeStats() {
        return fileTypeStats;
    }

    public void setFileTypeStats(Map<String, Long> fileTypeStats) {
        this.fileTypeStats = fileTypeStats;
    }

    public Map<String, Long> getFileSizeStats() {
        return fileSizeStats;
    }

    public void setFileSizeStats(Map<String, Long> fileSizeStats) {
        this.fileSizeStats = fileSizeStats;
    }

    public long getRecentFilesCount() {
        return recentFilesCount;
    }

    public void setRecentFilesCount(long recentFilesCount) {
        this.recentFilesCount = recentFilesCount;
    }

    public String getFormattedTotalSize() {
        return formattedTotalSize;
    }

    public void setFormattedTotalSize(String formattedTotalSize) {
        this.formattedTotalSize = formattedTotalSize;
    }

    // Utility method to format file size
    private String formatFileSize(long size) {
        if (size <= 0) return "0 B";
        
        final String[] units = new String[] { "B", "KB", "MB", "GB", "TB" };
        int digitGroups = (int) (Math.log10(size) / Math.log10(1024));
        
        return String.format("%.1f %s", 
            size / Math.pow(1024, digitGroups), 
            units[digitGroups]);
    }
}
