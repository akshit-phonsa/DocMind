package com.example.docmind.docmind_backend.repository;

import com.example.docmind.docmind_backend.entity.DocumentMetadata;
import com.example.docmind.docmind_backend.entity.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DocumentMetadataRepo extends JpaRepository<DocumentMetadata, UUID> {

    List<DocumentMetadata> findByStatus(DocumentStatus status);
    List<DocumentMetadata> findAllByOrderByCreatedAtDesc();
}
