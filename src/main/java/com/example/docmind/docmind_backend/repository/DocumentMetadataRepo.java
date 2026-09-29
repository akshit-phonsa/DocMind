package com.example.docmind.docmind_backend.repository;

import com.example.docmind.docmind_backend.entity.DocumentMetadata;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DocumentMetadataRepo extends JpaRepository<DocumentMetadata, UUID> {
}
