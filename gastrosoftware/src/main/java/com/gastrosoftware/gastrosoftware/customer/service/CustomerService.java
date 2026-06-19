package com.gastrosoftware.gastrosoftware.customer.service;

import com.gastrosoftware.gastrosoftware.customer.dto.CreateCustomerDTO;
import com.gastrosoftware.gastrosoftware.customer.dto.CustomerResponseDTO;
import com.gastrosoftware.gastrosoftware.customer.dto.UpdateCustomerDTO;
import com.gastrosoftware.gastrosoftware.customer.entity.Customer;
import com.gastrosoftware.gastrosoftware.customer.entity.CustomerDiscount;
import com.gastrosoftware.gastrosoftware.customer.entity.LoyaltyEvent;
import com.gastrosoftware.gastrosoftware.customer.repository.CustomerDiscountRepository;
import com.gastrosoftware.gastrosoftware.customer.repository.CustomerRepository;
import com.gastrosoftware.gastrosoftware.customer.repository.LoyaltyEventRepository;
import com.gastrosoftware.gastrosoftware.shared.entity.DiscountRule;
import com.gastrosoftware.gastrosoftware.shared.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class CustomerService {

    private static final String TIER_SILVER = "SILVER";
    private static final String TIER_GOLD = "GOLD";
    private static final String TIER_VIP = "VIP";

    private static final int ORDERS_FOR_SILVER = 10;
    private static final int ORDERS_FOR_GOLD = 30;
    private static final int ORDERS_FOR_VIP = 100;
    private static final BigDecimal SPENT_FOR_SILVER = new BigDecimal("50000");
    private static final BigDecimal SPENT_FOR_GOLD = new BigDecimal("150000");
    private static final BigDecimal SPENT_FOR_VIP = new BigDecimal("500000");

    private final CustomerRepository customerRepository;
    private final CustomerDiscountRepository customerDiscountRepository;
    private final LoyaltyEventRepository loyaltyEventRepository;

    public CustomerService(CustomerRepository customerRepository,
                           CustomerDiscountRepository customerDiscountRepository,
                           LoyaltyEventRepository loyaltyEventRepository) {
        this.customerRepository = customerRepository;
        this.customerDiscountRepository = customerDiscountRepository;
        this.loyaltyEventRepository = loyaltyEventRepository;
    }

    public CustomerResponseDTO createCustomer(CreateCustomerDTO dto) {
        Customer customer = Customer.builder()
                .fullName(dto.getFullName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .build();

        customer = customerRepository.save(customer);
        return toResponse(customer);
    }

    @Transactional(readOnly = true)
    public List<CustomerResponseDTO> getAllCustomers() {
        return customerRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CustomerResponseDTO getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));
        return toResponse(customer);
    }

    @Transactional(readOnly = true)
    public CustomerResponseDTO getCustomerByPhone(String phone) {
        Customer customer = customerRepository.findByPhone(phone)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "phone", phone));
        return toResponse(customer);
    }

    public CustomerResponseDTO updateCustomer(Long id, UpdateCustomerDTO dto) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", id));

        if (dto.getFullName() != null) {
            customer.setFullName(dto.getFullName());
        }
        if (dto.getEmail() != null) {
            customer.setEmail(dto.getEmail());
        }

        customer = customerRepository.save(customer);
        return toResponse(customer);
    }

    public void onOrderDelivered(Long customerId, BigDecimal orderTotal) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", customerId));

        customer.setTotalOrders(customer.getTotalOrders() + 1);
        customer.setTotalSpent(customer.getTotalSpent().add(orderTotal));
        customer.setLastOrderAt(LocalDateTime.now());

        String newTier = evaluateTier(customer.getTotalOrders(), customer.getTotalSpent());
        if (!newTier.equals(customer.getLoyaltyTier())) {
            String oldTier = customer.getLoyaltyTier();
            customer.setLoyaltyTier(newTier);

            loyaltyEventRepository.save(LoyaltyEvent.builder()
                    .customer(customer)
                    .eventType("TIER_UPGRADE")
                    .detail("Subió de %s a %s".formatted(oldTier, newTier))
                    .build());
        }

        customerRepository.save(customer);

        loyaltyEventRepository.save(LoyaltyEvent.builder()
                .customer(customer)
                .eventType("ORDER_COMPLETED")
                .detail("Pedido entregado por $%s".formatted(orderTotal))
                .build());
    }

    @Transactional(readOnly = true)
    public List<CustomerDiscount> getAvailableDiscount(Long customerId) {
        return customerDiscountRepository.findByCustomerIdAndUsedFalse(customerId);
    }

    private String evaluateTier(int totalOrders, BigDecimal totalSpent) {
        if (totalOrders >= ORDERS_FOR_VIP || totalSpent.compareTo(SPENT_FOR_VIP) >= 0) {
            return TIER_VIP;
        }
        if (totalOrders >= ORDERS_FOR_GOLD || totalSpent.compareTo(SPENT_FOR_GOLD) >= 0) {
            return TIER_GOLD;
        }
        if (totalOrders >= ORDERS_FOR_SILVER || totalSpent.compareTo(SPENT_FOR_SILVER) >= 0) {
            return TIER_SILVER;
        }
        return "NORMAL";
    }

    private CustomerResponseDTO toResponse(Customer customer) {
        return CustomerResponseDTO.builder()
                .id(customer.getId())
                .fullName(customer.getFullName())
                .phone(customer.getPhone())
                .email(customer.getEmail())
                .loyaltyTier(customer.getLoyaltyTier())
                .totalOrders(customer.getTotalOrders())
                .totalSpent(customer.getTotalSpent())
                .lastOrderAt(customer.getLastOrderAt())
                .build();
    }
}
