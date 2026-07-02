package com.dailyjournal.controller;

import com.dailyjournal.dto.*;
import com.dailyjournal.entity.Discussion;
import com.dailyjournal.entity.DiscussionAnswer;
import com.dailyjournal.entity.DiscussionVote;
import com.dailyjournal.entity.User;
import com.dailyjournal.mapper.DiscussionMapper;
import com.dailyjournal.util.SecurityUtils;
import com.dailyjournal.service.DiscussionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/discussions")
@RequiredArgsConstructor
public class DiscussionController {

    private final DiscussionService discussionService;
    private final DiscussionMapper discussionMapper;

    // Discussion endpoints
    @PostMapping("/journal/{journalId}")
    public ResponseEntity<?> createDiscussion(
            @PathVariable Long journalId,
            @Valid @RequestBody DiscussionRequest request,
            HttpServletRequest httpRequest) {
        try {
            // ✅ Get current user from Security Context (works with cookies)
            User currentUser = SecurityUtils.getCurrentUser();
            Discussion discussion = discussionService.createDiscussion(
                journalId, currentUser.getId(), request.getTitle(), request.getContent());
            
            DiscussionResponse response = discussionMapper.toResponse(discussion, currentUser);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{discussionId}")
    public ResponseEntity<?> getDiscussion(
            @PathVariable Long discussionId,
            HttpServletRequest httpRequest) {
        try {
            User currentUser = null;
            try {
                // ✅ Get current user from Security Context (works with cookies)
                currentUser = SecurityUtils.getCurrentUser();
            } catch (Exception e) {
                // Allow anonymous access for viewing discussions
            }
            
            Discussion discussion = discussionService.getDiscussion(discussionId);
            DiscussionResponse response = discussionMapper.toResponse(discussion, currentUser);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{discussionId}")
    public ResponseEntity<?> updateDiscussion(
            @PathVariable Long discussionId,
            @Valid @RequestBody DiscussionRequest request,
            HttpServletRequest httpRequest) {
        try {
            // ✅ Get current user from Security Context (works with cookies)
            User currentUser = SecurityUtils.getCurrentUser();
            Discussion discussion = discussionService.updateDiscussion(
                discussionId, currentUser.getId(), request.getTitle(), request.getContent());
            
            DiscussionResponse response = discussionMapper.toResponse(discussion, currentUser);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{discussionId}")
    public ResponseEntity<?> deleteDiscussion(
            @PathVariable Long discussionId,
            HttpServletRequest httpRequest) {
        try {
            // ✅ Get current user from Security Context (works with cookies)
            User currentUser = SecurityUtils.getCurrentUser();
            discussionService.deleteDiscussion(discussionId, currentUser.getId());
            return ResponseEntity.ok(Map.of("message", "Discussion deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/journal/{journalId}")
    public ResponseEntity<?> getDiscussionsByJournal(
            @PathVariable Long journalId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            HttpServletRequest httpRequest) {
        try {
            User currentUser = null;
            try {
                // ✅ Get current user from Security Context (works with cookies)
                currentUser = SecurityUtils.getCurrentUser();
            } catch (Exception e) {
                // Allow anonymous access for viewing discussions
            }
            
            Pageable pageable = PageRequest.of(page, size);
            Page<Discussion> discussions = discussionService.getDiscussionsByJournal(journalId, sortBy, pageable);
            
            List<DiscussionResponse> responses = discussionMapper.toResponseList(discussions.getContent(), currentUser);
            
            Map<String, Object> result = new HashMap<>();
            result.put("discussions", responses);
            result.put("totalElements", discussions.getTotalElements());
            result.put("totalPages", discussions.getTotalPages());
            result.put("currentPage", discussions.getNumber());
            result.put("size", discussions.getSize());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchDiscussions(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest httpRequest) {
        try {
            User currentUser = null;
            try {
                // ✅ Get current user from Security Context (works with cookies)
                currentUser = SecurityUtils.getCurrentUser();
            } catch (Exception e) {
                // Allow anonymous access for searching discussions
            }
            
            Pageable pageable = PageRequest.of(page, size);
            Page<Discussion> discussions = discussionService.searchDiscussions(query, pageable);
            
            List<DiscussionResponse> responses = discussionMapper.toResponseList(discussions.getContent(), currentUser);
            
            Map<String, Object> result = new HashMap<>();
            result.put("discussions", responses);
            result.put("totalElements", discussions.getTotalElements());
            result.put("totalPages", discussions.getTotalPages());
            result.put("currentPage", discussions.getNumber());
            result.put("size", discussions.getSize());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/popular")
    public ResponseEntity<?> getPopularDiscussions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest httpRequest) {
        try {
            User currentUser = null;
            try {
                // ✅ Get current user from Security Context (works with cookies)
                currentUser = SecurityUtils.getCurrentUser();
            } catch (Exception e) {
                // Allow anonymous access for viewing popular discussions
            }
            
            Pageable pageable = PageRequest.of(page, size);
            Page<Discussion> discussions = discussionService.getPopularDiscussions(pageable);
            
            List<DiscussionResponse> responses = discussionMapper.toResponseList(discussions.getContent(), currentUser);
            
            Map<String, Object> result = new HashMap<>();
            result.put("discussions", responses);
            result.put("totalElements", discussions.getTotalElements());
            result.put("totalPages", discussions.getTotalPages());
            result.put("currentPage", discussions.getNumber());
            result.put("size", discussions.getSize());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/recent")
    public ResponseEntity<?> getRecentDiscussions(
            @RequestParam(defaultValue = "7") int days,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest httpRequest) {
        try {
            User currentUser = null;
            try {
                // ✅ Get current user from Security Context (works with cookies)
                currentUser = SecurityUtils.getCurrentUser();
            } catch (Exception e) {
                // Allow anonymous access for viewing recent discussions
            }
            
            Pageable pageable = PageRequest.of(page, size);
            Page<Discussion> discussions = discussionService.getRecentDiscussions(days, pageable);
            
            List<DiscussionResponse> responses = discussionMapper.toResponseList(discussions.getContent(), currentUser);
            
            Map<String, Object> result = new HashMap<>();
            result.put("discussions", responses);
            result.put("totalElements", discussions.getTotalElements());
            result.put("totalPages", discussions.getTotalPages());
            result.put("currentPage", discussions.getNumber());
            result.put("size", discussions.getSize());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Answer endpoints
    @PostMapping("/{discussionId}/answers")
    public ResponseEntity<?> createAnswer(
            @PathVariable Long discussionId,
            @Valid @RequestBody DiscussionAnswerRequest request,
            HttpServletRequest httpRequest) {
        try {
            // ✅ Get current user from Security Context (works with cookies)
            User currentUser = SecurityUtils.getCurrentUser();
            DiscussionAnswer answer = discussionService.createAnswer(
                discussionId, currentUser.getId(), request.getContent(), request.getParentAnswerId());
            
            DiscussionAnswerResponse response = discussionMapper.toResponse(answer, currentUser);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{discussionId}/answers")
    public ResponseEntity<?> getAnswersByDiscussion(
            @PathVariable Long discussionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String sortBy,
            HttpServletRequest httpRequest) {
        try {
            User currentUser = null;
            try {
                // ✅ Get current user from Security Context (works with cookies)
                currentUser = SecurityUtils.getCurrentUser();
            } catch (Exception e) {
                // Allow anonymous access for viewing answers
            }
            
            Pageable pageable = PageRequest.of(page, size);
            Page<DiscussionAnswer> answers = discussionService.getAnswersByDiscussion(discussionId, sortBy, pageable);
            
            List<DiscussionAnswerResponse> responses = discussionMapper.toAnswerResponseList(answers.getContent(), currentUser);
            
            Map<String, Object> result = new HashMap<>();
            result.put("answers", responses);
            result.put("totalElements", answers.getTotalElements());
            result.put("totalPages", answers.getTotalPages());
            result.put("currentPage", answers.getNumber());
            result.put("size", answers.getSize());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/answers/{answerId}/replies")
    public ResponseEntity<?> getRepliesByAnswer(
            @PathVariable Long answerId,
            HttpServletRequest httpRequest) {
        try {
            User currentUser = null;
            try {
                // ✅ Get current user from Security Context (works with cookies)
                currentUser = SecurityUtils.getCurrentUser();
            } catch (Exception e) {
                // Allow anonymous access for viewing replies
            }
            
            List<DiscussionAnswer> replies = discussionService.getRepliesByAnswer(answerId);
            List<DiscussionAnswerResponse> responses = discussionMapper.toAnswerResponseList(replies, currentUser);
            
            return ResponseEntity.ok(Map.of("replies", responses));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/answers/{answerId}")
    public ResponseEntity<?> updateAnswer(
            @PathVariable Long answerId,
            @Valid @RequestBody DiscussionAnswerRequest request,
            HttpServletRequest httpRequest) {
        try {
            // ✅ Get current user from Security Context (works with cookies)
            User currentUser = SecurityUtils.getCurrentUser();
            DiscussionAnswer answer = discussionService.updateAnswer(
                answerId, currentUser.getId(), request.getContent());
            
            DiscussionAnswerResponse response = discussionMapper.toResponse(answer, currentUser);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/answers/{answerId}")
    public ResponseEntity<?> deleteAnswer(
            @PathVariable Long answerId,
            HttpServletRequest httpRequest) {
        try {
            // ✅ Get current user from Security Context (works with cookies)
            User currentUser = SecurityUtils.getCurrentUser();
            discussionService.deleteAnswer(answerId, currentUser.getId());
            return ResponseEntity.ok(Map.of("message", "Answer deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/answers/{answerId}/accept")
    public ResponseEntity<?> acceptAnswer(
            @PathVariable Long answerId,
            HttpServletRequest httpRequest) {
        try {
            // ✅ Get current user from Security Context (works with cookies)
            User currentUser = SecurityUtils.getCurrentUser();
            DiscussionAnswer answer = discussionService.acceptAnswer(answerId, currentUser.getId());
            DiscussionAnswerResponse response = discussionMapper.toResponse(answer, currentUser);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Voting endpoints
    @PostMapping("/{discussionId}/vote")
    public ResponseEntity<?> voteOnDiscussion(
            @PathVariable Long discussionId,
            @Valid @RequestBody VoteRequest request,
            HttpServletRequest httpRequest) {
        try {
            // ✅ Get current user from Security Context (works with cookies)
            User currentUser = SecurityUtils.getCurrentUser();
            DiscussionVote.VoteType voteType = DiscussionVote.VoteType.valueOf(request.getVoteType());
            discussionService.voteOnDiscussion(discussionId, currentUser.getId(), voteType);
            return ResponseEntity.ok(Map.of("message", "Vote recorded successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/answers/{answerId}/vote")
    public ResponseEntity<?> voteOnAnswer(
            @PathVariable Long answerId,
            @Valid @RequestBody VoteRequest request,
            HttpServletRequest httpRequest) {
        try {
            // ✅ Get current user from Security Context (works with cookies)
            User currentUser = SecurityUtils.getCurrentUser();
            DiscussionVote.VoteType voteType = DiscussionVote.VoteType.valueOf(request.getVoteType());
            discussionService.voteOnAnswer(answerId, currentUser.getId(), voteType);
            return ResponseEntity.ok(Map.of("message", "Vote recorded successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Moderation endpoints
    @PostMapping("/{discussionId}/pin")
    public ResponseEntity<?> pinDiscussion(
            @PathVariable Long discussionId,
            HttpServletRequest httpRequest) {
        try {
            // ✅ Get current user from Security Context (works with cookies)
            User currentUser = SecurityUtils.getCurrentUser();
            Discussion discussion = discussionService.pinDiscussion(discussionId, currentUser.getId());
            DiscussionResponse response = discussionMapper.toResponse(discussion, currentUser);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{discussionId}/lock")
    public ResponseEntity<?> lockDiscussion(
            @PathVariable Long discussionId,
            HttpServletRequest httpRequest) {
        try {
            // ✅ Get current user from Security Context (works with cookies)
            User currentUser = SecurityUtils.getCurrentUser();
            Discussion discussion = discussionService.lockDiscussion(discussionId, currentUser.getId());
            DiscussionResponse response = discussionMapper.toResponse(discussion, currentUser);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Statistics endpoints
    @GetMapping("/journal/{journalId}/stats")
    public ResponseEntity<?> getDiscussionStats(@PathVariable Long journalId) {
        try {
            Long discussionCount = discussionService.getDiscussionCount(journalId);
            return ResponseEntity.ok(Map.of("discussionCount", discussionCount));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{discussionId}/stats")
    public ResponseEntity<?> getAnswerStats(@PathVariable Long discussionId) {
        try {
            Long answerCount = discussionService.getAnswerCount(discussionId);
            return ResponseEntity.ok(Map.of("answerCount", answerCount));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
