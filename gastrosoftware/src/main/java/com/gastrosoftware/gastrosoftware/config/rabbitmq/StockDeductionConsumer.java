package com.gastrosoftware.gastrosoftware.config.rabbitmq;

import com.gastrosoftware.gastrosoftware.inventory.entity.IntermediateStock;
import com.gastrosoftware.gastrosoftware.inventory.entity.RawMaterial;
import com.gastrosoftware.gastrosoftware.inventory.entity.Recipe;
import com.gastrosoftware.gastrosoftware.inventory.entity.RecipeItem;
import com.gastrosoftware.gastrosoftware.inventory.entity.StockMovement;
import com.gastrosoftware.gastrosoftware.inventory.repository.IntermediateStockRepository;
import com.gastrosoftware.gastrosoftware.inventory.repository.RawMaterialRepository;
import com.gastrosoftware.gastrosoftware.inventory.repository.RecipeItemRepository;
import com.gastrosoftware.gastrosoftware.inventory.repository.RecipeRepository;
import com.gastrosoftware.gastrosoftware.inventory.repository.StockMovementRepository;
import com.gastrosoftware.gastrosoftware.order.entity.Order;
import com.gastrosoftware.gastrosoftware.order.entity.OrderItem;
import com.gastrosoftware.gastrosoftware.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
@Component
public class StockDeductionConsumer {

    private final OrderRepository orderRepository;
    private final RecipeRepository recipeRepository;
    private final RecipeItemRepository recipeItemRepository;
    private final RawMaterialRepository rawMaterialRepository;
    private final StockMovementRepository stockMovementRepository;
    private final IntermediateStockRepository intermediateStockRepository;

    @RabbitListener(queues = "${spring.rabbitmq.queue.kitchen:gastro.kitchen.ticket.queue}")
    @Transactional
    public void handleKitchenTicket(Map<String, Object> message) {
        Object rawOrderId = message.get("orderId");
        Object rawBranchId = message.get("branchId");

        if (rawOrderId == null) {
            log.warn("Mensaje sin orderId, ignorando: {}", message);
            return;
        }

        Long orderId = Long.valueOf(rawOrderId.toString());
        Long branchId = rawBranchId != null ? Long.valueOf(rawBranchId.toString()) : null;

        log.info("Procesando descuento de stock para order {}", orderId);

        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            log.warn("Order {} no encontrada, ignorando", orderId);
            return;
        }

        if (order.getOrderItems() == null || order.getOrderItems().isEmpty()) {
            log.info("Order {} no tiene items, nada que descontar", orderId);
            return;
        }

        for (OrderItem item : order.getOrderItems()) {
            String productName = item.getProduct().getName();
            log.info("Descontando stock para order {}, item {}", orderId, productName);

            Recipe recipe = resolveRecipe(item);

            if (recipe == null) {
                log.warn("Item {} de order {} no tiene receta asociada, saltando", productName, orderId);
                continue;
            }

            deductStockForRecipe(recipe.getId(), item.getQuantity(), branchId, productName, item);
        }

        log.info("Descuento de stock completado para order {}", orderId);
    }

    private Recipe resolveRecipe(OrderItem item) {
        if (item.getProductVariant() != null && item.getProductVariant().getRecipe() != null) {
            return item.getProductVariant().getRecipe();
        }
        if (item.getRecipe() != null) {
            return item.getRecipe();
        }
        var recipes = recipeRepository.findByProductIdAndActive(item.getProduct().getId(), true);
        return recipes.isEmpty() ? null : recipes.getFirst();
    }

    private void deductStockForRecipe(Long recipeId, int orderQty, Long branchId, String productName, OrderItem orderItem) {
        if (branchId == null) {
            log.warn("branchId nulo, no se puede descontar stock para recipe {}", recipeId);
            return;
        }

        var items = recipeItemRepository.findByRecipeId(recipeId);
        BigDecimal multiplier = BigDecimal.valueOf(orderQty);

        for (RecipeItem recipeItem : items) {
            BigDecimal totalQty = recipeItem.getQuantity().multiply(multiplier);

            if ("RAW".equals(recipeItem.getIngredientType()) && recipeItem.getMaterial() != null) {
                RawMaterial material = recipeItem.getMaterial();
                BigDecimal newStock = material.getStockQty().subtract(totalQty);

                if (newStock.compareTo(BigDecimal.ZERO) < 0) {
                    log.warn("Stock negativo para material {} (id={}): actual={}, a descontar={}, resultado={}",
                            material.getName(), material.getId(), material.getStockQty(), totalQty, newStock);
                }

                material.setStockQty(newStock);
                rawMaterialRepository.save(material);

                StockMovement movement = StockMovement.builder()
                        .material(material)
                        .branch(material.getBranch())
                        .orderItem(orderItem)
                        .type("DEDUCT")
                        .qtyChange(totalQty.negate())
                        .movedAt(LocalDateTime.now())
                        .build();
                stockMovementRepository.save(movement);

                log.info("Stock descontado: {} -{}{}", material.getName(), totalQty, recipeItem.getUnit());

            } else if ("INTERMEDIATE".equals(recipeItem.getIngredientType()) && recipeItem.getSubRecipe() != null) {
                var opt = intermediateStockRepository
                        .findByRecipeIdAndBranchId(recipeItem.getSubRecipe().getId(), branchId);

                if (opt.isPresent()) {
                    IntermediateStock is = opt.get();
                    BigDecimal newStock = is.getStockQty().subtract(totalQty);

                    if (newStock.compareTo(BigDecimal.ZERO) < 0) {
                        log.warn("Stock negativo para pre-elaboración {} (recipeId={}): actual={}, a descontar={}, resultado={}",
                                recipeItem.getSubRecipe().getName(), recipeItem.getSubRecipe().getId(),
                                is.getStockQty(), totalQty, newStock);
                    }

                    is.setStockQty(newStock);
                    intermediateStockRepository.save(is);

                    log.info("Stock descontado: {} -{}{}", recipeItem.getSubRecipe().getName(), totalQty, recipeItem.getUnit());
                } else {
                    log.warn("No hay stock de pre-elaboración {} para branch {}, no se descuenta",
                            recipeItem.getSubRecipe().getName(), branchId);
                }
            }
        }
    }
}
