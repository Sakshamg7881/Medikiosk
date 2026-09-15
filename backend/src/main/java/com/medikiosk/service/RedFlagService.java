package com.medikiosk.service;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RedFlagService {

    public static class RedFlagResult {
        private final boolean detected;
        private final List<String> matchedTerms;
        private final String warningMessage;

        public RedFlagResult(boolean detected, List<String> matchedTerms, String warningMessage) {
            this.detected = detected;
            this.matchedTerms = matchedTerms != null ? matchedTerms : Collections.emptyList();
            this.warningMessage = warningMessage;
        }

        public boolean isDetected() {
            return detected;
        }

        public List<String> getMatchedTerms() {
            return matchedTerms;
        }

        public String getWarningMessage() {
            return warningMessage;
        }
    }

    private static final List<String> RED_FLAG_KEYWORDS = List.of(
            // Chest / Heart
            "chest pain", "severe chest pain", "angina", "pressure in chest",
            "chhati me dard", "seene me dard", "seene me jalan aur dard", "dil me dard", "chaati me dard",
            "सीने में दर्द", "छाती में दर्द",

            // Breathing / Respiratory
            "difficulty breathing", "severe breathlessness", "shortness of breath", "unable to breathe",
            "saans lene me takleef", "dam ghutna", "saans foolna", "saans rukna",
            "सांस लेने में तकलीफ", "सांस फूलना", "दम घुटना",

            // Consciousness / Neurological / Stroke
            "unconscious", "fainting", "syncope", "passed out", "loss of consciousness",
            "behosh", "chakkar aake girna", "behoshi",
            "stroke symptoms", "sudden weakness", "facial droop", "slurred speech", "paralysis",
            "lakwa", "ek taraf kamzori", "muh tedha",
            "बेहोश", "बेहोशी", "लकवा",

            // Bleeding / Hemorrhage
            "heavy bleeding", "severe bleeding", "profuse bleeding", "hemorrhage",
            "khoon behna", "khoon ki ulti", "peshab me khoon",
            "खून बहना", "खून की उल्टी",

            // Anaphylaxis / Severe Allergy
            "anaphylaxis", "throat swelling", "gala band hona", "swelling in throat",

            // Vision / Extreme
            "sudden loss of vision", "aankhon ke aage andhera"
    );

    public RedFlagResult checkRedFlags(String... textSources) {
        if (textSources == null || textSources.length == 0) {
            return new RedFlagResult(false, Collections.emptyList(), null);
        }

        StringBuilder combined = new StringBuilder();
        for (String src : textSources) {
            if (src != null) {
                combined.append(" ").append(src.toLowerCase(Locale.ROOT));
            }
        }
        String content = combined.toString();

        Set<String> matches = new LinkedHashSet<>();
        for (String kw : RED_FLAG_KEYWORDS) {
            if (content.contains(kw)) {
                matches.add(kw);
            }
        }

        if (!matches.isEmpty()) {
            String warning = "Some symptoms mentioned may need urgent medical attention. Please seek appropriate medical care promptly.";
            return new RedFlagResult(true, new ArrayList<>(matches), warning);
        }

        return new RedFlagResult(false, Collections.emptyList(), null);
    }
}
