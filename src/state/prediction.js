/**
 * Predicts the recommended servings to cook for the day.
 * Formula:
 * Servings = Attendance * MenuFactor * DayFactor * WasteCorrectionFactor
 */
export function predictServings(attendance, menuName, dayOfWeek, last4WeeksAvgWasteKg) {
  // Baseline portion size is 1.0 (standard serving)
  let menuFactor = 1.0;
  
  // Some menus are more preferred or yield higher consumption
  const menu = (menuName || "").toLowerCase();
  if (menu.includes("rice") || menu.includes("biryani")) {
    menuFactor = 1.02; // Popular, higher consumption
  } else if (menu.includes("roti") || menu.includes("chapati")) {
    menuFactor = 0.95; // Higher preparation waste or leftovers
  } else if (menu.includes("upma") || menu.includes("khichdi")) {
    menuFactor = 0.90; // Often less popular, cook slightly less
  }

  // Day factor (Friday might have lower attendance, Monday might be peak)
  let dayFactor = 1.0;
  const day = (dayOfWeek || "").toLowerCase();
  if (day === "friday") {
    dayFactor = 0.92; // Weekend drag
  } else if (day === "monday") {
    dayFactor = 1.05; // Peak start-of-week attendance
  }

  // Waste Correction Factor:
  // If average waste is high, we scale down the multiplier to suggest less cooking.
  // Standard waste is around 5-10kg for a 400 student school.
  // If it exceeds 15kg, we must scale down portions to prevent overflow.
  let wasteCorrection = 1.0;
  if (last4WeeksAvgWasteKg > 25) {
    wasteCorrection = 0.85; // Heavy reduction needed
  } else if (last4WeeksAvgWasteKg > 15) {
    wasteCorrection = 0.92; // Moderate reduction
  } else if (last4WeeksAvgWasteKg > 5) {
    wasteCorrection = 0.97; // Minor adjustment
  } else {
    wasteCorrection = 1.03; // Excellent waste management, can cook closer to full capacity
  }

  const predictedServings = Math.round(attendance * menuFactor * dayFactor * wasteCorrection);
  
  // Calculations for expected waste & suggested reduction amount
  const expectedWastePercentage = last4WeeksAvgWasteKg > 15 ? 0.15 : 0.08;
  const expectedWasteKg = parseFloat((predictedServings * 0.15 * expectedWastePercentage).toFixed(1));
  const suggestedReductionKg = parseFloat((attendance * 0.15 * (1 - wasteCorrection)).toFixed(1));

  return {
    recommendedServings: Math.max(predictedServings, 10), // minimum 10 servings
    expectedWasteKg: Math.max(expectedWasteKg, 0.5),
    suggestedReductionKg: Math.max(suggestedReductionKg, 0.0)
  };
}
