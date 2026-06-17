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
public class AdjustStockDTO {

    @NotBlank
    private String type;

    @NotNull
    private BigDecimal quantity;

    @NotBlank
    private String reason;
}
