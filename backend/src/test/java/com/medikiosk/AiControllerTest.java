package com.medikiosk;

import com.medikiosk.exception.GeminiException;
import com.medikiosk.service.GeminiService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
public class AiControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private GeminiService geminiService;

    @Test
    public void testSuccessfulAiConnection() throws Exception {
        when(geminiService.generateContent(anyString()))
                .thenReturn("MediKiosk AI connection successful.");

        mockMvc.perform(get("/api/ai/test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("MediKiosk AI connection successful."));
    }

    @Test
    public void testMissingApiKeyFailure() throws Exception {
        when(geminiService.generateContent(anyString()))
                .thenThrow(new GeminiException("Gemini API key is not configured on the server.", 500));

        mockMvc.perform(get("/api/ai/test"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Gemini API key is not configured on the server."));
    }

    @Test
    public void testTimeoutFailure() throws Exception {
        when(geminiService.generateContent(anyString()))
                .thenThrow(new GeminiException("Gemini API request timed out or network connection failed.", 504));

        mockMvc.perform(get("/api/ai/test"))
                .andExpect(status().isGatewayTimeout())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Gemini API request timed out or network connection failed."));
    }
}
