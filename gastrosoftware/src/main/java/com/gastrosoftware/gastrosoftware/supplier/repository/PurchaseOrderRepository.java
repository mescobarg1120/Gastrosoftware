package com.gastrosoftware.gastrosoftware.supplier.repository;

import com.gastrosoftware.gastrosoftware.supplier.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

    List<PurchaseOrder> findByBranchIdAndStatus(Long branchId, String status);

    List<PurchaseOrder> findBySupplierIdAndStatus(Long supplierId, String status);
}
