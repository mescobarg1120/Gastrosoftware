package com.gastrosoftware.gastrosoftware.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeResponseDTO {

    private Long id;
    private String fullName;
    private String rut;
    private String email;
    private String role;
    private Long branchId;
    private boolean active;
    private LocalDateTime createdAt;
}
