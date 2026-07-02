// src/main/java/com/dailyjournal/mapper/JournalMapper.java
package com.dailyjournal.mapper;

import com.dailyjournal.dto.JournalResponse;
import com.dailyjournal.entity.JournalEntry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;


@Component
public class JournalMapper {

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    public JournalResponse toResponse(JournalEntry entry) {
        List<String> mediaUrls = null;
        if (entry.getMediaPaths() != null && !entry.getMediaPaths().isEmpty()) {
            mediaUrls = entry.getMediaPaths().stream()
                    .map(path -> {
                        // Extract filename from path (handle both full URLs and filenames)
                        String filename = path;
                        if (path.contains("/api/journals/media/")) {
                            // Extract filename from full URL
                            filename = path.substring(path.lastIndexOf("/api/journals/media/") + "/api/journals/media/".length());
                        } else if (path.startsWith("http")) {
                            // Extract filename from any other full URL format
                            filename = path.substring(path.lastIndexOf("/") + 1);
                        }
                        
                        // Ensure no double slashes in URL construction
                        String cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
                        return cleanBaseUrl + "/api/journals/media/" + filename;
                    })
                    .collect(Collectors.toList());
        }

        Long userId = null;
        String userName = null;
        String userEmail = null; // ✅ Declare variable
        String userProfilePicture = null; // ✅ Declare profile picture variable

        if (entry.getUser() != null) {
            userId = entry.getUser().getId();
            userName = entry.getUser().getName();
            userEmail = entry.getUser().getEmail(); // ✅ include email
            userProfilePicture = entry.getUser().getProfilePicture(); // ✅ include profile picture
        }

        Long teamId = null;
        String teamName = null;
        if (entry.getTeam() != null) {
            teamId = entry.getTeam().getId();
            teamName = entry.getTeam().getName();
        }

        JournalResponse resp = new JournalResponse();
        resp.setId(entry.getId());
        resp.setTitle(entry.getTitle());
        resp.setContent(entry.getContent());
        resp.setMood(entry.getMood());
        resp.setTags(entry.getTags());
        resp.setDate(entry.getDate());
        resp.setPrivate(entry.isPrivate());
        resp.setPublished(entry.isPublished());
        resp.setEverPublished(entry.isEverPublished());
        resp.setHiddenByAdmin(entry.isHiddenByAdmin());
        resp.setMediaUrls(mediaUrls);
        resp.setUserId(userId);
        resp.setUserName(userName);
        resp.setUserEmail(userEmail);
        resp.setUserProfilePicture(userProfilePicture);
        resp.setTeamId(teamId);
        resp.setTeamName(teamName);
        return resp;
    }
}

