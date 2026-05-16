const Patient = require("../models/patientModel");
const Illness = require("../models/illnessModel");

const symptomMap = require("../data/symptom_category_map.json");
const doctorMap = require("../data/condition_doctor_map.json");

const symptomSeverityMap = require("../data/symptom_severity_map.json");
const conditionSeverityMap = require("../data/condition_severity_map.json");

/* -----------------------
   EMERGENCY RULES
------------------------*/

const EMERGENCY_SYMPTOMS = [
  "chest pain",
  "shortness of breath",
  "fainting",
  "loss of consciousness",
  "seizure",
  "sudden weakness",
  "confusion"
];

const EMERGENCY_CONDITIONS = [
  "cardiac issue",
  "stroke risk",
  "neurological issue"
];

/* -----------------------
   BOOST MAPS
------------------------*/

const chronicMap = {
  hypertension: ["cardiac issue", "stroke risk"],
  diabetes: ["hormonal issue", "kidney issue"],
  asthma: ["respiratory issue"],
  heart_disease: ["cardiac issue"],
  epilepsy: ["neurological issue"],
  pregnancy: ["pregnancy_related"]
};

const allergyMap = {
  dust: ["respiratory issue"],
  pollen: ["allergy"],
  food: ["digestive issue"]
};

/* -----------------------
   UTILITIES
------------------------*/

const getConditionMeta = (condition) =>
  conditionSeverityMap[condition] ?? {
    severity: "medium",
    historyDecay: "medium",
    critical: false
  };

const daysAgo = (date) =>
  (Date.now() - new Date(date)) / (1000 * 60 * 60 * 24);

const getDecayWeight = (days, decayType) => {
  if (decayType === "fast") {
    if (days <= 7) return 1;
    if (days <= 14) return 0.5;
    return 0;
  }
  if (decayType === "medium") {
    if (days <= 30) return 0.6;
    if (days <= 60) return 0.3;
    return 0;
  }
  if (decayType === "never") {
    if (days <= 30) return 1;
    if (days <= 90) return 0.6;
    return 0.3;
  }
  return 0;
};

/* ======================================================
   🔵 ACUTE SCORING ENGINE (Current Symptoms Only)
====================================================== */

function calculateAcuteScores(symptoms) {
  let scores = {};
  let explanation = {};

  const addReason = (cond, msg) => {
    if (!explanation[cond]) explanation[cond] = [];
    explanation[cond].push(msg);
  };

  symptoms.forEach(sym => {
    const severity = symptomSeverityMap[sym] ?? 1.0;
    const categories = symptomMap[sym] || [];

    categories.forEach(cat => {
      scores[cat] = (scores[cat] || 0) + severity;
      addReason(cat, `${sym} (severity ${severity})`);
    });
  });

  return {
    rawScores: scores,
    sorted: Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([condition, score]) => ({
        condition,
        score: Number(score.toFixed(2))
      })),
    explanation
  };
}

/* ======================================================
   🟡 HISTORY RISK ENGINE (Past + Chronic + Allergy)
====================================================== */

function calculateHistoryScores(history, chronic, allergies) {
  let scores = {};
  let explanation = {};

  const addReason = (cond, msg) => {
    if (!explanation[cond]) explanation[cond] = [];
    explanation[cond].push(msg);
  };

  /* 1️⃣ Past illness with decay */
  history.forEach(ill => {
    const d = daysAgo(ill.createdAt);

    ill.matchedConditions.forEach(cat => {
      const meta = getConditionMeta(cat);
      const decay = getDecayWeight(d, meta.historyDecay);

      if (decay > 0) {
        scores[cat] = (scores[cat] || 0) + decay;
        addReason(cat, `past illness ${Math.round(d)} days ago`);
      }
    });
  });

  /* 2️⃣ Chronic boost */
  chronic.forEach(cd => {
    (chronicMap[cd] || []).forEach(cat => {
      scores[cat] = (scores[cat] || 0) + 1;
      addReason(cat, `chronic condition: ${cd}`);
    });
  });

  /* 3️⃣ Allergy boost */
  allergies.forEach(a => {
    (allergyMap[a] || []).forEach(cat => {
      scores[cat] = (scores[cat] || 0) + 0.5;
      addReason(cat, `allergy: ${a}`);
    });
  });

  return {
    rawScores: scores,
    sorted: Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .map(([condition, score]) => ({
        condition,
        score: Number(score.toFixed(2))
      })),
    explanation
  };
}

/* ======================================================
   🚀 PREDICT API
====================================================== */

exports.predict = async (req, res) => {
  try {
    const { symptoms } = req.body;
    const patientId = req.user.id;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const history = await Illness.find({ patientId });

    /* 🔵 Acute Engine */
    const acute = calculateAcuteScores(symptoms);

    /* 🟡 History Engine */
    const historyEngine = calculateHistoryScores(
      history,
      patient.chronicDiseases || [],
      patient.allergies || []
    );

    /* 🚨 Emergency (ONLY acute-based) */
    const emergencyBySymptom = symptoms.some(s =>
      EMERGENCY_SYMPTOMS.includes(s)
    );

    const emergencyByCondition = EMERGENCY_CONDITIONS.some(c =>
      (acute.rawScores[c] || 0) >= 6
    );

    if (emergencyBySymptom || emergencyByCondition) {
      return res.json({
        emergency: true,
        message: "Symptoms may require urgent medical attention",
        currentAnalysis: {
          topConditions: acute.sorted.slice(0, 2)
        }
      });
    }

    /* 🎯 Confidence (acute only) */
    const top = acute.sorted[0];
    const second = acute.sorted[1];
    const gap = second ? top.score - second.score : top?.score || 0;

    let confidence = "high";
    if (gap < 0.7) confidence = "low";
    else if (gap < 1.5) confidence = "medium";

    /* 👨‍⚕️ Specialty (acute only) */
    let specialties = acute.sorted.slice(0, 3).map(p => ({
      specialty: doctorMap[p.condition] || "General Physician"
    }));

    /* 💾 Save illness (acute only) */
    const newIllness = await Illness.create({
      patientId,
      symptoms,
      matchedConditions: acute.sorted.slice(0, 3).map(p => p.condition),
      recommendedSpecialty: specialties[0]?.specialty
    });

    /* 📤 Structured Response */
    res.json({
      emergency: false,

      currentAnalysis: {
        confidence,
        message: "Based on your current symptoms:",
        topConditions: acute.sorted.slice(0, 3),
        recommendedSpecialties: specialties,
        explanation: acute.explanation
      },

      historyInsights: {
        message:
          "Based on your past medical history, you may be more prone to:",
        riskConditions: historyEngine.sorted.slice(0, 3),
        explanation: historyEngine.explanation
      },

      illnessRecordId: newIllness._id
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* -----------------------
   HISTORY API
------------------------*/

exports.getHistory = async (req, res) => {
  try {
    const history = await Illness.find({ patientId: req.user.id })
      .sort({ createdAt: -1 });

    res.json({ count: history.length, history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};