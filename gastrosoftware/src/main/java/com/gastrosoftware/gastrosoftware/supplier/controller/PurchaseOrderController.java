package com.gastrosoftware.gastrosoftware.supplier.controller;

import com.gastrosoftware.gastrosoftware.supplier.dto.CreatePurchaseOrderDTO;
import com.gastrosoftware.gastrosoftware.supplier.dto.PurchaseOrderResponseDTO;
import com.gastrosoftware.gastrosoftware.supplier.service.SupplierService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {

    private final SupplierService supplierService;

    public PurchaseOrderController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @PostMapping
    public ResponseEntity<PurchaseOrderResponseDTO> createPurchaseOrder(@Valid @RequestBody CreatePurchaseOrderDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(supplierService.createPurchaseOrder(dto));
    }

    @PutMapping("/{id}/receive")
    public ResponseEntity<PurchaseOrderResponseDTO> receivePurchaseOrder(@PathVariable Long id) {
        return ResponseEntity.ok(supplierService.receivePurchaseOrder(id));
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<PurchaseOrderResponseDTO>> getByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(supplierService.getPurchaseOrdersByBranch(branchId));
    }
}
