const fs = require('fs');
const path = require('path');

const csvPath = '/Users/nithinselvaraj/Downloads/IDEX_Initial_Setup_Schools - IDEX_Initial_Setup_Schools.csv';
const jsonPath = path.join(__dirname, 'database.json');

function parseCSV(csvText) {
  const result = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"';
          i++; // Skip double quote
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(cell.trim());
        cell = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(cell.trim());
        if (row.length > 1 || row[0] !== '') {
          result.push(row);
        }
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell.trim());
    result.push(row);
  }
  return result;
}

try {
  console.log(`Reading CSV file from: ${csvPath}`);
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const parsedRows = parseCSV(csvContent);

  // Skip header row
  const headers = parsedRows[0];
  console.log('Headers:', headers);

  const schoolsList = [];

  for (let idx = 1; idx < parsedRows.length; idx++) {
    const row = parsedRows[idx];
    if (row.length < 9) continue;

    const rawId = row[0];
    const rawName = row[1];
    const rawDistrict = row[2] || 'Coimbatore District';
    const rawLat = parseFloat(row[3]);
    const rawLon = parseFloat(row[4]);
    const rawStrength = parseInt(row[5]) || 300;
    const rawCapacity = parseInt(row[6]) || 150;
    const rawContact = row[7] || '';
    const rawAddress = row[8] || '';
    const rawMenuMon = row[9] || '';
    const rawMenuTue = row[10] || '';
    const rawMenuWed = row[11] || '';
    const rawMenuThu = row[12] || '';
    const rawMenuFri = row[13] || '';

    // Normalize IDs to sch-1, sch-2, etc.
    let id = rawId.toLowerCase().trim().replace(/\s+/g, '-');
    if (id.startsWith('school-')) {
      id = id.replace('school-', 'sch-');
    }

    schoolsList.push({
      id: id,
      name: rawName.replace(/\s+/g, ' ').trim(),
      district: rawDistrict.trim(),
      latitude: rawLat,
      longitude: rawLon,
      student_strength: rawStrength,
      drum_capacity: rawCapacity,
      contact: rawContact.trim(),
      address: rawAddress.replace(/\s+/g, ' ').trim(),
      menu_mon: rawMenuMon.replace(/\r\n/g, '\n').replace(/\n+/g, ' || ').replace(/\s+/g, ' ').replace(/\s*\|\|\s*/g, ' || ').trim(),
      menu_tue: rawMenuTue.replace(/\r\n/g, '\n').replace(/\n+/g, ' || ').replace(/\s+/g, ' ').replace(/\s*\|\|\s*/g, ' || ').trim(),
      menu_wed: rawMenuWed.replace(/\r\n/g, '\n').replace(/\n+/g, ' || ').replace(/\s+/g, ' ').replace(/\s*\|\|\s*/g, ' || ').trim(),
      menu_thu: rawMenuThu.replace(/\r\n/g, '\n').replace(/\n+/g, ' || ').replace(/\s+/g, ' ').replace(/\s*\|\|\s*/g, ' || ').trim(),
      menu_fri: rawMenuFri.replace(/\r\n/g, '\n').replace(/\n+/g, ' || ').replace(/\s+/g, ' ').replace(/\s*\|\|\s*/g, ' || ').trim()
    });
  }

  console.log(`Parsed ${schoolsList.length} schools successfully!`);

  // Load existing database.json or create clean template
  let dbState = {
    schools: [],
    collectors: [
      { id: 'col-1', name: 'Kavin Kumar (Organic Pig Farm)', collector_type: 'Farmer', vehicle: 'Mahindra Bolero Pickup', radius: 15, latitude: 11.0458, longitude: 76.9158 },
      { id: 'col-2', name: 'Deepak Raj (Coimbatore BioCompost)', collector_type: 'Compost Company', vehicle: 'Tata Ace Mini Truck', radius: 20, latitude: 10.9858, longitude: 76.9858 }
    ],
    waste_posts: [],
    notifications: [],
    history: []
  };

  if (fs.existsSync(jsonPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      if (existing) {
        dbState = { ...dbState, ...existing };
      }
    } catch (e) {
      console.warn('Could not parse existing database.json, creating a fresh one.');
    }
  }

  // Set the newly parsed schools
  dbState.schools = schoolsList;

  // Save the updated database.json
  fs.writeFileSync(jsonPath, JSON.stringify(dbState, null, 2), 'utf8');
  console.log(`Successfully updated database.json with parsed schools at: ${jsonPath}`);

} catch (err) {
  console.error('Failed to parse schools CSV file:', err.message);
}
