package com.gastrosoftware.gastrosoftware.supplier.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierResponseDTO {

    private Long id;
    private String legalName;
    private String tradeName;
    private String rut;
    private Boolean active;
}
