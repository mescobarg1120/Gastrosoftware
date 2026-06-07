package com.gastrosoftware.gastrosoftware.inventory.repository;

import com.gastrosoftware.gastrosoftware.inventory.entity.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {

    List<StockMovement> findByBranchIdAndMovedAtBetween(Long branchId, LocalDateTime from, LocalDateTime to);

    List<StockMovement> findByMaterialIdAndMovedAtBetween(Long materialId, LocalDateTime from, LocalDateTime to);
}
