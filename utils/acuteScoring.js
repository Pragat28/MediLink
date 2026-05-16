function calculateAcuteScores(symptoms, conditionDatabase) {
  const scores = {};

  for (const condition of conditionDatabase) {
    let score = 0;

    for (const symptom of symptoms) {
      if (condition.symptoms.includes(symptom)) {
        score += 2; // or your severity logic
      }
    }

    if (score > 0) {
      scores[condition.name] = score;
    }
  }

  return scores;
}

module.exports = calculateAcuteScores;