package com.dailyjournal.controller;

import com.dailyjournal.dto.NoticeBoardDto;
import com.dailyjournal.entity.NoticeBoard;
import com.dailyjournal.service.NoticeBoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/teams/{teamId}/notices")
@RequiredArgsConstructor
public class NoticeBoardController {

    private final NoticeBoardService noticeBoardService;

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<NoticeBoardDto>> getTeamNotices(@PathVariable Long teamId) {
        List<NoticeBoardDto> notices = noticeBoardService.getTeamNotices(teamId);
        return ResponseEntity.ok(notices);
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<NoticeBoardDto> createNotice(
            @PathVariable Long teamId,
            @RequestBody CreateNoticeRequest createRequest) {
        NoticeBoardDto notice = noticeBoardService.createNotice(
                teamId, 
                createRequest.getTitle(), 
                createRequest.getContent(), 
                createRequest.getPriority()
        );
        return ResponseEntity.ok(notice);
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<NoticeBoardDto> createNoticeWithImage(
            @PathVariable Long teamId,
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam(value = "priority", defaultValue = "NORMAL") String priority,
            @RequestParam(value = "image", required = false) MultipartFile image) throws IOException {
        
        NoticeBoard.NoticePriority noticePriority;
        try {
            noticePriority = NoticeBoard.NoticePriority.valueOf(priority.toUpperCase());
        } catch (IllegalArgumentException e) {
            noticePriority = NoticeBoard.NoticePriority.NORMAL;
        }
        
        NoticeBoardDto notice = noticeBoardService.createNoticeWithImage(
                teamId, title, content, noticePriority, image
        );
        return ResponseEntity.ok(notice);
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PutMapping("/{noticeId}")
    public ResponseEntity<NoticeBoardDto> updateNotice(
            @PathVariable Long teamId,
            @PathVariable Long noticeId,
            @RequestBody UpdateNoticeRequest updateRequest) {
        NoticeBoardDto notice = noticeBoardService.updateNotice(
                teamId, 
                noticeId, 
                updateRequest.getTitle(), 
                updateRequest.getContent(), 
                updateRequest.getPriority()
        );
        return ResponseEntity.ok(notice);
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PutMapping(value = "/{noticeId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<NoticeBoardDto> updateNoticeWithImage(
            @PathVariable Long teamId,
            @PathVariable Long noticeId,
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam(value = "priority", defaultValue = "NORMAL") String priority,
            @RequestParam(value = "image", required = false) MultipartFile image) throws IOException {
        
        NoticeBoard.NoticePriority noticePriority;
        try {
            noticePriority = NoticeBoard.NoticePriority.valueOf(priority.toUpperCase());
        } catch (IllegalArgumentException e) {
            noticePriority = NoticeBoard.NoticePriority.NORMAL;
        }
        
        NoticeBoardDto notice = noticeBoardService.updateNoticeWithImage(
                teamId, noticeId, title, content, noticePriority, image
        );
        return ResponseEntity.ok(notice);
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @DeleteMapping("/{noticeId}")
    public ResponseEntity<Void> deleteNotice(
            @PathVariable Long teamId,
            @PathVariable Long noticeId) {
        noticeBoardService.deleteNotice(teamId, noticeId);
        return ResponseEntity.ok().build();
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @PutMapping("/{noticeId}/pin")
    public ResponseEntity<NoticeBoardDto> togglePinNotice(
            @PathVariable Long teamId,
            @PathVariable Long noticeId) {
        NoticeBoardDto notice = noticeBoardService.togglePinNotice(teamId, noticeId);
        return ResponseEntity.ok(notice);
    }

    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @GetMapping("/{noticeId}/image")
    public ResponseEntity<byte[]> getNoticeImage(
            @PathVariable Long teamId,
            @PathVariable Long noticeId) {
        try {
            byte[] imageData = noticeBoardService.getNoticeImage(teamId, noticeId);
            String contentType = noticeBoardService.getNoticeImageType(teamId, noticeId);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    // Disable caching to ensure updated images show immediately
                    .header(HttpHeaders.CACHE_CONTROL, "no-store, no-cache, must-revalidate, max-age=0")
                    .header("Pragma", "no-cache")
                    .header("Expires", "0")
                    .body(imageData);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Request DTOs
    public static class CreateNoticeRequest {
        private String title;
        private String content;
        private NoticeBoard.NoticePriority priority;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public NoticeBoard.NoticePriority getPriority() { return priority; }
        public void setPriority(NoticeBoard.NoticePriority priority) { this.priority = priority; }
    }

    public static class UpdateNoticeRequest {
        private String title;
        private String content;
        private NoticeBoard.NoticePriority priority;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public NoticeBoard.NoticePriority getPriority() { return priority; }
        public void setPriority(NoticeBoard.NoticePriority priority) { this.priority = priority; }
    }
}
