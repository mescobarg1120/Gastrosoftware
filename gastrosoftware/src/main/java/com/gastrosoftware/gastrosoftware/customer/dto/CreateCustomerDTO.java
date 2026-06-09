package com.gastrosoftware.gastrosoftware.customer.dto;

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
public class CreateCustomerDTO {

    @NotBlank
    @Size(max = 100)
    private String fullName;

    @NotBlank
    @Size(max = 20)
    private String phone;

    @Size(max = 100)
    private String email;
}
