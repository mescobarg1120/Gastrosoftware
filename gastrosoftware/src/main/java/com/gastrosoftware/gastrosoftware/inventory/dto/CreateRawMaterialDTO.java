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
public class CreateRawMaterialDTO {

    @NotNull
    private Long branchId;

    @NotBlank
    private String name;

    @NotBlank
    private String unit;

    @NotNull
    private BigDecimal stockQty;

    @NotNull
    private BigDecimal minStock;

    @NotNull
    private BigDecimal avgUnitCost;
}
