package com.gastrosoftware.gastrosoftware.supplier.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePurchaseOrderDTO {

    @NotNull
    private Long supplierId;

    @NotNull
    private Long branchId;

    @NotNull
    private Long employeeId;

    private LocalDateTime expectedAt;

    @NotEmpty
    private List<PurchaseItemDTO> items;
}
