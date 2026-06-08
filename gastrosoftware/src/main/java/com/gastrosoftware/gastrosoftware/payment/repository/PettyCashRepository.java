package com.gastrosoftware.gastrosoftware.payment.repository;

import com.gastrosoftware.gastrosoftware.payment.entity.PettyCash;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PettyCashRepository extends JpaRepository<PettyCash, Long> {

    List<PettyCash> findByShiftId(Long shiftId);
}
