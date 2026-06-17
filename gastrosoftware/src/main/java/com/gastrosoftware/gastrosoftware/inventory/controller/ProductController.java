package com.gastrosoftware.gastrosoftware.inventory.controller;

import com.gastrosoftware.gastrosoftware.inventory.dto.CreateProductDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.ProductResponseDTO;
import com.gastrosoftware.gastrosoftware.inventory.dto.UpdateProductDTO;
import com.gastrosoftware.gastrosoftware.inventory.entity.Category;
import com.gastrosoftware.gastrosoftware.inventory.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<List<ProductResponseDTO>> getAllProducts(@RequestParam(required = false) Long branchId) {
        return ResponseEntity.ok(productService.getAllProducts(branchId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @PostMapping
    public ResponseEntity<ProductResponseDTO> createProduct(@Valid @RequestBody CreateProductDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.createProduct(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> updateProduct(@PathVariable Long id, @Valid @RequestBody UpdateProductDTO dto) {
        return ResponseEntity.ok(productService.updateProduct(id, dto));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ProductResponseDTO> toggleAvailability(@PathVariable Long id) {
        return ResponseEntity.ok(productService.toggleAvailability(id));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getActiveCategories() {
        return ResponseEntity.ok(productService.getActiveCategories());
    }
}
