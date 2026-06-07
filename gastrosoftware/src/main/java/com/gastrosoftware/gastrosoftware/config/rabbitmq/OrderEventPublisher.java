package com.gastrosoftware.gastrosoftware.config.rabbitmq;

import com.gastrosoftware.gastrosoftware.order.entity.Order;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j @RequiredArgsConstructor
@Component
public class OrderEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishKitchenTicket(Order order) {
        var items = order.getOrderItems().stream()
            .map(item -> Map.of(
                "productId", item.getProduct().getId(),
                "productName", item.getProduct().getName(),
                "quantity", item.getQuantity(),
                "notes", item.getNotes() != null ? item.getNotes() : ""
            ))
            .toList();

        var message = Map.of(
            "orderId", order.getId(),
            "branchId", order.getBranch().getId(),
            "status", "IN_PROGRESS",
            "items", items
        );

        rabbitTemplate.convertAndSend(RabbitConfig.EXCHANGE, RabbitConfig.RK_TICKET, message);
        log.info("Kitchen ticket published for order {}", order.getId());
    }
}
