package com.dailyjournal.repository;

import com.dailyjournal.entity.Discussion;
import com.dailyjournal.entity.JournalEntry;
import com.dailyjournal.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DiscussionRepository extends JpaRepository<Discussion, Long> {
    
    // Find discussions by journal
    Page<Discussion> findByJournalAndStatusOrderByIsPinnedDescCreatedAtDesc(
        JournalEntry journal, Discussion.DiscussionStatus status, Pageable pageable);
    
    List<Discussion> findByJournalAndStatusOrderByIsPinnedDescCreatedAtDesc(
        JournalEntry journal, Discussion.DiscussionStatus status);
    
    // Find discussions by author
    Page<Discussion> findByAuthorAndStatusOrderByCreatedAtDesc(
        User author, Discussion.DiscussionStatus status, Pageable pageable);
    
    // Search discussions
    @Query("SELECT d FROM Discussion d WHERE d.status = :status AND " +
           "(LOWER(d.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.content) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY d.isPinned DESC, d.createdAt DESC")
    Page<Discussion> searchDiscussions(@Param("query") String query, 
                                     @Param("status") Discussion.DiscussionStatus status, 
                                     Pageable pageable);
    
    // Find popular discussions (by vote score)
    @Query("SELECT d FROM Discussion d WHERE d.status = :status " +
           "ORDER BY d.voteScore DESC, d.createdAt DESC")
    Page<Discussion> findPopularDiscussions(@Param("status") Discussion.DiscussionStatus status, 
                                          Pageable pageable);
    
    // Find recent discussions
    @Query("SELECT d FROM Discussion d WHERE d.status = :status AND d.createdAt >= :since " +
           "ORDER BY d.createdAt DESC")
    Page<Discussion> findRecentDiscussions(@Param("status") Discussion.DiscussionStatus status,
                                         @Param("since") LocalDateTime since,
                                         Pageable pageable);
    
    // Find unanswered discussions
    @Query("SELECT d FROM Discussion d WHERE d.status = :status AND d.answerCount = 0 " +
           "ORDER BY d.createdAt DESC")
    Page<Discussion> findUnansweredDiscussions(@Param("status") Discussion.DiscussionStatus status,
                                             Pageable pageable);
    
    // Statistics queries
    @Query("SELECT COUNT(d) FROM Discussion d WHERE d.journal = :journal AND d.status = :status")
    Long countByJournalAndStatus(@Param("journal") JournalEntry journal, 
                                @Param("status") Discussion.DiscussionStatus status);
    
    @Query("SELECT COUNT(d) FROM Discussion d WHERE d.author = :author AND d.status = :status")
    Long countByAuthorAndStatus(@Param("author") User author, 
                               @Param("status") Discussion.DiscussionStatus status);
    
    // Find discussions with most answers
    @Query("SELECT d FROM Discussion d WHERE d.status = :status " +
           "ORDER BY d.answerCount DESC, d.createdAt DESC")
    Page<Discussion> findMostAnsweredDiscussions(@Param("status") Discussion.DiscussionStatus status,
                                                Pageable pageable);
    
    // Find discussions by journal with pagination and sorting options
    @Query("SELECT d FROM Discussion d WHERE d.journal = :journal AND d.status = :status " +
           "ORDER BY " +
           "CASE WHEN :sortBy = 'votes' THEN d.voteScore END DESC, " +
           "CASE WHEN :sortBy = 'answers' THEN d.answerCount END DESC, " +
           "CASE WHEN :sortBy = 'views' THEN d.viewCount END DESC, " +
           "d.isPinned DESC, d.createdAt DESC")
    Page<Discussion> findByJournalWithSorting(@Param("journal") JournalEntry journal,
                                            @Param("status") Discussion.DiscussionStatus status,
                                            @Param("sortBy") String sortBy,
                                            Pageable pageable);
    
    // Check if user has already created a discussion for a journal
    boolean existsByJournalAndAuthor(JournalEntry journal, User author);
    
    // Find user's discussion for a specific journal
    Optional<Discussion> findByJournalAndAuthor(JournalEntry journal, User author);
    
    // Count user's discussions for a specific journal with status
    @Query("SELECT COUNT(d) FROM Discussion d WHERE d.journal = :journal AND d.author = :author AND d.status = :status")
    Long countByJournalAndAuthorAndStatus(@Param("journal") JournalEntry journal, 
                                         @Param("author") User author, 
                                         @Param("status") Discussion.DiscussionStatus status);
}
