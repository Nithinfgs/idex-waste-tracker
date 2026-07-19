export const INITIAL_COLLECTORS = [
  {
    id: "col-1",
    name: "Ravi Kumar",
    phone: "+91 98765 43220",
    collectorType: "Farmer",
    vehicle: "Tractor",
    radius: 10, // km
    latitude: 11.0210,
    longitude: 76.9600,
    totalPickups: 34,
    rating: 4.8,
    entryCode: "1",
    password: "12345"
  },
  {
    id: "col-2",
    name: "Suresh Bio-Composts",
    phone: "+91 98765 43221",
    collectorType: "Compost Company",
    vehicle: "Light Truck",
    radius: 15, // km
    latitude: 10.9980,
    longitude: 76.9500,
    totalPickups: 112,
    rating: 4.9,
    entryCode: "2",
    password: "12345"
  },
  {
    id: "col-3",
    name: "Lakshmi Organic Feed",
    phone: "+91 98765 43222",
    collectorType: "Organic Buyer",
    vehicle: "Three-Wheeler Auto",
    radius: 5, // km
    latitude: 11.0280,
    longitude: 76.9700,
    totalPickups: 8,
    rating: 4.5,
    entryCode: "3",
    password: "12345"
  }
];

/**
 * Filter waste posts by search query (School Name) and distance/weight filters.
 */
export function filterWastePosts(posts, { searchName, minWeight, maxDistance }, collectorLat, collectorLon, schools) {
  return posts.filter(post => {
    // 1. Status Filter - Only Available (or Reserved/InTransit by the current collector, but that's handled elsewhere)
    if (post.status !== "Available") return false;

    // 2. School Name search
    if (searchName && searchName.trim() !== "") {
      const schoolName = post.schoolName.toLowerCase();
      if (!schoolName.includes(searchName.toLowerCase())) return false;
    }

    // 3. Minimum Weight
    if (minWeight && post.estimatedWeight < minWeight) return false;

    // 4. Maximum Distance
    if (maxDistance && collectorLat && collectorLon) {
      const school = schools.find(s => s.id === post.schoolId);
      if (school) {
        const dist = parseFloat((Math.sqrt((school.latitude - collectorLat) ** 2 + (school.longitude - collectorLon) ** 2) * 111.32).toFixed(2));
        if (dist > maxDistance) return false;
      }
    }

    return true;
  });
}
