package com.medikiosk.dto;

import java.util.List;
import java.util.Map;

public class AssessmentResponse {

    private Long caseId;
    private String section; // "GENERAL", "AYUSH", "COMPLETED"
    private int questionNumber;
    private int totalQuestionsEstimate;
    private String message;
    private boolean completed;
    private List<String> quickOptions;
    private Map<String, Object> prakritiResult;
    private Map<String, Object> ayushData;
    private List<ChatMessageDto> messages;

    private Boolean redFlagDetected = false;
    private String redFlagWarning;
    private String statusMessage;
    private Map<String, Object> clinicalState;
    private Long patientId;
    private String language;

    public AssessmentResponse() {}

    public AssessmentResponse(Long caseId, String section, int questionNumber, int totalQuestionsEstimate,
                              String message, boolean completed, List<String> quickOptions,
                              Map<String, Object> prakritiResult, Map<String, Object> ayushData,
                              List<ChatMessageDto> messages) {
        this.caseId = caseId;
        this.section = section;
        this.questionNumber = questionNumber;
        this.totalQuestionsEstimate = totalQuestionsEstimate;
        this.message = message;
        this.completed = completed;
        this.quickOptions = quickOptions;
        this.prakritiResult = prakritiResult;
        this.ayushData = ayushData;
        this.messages = messages;
    }

    public AssessmentResponse(Long caseId, String section, int questionNumber, int totalQuestionsEstimate,
                              String message, boolean completed, List<String> quickOptions,
                              Map<String, Object> prakritiResult, Map<String, Object> ayushData,
                              List<ChatMessageDto> messages, Boolean redFlagDetected,
                              String redFlagWarning, String statusMessage, Map<String, Object> clinicalState) {
        this(caseId, section, questionNumber, totalQuestionsEstimate, message, completed, quickOptions, prakritiResult, ayushData, messages);
        this.redFlagDetected = redFlagDetected != null ? redFlagDetected : false;
        this.redFlagWarning = redFlagWarning;
        this.statusMessage = statusMessage;
        this.clinicalState = clinicalState;
    }

    public Long getCaseId() {
        return caseId;
    }

    public void setCaseId(Long caseId) {
        this.caseId = caseId;
    }

    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }

    public int getQuestionNumber() {
        return questionNumber;
    }

    public void setQuestionNumber(int questionNumber) {
        this.questionNumber = questionNumber;
    }

    public int getTotalQuestionsEstimate() {
        return totalQuestionsEstimate;
    }

    public void setTotalQuestionsEstimate(int totalQuestionsEstimate) {
        this.totalQuestionsEstimate = totalQuestionsEstimate;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public List<String> getQuickOptions() {
        return quickOptions;
    }

    public void setQuickOptions(List<String> quickOptions) {
        this.quickOptions = quickOptions;
    }

    public Map<String, Object> getPrakritiResult() {
        return prakritiResult;
    }

    public void setPrakritiResult(Map<String, Object> prakritiResult) {
        this.prakritiResult = prakritiResult;
    }

    public Map<String, Object> getAyushData() {
        return ayushData;
    }

    public void setAyushData(Map<String, Object> ayushData) {
        this.ayushData = ayushData;
    }

    public List<ChatMessageDto> getMessages() {
        return messages;
    }

    public void setMessages(List<ChatMessageDto> messages) {
        this.messages = messages;
    }

    public Boolean getRedFlagDetected() {
        return redFlagDetected != null ? redFlagDetected : false;
    }

    public void setRedFlagDetected(Boolean redFlagDetected) {
        this.redFlagDetected = redFlagDetected;
    }

    public String getRedFlagWarning() {
        return redFlagWarning;
    }

    public void setRedFlagWarning(String redFlagWarning) {
        this.redFlagWarning = redFlagWarning;
    }

    public String getStatusMessage() {
        return statusMessage;
    }

    public void setStatusMessage(String statusMessage) {
        this.statusMessage = statusMessage;
    }

    public Map<String, Object> getClinicalState() {
        return clinicalState;
    }

    public void setClinicalState(Map<String, Object> clinicalState) {
        this.clinicalState = clinicalState;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }
}
