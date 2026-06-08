package com.gastrosoftware.gastrosoftware.payment.repository;

import com.gastrosoftware.gastrosoftware.payment.entity.TaxDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TaxDocumentRepository extends JpaRepository<TaxDocument, Long> {

    Optional<TaxDocument> findByOrderId(Long orderId);
}
