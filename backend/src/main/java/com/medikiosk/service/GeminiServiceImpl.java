package com.medikiosk.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medikiosk.exception.GeminiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.List;
import java.util.Map;

@Service
public class GeminiServiceImpl implements GeminiService {

    private static final Logger logger = LoggerFactory.getLogger(GeminiServiceImpl.class);

    private final RestClient geminiRestClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-3.6-flash}")
    private String model;


    public GeminiServiceImpl(RestClient geminiRestClient, ObjectMapper objectMapper) {
        this.geminiRestClient = geminiRestClient;
        this.objectMapper = objectMapper;
    }

    private String resolveApiKey() {
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            return apiKey.trim();
        }

        String envKey = System.getenv("GEMINI_API_KEY");
        if (envKey != null && !envKey.trim().isEmpty()) {
            return envKey.trim();
        }

        // On Windows, query Machine/User registry in case the variable was set after the shell process started
        if (System.getProperty("os.name", "").toLowerCase().contains("win")) {
            String winKey = readWindowsRegistryKey("HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment");
            if (winKey != null) return winKey;

            winKey = readWindowsRegistryKey("HKCU\\Environment");
            if (winKey != null) return winKey;
        }

        return null;
    }

    private String readWindowsRegistryKey(String regPath) {
        try {
            Process process = new ProcessBuilder("reg", "query", regPath, "/v", "GEMINI_API_KEY").start();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.contains("GEMINI_API_KEY")) {
                        String[] parts = line.trim().split("\\s+");
                        if (parts.length >= 3) {
                            return parts[2].trim();
                        }
                    }
                }
            }
        } catch (Exception ignored) {
            // Silently ignore registry read exceptions and fallback
        }
        return null;
    }

    @Override
    public String generateContent(String prompt) {
        return generateContent(prompt, null, null);
    }

    @Override
    public String generateContent(String prompt, String mimeType, byte[] mediaBytes) {
        String activeApiKey = resolveApiKey();

        if (activeApiKey == null || activeApiKey.trim().isEmpty()) {
            throw new GeminiException("Gemini API key is not configured on the server.", 500);
        }

        if (prompt == null || prompt.trim().isEmpty()) {
            throw new GeminiException("Prompt cannot be empty.", 400);
        }

        // Prepare request body matching Google Gemini standard generateContent schema
        List<Map<String, Object>> parts = new java.util.ArrayList<>();
        parts.add(Map.of("text", prompt));

        if (mediaBytes != null && mediaBytes.length > 0 && mimeType != null && !mimeType.isBlank()) {
            String b64 = java.util.Base64.getEncoder().encodeToString(mediaBytes);
            parts.add(Map.of("inlineData", Map.of("mimeType", mimeType, "data", b64)));
        }

        Map<String, Object> content = Map.of("parts", parts);
        Map<String, Object> requestBody = Map.of("contents", List.of(content));

        try {
            logger.info("Executing Gemini request using model: {} (multimodal={})", model, mediaBytes != null);

            byte[] responseBytes = geminiRestClient.post()
                    .uri("/v1beta/models/{model}:generateContent", model)
                    .header("x-goog-api-key", activeApiKey.trim())
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON, MediaType.ALL)
                    .body(requestBody)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (request, response) -> {
                        int status = response.getStatusCode().value();
                        if (status == 400 || status == 401 || status == 403) {
                            throw new GeminiException("Gemini API authentication failed. Please verify the API key configuration.", status);
                        } else if (status == 429) {
                            throw new GeminiException("Gemini API rate limit exceeded. Please try again shortly.", status);
                        } else {
                            throw new GeminiException("Gemini API client error (status " + status + ").", status);
                        }
                    })
                    .onStatus(HttpStatusCode::is5xxServerError, (request, response) -> {
                        throw new GeminiException("Gemini API service temporarily unavailable.", response.getStatusCode().value());
                    })
                    .body(byte[].class);

            if (responseBytes == null || responseBytes.length == 0) {
                throw new GeminiException("Received empty response from Gemini API.", 502);
            }

            String responseBody = new String(responseBytes, java.nio.charset.StandardCharsets.UTF_8);

            // Parse response and extract candidate text
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");

            if (!candidates.isArray() || candidates.isEmpty()) {
                throw new GeminiException("Gemini API returned no response candidates.", 502);
            }

            JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
            if (textNode.isMissingNode() || textNode.asText().isEmpty()) {
                throw new GeminiException("Malformed response received from Gemini API.", 502);
            }

            return textNode.asText().trim();

        } catch (GeminiException e) {
            throw e;
        } catch (ResourceAccessException e) {
            logger.error("Network or timeout error while contacting Gemini API: {}", e.getMessage());
            throw new GeminiException("Gemini API request timed out or network connection failed.", 504);
        } catch (JsonProcessingException e) {
            logger.error("Failed to parse Gemini response JSON: {}", e.getMessage());
            throw new GeminiException("Malformed response received from Gemini API.", 502);
        } catch (Exception e) {
            logger.error("Unexpected error during Gemini API call: {}", e.getMessage());
            throw new GeminiException("Unexpected failure communicating with Gemini API.", 500);
        }
    }
}
