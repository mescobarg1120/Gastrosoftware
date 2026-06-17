package com.gastrosoftware.gastrosoftware.inventory.service;

import com.gastrosoftware.gastrosoftware.inventory.dto.CreateRecipeDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.CreateRecipeItemDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.RecipeItemResponseDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.RecipeResponseDTO;
import com.gastrosoftware.gastrosoftware.inventory.entity.Product;
import com.gastrosoftware.gastrosoftware.inventory.entity.RawMaterial;
import com.gastrosoftware.gastrosoftware.inventory.entity.Recipe;
import com.gastrosoftware.gastrosoftware.inventory.entity.RecipeItem;
import com.gastrosoftware.gastrosoftware.inventory.repository.ProductRepository;
import com.gastrosoftware.gastrosoftware.inventory.repository.RawMaterialRepository;
import com.gastrosoftware.gastrosoftware.inventory.repository.RecipeItemRepository;
import com.gastrosoftware.gastrosoftware.inventory.repository.RecipeRepository;
import com.gastrosoftware.gastrosoftware.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final RecipeItemRepository recipeItemRepository;
    private final ProductRepository productRepository;
    private final RawMaterialRepository rawMaterialRepository;

    public RecipeService(RecipeRepository recipeRepository, RecipeItemRepository recipeItemRepository, ProductRepository productRepository, RawMaterialRepository rawMaterialRepository) {
        this.recipeRepository = recipeRepository;
        this.recipeItemRepository = recipeItemRepository;
        this.productRepository = productRepository;
        this.rawMaterialRepository = rawMaterialRepository;
    }

    @Transactional(readOnly = true)
    public List<RecipeResponseDTO> getRecipesByProduct(Long productId) {
        return recipeRepository.findByProductIdAndActive(productId, true).stream()
                .map(this::toResponse)
                .toList();
    }

    public RecipeResponseDTO getRecipeById(Long id) {
        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe", id));
        return toResponse(recipe);
    }

    public RecipeResponseDTO createRecipe(CreateRecipeDTO dto) {
        Recipe.RecipeBuilder builder = Recipe.builder()
                .name(dto.getName())
                .size(dto.getSize())
                .isIntermediate(dto.getIsIntermediate() != null ? dto.getIsIntermediate() : false)
                .yieldQty(dto.getYieldQty())
                .yieldUnit(dto.getYieldUnit())
                .active(true);

        if (dto.getProductId() != null && dto.getProductId() > 0) {
            Product product = productRepository.findById(dto.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", dto.getProductId()));
            builder.product(product);
        }

        Recipe recipe = recipeRepository.save(builder.build());
        return toResponse(recipe);
    }

    public RecipeItemResponseDTO addRecipeItem(Long recipeId, CreateRecipeItemDTO dto) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe", recipeId));

        RecipeItem.RecipeItemBuilder builder = RecipeItem.builder()
                .recipe(recipe)
                .ingredientType(dto.getIngredientType())
                .quantity(dto.getQuantityRequired())
                .unit(dto.getUnit());

        if ("RAW".equals(dto.getIngredientType())) {
            RawMaterial material = rawMaterialRepository.findById(dto.getMaterialId())
                    .orElseThrow(() -> new ResourceNotFoundException("RawMaterial", dto.getMaterialId()));
            builder.material(material);
        } else if ("INTERMEDIATE".equals(dto.getIngredientType())) {
            Recipe subRecipe = recipeRepository.findById(dto.getSubRecipeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Recipe", dto.getSubRecipeId()));
            builder.subRecipe(subRecipe);
        }

        RecipeItem item = recipeItemRepository.save(builder.build());
        return toItemResponse(item);
    }

    public void removeRecipeItem(Long recipeId, Long itemId) {
        RecipeItem item = recipeItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("RecipeItem", itemId));

        if (!item.getRecipe().getId().equals(recipeId)) {
            throw new IllegalArgumentException("El item no pertenece a la receta especificada");
        }

        recipeItemRepository.delete(item);
    }

    @Transactional(readOnly = true)
    public List<RecipeResponseDTO> getIntermediateRecipes() {
        return recipeRepository.findByIsIntermediateTrueAndActiveTrue().stream()
                .map(this::toResponse)
                .toList();
    }

    private RecipeResponseDTO toResponse(Recipe recipe) {
        List<RecipeItemResponseDTO> items = recipe.getRecipeItems() != null
                ? recipe.getRecipeItems().stream().map(this::toItemResponse).toList()
                : List.of();

        return RecipeResponseDTO.builder()
                .id(recipe.getId())
                .productId(recipe.getProduct() != null ? recipe.getProduct().getId() : null)
                .productName(recipe.getProduct() != null ? recipe.getProduct().getName() : null)
                .name(recipe.getName())
                .size(recipe.getSize())
                .isIntermediate(recipe.getIsIntermediate())
                .yieldQty(recipe.getYieldQty())
                .yieldUnit(recipe.getYieldUnit())
                .items(items)
                .build();
    }

    private RecipeItemResponseDTO toItemResponse(RecipeItem item) {
        return RecipeItemResponseDTO.builder()
                .id(item.getId())
                .ingredientType(item.getIngredientType())
                .materialId(item.getMaterial() != null ? item.getMaterial().getId() : null)
                .materialName(item.getMaterial() != null ? item.getMaterial().getName() : null)
                .subRecipeId(item.getSubRecipe() != null ? item.getSubRecipe().getId() : null)
                .subRecipeName(item.getSubRecipe() != null ? item.getSubRecipe().getName() : null)
                .quantity(item.getQuantity())
                .unit(item.getUnit())
                .build();
    }
}
