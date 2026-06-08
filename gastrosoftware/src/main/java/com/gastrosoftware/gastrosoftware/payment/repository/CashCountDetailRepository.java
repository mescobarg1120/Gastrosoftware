package com.gastrosoftware.gastrosoftware.payment.repository;

import com.gastrosoftware.gastrosoftware.payment.entity.CashCountDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CashCountDetailRepository extends JpaRepository<CashCountDetail, Long> {

    List<CashCountDetail> findByShiftId(Long shiftId);

    void deleteByShiftId(Long shiftId);
}
