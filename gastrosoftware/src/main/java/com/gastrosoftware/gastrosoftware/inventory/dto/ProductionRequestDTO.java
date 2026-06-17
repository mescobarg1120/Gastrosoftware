package com.gastrosoftware.gastrosoftware.inventory.dto;

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
public class ProductionRequestDTO {

    @NotNull
    private Long recipeId;

    @NotNull
    private Long branchId;

    @NotNull
    private Long employeeId;

    @NotNull
    private BigDecimal quantityProduced;
}
