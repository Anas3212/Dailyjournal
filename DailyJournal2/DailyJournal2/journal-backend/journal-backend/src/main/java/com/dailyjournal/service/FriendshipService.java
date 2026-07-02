package com.dailyjournal.service;

import com.dailyjournal.dto.UserDTO;
import com.dailyjournal.entity.Friendship;
import com.dailyjournal.entity.FriendRequest;
import com.dailyjournal.entity.User;
import com.dailyjournal.repository.FriendshipRepository;
import com.dailyjournal.repository.FriendRequestRepository;
import com.dailyjournal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final FriendRequestRepository friendRequestRepository;
    private final UserRepository userRepository;

    /**
     * Send a friend request to another user
     */
    public String sendFriendRequest(Long senderId, Long receiverId) {
        // Validate that users exist
        Optional<User> sender = userRepository.findById(senderId);
        Optional<User> receiver = userRepository.findById(receiverId);
        
        if (sender.isEmpty() || receiver.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        
        // Prevent self-friendship
        if (senderId.equals(receiverId)) {
            throw new RuntimeException("Cannot send friend request to yourself");
        }
        
        // Check if users are already friends
        if (friendRequestRepository.areUsersFriends(senderId, receiverId)) {
            return "Already friends";
        }
        
        // Check if there's already a pending request between these users
        Optional<FriendRequest> existingRequest = friendRequestRepository.findRequestBetweenUsers(senderId, receiverId);
        if (existingRequest.isPresent()) {
            FriendRequest request = existingRequest.get();
            if (request.getStatus() == FriendRequest.FriendRequestStatus.PENDING) {
                if (request.getSender().getId().equals(senderId)) {
                    return "Friend request already sent";
                } else {
                    return "This user has already sent you a friend request";
                }
            }
        }
        
        // Create new friend request
        FriendRequest friendRequest = FriendRequest.builder()
                .sender(sender.get())
                .receiver(receiver.get())
                .status(FriendRequest.FriendRequestStatus.PENDING)
                .build();
        
        friendRequestRepository.save(friendRequest);
        return "Friend request sent successfully";
    }

    /**
     * Accept a friend request
     */
    public String acceptFriendRequest(Long requestId, Long userId) {
        Optional<FriendRequest> requestOpt = friendRequestRepository.findById(requestId);
        
        if (requestOpt.isEmpty()) {
            throw new RuntimeException("Friend request not found");
        }
        
        FriendRequest request = requestOpt.get();
        
        // Verify that the current user is the receiver of the request
        if (!request.getReceiver().getId().equals(userId)) {
            throw new RuntimeException("You can only accept requests sent to you");
        }
        
        // Check if request is still pending
        if (request.getStatus() != FriendRequest.FriendRequestStatus.PENDING) {
            return "Friend request is no longer pending";
        }
        
        // Update request status to accepted
        request.setStatus(FriendRequest.FriendRequestStatus.ACCEPTED);
        friendRequestRepository.save(request);
        
        // Also create a friendship record for backward compatibility
        Friendship friendship = Friendship.builder()
                .user(request.getSender())
                .friend(request.getReceiver())
                .build();
        friendshipRepository.save(friendship);
        
        return "Friend request accepted";
    }

    /**
     * Reject a friend request
     */
    public String rejectFriendRequest(Long requestId, Long userId) {
        Optional<FriendRequest> requestOpt = friendRequestRepository.findById(requestId);
        
        if (requestOpt.isEmpty()) {
            throw new RuntimeException("Friend request not found");
        }
        
        FriendRequest request = requestOpt.get();
        
        // Verify that the current user is the receiver of the request
        if (!request.getReceiver().getId().equals(userId)) {
            throw new RuntimeException("You can only reject requests sent to you");
        }
        
        // Check if request is still pending
        if (request.getStatus() != FriendRequest.FriendRequestStatus.PENDING) {
            return "Friend request is no longer pending";
        }
        
        // Update request status to rejected
        request.setStatus(FriendRequest.FriendRequestStatus.REJECTED);
        friendRequestRepository.save(request);
        
        return "Friend request rejected";
    }

    /**
     * Add a friend relationship between two users (legacy method for backward compatibility)
     */
    @Deprecated
    public boolean addFriend(Long userId, Long friendId) {
        // This method is kept for backward compatibility
        // It now creates an accepted friend request instead of direct friendship
        try {
            String result = sendFriendRequest(userId, friendId);
            if (result.equals("Friend request sent successfully")) {
                // Auto-accept the request for backward compatibility
                Optional<FriendRequest> request = friendRequestRepository.findPendingRequestBetweenUsers(userId, friendId);
                if (request.isPresent()) {
                    acceptFriendRequest(request.get().getId(), friendId);
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Remove a friend relationship between two users
     */
    public boolean removeFriend(Long userId, Long friendId) {
        // Remove from both friendship table and friend request table
        boolean removedFromFriendship = false;
        boolean removedFromRequests = false;
        
        // Remove from friendship table
        Optional<Friendship> friendship = friendshipRepository.findFriendshipBetweenUsers(userId, friendId);
        if (friendship.isPresent()) {
            friendshipRepository.delete(friendship.get());
            removedFromFriendship = true;
        }
        
        // Remove from friend requests table (set accepted requests back to rejected)
        Optional<FriendRequest> friendRequest = friendRequestRepository.findRequestBetweenUsers(userId, friendId);
        if (friendRequest.isPresent() && friendRequest.get().getStatus() == FriendRequest.FriendRequestStatus.ACCEPTED) {
            friendRequestRepository.delete(friendRequest.get());
            removedFromRequests = true;
        }
        
        return removedFromFriendship || removedFromRequests;
    }

    /**
     * Get all friends of a user as safe DTOs (no password or sensitive fields).
     */
    @Transactional(readOnly = true)
    public List<UserDTO> getFriends(Long userId) {
        // Get friends from accepted friend requests
        List<FriendRequest> acceptedRequests = friendRequestRepository.findAcceptedRequestsForUser(userId);
        List<User> friends = acceptedRequests.stream()
                .map(request -> {
                    if (request.getSender().getId().equals(userId)) {
                        return request.getReceiver();
                    } else {
                        return request.getSender();
                    }
                })
                .collect(Collectors.toList());

        // Also include friends from legacy friendship table for backward compatibility
        List<User> legacyFriends = new ArrayList<>();
        legacyFriends.addAll(friendshipRepository.findFriendsAsUser(userId));
        legacyFriends.addAll(friendshipRepository.findFriendsAsFriend(userId));

        // Merge and deduplicate
        for (User legacyFriend : legacyFriends) {
            if (friends.stream().noneMatch(f -> f.getId().equals(legacyFriend.getId()))) {
                friends.add(legacyFriend);
            }
        }

        return friends.stream().map(this::toUserDTO).collect(Collectors.toList());
    }

    /**
     * Maps a User entity to a safe DTO that excludes the password and other sensitive fields.
     */
    private UserDTO toUserDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setProfilePicture(user.getProfilePicture());
        dto.setCommunity(user.getCommunity());
        return dto;
    }

    /**
     * Check if two users are friends
     */
    @Transactional(readOnly = true)
    public boolean areUsersFriends(Long userId, Long friendId) {
        // Check both friend request table and legacy friendship table
        return friendRequestRepository.areUsersFriends(userId, friendId) || 
               friendshipRepository.areUsersFriends(userId, friendId);
    }

    /**
     * Get friend count for a user.
     * Uses direct COUNT queries instead of loading all User entities into memory.
     * Returns the deduplicated count via getFriends() only if both tables have data
     * (to handle legacy data overlap), otherwise uses fast COUNT queries.
     */
    @Transactional(readOnly = true)
    public Long getFriendCount(Long userId) {
        Long requestCount = friendRequestRepository.countFriendsByUserId(userId);
        Long legacyCount = friendshipRepository.countFriendsByUserId(userId);

        if (legacyCount == 0) {
            // Fast path: no legacy data, just use the request count
            return requestCount;
        }

        // Legacy data exists — must deduplicate to get accurate count
        log.debug("Legacy friendship data detected for userId={}, deduplicating count", userId);
        return (long) getFriends(userId).size();
    }

    /**
     * Get pending friend requests for a user
     */
    @Transactional(readOnly = true)
    public List<FriendRequest> getPendingFriendRequests(Long userId) {
        return friendRequestRepository.findPendingRequestsForUser(userId);
    }

    /**
     * Get pending friend requests sent by a user
     */
    @Transactional(readOnly = true)
    public List<FriendRequest> getSentFriendRequests(Long userId) {
        return friendRequestRepository.findPendingRequestsBySender(userId);
    }

    /**
     * Get count of pending friend requests for a user
     */
    @Transactional(readOnly = true)
    public Long getPendingRequestCount(Long userId) {
        return friendRequestRepository.countPendingRequestsForUser(userId);
    }

    /**
     * Get friend request status between two users
     */
    @Transactional(readOnly = true)
    public String getFriendRequestStatus(Long userId1, Long userId2) {
        if (areUsersFriends(userId1, userId2)) {
            return "FRIENDS";
        }
        
        Optional<FriendRequest> request = friendRequestRepository.findRequestBetweenUsers(userId1, userId2);
        if (request.isPresent()) {
            FriendRequest fr = request.get();
            if (fr.getStatus() == FriendRequest.FriendRequestStatus.PENDING) {
                if (fr.getSender().getId().equals(userId1)) {
                    return "REQUEST_SENT";
                } else {
                    return "REQUEST_RECEIVED";
                }
            } else if (fr.getStatus() == FriendRequest.FriendRequestStatus.REJECTED) {
                return "REJECTED";
            }
        }
        
        return "NONE";
    }
}
