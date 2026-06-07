package com.gastrosoftware.gastrosoftware.employee.service;

import com.gastrosoftware.gastrosoftware.config.entity.Branch;
import com.gastrosoftware.gastrosoftware.config.repository.BranchRepository;
import com.gastrosoftware.gastrosoftware.employee.dto.CreateEmployeeDTO;
import com.gastrosoftware.gastrosoftware.employee.dto.EmployeeResponseDTO;
import com.gastrosoftware.gastrosoftware.employee.dto.UpdateEmployeeDTO;
import com.gastrosoftware.gastrosoftware.employee.entity.Employee;
import com.gastrosoftware.gastrosoftware.employee.entity.Role;
import com.gastrosoftware.gastrosoftware.employee.repository.EmployeeRepository;
import com.gastrosoftware.gastrosoftware.employee.repository.RoleRepository;
import com.gastrosoftware.gastrosoftware.shared.exception.ResourceNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final RoleRepository roleRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;

    public EmployeeService(EmployeeRepository employeeRepository, RoleRepository roleRepository, BranchRepository branchRepository, PasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.roleRepository = roleRepository;
        this.branchRepository = branchRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public EmployeeResponseDTO createEmployee(CreateEmployeeDTO dto) {
        Role role = roleRepository.findById(dto.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role", dto.getRoleId()));
        Branch branch = branchRepository.findById(dto.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch", dto.getBranchId()));

        Employee employee = Employee.builder()
                .branch(branch)
                .role(role)
                .fullName(dto.getFullName())
                .rut(dto.getRut())
                .email(dto.getEmail())
                .passwordHash(passwordEncoder.encode(dto.getPassword()))
                .hourlyRate(dto.getHourlyRate())
                .active(true)
                .build();

        employee = employeeRepository.save(employee);
        return toResponse(employee);
    }

    @Transactional(readOnly = true)
    public EmployeeResponseDTO getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));
        return toResponse(employee);
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponseDTO> getEmployeesByBranch(Long branchId) {
        return employeeRepository.findByBranchId(branchId).stream()
                .map(this::toResponse)
                .toList();
    }

    public EmployeeResponseDTO updateEmployee(Long id, UpdateEmployeeDTO dto) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));

        if (dto.getRoleId() != null) {
            Role role = roleRepository.findById(dto.getRoleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Role", dto.getRoleId()));
            employee.setRole(role);
        }

        employee.setFullName(dto.getFullName());
        employee.setRut(dto.getRut());
        employee.setEmail(dto.getEmail());
        employee.setHourlyRate(dto.getHourlyRate());

        employee = employeeRepository.save(employee);
        return toResponse(employee);
    }

    public void deactivateEmployee(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));
        employee.setActive(false);
        employeeRepository.save(employee);
    }

    public void changePassword(Long id, String newPassword) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));
        employee.setPasswordHash(passwordEncoder.encode(newPassword));
        employeeRepository.save(employee);
    }

    private EmployeeResponseDTO toResponse(Employee employee) {
        return EmployeeResponseDTO.builder()
                .id(employee.getId())
                .fullName(employee.getFullName())
                .rut(employee.getRut())
                .email(employee.getEmail())
                .role(employee.getRole().getName())
                .branchId(employee.getBranch().getId())
                .active(employee.getActive())
                .createdAt(employee.getCreatedAt())
                .build();
    }
}
