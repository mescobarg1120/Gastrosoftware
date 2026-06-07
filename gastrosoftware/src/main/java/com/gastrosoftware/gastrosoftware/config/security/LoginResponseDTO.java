package com.gastrosoftware.gastrosoftware.config.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDTO {

    private String token;
    private Long employeeId;
    private String email;
    private String role;
    private Long branchId;
    private long expiresIn;
}
