package com.gastrosoftware.gastrosoftware.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private Long branchId;
    private Long employeeId;
    private Long customerId;
    private Long orderTypeId;
    private String orderTypeName;
    private Long orderStatusId;
    private String orderStatusName;
    private String orderStatusColor;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal platformCommission;
    private BigDecimal total;
    private String externalOrderRef;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<OrderItemResponse> items;
}
