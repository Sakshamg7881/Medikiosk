package com.medikiosk.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cases")
public class Case {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id")
    private Long patientId;

    @Column(name = "clinic_id")
    private Long clinicId;

    @Column(name = "doctor_id")
    private Long doctorId;

    @Column(columnDefinition = "TEXT")
    private String chiefComplaint;

    @Column(columnDefinition = "TEXT")
    private String hpi;

    @Column(columnDefinition = "TEXT")
    private String associatedSymptoms;

    // PostgreSQL TEXT column storing structured AYUSH JSON payload
    @Column(columnDefinition = "TEXT")
    private String ayushData;

    @Column(columnDefinition = "TEXT")
    private String prakritiResult;

    // PostgreSQL TEXT column storing documents metadata / URL list JSON
    @Column(columnDefinition = "TEXT")
    private String documents;

    // PostgreSQL TEXT column storing OCR parsed extraction JSON
    @Column(columnDefinition = "TEXT")
    private String ocrExtractedData;

    @Column(columnDefinition = "TEXT")
    private String aiSummary;

    @Column(columnDefinition = "TEXT")
    private String conversationHistory;

    @Column(columnDefinition = "TEXT")
    private String clinicalState;

    private Boolean redFlagDetected = false;

    @Column(columnDefinition = "TEXT")
    private String redFlagDetails;

    private String status;

    private LocalDateTime appointmentDate;

    @Column(columnDefinition = "TEXT")
    private String doctorNotes;

    @Column(columnDefinition = "TEXT")
    private String doctorReviewedSummary;

    private LocalDateTime doctorReviewedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Case() {}

    public Case(Long patientId, Long clinicId, Long doctorId, String chiefComplaint, 
                String hpi, String associatedSymptoms, String ayushData, String prakritiResult, 
                String documents, String ocrExtractedData, String aiSummary, String status, 
                LocalDateTime appointmentDate) {
        this.patientId = patientId;
        this.clinicId = clinicId;
        this.doctorId = doctorId;
        this.chiefComplaint = chiefComplaint;
        this.hpi = hpi;
        this.associatedSymptoms = associatedSymptoms;
        this.ayushData = ayushData;
        this.prakritiResult = prakritiResult;
        this.documents = documents;
        this.ocrExtractedData = ocrExtractedData;
        this.aiSummary = aiSummary;
        this.status = status;
        this.appointmentDate = appointmentDate;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public Long getClinicId() {
        return clinicId;
    }

    public void setClinicId(Long clinicId) {
        this.clinicId = clinicId;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
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

    public String getAyushData() {
        return ayushData;
    }

    public void setAyushData(String ayushData) {
        this.ayushData = ayushData;
    }

    public String getPrakritiResult() {
        return prakritiResult;
    }

    public void setPrakritiResult(String prakritiResult) {
        this.prakritiResult = prakritiResult;
    }

    public String getDocuments() {
        return documents;
    }

    public void setDocuments(String documents) {
        this.documents = documents;
    }

    public String getOcrExtractedData() {
        return ocrExtractedData;
    }

    public void setOcrExtractedData(String ocrExtractedData) {
        this.ocrExtractedData = ocrExtractedData;
    }

    public String getAiSummary() {
        return aiSummary;
    }

    public void setAiSummary(String aiSummary) {
        this.aiSummary = aiSummary;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getAppointmentDate() {
        return appointmentDate;
    }

    public void setAppointmentDate(LocalDateTime appointmentDate) {
        this.appointmentDate = appointmentDate;
    }

    public String getConversationHistory() {
        return conversationHistory;
    }

    public void setConversationHistory(String conversationHistory) {
        this.conversationHistory = conversationHistory;
    }

    public String getClinicalState() {
        return clinicalState;
    }

    public void setClinicalState(String clinicalState) {
        this.clinicalState = clinicalState;
    }

    public Boolean getRedFlagDetected() {
        return redFlagDetected != null ? redFlagDetected : false;
    }

    public void setRedFlagDetected(Boolean redFlagDetected) {
        this.redFlagDetected = redFlagDetected;
    }

    public String getRedFlagDetails() {
        return redFlagDetails;
    }

    public void setRedFlagDetails(String redFlagDetails) {
        this.redFlagDetails = redFlagDetails;
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

    public LocalDateTime getDoctorReviewedAt() {
        return doctorReviewedAt;
    }

    public void setDoctorReviewedAt(LocalDateTime doctorReviewedAt) {
        this.doctorReviewedAt = doctorReviewedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
