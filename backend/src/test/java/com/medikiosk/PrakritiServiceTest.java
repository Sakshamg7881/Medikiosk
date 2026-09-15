package com.medikiosk;

import com.medikiosk.service.PrakritiService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

public class PrakritiServiceTest {

    private PrakritiService prakritiService;

    @BeforeEach
    public void setup() {
        prakritiService = new PrakritiService();
    }

    @Test
    public void testVataDominantScoring() {
        Map<String, String> answers = Map.of(
                "agni", "Bhookh kam lagti hai / gas aur bloating hoti hai",
                "nidra", "Halki aur tuti neend, baar baar khulna",
                "mala", "Kabz rehti hai, thand bilkul pasand nahi"
        );

        Map<String, Object> result = prakritiService.calculatePrakriti(answers, "en");

        assertNotNull(result);
        assertEquals("Vata Dominant", result.get("dominantTendency"));
        assertEquals("Vata", result.get("dominantDosha"));

        @SuppressWarnings("unchecked")
        Map<String, Integer> scores = (Map<String, Integer>) result.get("scores");
        assertTrue(scores.get("vata") > scores.get("pitta"));
        assertTrue(scores.get("vata") > scores.get("kapha"));
        assertTrue(((String) result.get("description")).contains("Vata"));
        assertTrue(((String) result.get("disclaimer")).contains("preliminary wellness indicator"));
    }

    @Test
    public void testPittaDominantScoring() {
        Map<String, String> answers = Map.of(
                "agni", "Tez bhookh lagti hai, seene me jalan aur acidity hoti hai",
                "nidra", "Normal neend 6-7 ghante aaram se",
                "mala", "Jaldi pet saaf hota hai, garmi aur pasina zyada lagta hai"
        );

        Map<String, Object> result = prakritiService.calculatePrakriti(answers, "hi");

        assertNotNull(result);
        assertEquals("Pitta Dominant", result.get("dominantTendency"));
        assertEquals("Pitta", result.get("dominantDosha"));

        @SuppressWarnings("unchecked")
        Map<String, Integer> scores = (Map<String, Integer>) result.get("scores");
        assertTrue(scores.get("pitta") > scores.get("vata"));
        assertTrue(scores.get("pitta") > scores.get("kapha"));
        assertTrue(((String) result.get("description")).contains("पित्त"));
        assertTrue(((String) result.get("disclaimer")).contains("प्रारंभिक स्वास्थ्य संकेतक"));
    }

    @Test
    public void testKaphaDominantScoring() {
        Map<String, String> answers = Map.of(
                "agni", "Dheema pachan aur khane ke baad pet bhari lagta hai",
                "nidra", "Gehri bhari neend, subah uthne me aalas",
                "mala", "Steady sluggish bowels, tolerate seasons well"
        );

        Map<String, Object> result = prakritiService.calculatePrakriti(answers, "hinglish");

        assertNotNull(result);
        assertEquals("Kapha Dominant", result.get("dominantTendency"));
        assertEquals("Kapha", result.get("dominantDosha"));

        @SuppressWarnings("unchecked")
        Map<String, Integer> scores = (Map<String, Integer>) result.get("scores");
        assertTrue(scores.get("kapha") > scores.get("vata"));
        assertTrue(scores.get("kapha") > scores.get("pitta"));
        assertTrue(((String) result.get("description")).contains("Kapha"));
        assertTrue(((String) result.get("disclaimer")).contains("shuruati health indicator"));
    }

    @Test
    public void testDisclaimerIsAlwaysPresent() {
        Map<String, String> answers = Map.of(
                "agni", "Normal",
                "nidra", "Normal",
                "mala", "Normal"
        );

        for (String lang : new String[]{"en", "hi", "hinglish"}) {
            Map<String, Object> result = prakritiService.calculatePrakriti(answers, lang);
            assertNotNull(result.get("disclaimer"));
            assertFalse(((String) result.get("disclaimer")).isBlank());
        }
    }
}
