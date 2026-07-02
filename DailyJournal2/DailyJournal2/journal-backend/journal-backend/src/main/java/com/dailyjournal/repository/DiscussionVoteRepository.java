package com.dailyjournal.repository;

import com.dailyjournal.entity.Discussion;
import com.dailyjournal.entity.DiscussionAnswer;
import com.dailyjournal.entity.DiscussionVote;
import com.dailyjournal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DiscussionVoteRepository extends JpaRepository<DiscussionVote, Long> {
    
    // Find vote by user and discussion
    Optional<DiscussionVote> findByUserAndDiscussion(User user, Discussion discussion);
    
    // Find vote by user and answer
    Optional<DiscussionVote> findByUserAndAnswer(User user, DiscussionAnswer answer);
    
    // Check if user has voted on discussion
    boolean existsByUserAndDiscussion(User user, Discussion discussion);
    
    // Check if user has voted on answer
    boolean existsByUserAndAnswer(User user, DiscussionAnswer answer);
    
    // Calculate vote score for discussion
    @Query("SELECT COALESCE(SUM(CASE WHEN v.voteType = 'UPVOTE' THEN 1 ELSE -1 END), 0) " +
           "FROM DiscussionVote v WHERE v.discussion = :discussion")
    Long calculateDiscussionVoteScore(@Param("discussion") Discussion discussion);
    
    // Calculate vote score for answer
    @Query("SELECT COALESCE(SUM(CASE WHEN v.voteType = 'UPVOTE' THEN 1 ELSE -1 END), 0) " +
           "FROM DiscussionVote v WHERE v.answer = :answer")
    Long calculateAnswerVoteScore(@Param("answer") DiscussionAnswer answer);
    
    // Count upvotes for discussion
    @Query("SELECT COUNT(v) FROM DiscussionVote v WHERE v.discussion = :discussion AND v.voteType = 'UPVOTE'")
    Long countDiscussionUpvotes(@Param("discussion") Discussion discussion);
    
    // Count downvotes for discussion
    @Query("SELECT COUNT(v) FROM DiscussionVote v WHERE v.discussion = :discussion AND v.voteType = 'DOWNVOTE'")
    Long countDiscussionDownvotes(@Param("discussion") Discussion discussion);
    
    // Count upvotes for answer
    @Query("SELECT COUNT(v) FROM DiscussionVote v WHERE v.answer = :answer AND v.voteType = 'UPVOTE'")
    Long countAnswerUpvotes(@Param("answer") DiscussionAnswer answer);
    
    // Count downvotes for answer
    @Query("SELECT COUNT(v) FROM DiscussionVote v WHERE v.answer = :answer AND v.voteType = 'DOWNVOTE'")
    Long countAnswerDownvotes(@Param("answer") DiscussionAnswer answer);
    
    // Delete vote by user and discussion
    void deleteByUserAndDiscussion(User user, Discussion discussion);
    
    // Delete vote by user and answer
    void deleteByUserAndAnswer(User user, DiscussionAnswer answer);
    
    // Find all votes by user
    @Query("SELECT v FROM DiscussionVote v WHERE v.user = :user ORDER BY v.createdAt DESC")
    java.util.List<DiscussionVote> findByUserOrderByCreatedAtDesc(@Param("user") User user);
}
