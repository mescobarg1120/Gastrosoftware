package com.gastrosoftware.gastrosoftware.payment.dto;

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
public class AddPettyCashDTO {

    @NotNull
    private Long categoryId;

    @NotBlank
    private String description;

    @NotNull
    private BigDecimal amount;

    private String voucherRef;
}
