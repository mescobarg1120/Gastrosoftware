package com.gastrosoftware.gastrosoftware.employee.repository;

import com.gastrosoftware.gastrosoftware.employee.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
}
