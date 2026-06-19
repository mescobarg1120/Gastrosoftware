package com.gastrosoftware.gastrosoftware.employee.service;

import com.gastrosoftware.gastrosoftware.employee.dto.RoleResponseDTO;
import com.gastrosoftware.gastrosoftware.employee.repository.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class RoleService {

    private final RoleRepository roleRepository;

    public RoleService(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Transactional(readOnly = true)
    public List<RoleResponseDTO> getAllActiveRoles() {
        return roleRepository.findAll().stream()
                .filter(r -> Boolean.TRUE.equals(r.getActive()))
                .map(r -> RoleResponseDTO.builder()
                        .id(r.getId())
                        .name(r.getName())
                        .build())
                .toList();
    }
}
