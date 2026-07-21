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

  // Waste Correction Factor
  let wasteCorrection = 1.0;
  if (last4WeeksAvgWasteKg > 25) {
    wasteCorrection = 0.85;
  } else if (last4WeeksAvgWasteKg > 15) {
    wasteCorrection = 0.92;
  } else if (last4WeeksAvgWasteKg > 5) {
    wasteCorrection = 0.97;
  } else {
    wasteCorrection = 1.03;
  }

  const baseDemand = Math.round(attendance * menuFactor * dayFactor * wasteCorrection);
  // +7% "No Child Hungry" Safety Buffer Margin
  const safetyBufferServings = Math.max(1, Math.round(baseDemand * 0.07));
  const recommendedServings = Math.max(baseDemand + safetyBufferServings, 10);
  
  const expectedWasteKg = parseFloat((recommendedServings * 0.15 * 0.05).toFixed(1));
  const suggestedReductionKg = parseFloat((attendance * 0.15 * 0.12 + 1.2).toFixed(1));

  return {
    baseDemand,
    safetyBufferServings,
    safetyBufferPercent: 7,
    recommendedServings,
    expectedWasteKg: Math.max(expectedWasteKg, 0.5),
    suggestedReductionKg: Math.max(suggestedReductionKg, 0.8)
  };
}
