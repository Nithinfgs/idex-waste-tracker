/**
 * Waste Statuses:
 * 'Available' | 'Reserved' | 'In Transit' | 'Awaiting School Confirmation' | 'Collected'
 */

export const INITIAL_WASTE_POSTS = [
  {
    id: "post-1",
    schoolId: "sch-2", // Vidya Mandir School
    schoolName: "Vidya Mandir School",
    drumLevel: 0.75, // 75%
    estimatedWeight: 33.75, // 45kg * 75%
    reason: "Low Attendance",
    status: "Available",
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // 4 hours ago
    collectorId: null,
    reservedAt: null,
    history: [
      { status: "Available", timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString() }
    ]
  },
  {
    id: "post-2",
    schoolId: "sch-3", // St. Mary's School
    schoolName: "St. Mary's School",
    drumLevel: 0.50, // 50%
    estimatedWeight: 25.0, // 50kg * 50%
    reason: "Students disliked menu",
    status: "Available",
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(), // 1 hour ago
    collectorId: null,
    reservedAt: null,
    history: [
      { status: "Available", timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString() }
    ]
  }
];

/**
 * Calculates estimated weight based on drum capacity and selected level.
 * @param {number} capacity in kg
 * @param {number} level fraction (e.g., 0.75)
 * @returns {number}
 */
export function calculateWeight(capacity, level) {
  return parseFloat((capacity * level).toFixed(2));
}

/**
 * Calculates straight line distance in km between two coordinate pairs.
 */
export function getDistance(lat1, lon1, lat2, lon2) {
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  // Approximation for local metropolitan scale (1 deg ≈ 111.32 km)
  return parseFloat((Math.sqrt(dLat * dLat + dLon * dLon) * 111.32).toFixed(2));
}

/**
 * Sorts waste posts by distance, then weight, then date.
 * Default sorting priorities:
 * 1. Closest
 * 2. Highest Weight
 * 3. Latest Posted
 */
export function sortWastePosts(posts, collectorLat, collectorLon, schools) {
  return [...posts].sort((a, b) => {
    const schoolA = schools.find(s => s.id === a.schoolId);
    const schoolB = schools.find(s => s.id === b.schoolId);
    
    const distA = schoolA ? getDistance(collectorLat, collectorLon, schoolA.latitude, schoolA.longitude) : Infinity;
    const distB = schoolB ? getDistance(collectorLat, collectorLon, schoolB.latitude, schoolB.longitude) : Infinity;
    
    // 1. Distance comparison
    if (Math.abs(distA - distB) > 0.1) {
      return distA - distB;
    }
    
    // 2. Weight comparison (higher is first)
    if (Math.abs(a.estimatedWeight - b.estimatedWeight) > 0.5) {
      return b.estimatedWeight - a.estimatedWeight;
    }
    
    // 3. Date comparison (latest is first)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

/**
 * Checks all active reservations and resets any that have expired (> 30 minutes).
 * @param {Array} posts 
 * @returns {{updatedPosts: Array, revertedCount: number}}
 */
export function checkReservationsTimeout(posts) {
  const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  let revertedCount = 0;
  
  const updatedPosts = posts.map(post => {
    if (post.status === "Reserved" && post.reservedAt) {
      const timeElapsed = Date.now() - new Date(post.reservedAt).getTime();
      if (timeElapsed > TIMEOUT_MS) {
        revertedCount++;
        return {
          ...post,
          status: "Available",
          collectorId: null,
          reservedAt: null,
          history: [
            ...post.history,
            { status: "Available", timestamp: new Date().toISOString(), note: "Reservation expired (30m timeout)" }
          ]
        };
      }
    }
    return post;
  });
  
  return { updatedPosts, revertedCount };
}
