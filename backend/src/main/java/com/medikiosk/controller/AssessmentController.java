package com.medikiosk.controller;

import com.medikiosk.dto.AssessmentMessageRequest;
import com.medikiosk.dto.AssessmentResponse;
import com.medikiosk.dto.AssessmentStartRequest;
import com.medikiosk.service.AssessmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/assessment")
public class AssessmentController {

    private final AssessmentService assessmentService;

    public AssessmentController(AssessmentService assessmentService) {
        this.assessmentService = assessmentService;
    }

    @PostMapping("/start")
    public ResponseEntity<?> startAssessment(@Valid @RequestBody AssessmentStartRequest request) {
        try {
            AssessmentResponse response = assessmentService.startOrResumeAssessment(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Unable to start assessment: " + e.getMessage()));
        }
    }

    @PostMapping("/message")
    public ResponseEntity<?> processMessage(@Valid @RequestBody AssessmentMessageRequest request) {
        try {
            AssessmentResponse response = assessmentService.processMessage(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Unable to process intake message: " + e.getMessage()));
        }
    }

    @GetMapping("/{caseId}")
    public ResponseEntity<?> getAssessment(@PathVariable Long caseId) {
        try {
            AssessmentResponse response = assessmentService.getAssessment(caseId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
