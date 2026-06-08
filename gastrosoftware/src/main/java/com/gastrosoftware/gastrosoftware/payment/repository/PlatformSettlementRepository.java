package com.gastrosoftware.gastrosoftware.payment.repository;

import com.gastrosoftware.gastrosoftware.payment.entity.PlatformSettlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlatformSettlementRepository extends JpaRepository<PlatformSettlement, Long> {

    List<PlatformSettlement> findByBranchIdAndStatus(Long branchId, String status);
}
