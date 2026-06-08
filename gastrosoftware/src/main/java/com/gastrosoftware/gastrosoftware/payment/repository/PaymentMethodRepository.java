package com.gastrosoftware.gastrosoftware.payment.repository;

import com.gastrosoftware.gastrosoftware.payment.entity.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {

    Optional<PaymentMethod> findByName(String name);
}
