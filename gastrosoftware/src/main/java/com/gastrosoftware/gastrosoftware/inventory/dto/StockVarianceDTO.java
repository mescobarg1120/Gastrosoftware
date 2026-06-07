package com.gastrosoftware.gastrosoftware.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockVarianceDTO {

    private Long materialId;
    private String materialName;
    private String unit;
    private BigDecimal theoreticalUsed;
    private BigDecimal currentStock;
    private BigDecimal variance;
}
