// Initial schools mock data
export const INITIAL_SCHOOLS = [
  {
    id: "sch-1",
    name: "Government High School, Sector 4",
    district: "North District",
    latitude: 12.9716,
    longitude: 77.5946,
    studentStrength: 420,
    drumCapacity: 40, // kg
    contact: "+91 98765 43210",
    address: "Sector 4, Near Public Park, Bengaluru"
  },
  {
    id: "sch-2",
    name: "Vidya Mandir School",
    district: "North District",
    latitude: 12.9760,
    longitude: 77.5990,
    studentStrength: 450, // Within ±20% of 420 (Range: 336 to 504)
    drumCapacity: 45, // kg
    contact: "+91 98765 43211",
    address: "M.G. Road, Bengaluru"
  },
  {
    id: "sch-3",
    name: "St. Mary's School",
    district: "North District",
    latitude: 12.9680,
    longitude: 77.5910,
    studentStrength: 500, // Within ±20% of 420
    drumCapacity: 50, // kg
    contact: "+91 98765 43212",
    address: "Richmond Town, Bengaluru"
  },
  {
    id: "sch-4",
    name: "National Primary School",
    district: "North District",
    latitude: 12.9820,
    longitude: 77.6030,
    studentStrength: 200, // OUTSIDE ±20% of 420 (Too small)
    drumCapacity: 20, // kg
    contact: "+91 98765 43213",
    address: "Malleshwaram, Bengaluru"
  },
  {
    id: "sch-5",
    name: "Central Public School",
    district: "North District",
    latitude: 12.9560,
    longitude: 77.5820,
    studentStrength: 1100, // OUTSIDE ±20% of 420 (Too large)
    drumCapacity: 100, // kg
    contact: "+91 98765 43214",
    address: "Jayanagar, Bengaluru"
  }
];

/**
 * Checks if two schools are comparable based on student strength (within ±20%).
 * @param {number} strength1
 * @param {number} strength2
 * @returns {boolean}
 */
export function areSchoolsComparable(strength1, strength2) {
  const min = strength1 * 0.8;
  const max = strength1 * 1.2;
  return strength2 >= min && strength2 <= max;
}

/**
 * Filters the list of schools to find only those comparable to the target school.
 * @param {Object} targetSchool 
 * @param {Array} allSchools 
 * @returns {Array} Comparable schools list
 */
export function getComparableSchools(targetSchool, allSchools) {
  if (!targetSchool) return [];
  return allSchools.filter(school => 
    school.id !== targetSchool.id && 
    areSchoolsComparable(targetSchool.studentStrength, school.studentStrength)
  );
}
