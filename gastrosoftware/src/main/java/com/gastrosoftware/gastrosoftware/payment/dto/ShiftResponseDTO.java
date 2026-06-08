package com.gastrosoftware.gastrosoftware.payment.dto;

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
public class ShiftResponseDTO {

    private Long id;
    private Long branchId;
    private String branchName;
    private Long employeeId;
    private String employeeName;
    private BigDecimal openingAmount;
    private BigDecimal expectedAmount;
    private BigDecimal countedAmount;
    private BigDecimal difference;
    private String status;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;
}
