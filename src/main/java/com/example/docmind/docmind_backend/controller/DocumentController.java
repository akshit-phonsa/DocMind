package com.example.docmind.docmind_backend.controller;


import com.example.docmind.docmind_backend.dto.ApiResponse;
import com.example.docmind.docmind_backend.dto.ChunkDto;
import com.example.docmind.docmind_backend.dto.DocumentMetadataDto;
import com.example.docmind.docmind_backend.dto.DocumentResponseDto;
import com.example.docmind.docmind_backend.service.DocumentMetadataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController()
@RequestMapping("/api/v1/documents")
@Tag(
        name = "Document Management",
        description = "Endpoints for uploading, listing and managing documents and their vectors embeddings."
)
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentMetadataService documentService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Upload and Index a Document(PDF, DOCX, TXT, MD, CSV)",
            description = "This api is used to upload and index documents files."
    )
    public ResponseEntity<ApiResponse<DocumentResponseDto>> uploadDocument(
            @RequestParam("file")MultipartFile file
            ) {

        // Process the files
        DocumentResponseDto documentResponseDto = this.documentService.uploadAndProcess(file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<DocumentResponseDto>builder()
                        .success(true)
                        .data(documentResponseDto)
                        .timestamp(LocalDateTime.now())
                        .message("Documents uploaded and indexed successfully")
                        .build());
    }

//    api to upload multiple documents
    @PostMapping(value = "/upload-multiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary = "Upload and index multiple documents simultaneously",
            description = "This api is used to upload and index multiple documents."
    )
    public ResponseEntity<ApiResponse<List<DocumentResponseDto>>> uploadMultiple(
            @RequestParam("files")
            List<MultipartFile> files
    ){
        List<DocumentResponseDto> responseDtos = documentService.uploadMultipleDocuments(files);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(
                        ApiResponse.<List<DocumentResponseDto>>
                                builder()
                                .message("Document uploaded successfully")
                                .success(true)
                                .timestamp(LocalDateTime.now())
                                .data(responseDtos)
                                .build()
                );
    }

//    List all uploaded documents
    @GetMapping
    @Operation(summary = "List all the uploaded documents and their indexing status")
    public ResponseEntity<ApiResponse<List<DocumentMetadataDto>>> getAllDocuments(){
        List<DocumentMetadataDto> documents = documentService.getAllDocuments();
        return ResponseEntity.ok(
                        ApiResponse.<List<DocumentMetadataDto>>
                                        builder()
                                .message("All Documents is here")
                                .success(true)
                                .timestamp(LocalDateTime.now())
                                .data(documents)
                                .build()
                );
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Metadeta of a specific document by ID")
    public ResponseEntity<ApiResponse<DocumentMetadataDto>> getDocumentById(@PathVariable UUID id){
        DocumentMetadataDto documents = documentService.getDocumentById(id);
        return ResponseEntity.ok(
                ApiResponse.<DocumentMetadataDto>
                                builder()
                        .message("Single Document is here")
                        .success(true)
                        .timestamp(LocalDateTime.now())
                        .data(documents)
                        .build()
        );
    }

    @GetMapping("/{id}/chunks")
    @Operation(summary = "List all indexed vector chunks of a document")
    public ResponseEntity<ApiResponse<List<ChunkDto>>> getDocumentChunks(@PathVariable UUID id){
        return ResponseEntity.ok(
                ApiResponse.<List<ChunkDto>>
                                builder()
                        .message("Document chunks")
                        .success(true)
                        .timestamp(LocalDateTime.now())
                        .data(documentService.getDocumentChunks(id))
                        .build()
        );
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a document and purge its vector embeddings from vector store")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(@PathVariable UUID id){
       documentService.deleteDocument(id);
        return ResponseEntity.ok(
                ApiResponse.<Void>
                                builder()
                        .message("Document deleted successfully")
                        .success(true)
                        .timestamp(LocalDateTime.now())
                        .data(null)
                        .build()
        );
    }
}
