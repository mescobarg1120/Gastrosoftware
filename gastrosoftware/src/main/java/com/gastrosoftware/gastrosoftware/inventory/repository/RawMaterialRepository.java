package com.gastrosoftware.gastrosoftware.inventory.repository;

import com.gastrosoftware.gastrosoftware.inventory.entity.RawMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface RawMaterialRepository extends JpaRepository<RawMaterial, Long> {

    List<RawMaterial> findByBranchId(Long branchId);

    List<RawMaterial> findByBranchIdAndStockQtyLessThan(Long branchId, BigDecimal minStock);
}
