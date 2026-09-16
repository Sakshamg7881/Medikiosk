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
            "chhati me dard", "chhati mein dard", "seene me dard", "seene mein dard",
            "seene me jalan aur dard", "seene mein jalan aur dard", "dil me dard", "dil mein dard",
            "chaati me dard", "chaati mein dard",
            "सीने में दर्द", "छाती में दर्द", "सीने में जलन और दर्द",

            // Breathing / Respiratory
            "difficulty breathing", "severe breathlessness", "shortness of breath", "unable to breathe",
            "saans lene me takleef", "saans lene mein takleef",
            "saans lene me dikkat", "saans lene mein dikkat", "saans lene mein bahut dikkat", "saans lene me bahut dikkat",
            "dam ghutna", "saans foolna", "saans phoolna", "saans rukna",
            "सांस लेने में तकलीफ", "सांस लेने में दिक्कत", "सांस लेने में बहुत दिक्कत", "सांस फूलना", "दम घुटना",

            // Consciousness / Neurological / Stroke
            "unconscious", "fainting", "syncope", "passed out", "loss of consciousness",
            "behosh", "chakkar aake girna", "chakkar aakar behosh", "behoshi",
            "stroke symptoms", "sudden weakness", "facial droop", "slurred speech", "paralysis",
            "lakwa", "ek taraf kamzori", "muh tedha",
            "बेहोश", "बेहोशी", "लकवा", "अचानक कमजोरी",

            // Bleeding / Hemorrhage
            "heavy bleeding", "severe bleeding", "profuse bleeding", "hemorrhage",
            "khoon behna", "khoon ki ulti", "peshab me khoon", "peshab mein khoon",
            "खून बहना", "खून की उल्टी", "पेशाब में खून",

            // Anaphylaxis / Severe Allergy
            "anaphylaxis", "throat swelling", "gala band hona", "swelling in throat",

            // Vision / Extreme
            "sudden loss of vision", "aankhon ke aage andhera"
    );

    private static final List<java.util.regex.Pattern> RED_FLAG_PATTERNS = List.of(
            java.util.regex.Pattern.compile("saans\\s+lene\\s+(?:mein?|me)\\s+(?:bahut\\s+)?(?:dikkat|takleef)", java.util.regex.Pattern.CASE_INSENSITIVE),
            java.util.regex.Pattern.compile("chest\\s+pain.*saans", java.util.regex.Pattern.CASE_INSENSITIVE),
            java.util.regex.Pattern.compile("seene\\s+(?:mein?|me).*dard", java.util.regex.Pattern.CASE_INSENSITIVE),
            java.util.regex.Pattern.compile("saans\\s+(?:fool|phool)", java.util.regex.Pattern.CASE_INSENSITIVE)
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

        for (java.util.regex.Pattern pat : RED_FLAG_PATTERNS) {
            java.util.regex.Matcher m = pat.matcher(content);
            if (m.find()) {
                matches.add(m.group(0));
            }
        }

        if (!matches.isEmpty()) {
            String warning = "Some symptoms mentioned may need urgent medical attention. Please seek appropriate medical care promptly.";
            return new RedFlagResult(true, new ArrayList<>(matches), warning);
        }

        return new RedFlagResult(false, Collections.emptyList(), null);
    }
}
