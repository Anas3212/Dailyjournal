package com.dailyjournal.repository;

import com.dailyjournal.entity.Discussion;
import com.dailyjournal.entity.DiscussionAnswer;
import com.dailyjournal.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiscussionAnswerRepository extends JpaRepository<DiscussionAnswer, Long> {
    
    // Find answers by discussion (top-level only)
    Page<DiscussionAnswer> findByDiscussionAndParentAnswerIsNullAndIsDeletedFalseOrderByIsAcceptedDescVoteScoreDescCreatedAtAsc(
        Discussion discussion, Pageable pageable);
    
    List<DiscussionAnswer> findByDiscussionAndParentAnswerIsNullAndIsDeletedFalseOrderByIsAcceptedDescVoteScoreDescCreatedAtAsc(
        Discussion discussion);
    
    // Find replies to a specific answer
    List<DiscussionAnswer> findByParentAnswerAndIsDeletedFalseOrderByCreatedAtAsc(DiscussionAnswer parentAnswer);
    
    Page<DiscussionAnswer> findByParentAnswerAndIsDeletedFalseOrderByCreatedAtAsc(
        DiscussionAnswer parentAnswer, Pageable pageable);
    
    // Find answers by author
    Page<DiscussionAnswer> findByAuthorAndIsDeletedFalseOrderByCreatedAtDesc(User author, Pageable pageable);
    
    // Find accepted answers by discussion
    List<DiscussionAnswer> findByDiscussionAndIsAcceptedTrueAndIsDeletedFalse(Discussion discussion);
    
    // Statistics queries
    @Query("SELECT COUNT(a) FROM DiscussionAnswer a WHERE a.discussion = :discussion AND a.isDeleted = false")
    Long countByDiscussionAndNotDeleted(@Param("discussion") Discussion discussion);
    
    @Query("SELECT COUNT(a) FROM DiscussionAnswer a WHERE a.parentAnswer = :parentAnswer AND a.isDeleted = false")
    Long countRepliesByParentAnswer(@Param("parentAnswer") DiscussionAnswer parentAnswer);
    
    @Query("SELECT COUNT(a) FROM DiscussionAnswer a WHERE a.author = :author AND a.isDeleted = false")
    Long countByAuthorAndNotDeleted(@Param("author") User author);
    
    // Find top-rated answers
    @Query("SELECT a FROM DiscussionAnswer a WHERE a.discussion = :discussion AND a.isDeleted = false " +
           "ORDER BY a.voteScore DESC, a.createdAt ASC")
    Page<DiscussionAnswer> findTopRatedAnswers(@Param("discussion") Discussion discussion, Pageable pageable);
    
    // Find recent answers
    @Query("SELECT a FROM DiscussionAnswer a WHERE a.discussion = :discussion AND a.isDeleted = false " +
           "ORDER BY a.createdAt DESC")
    Page<DiscussionAnswer> findRecentAnswers(@Param("discussion") Discussion discussion, Pageable pageable);
    
    // Search answers within a discussion
    @Query("SELECT a FROM DiscussionAnswer a WHERE a.discussion = :discussion AND a.isDeleted = false AND " +
           "LOWER(a.content) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY a.voteScore DESC, a.createdAt ASC")
    Page<DiscussionAnswer> searchAnswersInDiscussion(@Param("discussion") Discussion discussion,
                                                    @Param("query") String query,
                                                    Pageable pageable);
    
    // Find answers with sorting options
    @Query("SELECT a FROM DiscussionAnswer a WHERE a.discussion = :discussion AND a.parentAnswer IS NULL AND a.isDeleted = false " +
           "ORDER BY " +
           "CASE WHEN :sortBy = 'votes' THEN a.voteScore END DESC, " +
           "CASE WHEN :sortBy = 'oldest' THEN a.createdAt END ASC, " +
           "CASE WHEN :sortBy = 'newest' THEN a.createdAt END DESC, " +
           "a.isAccepted DESC, a.voteScore DESC, a.createdAt ASC")
    Page<DiscussionAnswer> findByDiscussionWithSorting(@Param("discussion") Discussion discussion,
                                                      @Param("sortBy") String sortBy,
                                                      Pageable pageable);
    
    // Check if discussion has accepted answer
    boolean existsByDiscussionAndIsAcceptedTrueAndIsDeletedFalse(Discussion discussion);
    
    // Find user's answer for a specific discussion
    List<DiscussionAnswer> findByDiscussionAndAuthorAndIsDeletedFalse(Discussion discussion, User author);
}
