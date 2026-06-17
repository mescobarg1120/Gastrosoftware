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
public class UpdateRawMaterialDTO {

    private String name;
    private String unit;
    private BigDecimal minStock;
    private BigDecimal avgUnitCost;
}
