package com.gastrosoftware.gastrosoftware.config.repository;

import com.gastrosoftware.gastrosoftware.config.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {
}
