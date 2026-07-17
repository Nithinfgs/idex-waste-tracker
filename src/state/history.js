export const INITIAL_HISTORY = [
  {
    id: "hist-1",
    schoolId: "sch-1",
    schoolName: "Government High School, Sector 4",
    collectorId: "col-1",
    collectorName: "Ravi Kumar",
    collectorType: "Farmer",
    estimatedWeight: 28.0,
    reason: "Low Attendance",
    status: "Collected",
    date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), // 3 days ago
    activityLog: [
      { timestamp: new Date(Date.now() - (3 * 24 * 3600 * 1000 + 4 * 3600 * 1000)).toISOString(), message: "Waste uploaded by School" },
      { timestamp: new Date(Date.now() - (3 * 24 * 3600 * 1000 + 3.5 * 3600 * 1000)).toISOString(), message: "Reserved by Ravi Kumar" },
      { timestamp: new Date(Date.now() - (3 * 24 * 3600 * 1000 + 1 * 3600 * 1000)).toISOString(), message: "In Transit: Collector on the way" },
      { timestamp: new Date(Date.now() - (3 * 24 * 3600 * 1000 + 15 * 60 * 1000)).toISOString(), message: "Pickup Completed: Awaiting school confirmation" },
      { timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), message: "Collection Confirmed by School" }
    ]
  },
  {
    id: "hist-2",
    schoolId: "sch-2",
    schoolName: "Vidya Mandir School",
    collectorId: "col-2",
    collectorName: "Suresh Bio-Composts",
    collectorType: "Compost Company",
    estimatedWeight: 36.5,
    reason: "Overcooked",
    status: "Collected",
    date: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(), // 8 days ago
    activityLog: [
      { timestamp: new Date(Date.now() - (8 * 24 * 3600 * 1000 + 2 * 3600 * 1000)).toISOString(), message: "Waste uploaded by School" },
      { timestamp: new Date(Date.now() - (8 * 24 * 3600 * 1000 + 1.8 * 3600 * 1000)).toISOString(), message: "Reserved by Suresh Bio-Composts" },
      { timestamp: new Date(Date.now() - (8 * 24 * 3600 * 1000 + 10 * 60 * 1000)).toISOString(), message: "Collection Confirmed by School" }
    ]
  }
];

/**
 * Creates a formatted log entry for the active history of a post.
 * @param {string} status 
 * @param {string} actorName 
 * @param {string} [extraInfo] 
 * @returns {Object} { timestamp: string, message: string }
 */
export function createActivityLogEntry(status, actorName, extraInfo = "") {
  let message = "";
  switch (status) {
    case "Available":
      message = `Waste posted by School. ${extraInfo}`;
      break;
    case "Reserved":
      message = `Pickup reserved by ${actorName}.`;
      break;
    case "In Transit":
      message = `Collector (${actorName}) is on the way (In Transit).`;
      break;
    case "Awaiting School Confirmation":
      message = `Collector (${actorName}) completed the pickup. Awaiting confirmation.`;
      break;
    case "Collected":
      message = `Collection confirmed by School. Moved to History.`;
      break;
    default:
      message = `Status updated to ${status} by ${actorName}.`;
  }
  
  return {
    timestamp: new Date().toISOString(),
    message
  };
}
