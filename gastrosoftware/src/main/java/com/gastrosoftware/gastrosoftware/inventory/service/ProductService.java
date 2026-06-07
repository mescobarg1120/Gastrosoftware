package com.gastrosoftware.gastrosoftware.inventory.service;

import com.gastrosoftware.gastrosoftware.inventory.dto.CreateProductDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.ProductResponseDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.UpdateProductDTO;
import com.gastrosoftware.gastrosoftware.inventory.entity.Category;
import com.gastrosoftware.gastrosoftware.inventory.entity.Product;
import com.gastrosoftware.gastrosoftware.inventory.repository.CategoryRepository;
import com.gastrosoftware.gastrosoftware.inventory.repository.ProductRepository;
import com.gastrosoftware.gastrosoftware.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
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

    private ProductResponseDTO toResponse(Product product) {
        return ProductResponseDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .productType(product.getProductType())
                .price(product.getPrice())
                .available(product.getAvailable())
                .categoryName(product.getCategory().getName())
                .build();
    }
}
