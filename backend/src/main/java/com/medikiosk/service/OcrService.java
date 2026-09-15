package com.medikiosk.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.lang.reflect.Method;
import java.util.Locale;

@Service
public class OcrService {

    private static final Logger logger = LoggerFactory.getLogger(OcrService.class);

    public static class OcrResult {
        private final String extractedText;
        private final float confidence;
        private final String status; // "SUCCESS", "NO_TEXT_FOUND", "OCR_UNAVAILABLE", "UNSUPPORTED_FORMAT"
        private final String extractedVia; // "PDFBOX_DIRECT", "TESSERACT_OCR", "FALLBACK"

        public OcrResult(String extractedText, float confidence, String status, String extractedVia) {
            this.extractedText = extractedText != null ? extractedText.trim() : "";
            this.confidence = confidence;
            this.status = status;
            this.extractedVia = extractedVia;
        }

        public String getExtractedText() {
            return extractedText;
        }

        public float getConfidence() {
            return confidence;
        }

        public String getStatus() {
            return status;
        }

        public String getExtractedVia() {
            return extractedVia;
        }

        public boolean hasUsefulText() {
            return extractedText != null && extractedText.trim().length() >= 10;
        }
    }

    public OcrResult extractText(byte[] fileBytes, String fileName, String contentType) {
        if (fileBytes == null || fileBytes.length == 0) {
            return new OcrResult("", 0.0f, "NO_FILE_CONTENT", "NONE");
        }

        String mime = (contentType != null) ? contentType.toLowerCase(Locale.ROOT) : "";
        String name = (fileName != null) ? fileName.toLowerCase(Locale.ROOT) : "";

        // 1. PDF Document Text Extraction via Apache PDFBox
        if (mime.contains("pdf") || name.endsWith(".pdf")) {
            return extractTextFromPdf(fileBytes);
        }

        // 2. Image Document Text Extraction (PNG, JPEG, JPG)
        if (mime.contains("image") || name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg")) {
            return extractTextFromImage(fileBytes);
        }

        return new OcrResult("", 0.0f, "UNSUPPORTED_FORMAT", "NONE");
    }

    private OcrResult extractTextFromPdf(byte[] pdfBytes) {
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String text = stripper.getText(document);

            if (text != null && text.trim().length() >= 10) {
                logger.info("PDFBox successfully extracted {} characters from PDF", text.trim().length());
                return new OcrResult(text.trim(), 0.95f, "SUCCESS", "PDFBOX_DIRECT");
            } else {
                logger.info("PDF document contained no extractable digital text (scanned PDF)");
                return new OcrResult("", 0.0f, "NO_TEXT_FOUND", "PDFBOX_DIRECT");
            }
        } catch (Exception e) {
            logger.warn("PDFBox extraction failed: {}", e.getMessage());
            return new OcrResult("", 0.0f, "NO_TEXT_FOUND", "PDFBOX_DIRECT");
        }
    }

    private OcrResult extractTextFromImage(byte[] imageBytes) {
        // Attempt optional local Tesseract OCR via reflection if Tess4J is present
        try {
            Class<?> tesseractClass = Class.forName("net.sourceforge.tess4j.Tesseract");
            Object tesseract = tesseractClass.getDeclaredConstructor().newInstance();

            // Check if TESSDATA_PREFIX is set in environment or default
            String tessData = System.getenv("TESSDATA_PREFIX");
            if (tessData != null && !tessData.isBlank()) {
                Method setDatapath = tesseractClass.getMethod("setDatapath", String.class);
                setDatapath.invoke(tesseract, tessData);
            }

            // Convert bytes to BufferedImage
            try (java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(imageBytes)) {
                java.awt.image.BufferedImage img = javax.imageio.ImageIO.read(bais);
                if (img != null) {
                    Method doOCR = tesseractClass.getMethod("doOCR", java.awt.image.BufferedImage.class);
                    String ocrOutput = (String) doOCR.invoke(tesseract, img);
                    if (ocrOutput != null && ocrOutput.trim().length() >= 10) {
                        return new OcrResult(ocrOutput.trim(), 0.85f, "SUCCESS", "TESSERACT_OCR");
                    }
                }
            }
        } catch (ClassNotFoundException e) {
            logger.info("Tess4J not on classpath; image OCR running with multimodal fallback");
        } catch (Throwable t) {
            logger.info("Local Tesseract OCR unavailable or traineddata not present: {}", t.getMessage());
        }

        // Graceful non-crashing status when local OCR engine is not installed
        return new OcrResult("", 0.0f, "OCR_UNAVAILABLE", "FALLBACK");
    }
}
