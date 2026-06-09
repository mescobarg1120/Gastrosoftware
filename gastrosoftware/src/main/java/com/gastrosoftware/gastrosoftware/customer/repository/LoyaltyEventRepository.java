package com.gastrosoftware.gastrosoftware.customer.repository;

import com.gastrosoftware.gastrosoftware.customer.entity.LoyaltyEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoyaltyEventRepository extends JpaRepository<LoyaltyEvent, Long> {

    List<LoyaltyEvent> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
}
