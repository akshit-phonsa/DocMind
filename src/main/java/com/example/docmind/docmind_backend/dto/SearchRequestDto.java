package com.example.docmind.docmind_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Getter
@Service
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchRequestDto {

    @NotBlank(message = "Query cannot be empty")
    private String query;

    private UUID documentId;

    private Integer topk;

    private Double similaritySearch;
}
