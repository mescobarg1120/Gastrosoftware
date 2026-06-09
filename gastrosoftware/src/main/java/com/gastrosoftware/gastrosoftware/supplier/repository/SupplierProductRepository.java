package com.gastrosoftware.gastrosoftware.supplier.repository;

import com.gastrosoftware.gastrosoftware.supplier.entity.SupplierProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierProductRepository extends JpaRepository<SupplierProduct, Long> {

    List<SupplierProduct> findBySupplierId(Long supplierId);

    List<SupplierProduct> findByMaterialId(Long materialId);
}
