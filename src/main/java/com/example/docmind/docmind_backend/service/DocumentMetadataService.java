package com.example.docmind.docmind_backend.service;

import com.example.docmind.docmind_backend.dto.ChunkDto;
import com.example.docmind.docmind_backend.dto.DocumentMetadataDto;
import com.example.docmind.docmind_backend.dto.DocumentResponseDto;
import com.example.docmind.docmind_backend.entity.DocumentMetadata;
import com.example.docmind.docmind_backend.entity.DocumentStatus;
import com.example.docmind.docmind_backend.entity.User;
import com.example.docmind.docmind_backend.exception.DocumentProcessingException;
import com.example.docmind.docmind_backend.exception.ResourceNotFoundException;
import com.example.docmind.docmind_backend.repository.DocumentMetadataRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentMetadataService {

    private static final Logger log = LoggerFactory.getLogger(DocumentMetadataService.class);

    private final DocumentMetadataRepo documentMetadataRepo;
    private final DocumentParserService documentParserService;
    private final DocumentIngestionService documentIngestionService;
    private final JdbcTemplate jdbcTemplate;
    private final ModelMapper modelMapper;

//    Method to upload and parse document
    public DocumentResponseDto uploadAndProcess(MultipartFile file, User user) {

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
                .user(user)
                .build();

        documentMetadata = documentMetadataRepo.save(documentMetadata);
        List<Document> parsedDocs=null;
        int chunksCreated = 0;

        try {
            //parse the file
            parsedDocs = documentParserService.parse(file);

            //ingest service
            chunksCreated = documentIngestionService.ingest(documentMetadata, parsedDocs);
        } catch (DocumentProcessingException e) {
            log.info("Document metadata deleting due to fail processing");
            documentMetadataRepo.delete(documentMetadata);
            throw e;
        }

//        documentMetadata.setTotalChunks(chunksCreated);
        //save the document metadata
        return DocumentResponseDto.builder()
                .id(documentMetadata.getId())
                .fileName(documentMetadata.getFilename())
                .fileSize(documentMetadata.getFileSize())
                .chunksCreated(chunksCreated)
                .status(documentMetadata.getStatus())
                .message("Document successfully processed and indexed.")
                .userId(user.getId())
                .build();
    }

    public List<DocumentResponseDto> uploadMultipleDocuments(List<MultipartFile> files, User user) {

        List<DocumentResponseDto> responseDtos = new ArrayList<>();

        for(MultipartFile file: files){
            DocumentResponseDto result = this.uploadAndProcess(file, user);
            responseDtos.add(result);
        }

        return responseDtos;
    }

//    to get all the documents: This method is useful for admin
    public List<DocumentMetadataDto> getAllDocuments() {
        List<DocumentMetadata> allDocuments = documentMetadataRepo.findAllByOrderByCreatedAtDesc();

        return allDocuments.stream().map(documentMetadata -> modelMapper.map(documentMetadata, DocumentMetadataDto.class))
                .toList();
    }

    public List<DocumentMetadataDto> getAllDocumentsByUser(User user){
        List<DocumentMetadata> documents =  documentMetadataRepo.findByUserOrderByCreatedAtDesc(user);
        return documents.stream().map(documentMetadata -> modelMapper.map(documentMetadata, DocumentMetadataDto.class))
                .toList();
    }

    public DocumentMetadataDto getDocumentById(UUID id) {

        DocumentMetadata documentMetadata =  documentMetadataRepo.findById(id).orElseThrow(()-> new ResourceNotFoundException("Document with given id not found!!"));
        return modelMapper.map(documentMetadata, DocumentMetadataDto.class);
    }

    @Transactional
    public void deleteDocument(UUID id) {
        DocumentMetadata documentMetadata =  documentMetadataRepo.findById(id).orElseThrow(()-> new ResourceNotFoundException("Document with given id not found!!"));

        //delete the vector entries (failure here must abort the delete, otherwise vectors are orphaned)
        String deleteVectorsSql = "DELETE FROM vector_store WHERE metadata->>'documentId' = ?";
        int deletedCount = jdbcTemplate.update(deleteVectorsSql, id.toString());
        log.info("Deleted {} vector chunks for document id {} ", deletedCount, id);

        //delete the document metadata row
        documentMetadataRepo.delete(documentMetadata);
    }

    // Reads the stored chunks straight from the vector table (no embedding / similarity search needed)
    public List<ChunkDto> getDocumentChunks(UUID id) {
        if (!documentMetadataRepo.existsById(id)) {
            throw new ResourceNotFoundException("Document with given id not found!!");
        }
        String sql = """
                SELECT (metadata->>'chunkIndex')::int AS chunk_index,
                       (metadata->>'pageNumber')::int AS page_number,
                       content
                FROM vector_store
                WHERE metadata->>'documentId' = ?
                ORDER BY chunk_index
                """;
        return jdbcTemplate.query(sql, (rs, i) -> ChunkDto.builder()
                .chunkIndex(rs.getInt("chunk_index"))
                .pageNumber(rs.getObject("page_number") != null ? rs.getInt("page_number") : null)
                .content(rs.getString("content"))
                .build(), id.toString());
    }
}
