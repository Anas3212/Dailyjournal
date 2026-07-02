package com.dailyjournal.repository;

import com.dailyjournal.entity.WorkshopFile;
import com.dailyjournal.entity.WorkshopFile.FileType;
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
public interface WorkshopFileRepository extends JpaRepository<WorkshopFile, Long> {
    
    // Find files by user
    Page<WorkshopFile> findByUserIdOrderByUpdatedAtDesc(Long userId, Pageable pageable);
    
    List<WorkshopFile> findByUserIdOrderByUpdatedAtDesc(Long userId);
    
    // Find files by user and file type
    Page<WorkshopFile> findByUserIdAndFileTypeOrderByUpdatedAtDesc(Long userId, FileType fileType, Pageable pageable);
    
    // Find files by user and category
    Page<WorkshopFile> findByUserIdAndCategoryOrderByUpdatedAtDesc(Long userId, String category, Pageable pageable);
    
    // Search files by name or content
    @Query("SELECT wf FROM WorkshopFile wf WHERE wf.user.id = :userId AND " +
           "(LOWER(wf.fileName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "wf.content LIKE CONCAT('%', :searchTerm, '%') OR " +
           "LOWER(wf.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "ORDER BY wf.updatedAt DESC")
    Page<WorkshopFile> searchFilesByUser(@Param("userId") Long userId, 
                                        @Param("searchTerm") String searchTerm, 
                                        Pageable pageable);
    
    // Find files by tags
    @Query("SELECT wf FROM WorkshopFile wf WHERE wf.user.id = :userId AND " +
           "LOWER(wf.tags) LIKE LOWER(CONCAT('%', :tag, '%')) " +
           "ORDER BY wf.updatedAt DESC")
    Page<WorkshopFile> findByUserIdAndTagsContaining(@Param("userId") Long userId, 
                                                     @Param("tag") String tag, 
                                                     Pageable pageable);
    
    // Find shared files by token
    Optional<WorkshopFile> findByShareTokenAndIsSharedTrue(String shareToken);
    
    // Count files by user
    long countByUserId(Long userId);
    
    // Count files by user and type
    long countByUserIdAndFileType(Long userId, FileType fileType);
    
    // Get distinct categories for user
    @Query("SELECT DISTINCT wf.category FROM WorkshopFile wf WHERE wf.user.id = :userId AND wf.category IS NOT NULL ORDER BY wf.category")
    List<String> findDistinctCategoriesByUserId(@Param("userId") Long userId);
    
    // Get file statistics for user
    @Query("SELECT wf.fileType, COUNT(wf), SUM(wf.fileSize) FROM WorkshopFile wf WHERE wf.user.id = :userId GROUP BY wf.fileType")
    List<Object[]> getFileStatisticsByUserId(@Param("userId") Long userId);
    
    // Find recent files
    @Query("SELECT wf FROM WorkshopFile wf WHERE wf.user.id = :userId AND wf.updatedAt >= :since ORDER BY wf.updatedAt DESC")
    List<WorkshopFile> findRecentFilesByUserId(@Param("userId") Long userId, @Param("since") LocalDateTime since);
    
    // Find files by user and multiple file types
    @Query("SELECT wf FROM WorkshopFile wf WHERE wf.user.id = :userId AND wf.fileType IN :fileTypes ORDER BY wf.updatedAt DESC")
    Page<WorkshopFile> findByUserIdAndFileTypeIn(@Param("userId") Long userId, 
                                                 @Param("fileTypes") List<FileType> fileTypes, 
                                                 Pageable pageable);
    
    // Check if file name exists for user
    boolean existsByUserIdAndFileName(Long userId, String fileName);
    
    // Find files created between dates
    @Query("SELECT wf FROM WorkshopFile wf WHERE wf.user.id = :userId AND " +
           "wf.createdAt BETWEEN :startDate AND :endDate ORDER BY wf.createdAt DESC")
    List<WorkshopFile> findFilesByUserIdAndDateRange(@Param("userId") Long userId,
                                                     @Param("startDate") LocalDateTime startDate,
                                                     @Param("endDate") LocalDateTime endDate);
    
    // Get total file size for user
    @Query("SELECT COALESCE(SUM(wf.fileSize), 0) FROM WorkshopFile wf WHERE wf.user.id = :userId")
    Long getTotalFileSizeByUserId(@Param("userId") Long userId);
}
