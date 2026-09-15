package com.medikiosk.dto;

import java.util.List;
import java.util.Map;

public class CaseSummaryResponse {

    private Long caseId;
    private Map<String, Object> patient;
    private String chiefComplaint;
    private String hpi;
    private String associatedSymptoms;
    private Map<String, Object> ayushData;
    private Map<String, Object> prakritiResult;
    private List<Map<String, Object>> documents;
    private String aiSummary;
    private boolean redFlagDetected;
    private String redFlagWarning;
    private List<String> redFlagTerms;
    private String status;
    private String doctorNotes;
    private String doctorReviewedSummary;
    private java.time.LocalDateTime doctorReviewedAt;
    private Long doctorId;
    private java.time.LocalDateTime createdAt;

    public CaseSummaryResponse() {}

    public CaseSummaryResponse(Long caseId, Map<String, Object> patient, String chiefComplaint,
                               String hpi, String associatedSymptoms, Map<String, Object> ayushData,
                               Map<String, Object> prakritiResult, List<Map<String, Object>> documents,
                               String aiSummary, boolean redFlagDetected, String redFlagWarning,
                               List<String> redFlagTerms, String status) {
        this.caseId = caseId;
        this.patient = patient;
        this.chiefComplaint = chiefComplaint;
        this.hpi = hpi;
        this.associatedSymptoms = associatedSymptoms;
        this.ayushData = ayushData;
        this.prakritiResult = prakritiResult;
        this.documents = documents;
        this.aiSummary = aiSummary;
        this.redFlagDetected = redFlagDetected;
        this.redFlagWarning = redFlagWarning;
        this.redFlagTerms = redFlagTerms;
        this.status = status;
    }

    public Long getCaseId() {
        return caseId;
    }

    public void setCaseId(Long caseId) {
        this.caseId = caseId;
    }

    public Map<String, Object> getPatient() {
        return patient;
    }

    public void setPatient(Map<String, Object> patient) {
        this.patient = patient;
    }

    public String getChiefComplaint() {
        return chiefComplaint;
    }

    public void setChiefComplaint(String chiefComplaint) {
        this.chiefComplaint = chiefComplaint;
    }

    public String getHpi() {
        return hpi;
    }

    public void setHpi(String hpi) {
        this.hpi = hpi;
    }

    public String getAssociatedSymptoms() {
        return associatedSymptoms;
    }

    public void setAssociatedSymptoms(String associatedSymptoms) {
        this.associatedSymptoms = associatedSymptoms;
    }

    public Map<String, Object> getAyushData() {
        return ayushData;
    }

    public void setAyushData(Map<String, Object> ayushData) {
        this.ayushData = ayushData;
    }

    public Map<String, Object> getPrakritiResult() {
        return prakritiResult;
    }

    public void setPrakritiResult(Map<String, Object> prakritiResult) {
        this.prakritiResult = prakritiResult;
    }

    public List<Map<String, Object>> getDocuments() {
        return documents;
    }

    public void setDocuments(List<Map<String, Object>> documents) {
        this.documents = documents;
    }

    public String getAiSummary() {
        return aiSummary;
    }

    public void setAiSummary(String aiSummary) {
        this.aiSummary = aiSummary;
    }

    public boolean isRedFlagDetected() {
        return redFlagDetected;
    }

    public void setRedFlagDetected(boolean redFlagDetected) {
        this.redFlagDetected = redFlagDetected;
    }

    public String getRedFlagWarning() {
        return redFlagWarning;
    }

    public void setRedFlagWarning(String redFlagWarning) {
        this.redFlagWarning = redFlagWarning;
    }

    public List<String> getRedFlagTerms() {
        return redFlagTerms;
    }

    public void setRedFlagTerms(List<String> redFlagTerms) {
        this.redFlagTerms = redFlagTerms;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDoctorNotes() {
        return doctorNotes;
    }

    public void setDoctorNotes(String doctorNotes) {
        this.doctorNotes = doctorNotes;
    }

    public String getDoctorReviewedSummary() {
        return doctorReviewedSummary;
    }

    public void setDoctorReviewedSummary(String doctorReviewedSummary) {
        this.doctorReviewedSummary = doctorReviewedSummary;
    }

    public java.time.LocalDateTime getDoctorReviewedAt() {
        return doctorReviewedAt;
    }

    public void setDoctorReviewedAt(java.time.LocalDateTime doctorReviewedAt) {
        this.doctorReviewedAt = doctorReviewedAt;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(java.time.LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
