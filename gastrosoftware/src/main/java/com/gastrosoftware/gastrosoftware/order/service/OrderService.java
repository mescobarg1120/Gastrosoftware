package com.gastrosoftware.gastrosoftware.order.service;

import com.gastrosoftware.gastrosoftware.order.dto.AddItemRequest;
import com.gastrosoftware.gastrosoftware.order.dto.CreateOrderRequest;
import com.gastrosoftware.gastrosoftware.order.dto.OrderResponse;
import com.gastrosoftware.gastrosoftware.order.dto.UpdateStatusRequest;

import java.util.List;

public interface OrderService {

    OrderResponse createOrder(CreateOrderRequest request);

    OrderResponse addItem(Long orderId, AddItemRequest request);

    OrderResponse updateStatus(Long orderId, UpdateStatusRequest request);

    OrderResponse getOrderById(Long id);

    List<OrderResponse> getActiveOrders(Long branchId);

    void cancelOrder(Long id);
}
