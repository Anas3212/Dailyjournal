package com.dailyjournal.repository;

import com.dailyjournal.entity.FriendRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {

    // Find pending friend request between two users
    @Query("SELECT fr FROM FriendRequest fr JOIN FETCH fr.sender JOIN FETCH fr.receiver WHERE fr.sender.id = :senderId AND fr.receiver.id = :receiverId AND fr.status = 'PENDING'")
    Optional<FriendRequest> findPendingRequestBetweenUsers(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId);

    // Find any friend request between two users (regardless of status)
    @Query("SELECT fr FROM FriendRequest fr JOIN FETCH fr.sender JOIN FETCH fr.receiver WHERE (fr.sender.id = :userId1 AND fr.receiver.id = :userId2) OR (fr.sender.id = :userId2 AND fr.receiver.id = :userId1)")
    Optional<FriendRequest> findRequestBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    // Get all pending friend requests received by a user
    @Query("SELECT fr FROM FriendRequest fr JOIN FETCH fr.sender JOIN FETCH fr.receiver WHERE fr.receiver.id = :userId AND fr.status = 'PENDING' ORDER BY fr.createdAt DESC")
    List<FriendRequest> findPendingRequestsForUser(@Param("userId") Long userId);

    // Get all pending friend requests sent by a user
    @Query("SELECT fr FROM FriendRequest fr JOIN FETCH fr.sender JOIN FETCH fr.receiver WHERE fr.sender.id = :userId AND fr.status = 'PENDING' ORDER BY fr.createdAt DESC")
    List<FriendRequest> findPendingRequestsBySender(@Param("userId") Long userId);

    // Get all accepted friend requests involving a user (for friends list)
    @Query("SELECT fr FROM FriendRequest fr JOIN FETCH fr.sender JOIN FETCH fr.receiver WHERE (fr.sender.id = :userId OR fr.receiver.id = :userId) AND fr.status = 'ACCEPTED' ORDER BY fr.updatedAt DESC")
    List<FriendRequest> findAcceptedRequestsForUser(@Param("userId") Long userId);

    // Count pending friend requests for a user
    @Query("SELECT COUNT(fr) FROM FriendRequest fr WHERE fr.receiver.id = :userId AND fr.status = 'PENDING'")
    Long countPendingRequestsForUser(@Param("userId") Long userId);

    // Check if users are friends (have accepted friend request)
    @Query("SELECT COUNT(fr) > 0 FROM FriendRequest fr WHERE ((fr.sender.id = :userId1 AND fr.receiver.id = :userId2) OR (fr.sender.id = :userId2 AND fr.receiver.id = :userId1)) AND fr.status = 'ACCEPTED'")
    boolean areUsersFriends(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    // Count friends of a user
    @Query("SELECT COUNT(fr) FROM FriendRequest fr WHERE (fr.sender.id = :userId OR fr.receiver.id = :userId) AND fr.status = 'ACCEPTED'")
    Long countFriendsByUserId(@Param("userId") Long userId);
}
