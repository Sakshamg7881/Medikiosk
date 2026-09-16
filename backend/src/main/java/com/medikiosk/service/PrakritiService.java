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
            String aharaVihara = answers.get("aharaVihara") != null ? answers.get("aharaVihara").toString().toLowerCase(Locale.ROOT) : "";
            if (aharaVihara.isBlank() && answers.get("ayushGeneral") != null) {
                aharaVihara = answers.get("ayushGeneral").toString().toLowerCase(Locale.ROOT);
            }

            // 1. Score Agni (Appetite / Digestion)
            if (isReported(agni)) {
                if (matches(agni, "gas", "bloat", "irregular", "vishama", "variable", "kam bhookh", "bhookh kam", "utar-chadhav", "उतार-चढ़ाव", "गैस")) {
                    vata += 3;
                } else if (matches(agni, "tez", "jalan", "acidity", "tikshna", "burning", "heartburn", "sharp", "intense", "acid", "sour", "तेज भूख", "एसिडिटी")) {
                    pitta += 3;
                } else if (matches(agni, "dheema", "manda", "slow", "heavy", "bhari", "low", "sluggish", "heaviness", "धीमा", "भारीपन", "भारी लगना")) {
                    kapha += 3;
                } else if (matches(agni, "normal", "balanced", "santulit", "samanya", "theek", "theek rehta", "regular", "संतुलित", "सामान्य")) {
                    vata += 1;
                    pitta += 1;
                    kapha += 1;
                }
            }

            // 2. Score Nidra (Sleep)
            if (isReported(nidra)) {
                if (matches(nidra, "halki", "light", "disturbed", "khulti", "restless", "kam", "tut-tut", "toot ti", "insomnia", "trouble", "less sleep", "waking up", "कम नींद", "टूटती", "हल्की")) {
                    vata += 3;
                } else if (matches(nidra, "sound", "peaceful", "moderate", "6-7", "6 to 7", "alert", "refreshed", "aaram", "sound & restful", "achhi", "शांत नींद", "अच्छी")) {
                    pitta += 3;
                } else if (matches(nidra, "gehri", "deep", "heavy", "aalas", "8+", "der", "excessive", "oversleeping", "गहरी", "भारी नींद", "आलस्य")) {
                    kapha += 3;
                } else if (matches(nidra, "normal", "balanced", "samanya", "theek", "regular", "सामान्य")) {
                    vata += 1;
                    pitta += 1;
                    kapha += 1;
                }
            }

            // 3. Score Mala (Elimination / Bowel)
            if (isReported(mala)) {
                if (matches(mala, "kabz", "dry", "hard", "constipat", "constipation", "irregular", "straining", "gas", "thand", "cold", "chilly", "कब्ज", "अनियमित")) {
                    vata += 3;
                } else if (matches(mala, "loose", "soft", "garmi", "heat", "sweat", "pasina", "burning", "frequent", "dast", "bar-bar", "urgency", "loose motion", "दस्त", "बार-बार")) {
                    pitta += 3;
                } else if (matches(mala, "heavy", "sluggish", "der se", "steady", "sehan", "mucus", "chipchip", "sticky", "heaviness", "धीमा", "भारी")) {
                    kapha += 3;
                } else if (matches(mala, "regular & clear", "regular", "clear", "saaf", "clean", "theek", "नियमित", "साफ")) {
                    vata += 1;
                    pitta += 1;
                    kapha += 1;
                }
            }

            // 4. Score Ahara & Vihara (Diet, Routine & Lifestyle)
            if (isReported(aharaVihara)) {
                if (matches(aharaVihara, "irregular meals", "irregular routine", "erratic", "fast", "travel", "dry food", "cold food", "skip meals", "अनियमित", "भागदौड़")) {
                    vata += 3;
                } else if (matches(aharaVihara, "spicy", "oily", "masaledar", "fried", "hot food", "competitive", "sour", "worse after spicy", "तला-भुना", "मसालेदार", "तीखा")) {
                    pitta += 3;
                } else if (matches(aharaVihara, "sedentary", "desk job", "sitting", "sweet", "heavy meals", "low activity", "inactive", "lazy", "daytime sleep", "बैठकर काम", "गतिहीन")) {
                    kapha += 3;
                } else if (matches(aharaVihara, "balanced & active", "balanced food & active", "active", "simple home meals", "simple home food", "exercise", "walk", "सक्रिय", "संतुलित भोजन", "सादा")) {
                    vata += 1;
                    pitta += 1;
                    kapha += 1;
                }
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

    private boolean isReported(String val) {
        if (val == null || val.isBlank()) return false;
        String lower = val.toLowerCase(Locale.ROOT).trim();
        return !lower.equals("null") && !lower.contains("not reported") && !lower.contains("unrecorded") && !lower.contains("unspecified");
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
