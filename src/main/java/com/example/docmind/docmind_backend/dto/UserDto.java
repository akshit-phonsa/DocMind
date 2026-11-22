package com.example.docmind.docmind_backend.dto;

import com.example.docmind.docmind_backend.entity.Role;

public record UserDto(
        Long id,
        String username,
        String email,
        Role role
) {
}
