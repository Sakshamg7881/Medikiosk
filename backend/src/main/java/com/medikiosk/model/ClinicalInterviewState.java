package com.medikiosk.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.*;

@JsonIgnoreProperties(ignoreUnknown = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ClinicalInterviewState {

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SymptomItem {
        private String name;
        private String duration;
        private String severity;
        private String location;
        private String character;
        private String trigger;
        private String timing;
        private String relievingFactors;
        private String associatedSymptoms;
        private String notes;

        public SymptomItem() {}

        public SymptomItem(String name, String duration) {
            this.name = name;
            this.duration = duration;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getDuration() { return duration; }
        public void setDuration(String duration) { this.duration = duration; }

        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }

        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }

        public String getCharacter() { return character; }
        public void setCharacter(String character) { this.character = character; }

        public String getTrigger() { return trigger; }
        public void setTrigger(String trigger) { this.trigger = trigger; }

        public String getTiming() { return timing; }
        public void setTiming(String timing) { this.timing = timing; }

        public String getRelievingFactors() { return relievingFactors; }
        public void setRelievingFactors(String relievingFactors) { this.relievingFactors = relievingFactors; }

        public String getAssociatedSymptoms() { return associatedSymptoms; }
        public void setAssociatedSymptoms(String associatedSymptoms) { this.associatedSymptoms = associatedSymptoms; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class QuestionHistoryEntry {
        private String semanticKey;
        private String questionText;
        private String patientAnswer;
        private boolean answered;
        private String timestamp;

        public QuestionHistoryEntry() {}

        public QuestionHistoryEntry(String semanticKey, String questionText, boolean answered, String timestamp) {
            this.semanticKey = semanticKey;
            this.questionText = questionText;
            this.answered = answered;
            this.timestamp = timestamp;
        }

        public String getSemanticKey() { return semanticKey; }
        public void setSemanticKey(String semanticKey) { this.semanticKey = semanticKey; }

        public String getQuestionText() { return questionText; }
        public void setQuestionText(String questionText) { this.questionText = questionText; }

        public String getPatientAnswer() { return patientAnswer; }
        public void setPatientAnswer(String patientAnswer) { this.patientAnswer = patientAnswer; }

        public boolean isAnswered() { return answered; }
        public void setAnswered(boolean answered) { this.answered = answered; }

        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    }

    private String chiefComplaint;
    private List<SymptomItem> symptoms = new ArrayList<>();
    private String duration;
    private String location;
    private String character;
    private String severity;
    private String timing;
    private String aggravatingFactors;
    private String relievingFactors;
    private String associatedSymptoms;
    private List<String> pertinentNegatives = new ArrayList<>();
    private String pastMedicalHistory;
    private String pastSurgicalHistory;
    private String currentMedicines;
    private String allergies;
    private String familyHistory;
    private String personalLifestyle;
    private String ayushAgni;
    private String ayushNidra;
    private String ayushMala;
    private String ayushAharaVihara;
    private List<String> redFlags = new ArrayList<>();
    private Map<String, String> provenance = new LinkedHashMap<>();
    private Set<String> addressedDimensions = new LinkedHashSet<>();
    private Set<String> answeredFields = new LinkedHashSet<>();
    private List<String> questionHistory = new ArrayList<>();
    private String lastQuestionSemanticKey;
    private List<QuestionHistoryEntry> questionHistoryEntries = new ArrayList<>();
    private String language;

    public ClinicalInterviewState() {}

    /**
     * Merge new extracted facts from patient turn, applying corrections.
     * The latest non-empty patient statement overrides previous information.
     */
    @SuppressWarnings("unchecked")
    public void mergeExtractedFacts(Map<String, Object> facts) {
        if (facts == null || facts.isEmpty()) return;

        // Process structured symptoms list if returned
        if (facts.get("symptoms") instanceof List<?> symList) {
            for (Object obj : symList) {
                if (obj instanceof Map<?, ?> symMap) {
                    String sName = symMap.get("name") != null ? symMap.get("name").toString() : null;
                    String sDur = symMap.get("duration") != null ? symMap.get("duration").toString() : null;
                    String sSev = symMap.get("severity") != null ? symMap.get("severity").toString() : null;
                    String sLoc = symMap.get("location") != null ? symMap.get("location").toString() : null;
                    String sTrig = symMap.get("trigger") != null ? symMap.get("trigger").toString() : null;
                    addOrUpdateSymptom(sName, sDur, sSev, sLoc, sTrig);
                }
            }
        }

        if (hasValue(facts.get("chiefComplaint"))) {
            String newVal = cleanVal(facts.get("chiefComplaint"));
            if (this.chiefComplaint != null && !this.chiefComplaint.isBlank() && !this.chiefComplaint.equalsIgnoreCase(newVal)) {
                this.provenance.put("chiefComplaint", "PATIENT_CORRECTED");
            } else if (!"PATIENT_CORRECTED".equals(this.provenance.get("chiefComplaint"))) {
                this.provenance.put("chiefComplaint", "PATIENT_REPORTED");
            }
            this.chiefComplaint = newVal;
        }
        if (hasValue(facts.get("duration"))) {
            String newVal = cleanVal(facts.get("duration"));
            if (this.duration != null && !this.duration.isBlank() && !this.duration.equalsIgnoreCase(newVal)) {
                this.provenance.put("duration", "PATIENT_CORRECTED");
            } else if (!"PATIENT_CORRECTED".equals(this.provenance.get("duration"))) {
                this.provenance.put("duration", "PATIENT_REPORTED");
            }
            this.duration = newVal;
        }
        if (hasValue(facts.get("location"))) {
            String newVal = cleanVal(facts.get("location"));
            if (this.location != null && !this.location.isBlank() && !this.location.equalsIgnoreCase(newVal)) {
                this.provenance.put("location", "PATIENT_CORRECTED");
            } else if (!"PATIENT_CORRECTED".equals(this.provenance.get("location"))) {
                this.provenance.put("location", "PATIENT_REPORTED");
            }
            this.location = newVal;
        }
        if (hasValue(facts.get("character"))) {
            String newVal = cleanVal(facts.get("character"));
            if (this.character != null && !this.character.isBlank() && !this.character.equalsIgnoreCase(newVal)) {
                this.provenance.put("character", "PATIENT_CORRECTED");
            } else if (!"PATIENT_CORRECTED".equals(this.provenance.get("character"))) {
                this.provenance.put("character", "PATIENT_REPORTED");
            }
            this.character = newVal;
        }
        if (hasValue(facts.get("severity"))) {
            String newVal = cleanVal(facts.get("severity"));
            if (this.severity != null && !this.severity.isBlank() && !this.severity.equalsIgnoreCase(newVal)) {
                this.provenance.put("severity", "PATIENT_CORRECTED");
            } else if (!"PATIENT_CORRECTED".equals(this.provenance.get("severity"))) {
                this.provenance.put("severity", "PATIENT_REPORTED");
            }
            this.severity = newVal;
        }
        if (hasValue(facts.get("timing"))) {
            String newVal = cleanVal(facts.get("timing"));
            if (this.timing != null && !this.timing.isBlank() && !this.timing.equalsIgnoreCase(newVal)) {
                this.provenance.put("timing", "PATIENT_CORRECTED");
            } else if (!"PATIENT_CORRECTED".equals(this.provenance.get("timing"))) {
                this.provenance.put("timing", "PATIENT_REPORTED");
            }
            this.timing = newVal;
        }
        if (hasValue(facts.get("aggravatingFactors"))) {
            String newVal = cleanVal(facts.get("aggravatingFactors"));
            if (this.aggravatingFactors != null && !this.aggravatingFactors.isBlank() && !this.aggravatingFactors.equalsIgnoreCase(newVal)) {
                this.provenance.put("aggravatingFactors", "PATIENT_CORRECTED");
            } else if (!"PATIENT_CORRECTED".equals(this.provenance.get("aggravatingFactors"))) {
                this.provenance.put("aggravatingFactors", "PATIENT_REPORTED");
            }
            this.aggravatingFactors = newVal;
        }
        if (hasValue(facts.get("relievingFactors"))) {
            String newVal = cleanVal(facts.get("relievingFactors"));
            if (this.relievingFactors != null && !this.relievingFactors.isBlank() && !this.relievingFactors.equalsIgnoreCase(newVal)) {
                this.provenance.put("relievingFactors", "PATIENT_CORRECTED");
            } else if (!"PATIENT_CORRECTED".equals(this.provenance.get("relievingFactors"))) {
                this.provenance.put("relievingFactors", "PATIENT_REPORTED");
            }
            this.relievingFactors = newVal;
        }
        if (hasValue(facts.get("associatedSymptoms"))) {
            String newSym = cleanVal(facts.get("associatedSymptoms"));
            if (this.associatedSymptoms == null || this.associatedSymptoms.isBlank()) {
                this.associatedSymptoms = newSym;
            } else if (!this.associatedSymptoms.toLowerCase(Locale.ROOT).contains(newSym.toLowerCase(Locale.ROOT))) {
                this.associatedSymptoms = this.associatedSymptoms + ", " + newSym;
            }
            this.provenance.put("associatedSymptoms", "PATIENT_REPORTED");
        }
        if (facts.get("pertinentNegatives") != null) {
            Object pnObj = facts.get("pertinentNegatives");
            if (pnObj instanceof List<?> list) {
                for (Object item : list) {
                    if (item != null && !item.toString().isBlank()) {
                        String neg = item.toString().trim();
                        if (!this.pertinentNegatives.contains(neg)) {
                            this.pertinentNegatives.add(neg);
                        }
                    }
                }
            } else if (pnObj instanceof String str && !str.isBlank()) {
                for (String part : str.split("[,;]")) {
                    String clean = part.trim();
                    if (!clean.isEmpty() && !this.pertinentNegatives.contains(clean)) {
                        this.pertinentNegatives.add(clean);
                    }
                }
            }
        }
        if (hasValue(facts.get("pastMedicalHistory"))) {
            this.pastMedicalHistory = cleanVal(facts.get("pastMedicalHistory"));
            this.provenance.put("pastMedicalHistory", "PATIENT_REPORTED");
        }
        if (hasValue(facts.get("pastSurgicalHistory"))) {
            this.pastSurgicalHistory = cleanVal(facts.get("pastSurgicalHistory"));
            this.provenance.put("pastSurgicalHistory", "PATIENT_REPORTED");
        }
        if (hasValue(facts.get("currentMedicines"))) {
            this.currentMedicines = cleanVal(facts.get("currentMedicines"));
            this.provenance.put("currentMedicines", "PATIENT_REPORTED");
        }
        if (hasValue(facts.get("allergies"))) {
            this.allergies = cleanVal(facts.get("allergies"));
            this.provenance.put("allergies", "PATIENT_REPORTED");
        }
        if (hasValue(facts.get("familyHistory"))) {
            this.familyHistory = cleanVal(facts.get("familyHistory"));
            this.provenance.put("familyHistory", "PATIENT_REPORTED");
        }
        if (hasValue(facts.get("personalLifestyle"))) {
            this.personalLifestyle = cleanVal(facts.get("personalLifestyle"));
            this.provenance.put("personalLifestyle", "PATIENT_REPORTED");
        }
        if (hasValue(facts.get("pastMedicalHistory")) || hasValue(facts.get("currentMedicines")) || hasValue(facts.get("allergies"))) {
            this.addressedDimensions.add("MEDICAL_HISTORY");
        }
        if (hasValue(facts.get("ayushAgni"))) {
            this.ayushAgni = cleanVal(facts.get("ayushAgni"));
            this.provenance.put("ayushAgni", "PATIENT_REPORTED");
            this.addressedDimensions.add("AYUSH_AGNI");
        }
        if (hasValue(facts.get("ayushNidra"))) {
            this.ayushNidra = cleanVal(facts.get("ayushNidra"));
            this.provenance.put("ayushNidra", "PATIENT_REPORTED");
            this.addressedDimensions.add("AYUSH_NIDRA");
        }
        if (hasValue(facts.get("ayushMala"))) {
            this.ayushMala = cleanVal(facts.get("ayushMala"));
            this.provenance.put("ayushMala", "PATIENT_REPORTED");
            this.addressedDimensions.add("AYUSH_MALA");
        }
        if (hasValue(facts.get("ayushAharaVihara"))) {
            this.ayushAharaVihara = cleanVal(facts.get("ayushAharaVihara"));
            this.provenance.put("ayushAharaVihara", "PATIENT_REPORTED");
            this.addressedDimensions.add("AYUSH_AHARA_VIHARA");
        } else if (hasValue(facts.get("aharaVihara"))) {
            this.ayushAharaVihara = cleanVal(facts.get("aharaVihara"));
            this.provenance.put("ayushAharaVihara", "PATIENT_REPORTED");
            this.addressedDimensions.add("AYUSH_AHARA_VIHARA");
        }

        // Maintain backwards compatibility: synthesize duration if empty but symptoms have durations
        if (!hasValue(this.duration) && !this.symptoms.isEmpty()) {
            List<String> durParts = new ArrayList<>();
            for (SymptomItem s : this.symptoms) {
                if (hasValue(s.getDuration())) {
                    durParts.add(s.getName() + ": " + s.getDuration());
                }
            }
            if (!durParts.isEmpty()) {
                this.duration = String.join(", ", durParts);
            }
        }

        // Synthesize chiefComplaint if empty but symptoms recorded
        if (!hasValue(this.chiefComplaint) && !this.symptoms.isEmpty()) {
            List<String> sNames = new ArrayList<>();
            for (SymptomItem s : this.symptoms) {
                sNames.add(s.getName());
            }
            this.chiefComplaint = String.join(" and ", sNames);
        }

        syncAnsweredFields();
    }

    public void addOrUpdateSymptom(String name, String duration, String severity, String location, String trigger) {
        if (name == null || name.isBlank()) return;
        String lowerName = name.toLowerCase(Locale.ROOT).trim();

        SymptomItem target = null;
        for (SymptomItem s : symptoms) {
            if (s.getName() != null) {
                String existingLower = s.getName().toLowerCase(Locale.ROOT);
                if (existingLower.equals(lowerName) ||
                        (lowerName.contains("fever") && existingLower.contains("fever")) ||
                        (lowerName.contains("bukhar") && existingLower.contains("bukhar")) ||
                        (lowerName.contains("cough") && existingLower.contains("cough")) ||
                        (lowerName.contains("khansi") && existingLower.contains("khansi")) ||
                        ((lowerName.contains("cold") || lowerName.contains("jukham") || lowerName.contains("zukam")) &&
                                (existingLower.contains("cold") || existingLower.contains("jukham") || existingLower.contains("zukam"))) ||
                        (lowerName.contains("knee") && existingLower.contains("knee")) ||
                        (lowerName.contains("head") && existingLower.contains("head"))) {
                    target = s;
                    break;
                }
            }
        }

        if (target == null) {
            target = new SymptomItem(name.trim(), hasValue(duration) ? duration.trim() : null);
            symptoms.add(target);
        } else {
            if (hasValue(duration)) target.setDuration(duration.trim());
        }

        if (hasValue(severity)) target.setSeverity(severity.trim());
        if (hasValue(location)) target.setLocation(location.trim());
        if (hasValue(trigger)) target.setTrigger(trigger.trim());

        this.provenance.put("symptom:" + target.getName(), "PATIENT_REPORTED");
        syncAnsweredFields();
    }

    public boolean hasDurationKnown() {
        if (hasValue(duration)) return true;
        for (SymptomItem s : symptoms) {
            if (hasValue(s.getDuration())) return true;
        }
        return false;
    }

    public boolean hasSeverityKnown() {
        if (hasValue(severity)) return true;
        for (SymptomItem s : symptoms) {
            if (hasValue(s.getSeverity())) return true;
        }
        return false;
    }

    public boolean hasLocationKnown() {
        if (hasValue(location)) return true;
        for (SymptomItem s : symptoms) {
            if (hasValue(s.getLocation())) return true;
        }
        return false;
    }

    public boolean hasTriggerKnown() {
        if (hasValue(aggravatingFactors)) return true;
        for (SymptomItem s : symptoms) {
            if (hasValue(s.getTrigger())) return true;
        }
        return false;
    }

    private boolean hasValue(Object obj) {
        return obj != null && !obj.toString().trim().isEmpty() && !obj.toString().equalsIgnoreCase("null");
    }

    private String cleanVal(Object obj) {
        return obj.toString().trim();
    }

    /**
     * Compact summary of known clinical facts for Gemini prompt context
     */
    public String toPromptSummary() {
        StringBuilder sb = new StringBuilder();
        if (hasValue(chiefComplaint)) sb.append("- Chief Complaint: ").append(chiefComplaint).append("\n");

        if (!symptoms.isEmpty()) {
            sb.append("- Documented Symptoms (DO NOT RE-ASK DURATION/ATTRIBUTES FOR THESE):\n");
            for (SymptomItem s : symptoms) {
                sb.append("  * ").append(s.getName());
                if (hasValue(s.getDuration())) sb.append(" [Duration: ").append(s.getDuration()).append("]");
                if (hasValue(s.getSeverity())) sb.append(" [Severity: ").append(s.getSeverity()).append("]");
                if (hasValue(s.getLocation())) sb.append(" [Location: ").append(s.getLocation()).append("]");
                if (hasValue(s.getTrigger())) sb.append(" [Trigger: ").append(s.getTrigger()).append("]");
                sb.append("\n");
            }
        }

        if (hasValue(duration)) sb.append("- Overall Duration/Timeline: ").append(duration).append(" (DO NOT ASK HOW LONG)\n");
        if (hasValue(location)) sb.append("- Location: ").append(location).append("\n");
        if (hasValue(character)) sb.append("- Character/Nature: ").append(character).append("\n");
        if (hasValue(severity)) sb.append("- Severity: ").append(severity).append(" (DO NOT ASK SEVERITY)\n");
        if (hasValue(timing)) sb.append("- Timing/Pattern: ").append(timing).append("\n");
        if (hasValue(aggravatingFactors)) sb.append("- Aggravating Factors/Triggers: ").append(aggravatingFactors).append(" (DO NOT ASK TRIGGERS)\n");
        if (hasValue(relievingFactors)) sb.append("- Relieving Factors: ").append(relievingFactors).append("\n");
        if (hasValue(associatedSymptoms)) sb.append("- Associated Symptoms: ").append(associatedSymptoms).append("\n");
        if (!pertinentNegatives.isEmpty()) sb.append("- Pertinent Negatives: ").append(String.join(", ", pertinentNegatives)).append("\n");
        if (hasValue(pastMedicalHistory)) sb.append("- Past Medical History: ").append(pastMedicalHistory).append("\n");
        if (hasValue(pastSurgicalHistory)) sb.append("- Past Surgical History: ").append(pastSurgicalHistory).append("\n");
        if (hasValue(currentMedicines)) sb.append("- Current Medicines: ").append(currentMedicines).append("\n");
        if (hasValue(allergies)) sb.append("- Allergies: ").append(allergies).append("\n");
        if (hasValue(familyHistory)) sb.append("- Family History: ").append(familyHistory).append("\n");
        if (hasValue(personalLifestyle)) sb.append("- Lifestyle/Habits: ").append(personalLifestyle).append("\n");
        if (hasValue(ayushAgni)) sb.append("- AYUSH Digestion/Agni: ").append(ayushAgni).append(" (DO NOT ASK AGNI)\n");
        if (hasValue(ayushNidra)) sb.append("- AYUSH Sleep/Nidra: ").append(ayushNidra).append(" (DO NOT ASK NIDRA)\n");
        if (hasValue(ayushMala)) sb.append("- AYUSH Elimination/Bowel: ").append(ayushMala).append(" (DO NOT ASK MALA)\n");
        if (hasValue(ayushAharaVihara)) sb.append("- AYUSH Routine/Ahara-Vihara: ").append(ayushAharaVihara).append(" (DO NOT ASK AHARA/VIHARA)\n");

        return sb.length() > 0 ? sb.toString() : "- None recorded yet.\n";
    }

    /**
     * Determine if sufficient information exists to create a meaningful pre-consultation case.
     * Completes based purely on clinical information sufficiency rather than arbitrary turn thresholds.
     */
    public boolean isClinicallySufficient(int userTurnCount) {
        boolean hasComplaint = hasValue(chiefComplaint) || !symptoms.isEmpty();
        boolean hasTimeline = hasDurationKnown();
        boolean hasCharacteristics = hasSeverityKnown() || hasValue(character) || hasTriggerKnown() || hasLocationKnown() || hasValue(associatedSymptoms);
        boolean hasHistoryAddressed = hasValue(pastMedicalHistory) || hasValue(currentMedicines) || hasValue(allergies) || addressedDimensions.contains("MEDICAL_HISTORY");

        int ayushCount = 0;
        if (hasAgniKnown()) ayushCount++;
        if (hasNidraKnown()) ayushCount++;
        if (hasMalaKnown()) ayushCount++;
        if (hasAharaViharaKnown()) ayushCount++;

        // Completion criteria (targets ~5-6 meaningful turns without endless probing):
        // 1. Primary complaint is clear
        // 2. Relevant timeline is captured
        // 3. Enough complaint-specific characteristics are captured
        // 4. Relevant medical history/medication/allergy information has been addressed
        // 5. AYUSH profile reasonably explored:
        //    - all 4 AYUSH dimensions known
        //    - OR at least 2 AYUSH dimensions known and userTurnCount >= 5
        //    - OR at least 1 AYUSH dimension known and userTurnCount >= 6
        if (hasComplaint && hasTimeline && hasCharacteristics && hasHistoryAddressed) {
            if (ayushCount >= 4) {
                return true;
            }
            if (ayushCount >= 2 && userTurnCount >= 5) {
                return true;
            }
            if (ayushCount >= 1 && userTurnCount >= 6) {
                return true;
            }
        }

        // Exhaustive fallback safeguard: after 9+ turns if core facts are known
        if (userTurnCount >= 9 && hasComplaint && hasTimeline && hasCharacteristics) {
            return true;
        }

        return false;
    }

    public boolean hasAgniKnown() {
        return hasValue(ayushAgni) || addressedDimensions.contains("AYUSH_AGNI");
    }

    public boolean hasNidraKnown() {
        return hasValue(ayushNidra) || addressedDimensions.contains("AYUSH_NIDRA");
    }

    public boolean hasMalaKnown() {
        return hasValue(ayushMala) || addressedDimensions.contains("AYUSH_MALA");
    }

    public boolean hasAharaViharaKnown() {
        return hasValue(ayushAharaVihara) || addressedDimensions.contains("AYUSH_AHARA_VIHARA");
    }

    public boolean isAyushExplored() {
        return hasAgniKnown() && hasNidraKnown() && hasMalaKnown() && hasAharaViharaKnown();
    }

    public List<SymptomItem> getSymptoms() { return symptoms; }
    public void setSymptoms(List<SymptomItem> symptoms) { this.symptoms = symptoms != null ? symptoms : new ArrayList<>(); }

    // Getters and Setters
    public String getChiefComplaint() { return chiefComplaint; }
    public void setChiefComplaint(String chiefComplaint) { this.chiefComplaint = chiefComplaint; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getCharacter() { return character; }
    public void setCharacter(String character) { this.character = character; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getTiming() { return timing; }
    public void setTiming(String timing) { this.timing = timing; }

    public String getAggravatingFactors() { return aggravatingFactors; }
    public void setAggravatingFactors(String aggravatingFactors) { this.aggravatingFactors = aggravatingFactors; }

    public String getRelievingFactors() { return relievingFactors; }
    public void setRelievingFactors(String relievingFactors) { this.relievingFactors = relievingFactors; }

    public String getAssociatedSymptoms() { return associatedSymptoms; }
    public void setAssociatedSymptoms(String associatedSymptoms) { this.associatedSymptoms = associatedSymptoms; }

    public List<String> getPertinentNegatives() { return pertinentNegatives; }
    public void setPertinentNegatives(List<String> pertinentNegatives) { this.pertinentNegatives = pertinentNegatives; }

    public String getPastMedicalHistory() { return pastMedicalHistory; }
    public void setPastMedicalHistory(String pastMedicalHistory) { this.pastMedicalHistory = pastMedicalHistory; }

    public String getPastSurgicalHistory() { return pastSurgicalHistory; }
    public void setPastSurgicalHistory(String pastSurgicalHistory) { this.pastSurgicalHistory = pastSurgicalHistory; }

    public String getCurrentMedicines() { return currentMedicines; }
    public void setCurrentMedicines(String currentMedicines) { this.currentMedicines = currentMedicines; }

    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }

    public String getFamilyHistory() { return familyHistory; }
    public void setFamilyHistory(String familyHistory) { this.familyHistory = familyHistory; }

    public String getPersonalLifestyle() { return personalLifestyle; }
    public void setPersonalLifestyle(String personalLifestyle) { this.personalLifestyle = personalLifestyle; }

    public String getAyushAgni() { return ayushAgni; }
    public void setAyushAgni(String ayushAgni) { this.ayushAgni = ayushAgni; }

    public String getAyushNidra() { return ayushNidra; }
    public void setAyushNidra(String ayushNidra) { this.ayushNidra = ayushNidra; }

    public String getAyushMala() { return ayushMala; }
    public void setAyushMala(String ayushMala) { this.ayushMala = ayushMala; }

    public String getAyushAharaVihara() { return ayushAharaVihara; }
    public void setAyushAharaVihara(String ayushAharaVihara) { this.ayushAharaVihara = ayushAharaVihara; }

    public Set<String> getAddressedDimensions() { return addressedDimensions; }
    public void setAddressedDimensions(Set<String> addressedDimensions) { this.addressedDimensions = addressedDimensions != null ? addressedDimensions : new LinkedHashSet<>(); }
    public void markDimensionAddressed(String dim) { if (dim != null) this.addressedDimensions.add(dim); }
    public boolean isDimensionAddressed(String dim) { return this.addressedDimensions.contains(dim); }

    public List<String> getRedFlags() { return redFlags; }
    public void setRedFlags(List<String> redFlags) { this.redFlags = redFlags; }

    public Map<String, String> getProvenance() { return provenance; }
    public void setProvenance(Map<String, String> provenance) { this.provenance = provenance; }

    public void syncAnsweredFields() {
        if (hasValue(chiefComplaint) || !symptoms.isEmpty()) {
            answeredFields.add("CHIEF_COMPLAINT");
        }
        if (hasDurationKnown()) {
            answeredFields.add("DURATION");
        }
        if (hasLocationKnown()) {
            answeredFields.add("LOCATION");
        }
        if (hasSeverityKnown()) {
            answeredFields.add("SEVERITY");
        }
        if (hasTriggerKnown()) {
            answeredFields.add("TRIGGER");
        }
        if (hasValue(character)) {
            answeredFields.add("CHARACTER");
        }
        if (hasValue(relievingFactors)) {
            answeredFields.add("RELIEVING");
        }
        if (hasValue(associatedSymptoms)) {
            answeredFields.add("ASSOCIATED");
        }
        if (hasValue(timing)) {
            answeredFields.add("TIMING");
        }
        if (hasValue(pastMedicalHistory) || hasValue(currentMedicines)) {
            answeredFields.add("HISTORY_MEDS");
            addressedDimensions.add("MEDICAL_HISTORY");
        }
        if (hasValue(allergies)) {
            answeredFields.add("ALLERGIES");
            addressedDimensions.add("MEDICAL_HISTORY");
        }
        if (hasValue(personalLifestyle)) {
            answeredFields.add("LIFESTYLE");
        }
        if (hasValue(familyHistory)) {
            answeredFields.add("FAMILY_HISTORY");
        }
        if (hasAgniKnown()) {
            answeredFields.add("AYUSH_AGNI");
            addressedDimensions.add("AYUSH_AGNI");
        }
        if (hasNidraKnown()) {
            answeredFields.add("AYUSH_NIDRA");
            addressedDimensions.add("AYUSH_NIDRA");
        }
        if (hasMalaKnown()) {
            answeredFields.add("AYUSH_MALA");
            addressedDimensions.add("AYUSH_MALA");
        }
        if (hasAharaViharaKnown()) {
            answeredFields.add("AYUSH_AHARA_VIHARA");
            addressedDimensions.add("AYUSH_AHARA_VIHARA");
        }
    }

    public Set<String> getAnsweredFields() { return answeredFields; }
    public void setAnsweredFields(Set<String> answeredFields) { this.answeredFields = answeredFields != null ? answeredFields : new LinkedHashSet<>(); }
    public boolean isFieldAnswered(String field) {
        if (field == null) return false;
        return answeredFields.contains(field.toUpperCase(Locale.ROOT));
    }
    public void markFieldAnswered(String field) {
        if (field != null) {
            answeredFields.add(field.toUpperCase(Locale.ROOT));
        }
    }

    public List<String> getQuestionHistory() { return questionHistory; }
    public void setQuestionHistory(List<String> questionHistory) { this.questionHistory = questionHistory != null ? questionHistory : new ArrayList<>(); }
    public void recordQuestionAsked(String question) {
        if (question != null && !question.isBlank()) {
            this.questionHistory.add(question.trim());
        }
    }

    public String getLastQuestionSemanticKey() { return lastQuestionSemanticKey; }
    public void setLastQuestionSemanticKey(String lastQuestionSemanticKey) { this.lastQuestionSemanticKey = lastQuestionSemanticKey; }

    public List<QuestionHistoryEntry> getQuestionHistoryEntries() { return questionHistoryEntries; }
    public void setQuestionHistoryEntries(List<QuestionHistoryEntry> questionHistoryEntries) {
        this.questionHistoryEntries = questionHistoryEntries != null ? questionHistoryEntries : new ArrayList<>();
    }

    public void recordQuestion(String semanticKey, String text, String timestamp) {
        if (text != null && !text.isBlank()) {
            this.lastQuestionSemanticKey = semanticKey;
            this.questionHistory.add(text.trim());
            this.questionHistoryEntries.add(new QuestionHistoryEntry(semanticKey, text.trim(), false, timestamp));
        }
    }

    public void satisfyPendingQuestion(String answer) {
        if (answer == null || answer.isBlank() || this.lastQuestionSemanticKey == null) return;
        String cleanAnswer = answer.trim();

        // Update the last question history entry
        if (!this.questionHistoryEntries.isEmpty()) {
            for (int i = this.questionHistoryEntries.size() - 1; i >= 0; i--) {
                QuestionHistoryEntry entry = this.questionHistoryEntries.get(i);
                if (!entry.isAnswered() && (this.lastQuestionSemanticKey.equals(entry.getSemanticKey()) || i == this.questionHistoryEntries.size() - 1)) {
                    entry.setPatientAnswer(cleanAnswer);
                    entry.setAnswered(true);
                    break;
                }
            }
        }

        // Satisfy the state field directly according to semantic key
        switch (this.lastQuestionSemanticKey) {
            case "AYUSH_AGNI" -> {
                this.ayushAgni = cleanAnswer;
                this.addressedDimensions.add("AYUSH_AGNI");
                this.provenance.put("ayushAgni", "PATIENT_REPORTED");
            }
            case "AYUSH_NIDRA" -> {
                this.ayushNidra = cleanAnswer;
                this.addressedDimensions.add("AYUSH_NIDRA");
                this.provenance.put("ayushNidra", "PATIENT_REPORTED");
            }
            case "AYUSH_MALA" -> {
                this.ayushMala = cleanAnswer;
                this.addressedDimensions.add("AYUSH_MALA");
                this.provenance.put("ayushMala", "PATIENT_REPORTED");
            }
            case "AYUSH_AHARA_VIHARA" -> {
                this.ayushAharaVihara = cleanAnswer;
                this.addressedDimensions.add("AYUSH_AHARA_VIHARA");
                this.provenance.put("ayushAharaVihara", "PATIENT_REPORTED");
            }
            case "DURATION" -> {
                if (!hasDurationKnown()) {
                    this.duration = cleanAnswer;
                    this.provenance.put("duration", "PATIENT_REPORTED");
                }
            }
            case "LOCATION" -> {
                if (!hasLocationKnown()) {
                    this.location = cleanAnswer;
                    this.provenance.put("location", "PATIENT_REPORTED");
                }
            }
            case "SEVERITY" -> {
                if (!hasSeverityKnown()) {
                    this.severity = cleanAnswer;
                    this.provenance.put("severity", "PATIENT_REPORTED");
                }
            }
            case "TRIGGER" -> {
                if (!hasTriggerKnown()) {
                    this.aggravatingFactors = cleanAnswer;
                    this.provenance.put("aggravatingFactors", "PATIENT_REPORTED");
                }
            }
            case "RELIEVING" -> {
                if (!hasValue(this.relievingFactors)) {
                    this.relievingFactors = cleanAnswer;
                    this.provenance.put("relievingFactors", "PATIENT_REPORTED");
                }
            }
            case "CHARACTER" -> {
                if (!hasValue(this.character)) {
                    this.character = cleanAnswer;
                    this.provenance.put("character", "PATIENT_REPORTED");
                }
            }
            case "ASSOCIATED" -> {
                if (!hasValue(this.associatedSymptoms)) {
                    this.associatedSymptoms = cleanAnswer;
                    this.provenance.put("associatedSymptoms", "PATIENT_REPORTED");
                }
            }
            case "HISTORY_MEDS" -> {
                if (!hasValue(this.currentMedicines) && !hasValue(this.pastMedicalHistory)) {
                    this.currentMedicines = cleanAnswer;
                    this.provenance.put("currentMedicines", "PATIENT_REPORTED");
                }
                this.addressedDimensions.add("MEDICAL_HISTORY");
            }
            case "ALLERGIES" -> {
                if (!hasValue(this.allergies)) {
                    this.allergies = cleanAnswer;
                    this.provenance.put("allergies", "PATIENT_REPORTED");
                }
                this.addressedDimensions.add("MEDICAL_HISTORY");
            }
        }

        markFieldAnswered(this.lastQuestionSemanticKey);
        this.lastQuestionSemanticKey = null;
        syncAnsweredFields();
    }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
}
