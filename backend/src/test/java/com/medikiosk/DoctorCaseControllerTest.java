package com.medikiosk;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medikiosk.dto.DoctorReviewRequest;
import com.medikiosk.model.Case;
import com.medikiosk.model.Patient;
import com.medikiosk.repository.CaseRepository;
import com.medikiosk.repository.PatientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
public class DoctorCaseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CaseRepository caseRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private Long patientId1;
    private Long patientId2;
    private Long caseId1;
    private Long caseId2;

    @BeforeEach
    public void setUp() {
        caseRepository.deleteAll();
        patientRepository.deleteAll();

        // Create Patient 1
        Patient p1 = new Patient("Ramesh Gupta", 52, "Male", "9812345678", "hi");
        Patient savedP1 = patientRepository.save(p1);
        patientId1 = savedP1.getId();

        // Create Patient 2
        Patient p2 = new Patient("Sunita Rao", 36, "Female", "9876543210", "en");
        Patient savedP2 = patientRepository.save(p2);
        patientId2 = savedP2.getId();

        // Create Case 1 (Ready for Review)
        Case c1 = new Case();
        c1.setPatientId(patientId1);
        c1.setClinicId(1L);
        c1.setChiefComplaint("Persistent joint stiffness and morning swelling");
        c1.setHpi("Onset 4 weeks ago, aggravated by cold weather.");
        c1.setAssociatedSymptoms("Mild fatigue");
        c1.setAyushData("{\"agni\":\"Tikshnagni\",\"nidra\":\"Disturbed\",\"mala\":\"Constipation\"}");
        c1.setPrakritiResult("{\"dominantTendency\":\"Vata-Pitta\",\"scores\":{\"vata\":4,\"pitta\":3,\"kapha\":1}}");
        c1.setAiSummary("52yo Male presenting with 4-week joint stiffness. Vata-Pitta constitutional tendency noted.");
        c1.setStatus("READY_FOR_REVIEW");
        c1.setRedFlagDetected(false);
        Case savedC1 = caseRepository.save(c1);
        caseId1 = savedC1.getId();

        // Create Case 2 (Red Flag Detected)
        Case c2 = new Case();
        c2.setPatientId(patientId2);
        c2.setClinicId(1L);
        c2.setChiefComplaint("Sharp chest discomfort radiating to left shoulder");
        c2.setHpi("Sudden onset 2 hours ago.");
        c2.setAyushData("{\"agni\":\"Samagni\",\"nidra\":\"Normal\",\"mala\":\"Regular\"}");
        c2.setPrakritiResult("{\"dominantTendency\":\"Pitta-Kapha\",\"scores\":{\"vata\":1,\"pitta\":4,\"kapha\":3}}");
        c2.setAiSummary("36yo Female with sudden acute chest discomfort.");
        c2.setRedFlagDetected(true);
        c2.setRedFlagDetails("[\"Chest pain radiating to shoulder\",\"Acute onset\"]");
        c2.setStatus("READY_FOR_REVIEW");
        Case savedC2 = caseRepository.save(c2);
        caseId2 = savedC2.getId();
    }

    @Test
    public void testGetDoctorQueueListing() throws Exception {
        mockMvc.perform(get("/api/doctor/cases"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                // Ordered by latest ID first -> caseId2 first
                .andExpect(jsonPath("$[0].caseId").value(caseId2))
                .andExpect(jsonPath("$[0].patientName").value("Sunita Rao"))
                .andExpect(jsonPath("$[0].redFlagDetected").value(true))
                .andExpect(jsonPath("$[0].redFlagTerms", hasItem("Chest pain radiating to shoulder")))
                .andExpect(jsonPath("$[0].status").value("READY_FOR_REVIEW"))
                // Case 1
                .andExpect(jsonPath("$[1].caseId").value(caseId1))
                .andExpect(jsonPath("$[1].patientName").value("Ramesh Gupta"))
                .andExpect(jsonPath("$[1].redFlagDetected").value(false))
                .andExpect(jsonPath("$[1].status").value("READY_FOR_REVIEW"));
    }

    @Test
    public void testGetDoctorCaseDetailSuccess() throws Exception {
        mockMvc.perform(get("/api/doctor/cases/" + caseId1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caseId").value(caseId1))
                .andExpect(jsonPath("$.patient.name").value("Ramesh Gupta"))
                .andExpect(jsonPath("$.patient.age").value(52))
                .andExpect(jsonPath("$.patient.preferredLanguage").value("hi"))
                .andExpect(jsonPath("$.chiefComplaint").value("Persistent joint stiffness and morning swelling"))
                .andExpect(jsonPath("$.ayushData.agni").value("Tikshnagni"))
                .andExpect(jsonPath("$.prakritiResult.dominantTendency").value("Vata-Pitta"))
                .andExpect(jsonPath("$.aiSummary").value(containsString("52yo Male")))
                .andExpect(jsonPath("$.doctorReviewedSummary").value(containsString("52yo Male"))) // pre-filled from aiSummary
                .andExpect(jsonPath("$.redFlagDetected").value(false));
    }

    @Test
    public void testGetDoctorCaseDetailNotFound() throws Exception {
        mockMvc.perform(get("/api/doctor/cases/99999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Case not found with ID: 99999"));
    }

    @Test
    public void testReviewCaseSuccessAndStatusTransition() throws Exception {
        DoctorReviewRequest req = new DoctorReviewRequest(
                "Advised Yograj Guggulu 1 tab BD and Dashmularishta 15ml with lukewarm water. Restrict cold foods.",
                "Confirmed clinical signs of Amavata (rheumatoid-like stiffness). Prescribed Vata-pacifying regimen.",
                101L
        );

        mockMvc.perform(put("/api/doctor/cases/" + caseId1 + "/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caseId").value(caseId1))
                .andExpect(jsonPath("$.status").value("REVIEWED"))
                .andExpect(jsonPath("$.doctorNotes").value(containsString("Advised Yograj Guggulu")))
                .andExpect(jsonPath("$.doctorReviewedSummary").value(containsString("Confirmed clinical signs of Amavata")))
                .andExpect(jsonPath("$.doctorReviewedAt").isNotEmpty())
                .andExpect(jsonPath("$.doctorId").value(101));

        // Verify status in doctor queue is now REVIEWED
        mockMvc.perform(get("/api/doctor/cases"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.caseId == " + caseId1 + ")].status").value(hasItem("REVIEWED")))
                .andExpect(jsonPath("$[?(@.caseId == " + caseId1 + ")].doctorReviewedAt").isNotEmpty());
    }

    @Test
    public void testReviewCaseNotFound() throws Exception {
        DoctorReviewRequest req = new DoctorReviewRequest("Notes", "Summary", 101L);

        mockMvc.perform(put("/api/doctor/cases/99999/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Case not found with ID: 99999"));
    }
}
