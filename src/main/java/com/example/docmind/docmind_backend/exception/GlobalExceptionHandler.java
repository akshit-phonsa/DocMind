package com.example.docmind.docmind_backend.exception;

import com.example.docmind.docmind_backend.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);



    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> handleNotFound(ResourceNotFoundException ex) {
        logger.warn("Resource not found : {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.builder().success(false).message(ex.getMessage()).data(null).timestamp(LocalDateTime.now()).build());

    }

    @ExceptionHandler(DocumentProcessingException.class)
    public ResponseEntity<ApiResponse<Object>> handleProcessingError(DocumentProcessingException ex) {
        logger.error("Document processing error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT).body(ApiResponse.builder().success(false).message("Failed to process document: " + ex.getMessage()).timestamp(LocalDateTime.now()).build()

        );
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Object>> handleMaxSize(MaxUploadSizeExceededException ex) {
        logger.warn("File size limit exceeded: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT).body(ApiResponse.builder().success(false).message("File size exceeds the allowed limit (25MB)").timestamp(LocalDateTime.now()).build());

    }
}
