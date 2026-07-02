package com.dailyjournal.repository;

import com.dailyjournal.entity.NoticeBoard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NoticeBoardRepository extends JpaRepository<NoticeBoard, Long> {
    
    @Query("SELECT n FROM NoticeBoard n WHERE n.team.id = :teamId ORDER BY n.pinned DESC, n.createdAt DESC")
    List<NoticeBoard> findByTeamIdOrderByPinnedDescCreatedAtDesc(@Param("teamId") Long teamId);
    
    @Query("SELECT n FROM NoticeBoard n WHERE n.team.id = :teamId AND n.pinned = true ORDER BY n.createdAt DESC")
    List<NoticeBoard> findByTeamIdAndPinnedTrueOrderByCreatedAtDesc(@Param("teamId") Long teamId);
    
    @Query("SELECT n FROM NoticeBoard n WHERE n.team.id = :teamId AND n.pinned = false ORDER BY n.createdAt DESC")
    List<NoticeBoard> findByTeamIdAndPinnedFalseOrderByCreatedAtDesc(@Param("teamId") Long teamId);
    
    @Query("SELECT CASE WHEN COUNT(n) > 0 THEN true ELSE false END FROM NoticeBoard n WHERE n.id = :id AND n.team.id = :teamId")
    boolean existsByIdAndTeamId(@Param("id") Long id, @Param("teamId") Long teamId);
    
    @Query("SELECT n FROM NoticeBoard n WHERE n.id = :id AND n.team.id = :teamId")
    Optional<NoticeBoard> findByIdAndTeamId(@Param("id") Long id, @Param("teamId") Long teamId);

    @Modifying
    @Query("DELETE FROM NoticeBoard n WHERE n.team.id = :teamId")
    void deleteByTeamId(@Param("teamId") Long teamId);
}
