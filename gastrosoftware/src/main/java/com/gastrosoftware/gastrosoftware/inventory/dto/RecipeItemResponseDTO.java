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
public class RecipeItemResponseDTO {
    private Long id;
    private String ingredientType;
    private Long materialId;
    private String materialName;
    private Long subRecipeId;
    private String subRecipeName;
    private BigDecimal quantity;
    private String unit;
}
