package com.dailyjournal.dto;

import com.dailyjournal.entity.NoticeBoard;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NoticeBoardDto {
    private Long id;
    private String title;
    private String content;
    private NoticeBoard.NoticePriority priority;
    private Long teamId;
    private Long createdById;
    private String createdByName;
    private String createdByRole;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean pinned;
    private boolean hasImage;

    public static NoticeBoardDto fromEntity(NoticeBoard notice) {
        NoticeBoardDto dto = new NoticeBoardDto();
        dto.setId(notice.getId());
        dto.setTitle(notice.getTitle());
        dto.setContent(notice.getContent());
        dto.setPriority(notice.getPriority());
        dto.setTeamId(notice.getTeam().getId());
        dto.setCreatedById(notice.getCreatedBy().getId());
        dto.setCreatedByName(notice.getCreatedBy().getName());
        dto.setCreatedAt(notice.getCreatedAt());
        dto.setUpdatedAt(notice.getUpdatedAt());
        dto.setPinned(notice.isPinned());
        dto.setHasImage(notice.getImageData() != null && notice.getImageData().length > 0);
        return dto;
    }
}
