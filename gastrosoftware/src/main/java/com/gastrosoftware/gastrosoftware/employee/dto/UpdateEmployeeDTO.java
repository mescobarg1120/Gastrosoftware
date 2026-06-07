package com.gastrosoftware.gastrosoftware.employee.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEmployeeDTO {

    @NotBlank
    private String fullName;

    @NotBlank
    private String rut;

    @NotBlank
    @Email
    private String email;

    private BigDecimal hourlyRate;

    private Long roleId;
}
