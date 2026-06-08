package com.gastrosoftware.gastrosoftware.payment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CashCountDetailDTO {

    @NotNull
    private Integer denomination;

    @NotNull
    private Integer quantity;
}
