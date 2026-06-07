package com.gastrosoftware.gastrosoftware.inventory.entity;

import com.gastrosoftware.gastrosoftware.config.entity.Branch;
import jakarta.persistence.Column;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "stock_movement")
public class StockMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "material_id", nullable = false)
    private RawMaterial material;

    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne
    @JoinColumn(name = "order_item_id")
    private com.gastrosoftware.gastrosoftware.order.entity.OrderItem orderItem;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(name = "qty_change", nullable = false, precision = 10, scale = 3)
    private BigDecimal qtyChange;

    @Column(name = "moved_at", nullable = false, updatable = false)
    private LocalDateTime movedAt;
}
