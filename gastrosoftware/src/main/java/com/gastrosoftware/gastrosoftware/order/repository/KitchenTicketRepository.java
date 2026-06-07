package com.gastrosoftware.gastrosoftware.order.repository;

import com.gastrosoftware.gastrosoftware.order.entity.KitchenTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KitchenTicketRepository extends JpaRepository<KitchenTicket, Long> {

    List<KitchenTicket> findByBranchIdAndTicketStatusNameNot(Long branchId, String statusName);

    Optional<KitchenTicket> findByOrderId(Long orderId);
}
