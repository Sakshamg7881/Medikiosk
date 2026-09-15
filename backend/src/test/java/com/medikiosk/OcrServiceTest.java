package com.medikiosk;

import com.medikiosk.service.OcrService;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

public class OcrServiceTest {

    private OcrService ocrService;

    @BeforeEach
    public void setup() {
        ocrService = new OcrService();
    }

    @Test
    public void testPdfTextExtractionSuccess() throws IOException {
        byte[] pdfBytes = createTestPdfWithText("Dr. Verma Clinic. Rx: Tab Amoxicillin 500mg TID. Patient has fever and throat irritation.");

        OcrService.OcrResult result = ocrService.extractText(pdfBytes, "prescription.pdf", "application/pdf");

        assertNotNull(result);
        assertEquals("SUCCESS", result.getStatus());
        assertEquals("PDFBOX_DIRECT", result.getExtractedVia());
        assertTrue(result.getConfidence() >= 0.9f);
        assertTrue(result.getExtractedText().contains("Amoxicillin"));
        assertTrue(result.getExtractedText().contains("throat irritation"));
    }

    @Test
    public void testEmptyOrNullBytes() {
        OcrService.OcrResult result = ocrService.extractText(new byte[0], "empty.pdf", "application/pdf");
        assertNotNull(result);
        assertEquals("NO_FILE_CONTENT", result.getStatus());
        assertFalse(result.hasUsefulText());
    }

    @Test
    public void testUnsupportedFormat() {
        byte[] dummy = "hello world".getBytes();
        OcrService.OcrResult result = ocrService.extractText(dummy, "notes.txt", "text/plain");
        assertNotNull(result);
        assertEquals("UNSUPPORTED_FORMAT", result.getStatus());
        assertFalse(result.hasUsefulText());
    }

    private byte[] createTestPdfWithText(String text) throws IOException {
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
