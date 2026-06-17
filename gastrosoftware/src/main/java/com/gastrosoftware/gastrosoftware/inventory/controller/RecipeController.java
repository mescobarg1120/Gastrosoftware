package com.gastrosoftware.gastrosoftware.inventory.controller;

import com.gastrosoftware.gastrosoftware.inventory.dto.CreateRecipeDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.CreateRecipeItemDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.RecipeItemResponseDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.RecipeResponseDTO;
import com.gastrosoftware.gastrosoftware.inventory.service.RecipeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/recipes")
public class RecipeController {

    private final RecipeService recipeService;

    public RecipeController(RecipeService recipeService) {
        this.recipeService = recipeService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecipeResponseDTO> getRecipeById(@PathVariable Long id) {
        return ResponseEntity.ok(recipeService.getRecipeById(id));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<RecipeResponseDTO>> getRecipesByProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(recipeService.getRecipesByProduct(productId));
    }

    @PostMapping
    public ResponseEntity<RecipeResponseDTO> createRecipe(@Valid @RequestBody CreateRecipeDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(recipeService.createRecipe(dto));
    }

    @PostMapping("/{recipeId}/items")
    public ResponseEntity<RecipeItemResponseDTO> addRecipeItem(
            @PathVariable Long recipeId,
            @Valid @RequestBody CreateRecipeItemDTO dto
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(recipeService.addRecipeItem(recipeId, dto));
    }

    @DeleteMapping("/{recipeId}/items/{itemId}")
    public ResponseEntity<Void> removeRecipeItem(@PathVariable Long recipeId, @PathVariable Long itemId) {
        recipeService.removeRecipeItem(recipeId, itemId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/intermediates")
    public ResponseEntity<List<RecipeResponseDTO>> getIntermediateRecipes() {
        return ResponseEntity.ok(recipeService.getIntermediateRecipes());
    }
}
