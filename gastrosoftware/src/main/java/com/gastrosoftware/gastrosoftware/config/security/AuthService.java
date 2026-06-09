package com.gastrosoftware.gastrosoftware.config.security;

import com.gastrosoftware.gastrosoftware.employee.entity.Employee;
import com.gastrosoftware.gastrosoftware.employee.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final long expiration;

    public AuthService(
            EmployeeRepository employeeRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider,
            @Value("${jwt.expiration}") long expiration
    ) {
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.expiration = expiration;
    }

    public LoginResponseDTO login(LoginRequestDTO request) {
        Employee employee = employeeRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas"));

        if (!passwordEncoder.matches(request.getPassword(), employee.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales inválidas");
        }

        if (!employee.getActive()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Cuenta de usuario desactivada");
        }

        String token = jwtTokenProvider.generateToken(employee);

        return LoginResponseDTO.builder()
                .token(token)
                .employeeId(employee.getId())
                .email(employee.getEmail())
                .role(employee.getRole().getName())
                .branchId(employee.getBranch().getId())
                .fullName(employee.getFullName())
                .expiresIn(expiration)
                .build();
    }
}
