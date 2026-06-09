package com.gastrosoftware.gastrosoftware.supplier.dto;

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
public class PurchaseOrderResponseDTO {

    private Long id;
    private Long supplierId;
    private String supplierName;
    private Long branchId;
    private BigDecimal total;
    private String status;
    private LocalDateTime expectedAt;
    private LocalDateTime createdAt;
}
