package com.dailyjournal.mapper;

import com.dailyjournal.dto.DiscussionAnswerResponse;
import com.dailyjournal.dto.DiscussionResponse;
import com.dailyjournal.entity.Discussion;
import com.dailyjournal.entity.DiscussionAnswer;
import com.dailyjournal.entity.User;
import com.dailyjournal.repository.DiscussionVoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class DiscussionMapper {

    @Autowired
    private DiscussionVoteRepository voteRepository;

    public DiscussionResponse toResponse(Discussion discussion, User currentUser) {
        DiscussionResponse response = new DiscussionResponse();
        response.setId(discussion.getId());
        response.setTitle(discussion.getTitle());
        response.setContent(discussion.getContent());
        response.setJournalId(discussion.getJournal().getId());
        response.setJournalTitle(discussion.getJournal().getTitle());
        response.setAuthorId(discussion.getAuthor().getId());
        response.setAuthorName(discussion.getAuthor().getName());
        response.setAuthorEmail(discussion.getAuthor().getEmail());
        response.setAuthorProfilePicture(discussion.getAuthor().getProfilePicture());
        response.setCreatedAt(discussion.getCreatedAt());
        response.setUpdatedAt(discussion.getUpdatedAt());
        response.setIsEdited(discussion.getIsEdited());
        response.setIsPinned(discussion.getIsPinned());
        response.setIsLocked(discussion.getIsLocked());
        response.setStatus(discussion.getStatus().name());
        response.setViewCount(discussion.getViewCount());
        response.setAnswerCount(discussion.getAnswerCount());
        response.setVoteScore(discussion.getVoteScore());

        if (currentUser != null) {
            // Set user's vote type
            voteRepository.findByUserAndDiscussion(currentUser, discussion)
                .ifPresent(vote -> response.setUserVoteType(vote.getVoteType().name()));

            // Set permissions
            boolean isAuthor = discussion.getAuthor().getId().equals(currentUser.getId());
            boolean isJournalOwner = discussion.getJournal().getUser().getId().equals(currentUser.getId());

            response.setCanEdit(isAuthor && !discussion.getIsLocked());
            response.setCanDelete(isAuthor || isJournalOwner);
            response.setCanPin(isJournalOwner);
            response.setCanLock(isJournalOwner);
            response.setCanAcceptAnswers(isAuthor);
        }

        return response;
    }

    public DiscussionAnswerResponse toResponse(DiscussionAnswer answer, User currentUser) {
        DiscussionAnswerResponse response = new DiscussionAnswerResponse();
        response.setId(answer.getId());
        response.setContent(answer.getContent());
        response.setDiscussionId(answer.getDiscussion().getId());
        response.setAuthorId(answer.getAuthor().getId());
        response.setAuthorName(answer.getAuthor().getName());
        response.setAuthorEmail(answer.getAuthor().getEmail());
        response.setAuthorProfilePicture(answer.getAuthor().getProfilePicture());
        response.setParentAnswerId(answer.getParentAnswer() != null ? answer.getParentAnswer().getId() : null);
        response.setCreatedAt(answer.getCreatedAt());
        response.setUpdatedAt(answer.getUpdatedAt());
        response.setIsEdited(answer.getIsEdited());
        response.setIsAccepted(answer.getIsAccepted());
        response.setIsDeleted(answer.getIsDeleted());
        response.setVoteScore(answer.getVoteScore());
        response.setReplyCount(answer.getReplyCount());

        if (currentUser != null) {
            // Set user's vote type
            voteRepository.findByUserAndAnswer(currentUser, answer)
                .ifPresent(vote -> response.setUserVoteType(vote.getVoteType().name()));

            // Set permissions
            boolean isAuthor = answer.getAuthor().getId().equals(currentUser.getId());
            boolean isJournalOwner = answer.getDiscussion().getJournal().getUser().getId().equals(currentUser.getId());
            boolean isDiscussionAuthor = answer.getDiscussion().getAuthor().getId().equals(currentUser.getId());

            response.setCanEdit(isAuthor && !answer.getDiscussion().getIsLocked());
            response.setCanDelete(isAuthor || isJournalOwner);
            response.setCanAccept(isDiscussionAuthor && !answer.getIsDeleted());
        }

        // Map replies
        if (answer.getReplies() != null && !answer.getReplies().isEmpty()) {
            List<DiscussionAnswerResponse> replyResponses = answer.getReplies().stream()
                .filter(reply -> !reply.getIsDeleted())
                .map(reply -> toResponse(reply, currentUser))
                .collect(Collectors.toList());
            response.setReplies(replyResponses);
        }

        return response;
    }

    public List<DiscussionResponse> toResponseList(List<Discussion> discussions, User currentUser) {
        return discussions.stream()
            .map(discussion -> toResponse(discussion, currentUser))
            .collect(Collectors.toList());
    }

    public List<DiscussionAnswerResponse> toAnswerResponseList(List<DiscussionAnswer> answers, User currentUser) {
        return answers.stream()
            .filter(answer -> !answer.getIsDeleted())
            .map(answer -> toResponse(answer, currentUser))
            .collect(Collectors.toList());
    }
}
