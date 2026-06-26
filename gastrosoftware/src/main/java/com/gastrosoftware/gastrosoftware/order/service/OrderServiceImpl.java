package com.gastrosoftware.gastrosoftware.order.service;

import com.gastrosoftware.gastrosoftware.config.entity.Branch;
import com.gastrosoftware.gastrosoftware.config.rabbitmq.OrderEventPublisher;
import com.gastrosoftware.gastrosoftware.config.repository.BranchRepository;
import com.gastrosoftware.gastrosoftware.customer.entity.Customer;
import com.gastrosoftware.gastrosoftware.customer.repository.CustomerRepository;
import com.gastrosoftware.gastrosoftware.employee.entity.Employee;
import com.gastrosoftware.gastrosoftware.employee.repository.EmployeeRepository;
import com.gastrosoftware.gastrosoftware.inventory.entity.Product;
import com.gastrosoftware.gastrosoftware.inventory.entity.ProductVariant;
import com.gastrosoftware.gastrosoftware.inventory.entity.Recipe;
import com.gastrosoftware.gastrosoftware.inventory.repository.ProductRepository;
import com.gastrosoftware.gastrosoftware.inventory.repository.ProductVariantRepository;
import com.gastrosoftware.gastrosoftware.inventory.repository.RecipeRepository;
import com.gastrosoftware.gastrosoftware.order.dto.*;
import com.gastrosoftware.gastrosoftware.order.entity.*;
import com.gastrosoftware.gastrosoftware.order.repository.*;
import com.gastrosoftware.gastrosoftware.payment.entity.Payment;
import com.gastrosoftware.gastrosoftware.payment.repository.PaymentRepository;
import com.gastrosoftware.gastrosoftware.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j @Service @RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderStatusRepository orderStatusRepository;
    private final OrderTypeRepository orderTypeRepository;
    private final BranchRepository branchRepository;
    private final EmployeeRepository employeeRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final RecipeRepository recipeRepository;
    private final ProductVariantRepository productVariantRepository;
    private final OrderEventPublisher eventPublisher;
    private final PaymentRepository paymentRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        try {
            Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch", request.getBranchId()));

            Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee", request.getEmployeeId()));

            OrderType orderType = orderTypeRepository.findById(request.getOrderTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("OrderType", request.getOrderTypeId()));

            OrderStatus pendingStatus = orderStatusRepository.findByName("PENDING")
                .orElseThrow(() -> new ResourceNotFoundException("OrderStatus", "name", "PENDING"));

            Customer customer = Optional.ofNullable(request.getCustomerId())
                .flatMap(customerRepository::findById)
                .orElse(null);

            var now = LocalDateTime.now();
            var startOfDay = now.toLocalDate().atStartOfDay();
            var endOfDay = now.toLocalDate().atTime(23, 59, 59, 999999999);
            int dailyCount = orderRepository.countByBranchIdAndCreatedAtBetween(
                branch.getId(), startOfDay, endOfDay);
            int dailyOrderNumber = dailyCount + 1;

            Order order = Order.builder()
                .branch(branch)
                .employee(employee)
                .customer(customer)
                .orderType(orderType)
                .orderStatus(pendingStatus)
                .dailyOrderNumber(dailyOrderNumber)
                .subtotal(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .platformCommission(BigDecimal.ZERO)
                .total(BigDecimal.ZERO)
                .createdAt(now)
                .updatedAt(now)
                .build();

            order = orderRepository.save(order);
            log.info("Order {} created with status PENDING", order.getId());

            return toResponse(order);
        } catch (Exception e) {
            System.out.println(">>> ERROR en createOrder: " + e.getClass().getName() + " — " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @Override
    @Transactional
    public OrderResponse addItem(Long orderId, AddItemRequest request) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        Product product = productRepository.findById(request.getProductId())
            .orElseThrow(() -> new ResourceNotFoundException("Product", request.getProductId()));

        Recipe recipe = null;
        if (request.getRecipeId() != null) {
            recipe = recipeRepository.findById(request.getRecipeId())
                .orElseThrow(() -> new ResourceNotFoundException("Recipe", request.getRecipeId()));
        }

        BigDecimal unitPrice = product.getPrice();
        ProductVariant variant = null;

        if (request.getVariantId() != null) {
            variant = productVariantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", request.getVariantId()));
            unitPrice = variant.getPrice();
            if (variant.getRecipe() != null) {
                recipe = variant.getRecipe();
            }
        }

        OrderItem item = OrderItem.builder()
            .order(order)
            .product(product)
            .recipe(recipe)
            .productVariant(variant)
            .quantity(request.getQuantity())
            .unitPrice(unitPrice)
            .notes(request.getNotes())
            .build();

        orderItemRepository.save(item);

        recalculateOrder(order);

        log.info("Item added to order {}: product={}, qty={}, price={}",
            orderId, product.getName(), request.getQuantity(), unitPrice);

        return toResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse updateStatus(Long orderId, UpdateStatusRequest request) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));

        OrderStatus newStatus = orderStatusRepository.findById(request.getOrderStatusId())
            .orElseThrow(() -> new ResourceNotFoundException("OrderStatus", request.getOrderStatusId()));

        order.setOrderStatus(newStatus);
        order.setUpdatedAt(LocalDateTime.now());
        order = orderRepository.save(order);

        OrderResponse response = toResponse(order);

        if ("IN_PROGRESS".equals(newStatus.getName())) {
            eventPublisher.publishKitchenTicket(order);
        }

        if ("IN_PROGRESS".equals(newStatus.getName()) || "PREPARING".equals(newStatus.getName()) || "READY".equals(newStatus.getName())) {
            try {
                messagingTemplate.convertAndSend("/topic/kitchen/" + order.getBranch().getId(), response);
            } catch (Exception e) {
                log.warn("Error enviando WebSocket para order {}: {}", orderId, e.getMessage());
            }
        }

        log.info("Order {} status updated to {}", orderId, newStatus.getName());

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order", id));

        return toResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getActiveOrders(Long branchId) {
        List<String> excluded = List.of("DELIVERED", "CANCELLED");
        var now = LocalDateTime.now();
        var startOfDay = now.toLocalDate().atStartOfDay();
        var endOfDay = now.toLocalDate().atTime(23, 59, 59, 999999999);
        List<Order> orders = orderRepository.findByBranchIdAndOrderStatusNameNotInAndCreatedAtBetween(
                branchId, excluded, startOfDay, endOfDay);

        return orders.stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByBranchAndDateRange(Long branchId, LocalDateTime from, LocalDateTime to) {
        List<Order> orders = orderRepository.findByBranchIdAndCreatedAtBetweenOrderByCreatedAtDesc(branchId, from, to);
        return orders.stream()
            .map(this::toResponse)
            .toList();
    }

    @Override
    @Transactional
    public void cancelOrder(Long id) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order", id));

        OrderStatus cancelledStatus = orderStatusRepository.findByName("CANCELLED")
            .orElseThrow(() -> new ResourceNotFoundException("OrderStatus", "name", "CANCELLED"));

        order.setOrderStatus(cancelledStatus);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        log.info("Order {} cancelled", id);
    }

    private void recalculateOrder(Order order) {
        List<OrderItem> items = order.getOrderItems();
        if (items == null) return;

        BigDecimal subtotal = items.stream()
            .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        order.setSubtotal(subtotal);
        order.setTotal(subtotal
            .subtract(order.getDiscountAmount())
            .add(order.getPlatformCommission()));
        order.setUpdatedAt(LocalDateTime.now());

        orderRepository.save(order);
    }

    private OrderResponse toResponse(Order order) {
        List<OrderItemResponse> items = order.getOrderItems() != null
            ? order.getOrderItems().stream().map(this::toItemResponse).toList()
            : List.of();

        String paymentMethod = null;
        try {
            Optional<Payment> payment = paymentRepository.findByOrderId(order.getId());
            if (payment.isPresent() && payment.get().getPaymentMethod() != null) {
                paymentMethod = payment.get().getPaymentMethod().getName();
            }
        } catch (Exception ignored) {}

        return OrderResponse.builder()
            .id(order.getId())
            .branchId(order.getBranch().getId())
            .employeeId(order.getEmployee().getId())
            .employeeName(order.getEmployee().getFullName())
            .customerId(order.getCustomer() != null ? order.getCustomer().getId() : null)
            .customerName(order.getCustomer() != null ? order.getCustomer().getFullName() : null)
            .orderTypeId(order.getOrderType().getId())
            .orderTypeName(order.getOrderType().getName())
            .orderStatusId(order.getOrderStatus().getId())
            .orderStatusName(order.getOrderStatus().getName())
            .orderStatusColor(order.getOrderStatus().getColor())
            .subtotal(order.getSubtotal())
            .discountAmount(order.getDiscountAmount())
            .platformCommission(order.getPlatformCommission())
            .total(order.getTotal())
            .externalOrderRef(order.getExternalOrderRef())
            .dailyOrderNumber(order.getDailyOrderNumber())
            .paymentMethod(paymentMethod)
            .itemsCount(items.size())
            .createdAt(order.getCreatedAt())
            .updatedAt(order.getUpdatedAt())
            .items(items)
            .build();
    }

    private OrderItemResponse toItemResponse(OrderItem item) {
        return OrderItemResponse.builder()
            .id(item.getId())
            .productId(item.getProduct().getId())
            .productName(item.getProduct().getName())
            .recipeId(item.getRecipe() != null ? item.getRecipe().getId() : null)
            .variantId(item.getProductVariant() != null ? item.getProductVariant().getId() : null)
            .quantity(item.getQuantity())
            .unitPrice(item.getUnitPrice())
            .subtotal(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
            .notes(item.getNotes())
            .build();
    }
}
