package com.dailyjournal.repository;

import com.dailyjournal.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByName(String name);

    // ✅ Add this to fix "Cannot resolve method existsByName"
    boolean existsByName(String name);
}
