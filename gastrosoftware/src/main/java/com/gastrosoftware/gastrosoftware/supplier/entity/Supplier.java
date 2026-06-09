package com.gastrosoftware.gastrosoftware.supplier.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
@Table(name = "supplier")
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "legal_name", nullable = false, length = 150)
    private String legalName;

    @Column(name = "trade_name", length = 150)
    private String tradeName;

    @Column(nullable = false, unique = true, length = 12)
    private String rut;

    @Column(length = 255)
    private String address;

    @Column(name = "lead_time_days", nullable = false)
    @Builder.Default
    private Integer leadTimeDays = 1;

    @Column(name = "delivery_days", length = 50)
    private String deliveryDays;

    @Column(name = "payment_terms", length = 30)
    private String paymentTerms;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;
}
