package com.gastrosoftware.gastrosoftware.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftSummaryDTO {

    private Long shiftId;
    private String employeeName;
    private BigDecimal openingAmount;
    private BigDecimal expectedAmount;
    private BigDecimal countedAmount;
    private BigDecimal difference;
    private BigDecimal totalCash;
    private BigDecimal totalCard;
    private BigDecimal totalTransfer;
    private BigDecimal pettyCashTotal;
}
