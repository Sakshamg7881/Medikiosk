package com.medikiosk;

import com.medikiosk.model.Case;
import com.medikiosk.model.Patient;
import com.medikiosk.repository.CaseRepository;
import com.medikiosk.repository.PatientRepository;
import com.medikiosk.service.GeminiService;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.io.ByteArrayOutputStream;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
public class CaseDocumentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CaseRepository caseRepository;

    @Autowired
    private PatientRepository patientRepository;

    @MockBean
    private GeminiService geminiService;

    private Long testCaseId;
    private Long testPatientId;

    @BeforeEach
    public void setup() {
        caseRepository.deleteAll();
        patientRepository.deleteAll();

        Patient p = new Patient("Arun Verma", 48, "Male", "9812345678", "en");
        Patient savedPatient = patientRepository.save(p);
        testPatientId = savedPatient.getId();

        Case c = new Case();
        c.setPatientId(testPatientId);
        c.setChiefComplaint("Knee pain and mild stiffness");
        c.setHpi("Duration: 3 weeks");
        c.setStatus("IN_PROGRESS");
        Case savedCase = caseRepository.save(c);
        testCaseId = savedCase.getId();
    }

    @Test
    public void testUploadDocumentNotFoundCase() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "rx.pdf", "application/pdf", "dummy content".getBytes());

        mockMvc.perform(multipart("/api/cases/99999/documents")
                        .file(file)
                        .param("documentType", "PRESCRIPTION"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Case not found with ID: 99999"));
    }

    @Test
    public void testUploadEmptyFileFailure() throws Exception {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.pdf", "application/pdf", new byte[0]);

        mockMvc.perform(multipart("/api/cases/" + testCaseId + "/documents")
                        .file(emptyFile))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Uploaded file cannot be empty."));
    }

    @Test
    public void testUploadUnsupportedMimeTypeFailure() throws Exception {
        MockMultipartFile badFile = new MockMultipartFile("file", "script.sh", "application/x-sh", "echo hi".getBytes());

        mockMvc.perform(multipart("/api/cases/" + testCaseId + "/documents")
                        .file(badFile))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Unsupported file type. Only PDF, JPG, and PNG documents are supported."));
    }

    @Test
    public void testSuccessfulPdfUploadAndExtraction() throws Exception {
        // Mock Gemini response for document structuring
        String geminiJson = """
                {
                  "documentType": "PRESCRIPTION",
                  "patientName": "Arun Verma",
                  "doctorName": "Dr. Sen",
                  "date": "2026-09-01",
                  "diagnoses": ["Osteoarthritis"],
                  "medicines": ["Paracetamol 650mg SOS", "Glucosamine 500mg OD"],
                  "labResults": ["X-Ray: Mild joint space narrowing"],
                  "importantFindings": ["Mild crepitus"],
                  "followUpInstructions": ["Review after 3 weeks"],
                  "otherInformation": []
                }
                """;
        when(geminiService.generateContent(anyString())).thenReturn(geminiJson);

        byte[] pdfBytes = createSamplePdf("Dr. Sen Clinic. Rx: Paracetamol 650mg, Glucosamine 500mg. Osteoarthritis knee.");
        MockMultipartFile pdfFile = new MockMultipartFile("file", "prescription.pdf", "application/pdf", pdfBytes);

        mockMvc.perform(multipart("/api/cases/" + testCaseId + "/documents")
                        .file(pdfFile)
                        .param("documentType", "PRESCRIPTION"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.documentId").exists())
                .andExpect(jsonPath("$.fileName").value("prescription.pdf"))
                .andExpect(jsonPath("$.documentType").value("PRESCRIPTION"))
                .andExpect(jsonPath("$.ocrStatus").value("SUCCESS"))
                .andExpect(jsonPath("$.structuredData.medicines[0]").value("Paracetamol 650mg SOS"));

        // Verify summary endpoint
        mockMvc.perform(get("/api/cases/" + testCaseId + "/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caseId").value(testCaseId))
                .andExpect(jsonPath("$.patient.name").value("Arun Verma"))
                .andExpect(jsonPath("$.documents[0].fileName").value("prescription.pdf"))
                .andExpect(jsonPath("$.redFlagDetected").value(false));
    }

    @Test
    public void testRedFlagDetectedFromDocumentContent() throws Exception {
        String geminiJson = """
                {
                  "documentType": "MEDICAL_REPORT",
                  "patientName": "Arun Verma",
                  "doctorName": "Dr. Heart",
                  "date": "2026-09-01",
                  "diagnoses": ["Acute Coronary Syndrome"],
                  "medicines": ["Aspirin 150mg"],
                  "labResults": ["Troponin positive"],
                  "importantFindings": ["Patient reported severe chest pain and shortness of breath"],
                  "followUpInstructions": ["Emergency cardiology referral"],
                  "otherInformation": []
                }
                """;
        when(geminiService.generateContent(anyString())).thenReturn(geminiJson);

        byte[] pdfBytes = createSamplePdf("Emergency report: severe chest pain and difficulty breathing.");
        MockMultipartFile pdfFile = new MockMultipartFile("file", "er_report.pdf", "application/pdf", pdfBytes);

        mockMvc.perform(multipart("/api/cases/" + testCaseId + "/documents")
                        .file(pdfFile)
                        .param("documentType", "MEDICAL_REPORT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.redFlags").isArray());

        // Check summary reflects red flag
        mockMvc.perform(get("/api/cases/" + testCaseId + "/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.redFlagDetected").value(true))
                .andExpect(jsonPath("$.redFlagWarning").isNotEmpty());
    }

    private byte[] createSamplePdf(String text) throws Exception {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                cs.beginText();
                cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                cs.newLineAtOffset(50, 700);
                cs.showText(text);
                cs.endText();
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }
}
