package com.gastrosoftware.gastrosoftware.supplier.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSupplierDTO {

    @NotBlank
    @Size(max = 150)
    private String legalName;

    @Size(max = 150)
    private String tradeName;

    @NotBlank
    @Size(max = 12)
    private String rut;

    @Size(max = 255)
    private String address;

    private Integer leadTimeDays;

    @Size(max = 50)
    private String deliveryDays;

    @Size(max = 30)
    private String paymentTerms;
}
