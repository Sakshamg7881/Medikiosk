package com.medikiosk;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medikiosk.dto.AssessmentMessageRequest;
import com.medikiosk.dto.AssessmentStartRequest;
import com.medikiosk.model.Patient;
import com.medikiosk.repository.CaseRepository;
import com.medikiosk.repository.PatientRepository;
import com.medikiosk.service.GeminiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
public class AssessmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private CaseRepository caseRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private GeminiService geminiService;

    private Long testPatientId;

    @BeforeEach
    public void setup() {
        caseRepository.deleteAll();
        patientRepository.deleteAll();

        Patient p = new Patient("Test Patient", 34, "Female", "9876543210", "hinglish");
        Patient saved = patientRepository.save(p);
        testPatientId = saved.getId();
    }

    @Test
    public void testStartAssessmentSuccess() throws Exception {
        AssessmentStartRequest startReq = new AssessmentStartRequest(testPatientId, "hinglish");

        mockMvc.perform(post("/api/assessment/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(startReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caseId").exists())
                .andExpect(jsonPath("$.section").value("GENERAL"))
                .andExpect(jsonPath("$.questionNumber").value(1))
                .andExpect(jsonPath("$.completed").value(false))
                .andExpect(jsonPath("$.quickOptions").isArray())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    public void testStartAssessmentInvalidPatient() throws Exception {
        AssessmentStartRequest startReq = new AssessmentStartRequest(99999L, "en");

        mockMvc.perform(post("/api/assessment/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(startReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Patient not found with ID: 99999"));
    }

    @Test
    public void testProcessMessageCycleAndAYUSHTouchpoint() throws Exception {
        // Mock Gemini response for general turn
        String geminiJson = """
                {
                  "nextQuestion": "Ye dard kab se ho raha hai?",
                  "quickOptions": ["1-2 din se", "1 hafte se", "1 mahine se"],
                  "extractedComplaint": "Pet me dard",
                  "extractedDuration": "2 din",
                  "extractedSymptoms": "aithan",
                  "isGeneralCaseComplete": false
                }
                """;
        when(geminiService.generateContent(anyString())).thenReturn(geminiJson);

        // Start
        AssessmentStartRequest startReq = new AssessmentStartRequest(testPatientId, "hinglish");
        String startResStr = mockMvc.perform(post("/api/assessment/start")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(startReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long caseId = objectMapper.readTree(startResStr).get("caseId").asLong();

        // Message 1
        AssessmentMessageRequest msg1 = new AssessmentMessageRequest(caseId, testPatientId, "hinglish", "Mere pet me dard hai");
        mockMvc.perform(post("/api/assessment/message")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(msg1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.section").value("GENERAL"))
                .andExpect(jsonPath("$.message").value("Ye dard kab se ho raha hai?"))
                .andExpect(jsonPath("$.quickOptions[0]").value("1-2 din se"));

        // Get assessment status
        mockMvc.perform(get("/api/assessment/" + caseId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caseId").value(caseId))
                .andExpect(jsonPath("$.completed").value(false));
    }
}
