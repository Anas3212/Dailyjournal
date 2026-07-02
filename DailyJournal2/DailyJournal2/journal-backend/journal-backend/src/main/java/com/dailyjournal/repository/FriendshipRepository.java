package com.dailyjournal.repository;

import com.dailyjournal.entity.Friendship;
import com.dailyjournal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    // Check if friendship exists between two users (bidirectional)
    @Query("SELECT f FROM Friendship f WHERE (f.user.id = :userId AND f.friend.id = :friendId) OR (f.user.id = :friendId AND f.friend.id = :userId)")
    Optional<Friendship> findFriendshipBetweenUsers(@Param("userId") Long userId, @Param("friendId") Long friendId);

    // Get friends where user is the initiator
    @Query("SELECT f.friend FROM Friendship f WHERE f.user.id = :userId")
    List<User> findFriendsAsUser(@Param("userId") Long userId);
    
    // Get friends where user is the friend
    @Query("SELECT f.user FROM Friendship f WHERE f.friend.id = :userId")
    List<User> findFriendsAsFriend(@Param("userId") Long userId);

    // Count friends of a user
    @Query("SELECT COUNT(f) FROM Friendship f WHERE f.user.id = :userId OR f.friend.id = :userId")
    Long countFriendsByUserId(@Param("userId") Long userId);

    // Check if two users are friends
    @Query("SELECT COUNT(f) > 0 FROM Friendship f WHERE (f.user.id = :userId AND f.friend.id = :friendId) OR (f.user.id = :friendId AND f.friend.id = :userId)")
    boolean areUsersFriends(@Param("userId") Long userId, @Param("friendId") Long friendId);
}
