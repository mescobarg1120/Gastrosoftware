package com.gastrosoftware.gastrosoftware.employee.dto;

import jakarta.validation.constraints.Email;
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
public class CreateEmployeeDTO {

    @NotNull
    private Long branchId;

    @NotNull
    private Long roleId;

    @NotBlank
    private String fullName;

    @NotBlank
    private String rut;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String password;

    private BigDecimal hourlyRate;
}
