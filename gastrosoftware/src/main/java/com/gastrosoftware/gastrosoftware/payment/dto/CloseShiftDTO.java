package com.gastrosoftware.gastrosoftware.payment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CloseShiftDTO {

    @NotNull
    private List<CashCountDetailDTO> countDetails;
}
