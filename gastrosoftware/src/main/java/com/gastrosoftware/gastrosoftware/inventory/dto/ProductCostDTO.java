package com.gastrosoftware.gastrosoftware.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductCostDTO {

    private String productName;
    private String size;
    private BigDecimal costPrice;
    private BigDecimal salePrice;
    private BigDecimal grossMargin;
    private List<IngredientCostDTO> ingredients;
}
