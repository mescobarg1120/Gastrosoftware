package com.gastrosoftware.gastrosoftware.inventory.service;

import com.gastrosoftware.gastrosoftware.config.entity.Branch;
import com.gastrosoftware.gastrosoftware.config.repository.BranchRepository;
import com.gastrosoftware.gastrosoftware.inventory.dto.IngredientCostDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.ProductCostDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.RawMaterialResponseDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.StockVarianceDTO;
import com.gastrosoftware.gastrosoftware.inventory.entity.ProductionLog;
import com.gastrosoftware.gastrosoftware.inventory.entity.RawMaterial;
import com.gastrosoftware.gastrosoftware.inventory.entity.Recipe;
import com.gastrosoftware.gastrosoftware.inventory.entity.RecipeItem;
import com.gastrosoftware.gastrosoftware.inventory.entity.StockMovement;
import com.gastrosoftware.gastrosoftware.inventory.repository.IntermediateStockRepository;
import com.gastrosoftware.gastrosoftware.inventory.repository.ProductionLogRepository;
import com.gastrosoftware.gastrosoftware.inventory.repository.RawMaterialRepository;
import com.gastrosoftware.gastrosoftware.inventory.repository.RecipeItemRepository;
import com.gastrosoftware.gastrosoftware.inventory.repository.RecipeRepository;
import com.gastrosoftware.gastrosoftware.inventory.repository.StockMovementRepository;
import com.gastrosoftware.gastrosoftware.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class InventoryService {

    private final RawMaterialRepository rawMaterialRepository;
    private final RecipeRepository recipeRepository;
    private final RecipeItemRepository recipeItemRepository;
    private final StockMovementRepository stockMovementRepository;
    private final IntermediateStockRepository intermediateStockRepository;
    private final BranchRepository branchRepository;
    private final ProductionLogRepository productionLogRepository;

    public InventoryService(RawMaterialRepository rawMaterialRepository, RecipeRepository recipeRepository, RecipeItemRepository recipeItemRepository, StockMovementRepository stockMovementRepository, IntermediateStockRepository intermediateStockRepository, BranchRepository branchRepository, ProductionLogRepository productionLogRepository) {
        this.rawMaterialRepository = rawMaterialRepository;
        this.recipeRepository = recipeRepository;
        this.recipeItemRepository = recipeItemRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.intermediateStockRepository = intermediateStockRepository;
        this.branchRepository = branchRepository;
        this.productionLogRepository = productionLogRepository;
    }

    @Transactional(readOnly = true)
    public List<RawMaterialResponseDTO> getRawMaterialsByBranch(Long branchId) {
        return rawMaterialRepository.findByBranchId(branchId).stream()
                .map(this::toRawMaterialResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RawMaterialResponseDTO> getLowStockMaterials(Long branchId) {
        return rawMaterialRepository.findByBranchId(branchId).stream()
                .filter(m -> m.getStockQty().compareTo(m.getMinStock()) < 0)
                .map(this::toRawMaterialResponse)
                .toList();
    }

    public void updateStock(Long materialId, BigDecimal qty, String type, Long orderItemId) {
        RawMaterial material = rawMaterialRepository.findById(materialId)
                .orElseThrow(() -> new ResourceNotFoundException("RawMaterial", materialId));

        Branch branch = material.getBranch();

        material.setStockQty(material.getStockQty().add(qty));
        rawMaterialRepository.save(material);

        StockMovement movement = StockMovement.builder()
                .material(material)
                .branch(branch)
                .type(type)
                .qtyChange(qty)
                .movedAt(LocalDateTime.now())
                .build();
        stockMovementRepository.save(movement);
    }

    public void deductStockByRecipe(Long recipeId, int quantity, Long branchId, Long orderItemId) {
        List<RecipeItem> items = recipeItemRepository.findByRecipeId(recipeId);

        for (RecipeItem item : items) {
            BigDecimal totalQty = item.getQuantity().multiply(BigDecimal.valueOf(quantity));

            if ("RAW".equals(item.getIngredientType()) && item.getMaterial() != null) {
                RawMaterial material = item.getMaterial();
                material.setStockQty(material.getStockQty().subtract(totalQty));
                rawMaterialRepository.save(material);

                StockMovement movement = StockMovement.builder()
                        .material(material)
                        .branch(branchRepository.getReferenceById(branchId))
                        .type("DEDUCT")
                        .qtyChange(totalQty.negate())
                        .movedAt(LocalDateTime.now())
                        .build();
                stockMovementRepository.save(movement);

            } else if ("INTERMEDIATE".equals(item.getIngredientType()) && item.getSubRecipe() != null) {
                var intermediateOpt = intermediateStockRepository
                        .findByRecipeIdAndBranchId(item.getSubRecipe().getId(), branchId);
                if (intermediateOpt.isPresent()) {
                    var is = intermediateOpt.get();
                    is.setStockQty(is.getStockQty().subtract(totalQty));
                    intermediateStockRepository.save(is);
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public List<StockVarianceDTO> getStockVariance(Long branchId, LocalDateTime from, LocalDateTime to) {
        List<StockMovement> movements = stockMovementRepository
                .findByBranchIdAndMovedAtBetween(branchId, from, to);

        Map<Long, BigDecimal> usedByMaterial = movements.stream()
                .filter(m -> "DEDUCT".equals(m.getType()))
                .collect(Collectors.groupingBy(
                        m -> m.getMaterial().getId(),
                        Collectors.reducing(BigDecimal.ZERO, StockMovement::getQtyChange, BigDecimal::add)
                ));

        List<RawMaterial> materials = rawMaterialRepository.findByBranchId(branchId);
        List<StockVarianceDTO> result = new ArrayList<>();

        for (RawMaterial m : materials) {
            BigDecimal theoreticalUsed = usedByMaterial.getOrDefault(m.getId(), BigDecimal.ZERO).abs();
            result.add(StockVarianceDTO.builder()
                    .materialId(m.getId())
                    .materialName(m.getName())
                    .unit(m.getUnit())
                    .theoreticalUsed(theoreticalUsed)
                    .currentStock(m.getStockQty())
                    .variance(m.getStockQty().subtract(theoreticalUsed))
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public ProductCostDTO calculateProductCost(Long recipeId, Long branchId) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe", recipeId));

        List<RecipeItem> items = recipeItemRepository.findByRecipeId(recipeId);
        BigDecimal totalCost = BigDecimal.ZERO;
        List<IngredientCostDTO> ingredients = new ArrayList<>();

        for (RecipeItem item : items) {
            String name;
            BigDecimal unitCost = BigDecimal.ZERO;

            if ("RAW".equals(item.getIngredientType()) && item.getMaterial() != null) {
                name = item.getMaterial().getName();
                unitCost = item.getMaterial().getAvgUnitCost();
            } else if ("INTERMEDIATE".equals(item.getIngredientType()) && item.getSubRecipe() != null) {
                name = item.getSubRecipe().getName();
                var intermediateOpt = intermediateStockRepository
                        .findByRecipeIdAndBranchId(item.getSubRecipe().getId(), branchId);
                if (intermediateOpt.isPresent()) {
                    unitCost = intermediateOpt.get().getUnitCost();
                }
            } else {
                continue;
            }

            BigDecimal subtotal = unitCost.multiply(item.getQuantity()).setScale(2, RoundingMode.HALF_UP);
            totalCost = totalCost.add(subtotal);

            ingredients.add(IngredientCostDTO.builder()
                    .name(name)
                    .quantity(item.getQuantity())
                    .unit(item.getUnit())
                    .unitCost(unitCost)
                    .subtotal(subtotal)
                    .build());
        }

        BigDecimal salePrice = recipe.getProduct().getPrice();
        BigDecimal grossMargin = salePrice.compareTo(BigDecimal.ZERO) > 0
                ? salePrice.subtract(totalCost).divide(salePrice, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return ProductCostDTO.builder()
                .productName(recipe.getProduct().getName())
                .size(recipe.getSize())
                .costPrice(totalCost)
                .salePrice(salePrice)
                .grossMargin(grossMargin)
                .ingredients(ingredients)
                .build();
    }

    private RawMaterialResponseDTO toRawMaterialResponse(RawMaterial m) {
        return RawMaterialResponseDTO.builder()
                .id(m.getId())
                .name(m.getName())
                .unit(m.getUnit())
                .stockQty(m.getStockQty())
                .minStock(m.getMinStock())
                .avgUnitCost(m.getAvgUnitCost())
                .build();
    }
}
