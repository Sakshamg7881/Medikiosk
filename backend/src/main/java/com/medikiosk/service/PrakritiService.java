package com.medikiosk.service;

import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class PrakritiService {

    public Map<String, Object> calculatePrakriti(Map<String, ?> answers, String language) {
        int vata = 1;
        int pitta = 1;
        int kapha = 1;

        if (answers != null) {
            String agni = answers.get("agni") != null ? answers.get("agni").toString().toLowerCase(Locale.ROOT) : "";
            String nidra = answers.get("nidra") != null ? answers.get("nidra").toString().toLowerCase(Locale.ROOT) : "";
            String mala = answers.get("mala") != null ? answers.get("mala").toString().toLowerCase(Locale.ROOT) : "";
            String generalAyush = answers.get("ayushGeneral") != null ? answers.get("ayushGeneral").toString().toLowerCase(Locale.ROOT) : "";

            // Score Agni (Appetite / Digestion)
            if (matches(agni, "gas", "bloat", "irregular", "vishama", "kam", "anischit", "variable")) {
                vata += 3;
            } else if (matches(agni, "tez", "jalan", "acidity", "tikshna", "burning", "heartburn", "sharp", "intense")) {
                pitta += 3;
            } else if (matches(agni, "dheema", "manda", "slow", "heavy", "bhari", "low")) {
                kapha += 3;
            } else {
                vata += 1;
                pitta += 1;
                kapha += 1;
            }

            // Score Nidra (Sleep)
            if (matches(nidra, "halki", "light", "disturbed", "khulti", "restless", "kam", "tut-tut")) {
                vata += 3;
            } else if (matches(nidra, "normal", "moderate", "6-7", "sound", "peaceful", "aaram")) {
                pitta += 3;
            } else if (matches(nidra, "gehri", "deep", "heavy", "aalas", "8+", "der", "excessive")) {
                kapha += 3;
            } else {
                vata += 1;
                pitta += 1;
                kapha += 1;
            }

            // Score Mala & Environment / Tolerance
            String combinedMala = mala + " " + generalAyush;
            if (matches(combinedMala, "kabz", "dry", "hard", "constipat", "thand", "cold", "chilly")) {
                vata += 3;
            } else if (matches(combinedMala, "loose", "soft", "garmi", "heat", "sweat", "pasina", "burning", "frequent")) {
                pitta += 3;
            } else if (matches(combinedMala, "heavy", "sluggish", "der se", "steady", "sehan", "mucus")) {
                kapha += 3;
            } else {
                vata += 1;
                pitta += 1;
                kapha += 1;
            }
        }

        // Determine dominant tendency deterministically
        String dominantTendency;
        String dominantDosha;
        int max = Math.max(vata, Math.max(pitta, kapha));
        int min = Math.min(vata, Math.min(pitta, kapha));

        if (max - min <= 1) {
            dominantTendency = "Tridoshic (Balanced)";
            dominantDosha = "Sama";
        } else if (vata == max && (vata - Math.max(pitta, kapha) >= 2)) {
            dominantTendency = "Vata Dominant";
            dominantDosha = "Vata";
        } else if (pitta == max && (pitta - Math.max(vata, kapha) >= 2)) {
            dominantTendency = "Pitta Dominant";
            dominantDosha = "Pitta";
        } else if (kapha == max && (kapha - Math.max(vata, pitta) >= 2)) {
            dominantTendency = "Kapha Dominant";
            dominantDosha = "Kapha";
        } else if (vata == max && pitta == max) {
            dominantTendency = "Vata-Pitta Tendency";
            dominantDosha = "Vata-Pitta";
        } else if (pitta == max && kapha == max) {
            dominantTendency = "Pitta-Kapha Tendency";
            dominantDosha = "Pitta-Kapha";
        } else if (vata == max && kapha == max) {
            dominantTendency = "Vata-Kapha Tendency";
            dominantDosha = "Vata-Kapha";
        } else if (vata == max) {
            dominantTendency = (pitta > kapha) ? "Vata-Pitta Tendency" : "Vata-Kapha Tendency";
            dominantDosha = "Vata";
        } else if (pitta == max) {
            dominantTendency = (vata > kapha) ? "Pitta-Vata Tendency" : "Pitta-Kapha Tendency";
            dominantDosha = "Pitta";
        } else {
            dominantTendency = (pitta > vata) ? "Kapha-Pitta Tendency" : "Kapha-Vata Tendency";
            dominantDosha = "Kapha";
        }

        String lang = (language != null) ? language.toLowerCase(Locale.ROOT) : "en";
        String description = getPrakritiDescription(dominantDosha, lang);
        String disclaimer = getDisclaimer(lang);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("dominantTendency", dominantTendency);
        result.put("dominantDosha", dominantDosha);

        Map<String, Integer> scores = new LinkedHashMap<>();
        scores.put("vata", vata);
        scores.put("pitta", pitta);
        scores.put("kapha", kapha);
        result.put("scores", scores);

        result.put("description", description);
        result.put("disclaimer", disclaimer);

        return result;
    }

    private boolean matches(String text, String... keywords) {
        if (text == null || text.isEmpty()) return false;
        for (String kw : keywords) {
            if (text.contains(kw)) {
                return true;
            }
        }
        return false;
    }

    private String getPrakritiDescription(String dosha, String lang) {
        boolean isHi = "hi".equalsIgnoreCase(lang);
        boolean isHinglish = "hinglish".equalsIgnoreCase(lang);

        if (isHi) {
            return switch (dosha) {
                case "Vata" -> "आपके उत्तर वात प्रवृत्ति (वायु और आकाश तत्व) का संकेत देते हैं। इसमें अक्सर पाचन में उतार-चढ़ाव, हल्की नींद और ठंड के प्रति संवेदनशीलता देखी जाती है। नियमित दिनचर्या और गर्म, सुपाच्य आहार लाभकारी होता है।";
                case "Pitta" -> "आपके उत्तर पित्त प्रवृत्ति (अग्नि और जल तत्व) का संकेत देते हैं। इसमें तेज पाचन, गर्मी के प्रति संवेदनशीलता और ऊर्जावान स्वभाव देखा जाता है। शीतल आहार और पर्याप्त पानी पीना लाभकारी रहता है।";
                case "Kapha" -> "आपके उत्तर कफ प्रवृत्ति (पृथ्वी और जल तत्व) का संकेत देते हैं। इसमें स्थिर सहनशक्ति, गहरी नींद और धीमा पाचन देखा जाता है। हल्का, सुपाच्य भोजन और नियमित शारीरिक गतिविधि लाभकारी रहती है।";
                default -> "आपके उत्तर मिले-जुले दोषों का संतुलन दर्शाते हैं। आपके परामर्श के दौरान आयुष डॉक्टर नाड़ी परीक्षा द्वारा इसका सटीक मूल्यांकन करेंगे।";
            };
        } else if (isHinglish) {
            return switch (dosha) {
                case "Vata" -> "Aapke answers Vata tendency (Air & Space elements) darshate hain. Isme aamtaur par pachan me utar-chadhav, halki neend aur thand lagna dekha jata hai. Regular routine aur gunguna, poshtik aahar labhdayak hota hai.";
                case "Pitta" -> "Aapke answers Pitta tendency (Fire & Water elements) darshate hain. Isme tez pachan, garmi jaldi lagna aur acidity ki sambhavna rehti hai. Thanda aahar aur khoob paani peena labhdayak hota hai.";
                case "Kapha" -> "Aapke answers Kapha tendency (Earth & Water elements) darshate hain. Isme sthir stamina, gehri neend aur dheema pachan dekha jata hai. Halka bhojan aur regular active rehna faydemand hota hai.";
                default -> "Aapke answers mixed dosha tendency darshate hain. Doctor consultation me nadi pariksha se iski pushti karenge.";
            };
        } else {
            return switch (dosha) {
                case "Vata" -> "Your responses indicate a Vata tendency (governed by Air & Space elements). Characteristics include variable digestion, lighter sleep patterns, and sensitivity to cold. Emphasize warm nourishment, regular hydration, and structured daily routines.";
                case "Pitta" -> "Your responses indicate a Pitta tendency (governed by Fire & Water elements). Characteristics include robust digestion, sensitivity to heat, and focused energy. Favor cooling nourishment and adequate hydration.";
                case "Kapha" -> "Your responses indicate a Kapha tendency (governed by Earth & Water elements). Characteristics include strong endurance, deep sleep, and deliberate metabolism. Favor warm, light meals and regular physical activity.";
                default -> "Your responses indicate a balanced dual-dosha presentation. Your consulting doctor will corroborate this with your clinical pulse and history.";
            };
        }
    }

    private String getDisclaimer(String lang) {
        if ("hi".equalsIgnoreCase(lang)) {
            return "यह आपकी जीवनशैली और दिनचर्या पर आधारित एक प्रारंभिक स्वास्थ्य संकेतक है, कोई चिकित्सीय निदान नहीं। आपके परामर्श के दौरान आयुष डॉक्टर नाड़ी परीक्षा द्वारा सही प्रकृति और उपचार तय करेंगे।";
        } else if ("hinglish".equalsIgnoreCase(lang)) {
            return "Yeh aapki daily routine par aadharit ek shuruati health indicator hai, koi medical diagnosis nahi. Aapke AYUSH doctor consultation ke dauran sahi prakriti aur upchar tay karenge.";
        } else {
            return "This is a preliminary wellness indicator based on intake history, NOT a clinical diagnosis. Your AYUSH physician will determine your constitutional Prakriti during consultation.";
        }
    }
}
