package com.gastrosoftware.gastrosoftware.employee.repository;

import com.gastrosoftware.gastrosoftware.employee.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findByEmployeeIdAndCheckInBetween(Long employeeId, LocalDateTime from, LocalDateTime to);
}
