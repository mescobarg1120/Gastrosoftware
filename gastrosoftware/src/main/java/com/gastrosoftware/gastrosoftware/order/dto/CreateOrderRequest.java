package com.gastrosoftware.gastrosoftware.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {
    private Long branchId;
    private Long employeeId;
    private Long customerId;
    private Long orderTypeId;
    private Long tableId;
    private Long shiftId;
    private Long platformId;
    private Long discountRuleId;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal platformCommission;
    private BigDecimal total;
    private String externalOrderRef;
}
