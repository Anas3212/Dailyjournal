package com.dailyjournal.service;

import com.dailyjournal.entity.*;
import com.dailyjournal.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class DiscussionService {

    @Autowired
    private DiscussionRepository discussionRepository;

    @Autowired
    private DiscussionAnswerRepository answerRepository;

    @Autowired
    private DiscussionVoteRepository voteRepository;

    @Autowired
    private JournalRepository journalRepository;

    @Autowired
    private UserRepository userRepository;

    // Discussion CRUD operations
    public Discussion createDiscussion(Long journalId, Long authorId, String title, String content) {
        JournalEntry journal = journalRepository.findById(journalId)
            .orElseThrow(() -> new RuntimeException("Journal not found"));
        
        User author = userRepository.findById(authorId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate that journal is published
        if (!journal.isPublished()) {
            throw new RuntimeException("Cannot create discussion for unpublished journal");
        }

        // Check if user has reached the limit of 3 discussions for this journal
        long userDiscussionCount = discussionRepository.countByJournalAndAuthorAndStatus(journal, author, Discussion.DiscussionStatus.ACTIVE);
        if (userDiscussionCount >= 3) {
            throw new RuntimeException("You can only create up to 3 discussions per journal");
        }

        Discussion discussion = new Discussion();
        discussion.setTitle(title);
        discussion.setContent(content);
        discussion.setJournal(journal);
        discussion.setAuthor(author);
        discussion.setStatus(Discussion.DiscussionStatus.ACTIVE);

        return discussionRepository.save(discussion);
    }

    public Discussion updateDiscussion(Long discussionId, Long userId, String title, String content) {
        Discussion discussion = discussionRepository.findById(discussionId)
            .orElseThrow(() -> new RuntimeException("Discussion not found"));

        // Check if user is the author
        if (!discussion.getAuthor().getId().equals(userId)) {
            throw new RuntimeException("Only discussion author can update discussion");
        }

        // Check if discussion is locked
        if (discussion.getIsLocked()) {
            throw new RuntimeException("Cannot update locked discussion");
        }

        discussion.setTitle(title);
        discussion.setContent(content);
        discussion.setIsEdited(true);

        return discussionRepository.save(discussion);
    }

    public void deleteDiscussion(Long discussionId, Long userId) {
        Discussion discussion = discussionRepository.findById(discussionId)
            .orElseThrow(() -> new RuntimeException("Discussion not found"));

        // Check if user is the author or journal owner
        boolean isAuthor = discussion.getAuthor().getId().equals(userId);
        boolean isJournalOwner = discussion.getJournal().getUser().getId().equals(userId);

        if (!isAuthor && !isJournalOwner) {
            throw new RuntimeException("Only discussion author or journal owner can delete discussion");
        }

        discussion.setStatus(Discussion.DiscussionStatus.DELETED);
        discussionRepository.save(discussion);
    }

    public Discussion getDiscussion(Long discussionId) {
        Discussion discussion = discussionRepository.findById(discussionId)
            .orElseThrow(() -> new RuntimeException("Discussion not found"));

        if (discussion.getStatus() == Discussion.DiscussionStatus.DELETED) {
            throw new RuntimeException("Discussion not found");
        }

        // Increment view count
        discussion.incrementViewCount();
        return discussionRepository.save(discussion);
    }

    // Discussion queries
    public Page<Discussion> getDiscussionsByJournal(Long journalId, String sortBy, Pageable pageable) {
        JournalEntry journal = journalRepository.findById(journalId)
            .orElseThrow(() -> new RuntimeException("Journal not found"));

        if (sortBy != null && !sortBy.isEmpty()) {
            return discussionRepository.findByJournalWithSorting(
                journal, Discussion.DiscussionStatus.ACTIVE, sortBy, pageable);
        }

        return discussionRepository.findByJournalAndStatusOrderByIsPinnedDescCreatedAtDesc(
            journal, Discussion.DiscussionStatus.ACTIVE, pageable);
    }

    public Page<Discussion> searchDiscussions(String query, Pageable pageable) {
        return discussionRepository.searchDiscussions(
            query, Discussion.DiscussionStatus.ACTIVE, pageable);
    }

    public Page<Discussion> getPopularDiscussions(Pageable pageable) {
        return discussionRepository.findPopularDiscussions(
            Discussion.DiscussionStatus.ACTIVE, pageable);
    }

    public Page<Discussion> getRecentDiscussions(int days, Pageable pageable) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        return discussionRepository.findRecentDiscussions(
            Discussion.DiscussionStatus.ACTIVE, since, pageable);
    }

    // Answer CRUD operations
    public DiscussionAnswer createAnswer(Long discussionId, Long authorId, String content, Long parentAnswerId) {
        Discussion discussion = discussionRepository.findById(discussionId)
            .orElseThrow(() -> new RuntimeException("Discussion not found"));

        User author = userRepository.findById(authorId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if discussion is locked
        if (discussion.getIsLocked()) {
            throw new RuntimeException("Cannot answer locked discussion");
        }

        DiscussionAnswer answer = new DiscussionAnswer();
        answer.setContent(content);
        answer.setDiscussion(discussion);
        answer.setAuthor(author);

        // Handle parent answer for replies
        if (parentAnswerId != null) {
            DiscussionAnswer parentAnswer = answerRepository.findById(parentAnswerId)
                .orElseThrow(() -> new RuntimeException("Parent answer not found"));
            
            // Validate parent answer belongs to same discussion
            if (!parentAnswer.getDiscussion().getId().equals(discussionId)) {
                throw new RuntimeException("Parent answer does not belong to this discussion");
            }

            answer.setParentAnswer(parentAnswer);
            parentAnswer.incrementReplyCount();
            answerRepository.save(parentAnswer);
        }

        DiscussionAnswer savedAnswer = answerRepository.save(answer);

        // Update discussion answer count
        discussion.incrementAnswerCount();
        discussionRepository.save(discussion);

        return savedAnswer;
    }

    public DiscussionAnswer updateAnswer(Long answerId, Long userId, String content) {
        DiscussionAnswer answer = answerRepository.findById(answerId)
            .orElseThrow(() -> new RuntimeException("Answer not found"));

        // Check if user is the author
        if (!answer.getAuthor().getId().equals(userId)) {
            throw new RuntimeException("Only answer author can update answer");
        }

        // Check if discussion is locked
        if (answer.getDiscussion().getIsLocked()) {
            throw new RuntimeException("Cannot update answer in locked discussion");
        }

        answer.setContent(content);
        answer.setIsEdited(true);

        return answerRepository.save(answer);
    }

    public void deleteAnswer(Long answerId, Long userId) {
        DiscussionAnswer answer = answerRepository.findById(answerId)
            .orElseThrow(() -> new RuntimeException("Answer not found"));

        // Check if user is the author or journal owner
        boolean isAuthor = answer.getAuthor().getId().equals(userId);
        boolean isJournalOwner = answer.getDiscussion().getJournal().getUser().getId().equals(userId);

        if (!isAuthor && !isJournalOwner) {
            throw new RuntimeException("Only answer author or journal owner can delete answer");
        }

        answer.setIsDeleted(true);
        answerRepository.save(answer);

        // Update counts
        Discussion discussion = answer.getDiscussion();
        discussion.decrementAnswerCount();
        discussionRepository.save(discussion);

        if (answer.getParentAnswer() != null) {
            answer.getParentAnswer().decrementReplyCount();
            answerRepository.save(answer.getParentAnswer());
        }
    }

    public DiscussionAnswer acceptAnswer(Long answerId, Long userId) {
        DiscussionAnswer answer = answerRepository.findById(answerId)
            .orElseThrow(() -> new RuntimeException("Answer not found"));

        Discussion discussion = answer.getDiscussion();

        // Check if user is the discussion author
        if (!discussion.getAuthor().getId().equals(userId)) {
            throw new RuntimeException("Only discussion author can accept answers");
        }

        // Unaccept any previously accepted answers
        List<DiscussionAnswer> acceptedAnswers = answerRepository
            .findByDiscussionAndIsAcceptedTrueAndIsDeletedFalse(discussion);
        
        for (DiscussionAnswer acceptedAnswer : acceptedAnswers) {
            acceptedAnswer.setIsAccepted(false);
            answerRepository.save(acceptedAnswer);
        }

        // Accept this answer
        answer.setIsAccepted(true);
        return answerRepository.save(answer);
    }

    // Answer queries
    public Page<DiscussionAnswer> getAnswersByDiscussion(Long discussionId, String sortBy, Pageable pageable) {
        Discussion discussion = discussionRepository.findById(discussionId)
            .orElseThrow(() -> new RuntimeException("Discussion not found"));

        if (sortBy != null && !sortBy.isEmpty()) {
            return answerRepository.findByDiscussionWithSorting(discussion, sortBy, pageable);
        }

        return answerRepository.findByDiscussionAndParentAnswerIsNullAndIsDeletedFalseOrderByIsAcceptedDescVoteScoreDescCreatedAtAsc(
            discussion, pageable);
    }

    public List<DiscussionAnswer> getRepliesByAnswer(Long answerId) {
        DiscussionAnswer answer = answerRepository.findById(answerId)
            .orElseThrow(() -> new RuntimeException("Answer not found"));

        return answerRepository.findByParentAnswerAndIsDeletedFalseOrderByCreatedAtAsc(answer);
    }

    // Voting operations
    public void voteOnDiscussion(Long discussionId, Long userId, DiscussionVote.VoteType voteType) {
        Discussion discussion = discussionRepository.findById(discussionId)
            .orElseThrow(() -> new RuntimeException("Discussion not found"));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user is trying to vote on their own discussion
        if (discussion.getAuthor().getId().equals(userId)) {
            throw new RuntimeException("Cannot vote on your own discussion");
        }

        Optional<DiscussionVote> existingVote = voteRepository.findByUserAndDiscussion(user, discussion);

        if (existingVote.isPresent()) {
            DiscussionVote vote = existingVote.get();
            if (vote.getVoteType() == voteType) {
                // Remove vote if same type
                voteRepository.delete(vote);
            } else {
                // Change vote type
                vote.setVoteType(voteType);
                voteRepository.save(vote);
            }
        } else {
            // Create new vote
            DiscussionVote vote = new DiscussionVote();
            vote.setUser(user);
            vote.setDiscussion(discussion);
            vote.setVoteType(voteType);
            voteRepository.save(vote);
        }

        // Update discussion vote score
        Long newScore = voteRepository.calculateDiscussionVoteScore(discussion);
        discussion.updateVoteScore(newScore);
        discussionRepository.save(discussion);
    }

    public void voteOnAnswer(Long answerId, Long userId, DiscussionVote.VoteType voteType) {
        DiscussionAnswer answer = answerRepository.findById(answerId)
            .orElseThrow(() -> new RuntimeException("Answer not found"));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user is trying to vote on their own answer
        if (answer.getAuthor().getId().equals(userId)) {
            throw new RuntimeException("Cannot vote on your own answer");
        }

        Optional<DiscussionVote> existingVote = voteRepository.findByUserAndAnswer(user, answer);

        if (existingVote.isPresent()) {
            DiscussionVote vote = existingVote.get();
            if (vote.getVoteType() == voteType) {
                // Remove vote if same type
                voteRepository.delete(vote);
            } else {
                // Change vote type
                vote.setVoteType(voteType);
                voteRepository.save(vote);
            }
        } else {
            // Create new vote
            DiscussionVote vote = new DiscussionVote();
            vote.setUser(user);
            vote.setAnswer(answer);
            vote.setVoteType(voteType);
            voteRepository.save(vote);
        }

        // Update answer vote score
        Long newScore = voteRepository.calculateAnswerVoteScore(answer);
        answer.updateVoteScore(newScore);
        answerRepository.save(answer);
    }

    // Statistics
    public Long getDiscussionCount(Long journalId) {
        JournalEntry journal = journalRepository.findById(journalId)
            .orElseThrow(() -> new RuntimeException("Journal not found"));

        return discussionRepository.countByJournalAndStatus(journal, Discussion.DiscussionStatus.ACTIVE);
    }

    public Long getAnswerCount(Long discussionId) {
        Discussion discussion = discussionRepository.findById(discussionId)
            .orElseThrow(() -> new RuntimeException("Discussion not found"));

        return answerRepository.countByDiscussionAndNotDeleted(discussion);
    }

    // Moderation operations
    public Discussion pinDiscussion(Long discussionId, Long userId) {
        Discussion discussion = discussionRepository.findById(discussionId)
            .orElseThrow(() -> new RuntimeException("Discussion not found"));

        // Check if user is the journal owner
        if (!discussion.getJournal().getUser().getId().equals(userId)) {
            throw new RuntimeException("Only journal owner can pin discussions");
        }

        discussion.setIsPinned(!discussion.getIsPinned());
        return discussionRepository.save(discussion);
    }

    public Discussion lockDiscussion(Long discussionId, Long userId) {
        Discussion discussion = discussionRepository.findById(discussionId)
            .orElseThrow(() -> new RuntimeException("Discussion not found"));

        // Check if user is the journal owner
        if (!discussion.getJournal().getUser().getId().equals(userId)) {
            throw new RuntimeException("Only journal owner can lock discussions");
        }

        discussion.setIsLocked(!discussion.getIsLocked());
        return discussionRepository.save(discussion);
    }
}
