package com.gastrosoftware.gastrosoftware.inventory.dto;

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
public class IntermediateStockResponseDTO {
    private Long id;
    private Long recipeId;
    private String recipeName;
    private BigDecimal stockQty;
    private String unit;
    private LocalDateTime lastProducedAt;
}
