package com.dailyjournal.mapper;

import com.dailyjournal.dto.UserVerificationDto;
import com.dailyjournal.entity.UserVerification;

import java.util.List;
import java.util.stream.Collectors;

public class UserVerificationMapper {

    public static UserVerificationDto toDto(UserVerification entity) {
        if (entity == null) return null;
        UserVerificationDto dto = new UserVerificationDto();
        dto.setId(entity.getId());
        dto.setType(entity.getType() != null ? entity.getType().name() : null);
        dto.setTitle(entity.getTitle());
        dto.setIssuer(entity.getIssuer());
        dto.setIssueDate(entity.getIssueDate());
        dto.setExpiryDate(entity.getExpiryDate());
        dto.setCredentialId(entity.getCredentialId());
        dto.setCredentialUrl(entity.getCredentialUrl());
        dto.setDescription(entity.getDescription());
        dto.setVisibility(entity.getVisibility() != null ? entity.getVisibility().name() : null);
        dto.setFileName(entity.getFileName());
        dto.setFileType(entity.getFileType());
        dto.setFileSize(entity.getFileSize());
        dto.setHasFile(entity.hasFile());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setUpdatedAt(entity.getUpdatedAt());
        return dto;
    }

    public static List<UserVerificationDto> toDtoList(List<UserVerification> entities) {
        return entities.stream().map(UserVerificationMapper::toDto).collect(Collectors.toList());
    }
}
