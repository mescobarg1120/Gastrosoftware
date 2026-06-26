package com.gastrosoftware.gastrosoftware.order.repository;

import com.gastrosoftware.gastrosoftware.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    int countByBranchIdAndCreatedAtBetween(Long branchId, LocalDateTime from, LocalDateTime to);

    List<Order> findByBranchIdAndOrderStatusName(Long branchId, String statusName);

    List<Order> findByBranchIdAndOrderStatusNameNotIn(Long branchId, List<String> statusNames);

    List<Order> findByBranchIdAndCreatedAtBetweenOrderByCreatedAtDesc(Long branchId, LocalDateTime from, LocalDateTime to);

    List<Order> findByCustomerId(Long customerId);
}
