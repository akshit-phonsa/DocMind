package com.example.docmind.docmind_backend.service;

import com.example.docmind.docmind_backend.dto.DocumentResponseDto;
import com.example.docmind.docmind_backend.entity.DocumentMetadata;
import com.example.docmind.docmind_backend.entity.DocumentStatus;
import com.example.docmind.docmind_backend.repository.DocumentMetadataRepo;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentMetadataService {

    private static final Logger log = LoggerFactory.getLogger(DocumentMetadataService.class);

    private final DocumentMetadataRepo documentMetadataRepo;
    private final DocumentParserService documentParserService;
    private final DocumentIngestionService documentIngestionService;
    private final JdbcTemplate jdbcTemplate;

//    Method to upload and parse document
    public DocumentResponseDto uploadAndProcess(MultipartFile file) {

        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "Document";
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        //document meta data create
        //storing the user detail with document metadata
        DocumentMetadata documentMetadata = DocumentMetadata
                .builder()
                .filename(fileName)
                .contentType(contentType)
                .status(DocumentStatus.UPLOADING)
                .fileSize(file.getSize())
                .createdAt(LocalDateTime.now())
                .build();

        documentMetadata = documentMetadataRepo.save(documentMetadata);


        //parse the file
        List<Document> parsedDocs = documentParserService.parse(file);;

        //ingest service
        int chunksCreated = documentIngestionService.ingest(documentMetadata, parsedDocs);;

//        documentMetadata.setTotalChunks(chunksCreated);
        //save the document metadata
        return DocumentResponseDto.builder()
                .id(documentMetadata.getId())
                .fileName(documentMetadata.getFilename())
                .fileSize(documentMetadata.getFileSize())
                .chunksCreated(chunksCreated)
                .status(documentMetadata.getStatus())
                .message("Document successfully processed and indexed.")
                .build();
    }
}
