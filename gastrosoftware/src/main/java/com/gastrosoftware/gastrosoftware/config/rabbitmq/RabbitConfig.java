package com.gastrosoftware.gastrosoftware.config.rabbitmq;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    public static final String EXCHANGE = "gastro.order.exchange";
    public static final String QUEUE_KITCHEN = "gastro.kitchen.ticket.queue";
    public static final String RK_TICKET = "order.status.in_progress";

    @Bean
    public TopicExchange orderExchange() {
        return new TopicExchange(EXCHANGE);
    }

    @Bean
    public Queue kitchenQueue() {
        return QueueBuilder.durable(QUEUE_KITCHEN).build();
    }

    @Bean
    public Binding kitchenBinding(Queue kitchenQueue, TopicExchange orderExchange) {
        return BindingBuilder.bind(kitchenQueue).to(orderExchange).with(RK_TICKET);
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory,
                                          Jackson2JsonMessageConverter converter) {
        RabbitTemplate t = new RabbitTemplate(connectionFactory);
        t.setMessageConverter(converter);
        return t;
    }
}
