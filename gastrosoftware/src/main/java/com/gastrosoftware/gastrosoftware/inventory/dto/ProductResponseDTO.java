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
public class ProductResponseDTO {

    private Long id;
    private String name;
    private String productType;
    private BigDecimal price;
    private Boolean available;
    private String categoryName;
    private Long categoryId;
    private String description;
    private List<ProductVariantResponseDTO> variants;
}
