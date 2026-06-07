package com.gastrosoftware.gastrosoftware.employee.repository;

import com.gastrosoftware.gastrosoftware.employee.entity.WorkSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface WorkScheduleRepository extends JpaRepository<WorkSchedule, Long> {

    Optional<WorkSchedule> findByEmployeeIdAndWeekStart(Long employeeId, LocalDate weekStart);
}
