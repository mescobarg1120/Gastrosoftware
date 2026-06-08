package com.gastrosoftware.gastrosoftware.payment.repository;

import com.gastrosoftware.gastrosoftware.payment.entity.CashRegisterShift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CashRegisterShiftRepository extends JpaRepository<CashRegisterShift, Long> {

    List<CashRegisterShift> findByBranchIdAndStatus(Long branchId, String status);

    Optional<CashRegisterShift> findByEmployeeIdAndStatus(Long employeeId, String status);
}
