package com.gastrosoftware.gastrosoftware.customer.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCustomerDTO {

    @Size(max = 100)
    private String fullName;

    @Size(max = 100)
    private String email;
}
