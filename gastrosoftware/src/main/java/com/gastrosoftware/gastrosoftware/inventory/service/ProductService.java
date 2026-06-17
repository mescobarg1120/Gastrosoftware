package com.gastrosoftware.gastrosoftware.inventory.service;

import com.gastrosoftware.gastrosoftware.inventory.dto.CreateProductDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.CreateProductVariantDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.ProductResponseDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.ProductVariantResponseDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.UpdateProductDTO;
import com.gastrosoftware.gastrosoftware.inventory.entity.Category;
import com.gastrosoftware.gastrosoftware.inventory.entity.Product;
import com.gastrosoftware.gastrosoftware.inventory.entity.ProductVariant;
import com.gastrosoftware.gastrosoftware.inventory.entity.Recipe;
import com.gastrosoftware.gastrosoftware.inventory.repository.CategoryRepository;
import com.gastrosoftware.gastrosoftware.inventory.repository.ProductRepository;
import com.gastrosoftware.gastrosoftware.inventory.repository.ProductVariantRepository;
import com.gastrosoftware.gastrosoftware.inventory.repository.RecipeRepository;
import com.gastrosoftware.gastrosoftware.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository productVariantRepository;
    private final RecipeRepository recipeRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository,
                          ProductVariantRepository productVariantRepository, RecipeRepository recipeRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.productVariantRepository = productVariantRepository;
        this.recipeRepository = recipeRepository;
    }

    @Transactional(readOnly = true)
    public List<ProductResponseDTO> getAllProducts(Long branchId) {
        return productRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponseDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        return toResponse(product);
    }

    public ProductResponseDTO createProduct(CreateProductDTO dto) {
        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", dto.getCategoryId()));

        Product product = Product.builder()
                .category(category)
                .name(dto.getName())
                .productType(dto.getProductType())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .available(true)
                .build();

        product = productRepository.save(product);
        return toResponse(product);
    }

    public ProductResponseDTO updateProduct(Long id, UpdateProductDTO dto) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));

        if (dto.getName() != null) product.setName(dto.getName());
        if (dto.getDescription() != null) product.setDescription(dto.getDescription());
        if (dto.getPrice() != null) product.setPrice(dto.getPrice());
        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", dto.getCategoryId()));
            product.setCategory(category);
        }

        product = productRepository.save(product);
        return toResponse(product);
    }

    public ProductResponseDTO toggleAvailability(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        product.setAvailable(!product.getAvailable());
        product = productRepository.save(product);
        return toResponse(product);
    }

    @Transactional(readOnly = true)
    public List<Category> getActiveCategories() {
        return categoryRepository.findByActive(true);
    }

    @Transactional(readOnly = true)
    public List<ProductVariantResponseDTO> getVariantsByProduct(Long productId) {
        return productVariantRepository.findByProductIdAndActiveTrue(productId).stream()
                .map(this::toVariantResponse)
                .toList();
    }

    public ProductVariantResponseDTO createVariant(Long productId, CreateProductVariantDTO dto) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        Recipe recipe = null;
        if (dto.getRecipeId() != null) {
            recipe = recipeRepository.findById(dto.getRecipeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Recipe", dto.getRecipeId()));
        }

        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .size(dto.getSize())
                .price(dto.getPrice())
                .recipe(recipe)
                .active(true)
                .build();

        variant = productVariantRepository.save(variant);
        return toVariantResponse(variant);
    }

    private ProductVariantResponseDTO toVariantResponse(ProductVariant variant) {
        return ProductVariantResponseDTO.builder()
                .id(variant.getId())
                .size(variant.getSize())
                .price(variant.getPrice())
                .recipeId(variant.getRecipe() != null ? variant.getRecipe().getId() : null)
                .build();
    }

    private ProductResponseDTO toResponse(Product product) {
        List<ProductVariantResponseDTO> variants = productVariantRepository
                .findByProductIdAndActiveTrue(product.getId()).stream()
                .map(this::toVariantResponse)
                .toList();

        return ProductResponseDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .productType(product.getProductType())
                .price(product.getPrice())
                .available(product.getAvailable())
                .categoryName(product.getCategory().getName())
                .variants(variants)
                .build();
    }
}
