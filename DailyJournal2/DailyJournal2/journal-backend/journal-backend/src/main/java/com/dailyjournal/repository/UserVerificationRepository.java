package com.dailyjournal.repository;

import com.dailyjournal.entity.UserVerification;
import com.dailyjournal.entity.UserVerification.VerificationVisibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface UserVerificationRepository extends JpaRepository<UserVerification, Long> {

    List<UserVerification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<UserVerification> findByUserIdAndVisibilityInOrderByCreatedAtDesc(
            Long userId, 
            Collection<VerificationVisibility> visibilities
    );

    @Query("SELECT v FROM UserVerification v WHERE v.user.id = :userId AND v.type = :type ORDER BY v.createdAt DESC")
    List<UserVerification> findByUserIdAndTypeOrderByCreatedAtDesc(
            @Param("userId") Long userId, 
            @Param("type") UserVerification.VerificationType type
    );

    long countByUserId(Long userId);

    long countByUserIdAndVisibility(Long userId, VerificationVisibility visibility);
}
