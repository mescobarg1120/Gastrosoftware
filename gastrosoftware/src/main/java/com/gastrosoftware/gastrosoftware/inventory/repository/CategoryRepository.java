package com.gastrosoftware.gastrosoftware.inventory.repository;

import com.gastrosoftware.gastrosoftware.inventory.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByActive(boolean active);
}
