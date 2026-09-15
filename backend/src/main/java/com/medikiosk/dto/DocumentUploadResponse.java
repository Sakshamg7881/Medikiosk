package com.medikiosk.dto;

import java.util.List;
import java.util.Map;

public class DocumentUploadResponse {

    private String documentId;
    private String fileName;
    private String documentType;
    private long fileSize;
    private String contentType;
    private String ocrStatus; // "SUCCESS", "NO_TEXT_EXTRACTED", "FAILED"
    private String extractedTextPreview;
    private Map<String, Object> structuredData;
    private List<String> redFlags;
    private Long caseId;

    public DocumentUploadResponse() {}

    public DocumentUploadResponse(String documentId, String fileName, String documentType,
                                  long fileSize, String contentType, String ocrStatus,
                                  String extractedTextPreview, Map<String, Object> structuredData,
                                  List<String> redFlags, Long caseId) {
        this.documentId = documentId;
        this.fileName = fileName;
        this.documentType = documentType;
        this.fileSize = fileSize;
        this.contentType = contentType;
        this.ocrStatus = ocrStatus;
        this.extractedTextPreview = extractedTextPreview;
        this.structuredData = structuredData;
        this.redFlags = redFlags;
        this.caseId = caseId;
    }

    public String getDocumentId() {
        return documentId;
    }

    public void setDocumentId(String documentId) {
        this.documentId = documentId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getDocumentType() {
        return documentType;
    }

    public void setDocumentType(String documentType) {
        this.documentType = documentType;
    }

    public long getFileSize() {
        return fileSize;
    }

    public void setFileSize(long fileSize) {
        this.fileSize = fileSize;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public String getOcrStatus() {
        return ocrStatus;
    }

    public void setOcrStatus(String ocrStatus) {
        this.ocrStatus = ocrStatus;
    }

    public String getExtractedTextPreview() {
        return extractedTextPreview;
    }

    public void setExtractedTextPreview(String extractedTextPreview) {
        this.extractedTextPreview = extractedTextPreview;
    }

    public Map<String, Object> getStructuredData() {
        return structuredData;
    }

    public void setStructuredData(Map<String, Object> structuredData) {
        this.structuredData = structuredData;
    }

    public List<String> getRedFlags() {
        return redFlags;
    }

    public void setRedFlags(List<String> redFlags) {
        this.redFlags = redFlags;
    }

    public Long getCaseId() {
        return caseId;
    }

    public void setCaseId(Long caseId) {
        this.caseId = caseId;
    }
}
