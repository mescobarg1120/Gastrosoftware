package com.gastrosoftware.gastrosoftware.inventory.repository;

import com.gastrosoftware.gastrosoftware.inventory.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    List<Recipe> findByProductIdAndActive(Long productId, boolean active);

    List<Recipe> findByIsIntermediateTrueAndActiveTrue();
}
