package com.gastrosoftware.gastrosoftware.inventory.repository;

import com.gastrosoftware.gastrosoftware.inventory.entity.IntermediateStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IntermediateStockRepository extends JpaRepository<IntermediateStock, Long> {

    Optional<IntermediateStock> findByRecipeIdAndBranchId(Long recipeId, Long branchId);
}
