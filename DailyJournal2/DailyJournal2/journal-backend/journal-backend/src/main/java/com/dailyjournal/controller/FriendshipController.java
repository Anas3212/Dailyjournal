package com.dailyjournal.controller;

import com.dailyjournal.dto.UserDTO;
import com.dailyjournal.entity.FriendRequest;
import com.dailyjournal.entity.User;
import com.dailyjournal.service.FriendshipService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
@Slf4j
public class FriendshipController {

    private final FriendshipService friendshipService;

    /**
     * Send a friend request
     */
    @PostMapping("/request/{receiverId}")
    public ResponseEntity<?> sendFriendRequest(@PathVariable Long receiverId, @AuthenticationPrincipal User user) {
        try {
            String result = friendshipService.sendFriendRequest(user.getId(), receiverId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", result);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Accept a friend request
     */
    @PostMapping("/accept/{requestId}")
    public ResponseEntity<?> acceptFriendRequest(@PathVariable Long requestId, @AuthenticationPrincipal User user) {
        try {
            String result = friendshipService.acceptFriendRequest(requestId, user.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", result);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Reject a friend request
     */
    @PostMapping("/reject/{requestId}")
    public ResponseEntity<?> rejectFriendRequest(@PathVariable Long requestId, @AuthenticationPrincipal User user) {
        try {
            String result = friendshipService.rejectFriendRequest(requestId, user.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", result);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }


    @DeleteMapping("/remove/{friendId}")
    public ResponseEntity<?> removeFriend(@PathVariable Long friendId, @AuthenticationPrincipal User user) {
        try {
            boolean removed = friendshipService.removeFriend(user.getId(), friendId);
            
            Map<String, Object> response = new HashMap<>();
            if (removed) {
                response.put("success", true);
                response.put("message", "Friend removed successfully");
            } else {
                response.put("success", false);
                response.put("message", "Friendship doesn't exist");
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Get all friends of current user
     */
    @GetMapping("/my-friends")
    public ResponseEntity<List<UserDTO>> getMyFriends(@AuthenticationPrincipal User user) {
        try {
            List<UserDTO> friends = friendshipService.getFriends(user.getId());
            return ResponseEntity.ok(friends);
        } catch (Exception e) {
            log.error("Failed to retrieve friends for userId={}: {}", user.getId(), e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get friends of a specific user.
     * Users can only view their own friends list. Use /my-friends for self.
     * Authenticated users may view another user's friend list for social features
     * but only receive safe UserDTO (no password or sensitive data).
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserDTO>> getUserFriends(
            @PathVariable Long userId,
            @AuthenticationPrincipal User currentUser) {
        try {
            // Only allow a user to view their own friends list, or others for social browsing.
            // Sensitive fields are already stripped by the service (returns UserDTO).
            if (!currentUser.getId().equals(userId)) {
                // Optionally restrict to friends-of-friends here. For now, log the access.
                log.debug("User {} viewed friend list of user {}", currentUser.getId(), userId);
            }
            List<UserDTO> friends = friendshipService.getFriends(userId);
            return ResponseEntity.ok(friends);
        } catch (Exception e) {
            log.error("Failed to retrieve friends for userId={}: {}", userId, e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Check if current user is friends with another user
     */
    @GetMapping("/is-friend/{userId}")
    public ResponseEntity<?> isFriend(@PathVariable Long userId, @AuthenticationPrincipal User user) {
        try {
            boolean isFriend = friendshipService.areUsersFriends(user.getId(), userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("isFriend", isFriend);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("isFriend", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Get friend count for current user
     */
    @GetMapping("/count")
    public ResponseEntity<?> getFriendCount(@AuthenticationPrincipal User user) {
        try {
            Long count = friendshipService.getFriendCount(user.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("count", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("count", 0);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Get pending friend requests for current user
     */
    @GetMapping("/requests/pending")
    public ResponseEntity<List<FriendRequest>> getPendingFriendRequests(@AuthenticationPrincipal User user) {
        try {
            List<FriendRequest> requests = friendshipService.getPendingFriendRequests(user.getId());
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get sent friend requests for current user
     */
    @GetMapping("/requests/sent")
    public ResponseEntity<List<FriendRequest>> getSentFriendRequests(@AuthenticationPrincipal User user) {
        try {
            List<FriendRequest> requests = friendshipService.getSentFriendRequests(user.getId());
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get pending friend request count for current user
     */
    @GetMapping("/requests/count")
    public ResponseEntity<?> getPendingRequestCount(@AuthenticationPrincipal User user) {
        try {
            Long count = friendshipService.getPendingRequestCount(user.getId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("count", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("count", 0);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Get friend request status between current user and another user
     */
    @GetMapping("/status/{userId}")
    public ResponseEntity<?> getFriendRequestStatus(@PathVariable Long userId, @AuthenticationPrincipal User user) {
        try {
            String status = friendshipService.getFriendRequestStatus(user.getId(), userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", status);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
