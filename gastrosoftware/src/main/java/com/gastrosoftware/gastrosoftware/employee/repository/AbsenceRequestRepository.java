package com.gastrosoftware.gastrosoftware.employee.repository;

import com.gastrosoftware.gastrosoftware.employee.entity.AbsenceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AbsenceRequestRepository extends JpaRepository<AbsenceRequest, Long> {

    List<AbsenceRequest> findByEmployeeIdAndStatus(Long employeeId, String status);
}
