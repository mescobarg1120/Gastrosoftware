package com.gastrosoftware.gastrosoftware.inventory.dto;

import jakarta.validation.constraints.NotBlank;
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
public class CreateRecipeItemDTO {

    @NotBlank
    private String ingredientType;

    private Long materialId;

    private Long subRecipeId;

    @NotNull
    private BigDecimal quantityRequired;

    @NotBlank
    private String unit;
}
