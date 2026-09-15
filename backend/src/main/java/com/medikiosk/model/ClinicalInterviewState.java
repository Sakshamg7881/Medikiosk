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

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
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
    private List<String> redFlags = new ArrayList<>();
    private Map<String, String> provenance = new LinkedHashMap<>();

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
            this.chiefComplaint = cleanVal(facts.get("chiefComplaint"));
            this.provenance.put("chiefComplaint", "PATIENT_REPORTED");
        }
        if (hasValue(facts.get("duration"))) {
            this.duration = cleanVal(facts.get("duration"));
            this.provenance.put("duration", "PATIENT_REPORTED");
        }
        if (hasValue(facts.get("location"))) {
            this.location = cleanVal(facts.get("location"));
            this.provenance.put("location", "PATIENT_REPORTED");
        }
        if (hasValue(facts.get("character"))) {
            this.character = cleanVal(facts.get("character"));
            this.provenance.put("character", "PATIENT_REPORTED");
        }
        if (hasValue(facts.get("severity"))) {
            this.severity = cleanVal(facts.get("severity"));
            this.provenance.put("severity", "PATIENT_REPORTED");
        }
        if (hasValue(facts.get("timing"))) {
            this.timing = cleanVal(facts.get("timing"));
            this.provenance.put("timing", "PATIENT_REPORTED");
        }
        if (hasValue(facts.get("aggravatingFactors"))) {
            this.aggravatingFactors = cleanVal(facts.get("aggravatingFactors"));
            this.provenance.put("aggravatingFactors", "PATIENT_REPORTED");
        }
        if (hasValue(facts.get("relievingFactors"))) {
            this.relievingFactors = cleanVal(facts.get("relievingFactors"));
            this.provenance.put("relievingFactors", "PATIENT_REPORTED");
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
        if (hasValue(facts.get("ayushAgni"))) {
            this.ayushAgni = cleanVal(facts.get("ayushAgni"));
            this.provenance.put("ayushAgni", "PATIENT_REPORTED");
        }
        if (hasValue(facts.get("ayushNidra"))) {
            this.ayushNidra = cleanVal(facts.get("ayushNidra"));
            this.provenance.put("ayushNidra", "PATIENT_REPORTED");
        }
        if (hasValue(facts.get("ayushMala"))) {
            this.ayushMala = cleanVal(facts.get("ayushMala"));
            this.provenance.put("ayushMala", "PATIENT_REPORTED");
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
        if (hasValue(ayushAgni)) sb.append("- AYUSH Digestion/Agni: ").append(ayushAgni).append("\n");
        if (hasValue(ayushNidra)) sb.append("- AYUSH Sleep/Nidra: ").append(ayushNidra).append("\n");
        if (hasValue(ayushMala)) sb.append("- AYUSH Elimination/Bowel: ").append(ayushMala).append("\n");

        return sb.length() > 0 ? sb.toString() : "- None recorded yet.\n";
    }

    /**
     * Determine if sufficient information exists to create a meaningful pre-consultation case.
     * Sufficiency is complaint-specific:
     * We do NOT require every schema field.
     */
    public boolean isClinicallySufficient(int userTurnCount) {
        boolean hasComplaint = hasValue(chiefComplaint) || !symptoms.isEmpty();
        boolean hasTimeline = hasDurationKnown();
        boolean hasKeyCharacter = hasSeverityKnown() || hasValue(character) || hasTriggerKnown() || hasLocationKnown();

        // If turn count reached 6 or more turns with at least some clinical facts, conclude
        if (userTurnCount >= 6 && (hasComplaint || hasTimeline || hasKeyCharacter)) {
            return true;
        }

        // Need at least chief complaint and duration/timeline
        if (!hasComplaint && userTurnCount < 5) return false;

        // If patient answered 4 or more turns and has timeline + key character, it is sufficient
        if (userTurnCount >= 4 && (hasTimeline || hasKeyCharacter)) {
            return true;
        }

        // If turn count reached 7 turns, conclude
        return userTurnCount >= 7;
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

    public List<String> getRedFlags() { return redFlags; }
    public void setRedFlags(List<String> redFlags) { this.redFlags = redFlags; }

    public Map<String, String> getProvenance() { return provenance; }
    public void setProvenance(Map<String, String> provenance) { this.provenance = provenance; }
}
