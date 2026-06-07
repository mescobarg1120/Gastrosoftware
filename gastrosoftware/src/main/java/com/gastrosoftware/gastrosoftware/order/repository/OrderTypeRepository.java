package com.gastrosoftware.gastrosoftware.order.repository;

import com.gastrosoftware.gastrosoftware.order.entity.OrderType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderTypeRepository extends JpaRepository<OrderType, Long> {
}
