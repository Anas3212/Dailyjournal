package com.dailyjournal.mapper;

import com.dailyjournal.dto.WorkshopFileRequest;
import com.dailyjournal.dto.WorkshopFileResponse;
import com.dailyjournal.entity.User;
import com.dailyjournal.entity.WorkshopFile;
import org.springframework.stereotype.Component;

@Component
public class WorkshopFileMapper {

    public WorkshopFile toEntity(WorkshopFileRequest request, User user) {
        if (request == null) {
            return null;
        }

        WorkshopFile workshopFile = new WorkshopFile();
        workshopFile.setFileName(request.getFileName());
        workshopFile.setFileType(request.getFileType());
        workshopFile.setContent(request.getContent());
        workshopFile.setDescription(request.getDescription());
        workshopFile.setCategory(request.getCategory());
        workshopFile.setTags(request.getTags());
        workshopFile.setIsShared(request.getIsShared() != null ? request.getIsShared() : false);
        workshopFile.setUser(user);

        return workshopFile;
    }

    public WorkshopFileResponse toResponse(WorkshopFile workshopFile) {
        if (workshopFile == null) {
            return null;
        }

        WorkshopFileResponse response = new WorkshopFileResponse();
        response.setId(workshopFile.getId());
        response.setFileName(workshopFile.getFileName());
        response.setFileType(workshopFile.getFileType());
        response.setContent(workshopFile.getContent());
        response.setDescription(workshopFile.getDescription());
        response.setCategory(workshopFile.getCategory());
        response.setTags(workshopFile.getTags());
        response.setCreatedAt(workshopFile.getCreatedAt());
        response.setUpdatedAt(workshopFile.getUpdatedAt());
        response.setFileSize(workshopFile.getFileSize());
        response.setIsShared(workshopFile.getIsShared());
        response.setShareToken(workshopFile.getShareToken());

        // Set owner information
        if (workshopFile.getUser() != null) {
            response.setOwnerName(workshopFile.getUser().getName());
            response.setOwnerEmail(workshopFile.getUser().getEmail());
        }

        // Set file type information
        if (workshopFile.getFileType() != null) {
            response.setFileTypeDisplayName(workshopFile.getFileType().getDisplayName());
            response.setFileExtension(workshopFile.getFileType().getExtension());
            response.setMimeType(workshopFile.getFileType().getMimeType());
        }

        return response;
    }

    public WorkshopFileResponse toResponseWithoutContent(WorkshopFile workshopFile) {
        WorkshopFileResponse response = toResponse(workshopFile);
        if (response != null) {
            response.setContent(null); // Remove content for list views to reduce payload size
        }
        return response;
    }

    public void updateEntityFromRequest(WorkshopFile workshopFile, WorkshopFileRequest request) {
        if (workshopFile == null || request == null) {
            return;
        }

        if (request.getFileName() != null) {
            workshopFile.setFileName(request.getFileName());
        }
        if (request.getFileType() != null) {
            workshopFile.setFileType(request.getFileType());
        }
        if (request.getContent() != null) {
            workshopFile.setContent(request.getContent());
        }
        if (request.getDescription() != null) {
            workshopFile.setDescription(request.getDescription());
        }
        if (request.getCategory() != null) {
            workshopFile.setCategory(request.getCategory());
        }
        if (request.getTags() != null) {
            workshopFile.setTags(request.getTags());
        }
        if (request.getIsShared() != null) {
            workshopFile.setIsShared(request.getIsShared());
        }
    }
}
