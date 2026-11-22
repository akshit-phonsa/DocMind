package com.example.docmind.docmind_backend.dto;

public record LoginResponse(
        String accessToken,
        UserDto user
) {
}
