package com.gastrosoftware.gastrosoftware.inventory.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "recipe")
public class Recipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 30)
    private String size;

    @Column(name = "is_intermediate", nullable = false)
    private Boolean isIntermediate;

    @Column(name = "yield_qty", precision = 10, scale = 3)
    private BigDecimal yieldQty;

    @Column(name = "yield_unit", length = 20)
    private String yieldUnit;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(nullable = false)
    private Boolean active;

    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToMany(mappedBy = "recipe")
    private List<RecipeItem> recipeItems;
}
