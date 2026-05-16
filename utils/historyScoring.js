function calculateHistoryScores(patient, conditionDatabase) {
  const scores = {};

  const { medicalHistory = [], chronicDiseases = [], allergies = [] } = patient;

  for (const condition of conditionDatabase) {
    let score = 0;

    // Past conditions influence
    if (medicalHistory.includes(condition.name)) {
      score += 3;
    }

    // Chronic boost
    if (chronicDiseases.includes(condition.name)) {
      score += 4;
    }

    // Allergy link example
    if (
      allergies.some((a) =>
        condition.symptoms.some((s) => s.toLowerCase().includes(a.toLowerCase()))
      )
    ) {
      score += 2;
    }

    if (score > 0) {
      scores[condition.name] = score;
    }
  }

  return scores;
}

module.exports = calculateHistoryScores;