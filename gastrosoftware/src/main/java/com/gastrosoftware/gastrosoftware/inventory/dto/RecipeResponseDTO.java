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
public class RecipeResponseDTO {
    private Long id;
    private Long productId;
    private String productName;
    private String name;
    private String size;
    private Boolean isIntermediate;
    private BigDecimal yieldQty;
    private String yieldUnit;
    private List<RecipeItemResponseDTO> items;
}
