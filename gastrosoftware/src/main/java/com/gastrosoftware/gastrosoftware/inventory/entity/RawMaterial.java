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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "raw_material")
public class RawMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 20)
    private String unit;

    @Column(name = "stock_qty", nullable = false, precision = 10, scale = 3)
    private BigDecimal stockQty;

    @Column(name = "min_stock", nullable = false, precision = 10, scale = 3)
    private BigDecimal minStock;

    @Column(name = "avg_unit_cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal avgUnitCost;

    @Column(name = "last_unit_cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal lastUnitCost;
}
