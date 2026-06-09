package com.gastrosoftware.gastrosoftware.customer.repository;

import com.gastrosoftware.gastrosoftware.customer.entity.CustomerDiscount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerDiscountRepository extends JpaRepository<CustomerDiscount, Long> {

    List<CustomerDiscount> findByCustomerIdAndUsedFalse(Long customerId);
}
