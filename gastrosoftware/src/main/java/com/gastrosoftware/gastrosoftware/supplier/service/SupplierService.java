package com.gastrosoftware.gastrosoftware.supplier.service;

import com.gastrosoftware.gastrosoftware.config.entity.Branch;
import com.gastrosoftware.gastrosoftware.config.repository.BranchRepository;
import com.gastrosoftware.gastrosoftware.employee.entity.Employee;
import com.gastrosoftware.gastrosoftware.employee.repository.EmployeeRepository;
import com.gastrosoftware.gastrosoftware.inventory.entity.RawMaterial;
import com.gastrosoftware.gastrosoftware.inventory.repository.RawMaterialRepository;
import com.gastrosoftware.gastrosoftware.shared.exception.ResourceNotFoundException;
import com.gastrosoftware.gastrosoftware.supplier.dto.CreatePurchaseOrderDTO;
import com.gastrosoftware.gastrosoftware.supplier.dto.CreateSupplierDTO;
import com.gastrosoftware.gastrosoftware.supplier.dto.PurchaseItemDTO;
import com.gastrosoftware.gastrosoftware.supplier.dto.PurchaseOrderResponseDTO;
import com.gastrosoftware.gastrosoftware.supplier.dto.SupplierResponseDTO;
import com.gastrosoftware.gastrosoftware.supplier.entity.PurchaseItem;
import com.gastrosoftware.gastrosoftware.supplier.entity.PurchaseOrder;
import com.gastrosoftware.gastrosoftware.supplier.entity.Supplier;
import com.gastrosoftware.gastrosoftware.supplier.repository.PurchaseItemRepository;
import com.gastrosoftware.gastrosoftware.supplier.repository.PurchaseOrderRepository;
import com.gastrosoftware.gastrosoftware.supplier.repository.SupplierRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseItemRepository purchaseItemRepository;
    private final BranchRepository branchRepository;
    private final EmployeeRepository employeeRepository;
    private final RawMaterialRepository rawMaterialRepository;

    public SupplierService(SupplierRepository supplierRepository,
                           PurchaseOrderRepository purchaseOrderRepository,
                           PurchaseItemRepository purchaseItemRepository,
                           BranchRepository branchRepository,
                           EmployeeRepository employeeRepository,
                           RawMaterialRepository rawMaterialRepository) {
        this.supplierRepository = supplierRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.purchaseItemRepository = purchaseItemRepository;
        this.branchRepository = branchRepository;
        this.employeeRepository = employeeRepository;
        this.rawMaterialRepository = rawMaterialRepository;
    }

    public SupplierResponseDTO createSupplier(CreateSupplierDTO dto) {
        Supplier supplier = Supplier.builder()
                .legalName(dto.getLegalName())
                .tradeName(dto.getTradeName())
                .rut(dto.getRut())
                .address(dto.getAddress())
                .leadTimeDays(dto.getLeadTimeDays() != null ? dto.getLeadTimeDays() : 1)
                .deliveryDays(dto.getDeliveryDays())
                .paymentTerms(dto.getPaymentTerms())
                .build();

        supplier = supplierRepository.save(supplier);
        return toSupplierResponse(supplier);
    }

    @Transactional(readOnly = true)
    public SupplierResponseDTO getSupplierById(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", id));
        return toSupplierResponse(supplier);
    }

    @Transactional(readOnly = true)
    public List<SupplierResponseDTO> getAllSuppliers() {
        return supplierRepository.findAll().stream()
                .map(this::toSupplierResponse)
                .toList();
    }

    public PurchaseOrderResponseDTO createPurchaseOrder(CreatePurchaseOrderDTO dto) {
        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", dto.getSupplierId()));
        Branch branch = branchRepository.findById(dto.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch", dto.getBranchId()));
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", dto.getEmployeeId()));

        PurchaseOrder order = PurchaseOrder.builder()
                .supplier(supplier)
                .branch(branch)
                .employee(employee)
                .expectedAt(dto.getExpectedAt())
                .items(new ArrayList<>())
                .build();

        BigDecimal total = BigDecimal.ZERO;

        for (PurchaseItemDTO itemDTO : dto.getItems()) {
            RawMaterial material = rawMaterialRepository.findById(itemDTO.getMaterialId())
                    .orElseThrow(() -> new ResourceNotFoundException("RawMaterial", itemDTO.getMaterialId()));

            BigDecimal lineTotal = itemDTO.getQuantity().multiply(itemDTO.getUnitCost());
            total = total.add(lineTotal);

            PurchaseItem item = PurchaseItem.builder()
                    .purchaseOrder(order)
                    .material(material)
                    .quantity(itemDTO.getQuantity())
                    .unitCost(itemDTO.getUnitCost())
                    .build();

            order.getItems().add(item);
        }

        order.setTotal(total);
        order = purchaseOrderRepository.save(order);
        return toPurchaseOrderResponse(order);
    }

    public PurchaseOrderResponseDTO receivePurchaseOrder(Long purchaseOrderId) {
        PurchaseOrder order = purchaseOrderRepository.findById(purchaseOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", purchaseOrderId));

        if (!"PENDING".equals(order.getStatus())) {
            throw new IllegalStateException("La orden de compra ya fue recibida o cancelada");
        }

        order.setStatus("RECEIVED");

        for (PurchaseItem item : order.getItems()) {
            RawMaterial material = item.getMaterial();
            BigDecimal currentStock = material.getStockQty();
            BigDecimal currentCost = material.getAvgUnitCost();
            BigDecimal newQty = item.getQuantity();
            BigDecimal newCost = item.getUnitCost();

            BigDecimal totalCost = currentStock.multiply(currentCost)
                    .add(newQty.multiply(newCost));
            BigDecimal totalQty = currentStock.add(newQty);
            BigDecimal newAvgCost = totalCost.divide(totalQty, 2, RoundingMode.HALF_UP);

            material.setStockQty(totalQty);
            material.setAvgUnitCost(newAvgCost);
            material.setLastUnitCost(newCost);
            rawMaterialRepository.save(material);
        }

        order = purchaseOrderRepository.save(order);
        return toPurchaseOrderResponse(order);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderResponseDTO> getPurchaseOrdersByBranch(Long branchId) {
        return purchaseOrderRepository.findByBranchIdAndStatus(branchId, "PENDING").stream()
                .map(this::toPurchaseOrderResponse)
                .toList();
    }

    private SupplierResponseDTO toSupplierResponse(Supplier supplier) {
        return SupplierResponseDTO.builder()
                .id(supplier.getId())
                .legalName(supplier.getLegalName())
                .tradeName(supplier.getTradeName())
                .rut(supplier.getRut())
                .active(supplier.getActive())
                .build();
    }

    private PurchaseOrderResponseDTO toPurchaseOrderResponse(PurchaseOrder order) {
        return PurchaseOrderResponseDTO.builder()
                .id(order.getId())
                .supplierId(order.getSupplier().getId())
                .supplierName(order.getSupplier().getLegalName())
                .branchId(order.getBranch().getId())
                .total(order.getTotal())
                .status(order.getStatus())
                .expectedAt(order.getExpectedAt())
                .createdAt(order.getCreatedAt())
                .build();
    }
}
