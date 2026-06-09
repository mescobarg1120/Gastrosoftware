package com.gastrosoftware.gastrosoftware.supplier.repository;

import com.gastrosoftware.gastrosoftware.supplier.entity.SupplierContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupplierContactRepository extends JpaRepository<SupplierContact, Long> {

    List<SupplierContact> findBySupplierId(Long supplierId);
}
