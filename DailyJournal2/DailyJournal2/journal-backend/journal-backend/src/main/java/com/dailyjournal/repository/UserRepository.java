package com.dailyjournal.repository;

import com.dailyjournal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);

    // Find users by name or email (case-insensitive search)
    List<User> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(String name, String email);
    
    // Find users by community (excluding current user)
    List<User> findByCommunityIgnoreCaseAndIdNot(String community, Long userId);
    
    // Find all users by community (including current user)
    List<User> findByCommunityIgnoreCase(String community);
    
    // Count users by community
    Long countByCommunityIgnoreCase(String community);
    
    // Find all distinct communities
    @Query("SELECT DISTINCT u.community FROM User u WHERE u.community IS NOT NULL AND u.community != ''")
    List<String> findDistinctCommunities();
}
