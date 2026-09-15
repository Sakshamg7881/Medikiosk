package com.medikiosk;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medikiosk.model.Patient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
public class PatientControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testCreateAndGetPatient() throws Exception {
        Patient newPatient = new Patient("Ramesh Gupta", 45, "Male", "9876543210", "hi");

        // 1. Create Patient (POST /api/patients)
        MvcResult result = mockMvc.perform(post("/api/patients")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(newPatient)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Ramesh Gupta"))
                .andExpect(jsonPath("$.phone").value("9876543210"))
                .andExpect(jsonPath("$.preferredLanguage").value("hi"))
                .andReturn();

        String responseContent = result.getResponse().getContentAsString();
        Patient createdPatient = objectMapper.readValue(responseContent, Patient.class);

        // 2. Fetch Created Patient (GET /api/patients/{id})
        mockMvc.perform(get("/api/patients/" + createdPatient.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(createdPatient.getId()))
                .andExpect(jsonPath("$.name").value("Ramesh Gupta"))
                .andExpect(jsonPath("$.age").value(45));
    }
}
