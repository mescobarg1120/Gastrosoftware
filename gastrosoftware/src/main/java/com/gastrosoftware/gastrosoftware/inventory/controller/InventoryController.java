package com.gastrosoftware.gastrosoftware.inventory.controller;

import com.gastrosoftware.gastrosoftware.inventory.dto.AdjustStockDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.CreateRawMaterialDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.IntermediateStockResponseDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.ProductCostDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.ProductionRequestDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.RawMaterialResponseDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.StockVarianceDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.UpdateRawMaterialDTO;
import com.gastrosoftware.gastrosoftware.inventory.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/materials/{id}")
    public ResponseEntity<RawMaterialResponseDTO> getRawMaterialById(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getRawMaterialById(id));
    }

    @PostMapping("/materials")
    public ResponseEntity<RawMaterialResponseDTO> createRawMaterial(@Valid @RequestBody CreateRawMaterialDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.createRawMaterial(dto));
    }

    @PutMapping("/materials/{id}")
    public ResponseEntity<RawMaterialResponseDTO> updateRawMaterial(@PathVariable Long id, @Valid @RequestBody UpdateRawMaterialDTO dto) {
        return ResponseEntity.ok(inventoryService.updateRawMaterial(id, dto));
    }

    @PostMapping("/materials/{id}/adjust")
    public ResponseEntity<RawMaterialResponseDTO> adjustStock(@PathVariable Long id, @Valid @RequestBody AdjustStockDTO dto) {
        return ResponseEntity.ok(inventoryService.adjustStock(id, dto));
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<RawMaterialResponseDTO>> getRawMaterialsByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(inventoryService.getRawMaterialsByBranch(branchId));
    }

    @GetMapping("/branch/{branchId}/low-stock")
    public ResponseEntity<List<RawMaterialResponseDTO>> getLowStockMaterials(@PathVariable Long branchId) {
        return ResponseEntity.ok(inventoryService.getLowStockMaterials(branchId));
    }

    @GetMapping("/branch/{branchId}/variance")
    public ResponseEntity<List<StockVarianceDTO>> getStockVariance(
            @PathVariable Long branchId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to
    ) {
        return ResponseEntity.ok(inventoryService.getStockVariance(branchId, from, to));
    }

    @GetMapping("/recipe/{recipeId}/cost")
    public ResponseEntity<ProductCostDTO> calculateProductCost(
            @PathVariable Long recipeId,
            @RequestParam Long branchId
    ) {
        return ResponseEntity.ok(inventoryService.calculateProductCost(recipeId, branchId));
    }

    @GetMapping("/branch/{branchId}/intermediates")
    public ResponseEntity<List<IntermediateStockResponseDTO>> getIntermediateStocks(@PathVariable Long branchId) {
        return ResponseEntity.ok(inventoryService.getIntermediateStocksByBranch(branchId));
    }

    @PostMapping("/production")
    public ResponseEntity<Void> recordProduction(@Valid @RequestBody ProductionRequestDTO dto) {
        inventoryService.recordProduction(dto);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
