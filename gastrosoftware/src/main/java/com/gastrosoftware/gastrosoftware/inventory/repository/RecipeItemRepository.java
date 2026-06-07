package com.gastrosoftware.gastrosoftware.inventory.repository;

import com.gastrosoftware.gastrosoftware.inventory.entity.RecipeItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecipeItemRepository extends JpaRepository<RecipeItem, Long> {

    List<RecipeItem> findByRecipeId(Long recipeId);
}
