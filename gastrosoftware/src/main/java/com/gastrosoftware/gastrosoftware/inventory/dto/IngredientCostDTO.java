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
public class IngredientCostDTO {

    private String name;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal unitCost;
    private BigDecimal subtotal;
}
