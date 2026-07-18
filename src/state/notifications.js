export const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-1",
    role: "school",
    targetId: "sch-1", // GHS Gandhipuram
    title: "Collector Arriving",
    message: "Ravi Kumar has marked the pickup in transit.",
    type: "info",
    timestamp: new Date().toISOString(), // Today
    read: false
  },
  {
    id: "notif-2",
    role: "collector",
    targetId: "col-1", // Ravi Kumar
    title: "Reservation Expiring",
    message: "Your reservation for Vidya Mandir School expires in 5 minutes.",
    type: "warning",
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // Today
    read: false
  },
  {
    id: "notif-3",
    role: "school",
    targetId: "sch-2", // Vidya Mandir School
    title: "Pickup Reserved",
    message: "Suresh Bio-Composts reserved your waste posting.",
    type: "success",
    timestamp: new Date(Date.now() - 26 * 3600 * 1000).toISOString(), // Yesterday
    read: true
  },
  {
    id: "notif-4",
    role: "collector",
    targetId: "col-1", // Ravi Kumar
    title: "New Nearby Waste Available",
    message: "St. Mary's School uploaded 25kg of organic waste within your operating radius.",
    type: "info",
    timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(), // This week
    read: true
  }
];

/**
 * Groups notification items chronologically into Today, Yesterday, and This Week.
 * @param {Array} notifications 
 * @returns {Object} { today: Array, yesterday: Array, thisWeek: Array }
 */
export function groupNotifications(notifications) {
  const today = [];
  const yesterday = [];
  const thisWeek = [];
  
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 3600 * 1000;
  const startOfThisWeek = startOfToday - 7 * 24 * 3600 * 1000;
  
  notifications.forEach(notif => {
    const time = new Date(notif.timestamp).getTime();
    if (time >= startOfToday) {
      today.push(notif);
    } else if (time >= startOfYesterday) {
      yesterday.push(notif);
    } else if (time >= startOfThisWeek) {
      thisWeek.push(notif);
    }
  });
  
  return { today, yesterday, thisWeek };
}
