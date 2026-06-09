package com.gastrosoftware.gastrosoftware.customer.dto;

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
public class CustomerResponseDTO {

    private Long id;
    private String fullName;
    private String phone;
    private String email;
    private String loyaltyTier;
    private Integer totalOrders;
    private BigDecimal totalSpent;
    private LocalDateTime lastOrderAt;
}
