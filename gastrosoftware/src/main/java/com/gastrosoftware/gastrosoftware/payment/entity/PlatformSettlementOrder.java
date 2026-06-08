package com.gastrosoftware.gastrosoftware.payment.entity;

import com.gastrosoftware.gastrosoftware.order.entity.Order;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "platform_settlement_order")
public class PlatformSettlementOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "settlement_id", nullable = false)
    private PlatformSettlement settlement;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;
}
