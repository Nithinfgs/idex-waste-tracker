// Initial schools mock data
export const INITIAL_SCHOOLS = [
  {
    id: "sch-1",
    name: "Government High School, Gandhipuram",
    district: "Coimbatore District",
    latitude: 11.0180,
    longitude: 76.9680,
    studentStrength: 420,
    drumCapacity: 40, // kg
    contact: "+91 98765 43210",
    address: "Cross Cut Road, Gandhipuram, Coimbatore",
    entryCode: "1",
    password: "12345"
  },
  {
    id: "sch-2",
    name: "Vidya Mandir School",
    district: "Coimbatore District",
    latitude: 11.0232,
    longitude: 76.9507,
    studentStrength: 450, // Within ±20% of 420 (Range: 336 to 504)
    drumCapacity: 45, // kg
    contact: "+91 98765 43211",
    address: "DB Road, RS Puram, Coimbatore",
    entryCode: "2",
    password: "12345"
  },
  {
    id: "sch-3",
    name: "St. Mary's School",
    district: "Coimbatore District",
    latitude: 11.0090,
    longitude: 76.9520,
    studentStrength: 500, // Within ±20% of 420
    drumCapacity: 50, // kg
    contact: "+91 98765 43212",
    address: "Town Hall, Coimbatore",
    entryCode: "3",
    password: "12345"
  },
  {
    id: "sch-4",
    name: "National Primary School",
    district: "Coimbatore District",
    latitude: 11.0310,
    longitude: 76.9710,
    studentStrength: 200, // OUTSIDE ±20% of 420 (Too small)
    drumCapacity: 20, // kg
    contact: "+91 98765 43213",
    address: "Peelamedu, Coimbatore",
    entryCode: "4",
    password: "12345"
  },
  {
    id: "sch-5",
    name: "Central Public School",
    district: "Coimbatore District",
    latitude: 10.9980,
    longitude: 76.9400,
    studentStrength: 1100, // OUTSIDE ±20% of 420 (Too large)
    drumCapacity: 100, // kg
    contact: "+91 98765 43214",
    address: "Kuniamuthur, Coimbatore",
    entryCode: "5",
    password: "12345"
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
