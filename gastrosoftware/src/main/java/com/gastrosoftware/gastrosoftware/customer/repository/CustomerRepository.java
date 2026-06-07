package com.gastrosoftware.gastrosoftware.customer.repository;

import com.gastrosoftware.gastrosoftware.customer.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
}
