package com.gastrosoftware.gastrosoftware.supplier.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.gastrosoftware.gastrosoftware.inventory.entity.RawMaterial;
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
@Table(name = "supplier_product")
public class SupplierProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @ManyToOne
    @JoinColumn(name = "material_id", nullable = false)
    private RawMaterial material;

    @Column(name = "agreed_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal agreedPrice;

    @Column(name = "min_order_qty", nullable = false, precision = 10, scale = 3)
    @Builder.Default
    private BigDecimal minOrderQty = BigDecimal.ZERO;

    @Column(nullable = false, length = 20)
    private String unit;

    @Column(name = "price_updated_at", nullable = false, updatable = false)
    private LocalDateTime priceUpdatedAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
