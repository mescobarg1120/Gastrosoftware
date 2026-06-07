package com.gastrosoftware.gastrosoftware.order.repository;

import com.gastrosoftware.gastrosoftware.order.entity.KitchenTicketItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KitchenTicketItemRepository extends JpaRepository<KitchenTicketItem, Long> {
}
