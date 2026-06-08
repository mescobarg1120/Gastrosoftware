package com.gastrosoftware.gastrosoftware.payment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessPaymentDTO {

    @NotNull
    private Long orderId;

    @NotNull
    private Long paymentMethodId;

    @NotNull
    private BigDecimal amount;

    private String transactionRef;
}
