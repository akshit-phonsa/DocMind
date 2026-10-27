package com.example.docmind.docmind_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChunkDto {
    private Integer chunkIndex;
    private Integer pageNumber;
    private String content;
}
