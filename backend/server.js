const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 📥 Incoming: ${req.method} ${req.url}`);
  if (req.method === 'POST') {
    console.log(`   Payload:`, JSON.stringify(req.body));
  }
  next();
});

const dbFilePath = path.join(__dirname, 'database.json');

// Setup PostgreSQL pool (only if DATABASE_URL is supplied)
let pool = null;
if (process.env.DATABASE_URL) {
  console.log('PostgreSQL connection string detected. Connecting...');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for cloud providers like Neon/Render/Supabase
  });
} else {
  console.log('No DATABASE_URL found. Running server with in-memory fallback simulation.');
}

// In-Memory Database Fallback for instant local testability
let db = {
  schools: [
    { id: 'sch-1', name: 'Corporation Middle School, RS Puram', district: 'Coimbatore', latitude: 11.0084, longitude: 76.9458, student_strength: 380, drum_capacity: 40, contact: '+91 98765 43210', address: 'West RS Puram, Coimbatore, Tamil Nadu 641002', entry_code: '1', password: '12345' },
    { id: 'sch-2', name: 'Government Girls High School, Gandhipuram', district: 'Coimbatore', latitude: 11.0182, longitude: 76.9631, student_strength: 510, drum_capacity: 60, contact: '+91 98765 43211', address: 'Cross Cut Road, Gandhipuram, Coimbatore, Tamil Nadu 641012', entry_code: '2', password: '12345' },
    { id: 'sch-3', name: 'Municipal Higher Secondary School, Peelamedu', district: 'Coimbatore', latitude: 11.0268, longitude: 76.9958, student_strength: 420, drum_capacity: 40, contact: '+91 98765 43212', address: 'Peelamedu Main Road, Coimbatore, Tamil Nadu 641004', entry_code: '3', password: '12345' },
    { id: 'sch-4', name: 'Corporation School, Town Hall', district: 'Coimbatore', latitude: 10.9958, longitude: 76.9592, student_strength: 290, drum_capacity: 30, contact: '+91 98765 43213', address: 'Near Big Bazaar Street, Town Hall, Coimbatore, Tamil Nadu 641001', entry_code: '4', password: '12345' }
  ],
  collectors: [
    { id: 'col-1', name: 'Kavin Kumar (Organic Pig Farm)', collector_type: 'Farmer', vehicle: 'Mahindra Bolero Pickup', radius: 15.0, latitude: 11.0458, longitude: 76.9158, entry_code: '1', password: '12345' },
    { id: 'col-2', name: 'Deepak Raj (Coimbatore BioCompost)', collector_type: 'Compost Company', vehicle: 'Tata Ace Mini Truck', radius: 20.0, latitude: 10.9858, longitude: 76.9858, entry_code: '2', password: '12345' }
  ],
  waste_posts: [],
  produce_posts: [],
  notifications: [],
  history: [
    { id: 'h-1', post_id: 'p-old-1', school_id: 'sch-1', collector_id: 'col-1', estimated_weight: 18.5, date: '2026-07-13T10:00:00Z', reason: 'Rice & Sambhar Excess' },
    { id: 'h-2', post_id: 'p-old-2', school_id: 'sch-1', collector_id: 'col-2', estimated_weight: 22.0, date: '2026-07-14T10:00:00Z', reason: 'Wheat Upma Excess' },
    { id: 'h-3', post_id: 'p-old-3', school_id: 'sch-1', collector_id: 'col-1', estimated_weight: 15.0, date: '2026-07-15T10:00:00Z', reason: 'Chapati & Dal Excess' },
    { id: 'h-4', post_id: 'p-old-4', school_id: 'sch-1', collector_id: 'col-2', estimated_weight: 10.5, date: '2026-07-16T10:00:00Z', reason: 'Rice & Sambhar Excess' }
  ]
};

// Load saved database if present
if (fs.existsSync(dbFilePath)) {
  try {
    const saved = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
    if (saved && saved.schools && saved.waste_posts) {
      db = saved;
      console.log('Loaded database state successfully from database.json');
    }
  } catch (err) {
    console.error('Error reading database file, using default mock data:', err.message);
  }
}

// Save helper
function saveDatabaseToFile() {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write database file:', err.message);
  }
}

// HELPER: Query abstraction to swap between SQL and In-Memory
async function executeQuery(sql, params, inMemoryFallback) {
  if (pool) {
    try {
      const res = await pool.query(sql, params);
      return res.rows;
    } catch (err) {
      console.error('SQL Execution Error, using fallback:', err.message);
      return inMemoryFallback();
    }
  }
  return inMemoryFallback();
}

// API ENDPOINTS

// 1. Schools
app.get('/api/schools', async (req, res) => {
  const data = await executeQuery('SELECT * FROM schools', [], () => db.schools);
  res.json(data);
});

app.post('/api/schools', async (req, res) => {
  const school = req.body;
  await executeQuery(
    'INSERT INTO schools (id, name, district, latitude, longitude, student_strength, drum_capacity, contact, address, entry_code, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (id) DO UPDATE SET student_strength = EXCLUDED.student_strength, drum_capacity = EXCLUDED.drum_capacity, contact = EXCLUDED.contact, address = EXCLUDED.address, entry_code = EXCLUDED.entry_code, password = EXCLUDED.password',
    [school.id, school.name, school.district || 'Coimbatore', parseFloat(school.latitude || 11.0), parseFloat(school.longitude || 76.9), parseInt(school.studentStrength || 0), parseFloat(school.drumCapacity || 0), school.contact || '', school.address || '', school.entryCode || '', school.password || '12345'],
    () => {
      const idx = db.schools.findIndex(s => s.id === school.id);
      const mapped = {
        id: school.id,
        name: school.name,
        district: school.district || 'Coimbatore',
        latitude: parseFloat(school.latitude || 11.0),
        longitude: parseFloat(school.longitude || 76.9),
        student_strength: parseInt(school.studentStrength || 0),
        studentStrength: parseInt(school.studentStrength || 0),
        drum_capacity: parseFloat(school.drumCapacity || 0),
        drumCapacity: parseFloat(school.drumCapacity || 0),
        contact: school.contact || '',
        address: school.address || '',
        entryCode: school.entryCode || '',
        entry_code: school.entryCode || '',
        password: school.password || '12345'
      };
      if (idx >= 0) {
        db.schools[idx] = mapped;
      } else {
        db.schools.push(mapped);
      }
      saveDatabaseToFile();
      return [];
    }
  );
  res.json({ success: true });
});

// 2. Collectors
app.get('/api/collectors', async (req, res) => {
  const data = await executeQuery('SELECT * FROM collectors', [], () => db.collectors);
  res.json(data);
});

app.post('/api/collectors', async (req, res) => {
  const collector = req.body;
  await executeQuery(
    'INSERT INTO collectors (id, name, phone, collector_type, vehicle, radius, latitude, longitude, entry_code, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO UPDATE SET collector_type = EXCLUDED.collector_type, vehicle = EXCLUDED.vehicle, radius = EXCLUDED.radius, phone = EXCLUDED.phone, entry_code = EXCLUDED.entry_code, password = EXCLUDED.password',
    [collector.id, collector.name, collector.phone || '', collector.collectorType || 'Farmer', collector.vehicle || 'Tractor', parseFloat(collector.radius || 10.0), parseFloat(collector.latitude || 11.0), parseFloat(collector.longitude || 76.9), collector.entryCode || '', collector.password || '12345'],
    () => {
      const idx = db.collectors.findIndex(c => c.id === collector.id);
      const mapped = {
        id: collector.id,
        name: collector.name,
        phone: collector.phone || '',
        collector_type: collector.collectorType || 'Farmer',
        collectorType: collector.collectorType || 'Farmer',
        vehicle: collector.vehicle || 'Tractor',
        radius: parseFloat(collector.radius || 10.0),
        latitude: parseFloat(collector.latitude || 11.0),
        longitude: parseFloat(collector.longitude || 76.9),
        entryCode: collector.entryCode || '',
        entry_code: collector.entryCode || '',
        password: collector.password || '12345',
        totalPickups: 0,
        rating: 5.0
      };
      if (idx >= 0) {
        db.collectors[idx] = mapped;
      } else {
        db.collectors.push(mapped);
      }
      saveDatabaseToFile();
      return [];
    }
  );
  res.json({ success: true });
});

// 3. Waste Posts
app.get('/api/waste-posts', async (req, res) => {
  const data = await executeQuery('SELECT * FROM waste_posts', [], () => db.waste_posts);
  res.json(data);
});

app.post('/api/waste-posts', async (req, res) => {
  const post = req.body; // Expects complete waste post fields
  await executeQuery(
    'INSERT INTO waste_posts (id, school_id, status, drum_level, estimated_weight, reason, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [post.id, post.school_id, 'Available', post.drumLevel, post.estimatedWeight, post.reason, post.createdAt],
    () => {
      const newPost = {
        id: post.id,
        schoolId: post.school_id || post.schoolId,
        status: 'Available',
        drumLevel: post.drumLevel,
        estimatedWeight: post.estimatedWeight,
        reason: post.reason,
        createdAt: post.createdAt || new Date().toISOString(),
        collectorId: null,
        reservedAt: null,
        history: [{ status: 'Available', timestamp: new Date().toISOString(), message: 'Waste logged online' }]
      };
      
      const existingIdx = db.waste_posts.findIndex(p => p.schoolId === newPost.schoolId && p.status !== 'Collected');
      if (existingIdx >= 0) {
        db.waste_posts[existingIdx] = newPost;
      } else {
        db.waste_posts.push(newPost);
      }
      
      saveDatabaseToFile();
      return [newPost];
    }
  );
  res.json({ success: true, post });
});

// Update status endpoint (generic action)
app.post('/api/waste-posts/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, collectorId, reservedAt } = req.body;

  const updates = [];
  const params = [];
  let paramIdx = 1;

  if (status !== undefined) {
    updates.push(`status = $${paramIdx++}`);
    params.push(status);
  }
  if (collectorId !== undefined) {
    updates.push(`collector_id = $${paramIdx++}`);
    params.push(collectorId);
  }
  if (reservedAt !== undefined) {
    updates.push(`reserved_at = $${paramIdx++}`);
    params.push(reservedAt);
  }

  if (updates.length > 0) {
    params.push(id);
    const sql = `UPDATE waste_posts SET ${updates.join(', ')} WHERE id = $${paramIdx}`;
    
    await executeQuery(
      sql,
      params,
      () => {
        db.waste_posts = db.waste_posts.map(post => {
          if (post.id === id) {
            const timestamp = new Date().toISOString();
            const newHistory = post.history || [];
            return {
              ...post,
              status: status !== undefined ? status : post.status,
              collectorId: collectorId !== undefined ? collectorId : post.collectorId,
              reservedAt: reservedAt !== undefined ? reservedAt : post.reservedAt,
              history: status !== undefined 
                ? [...newHistory, { status, timestamp, message: `Status updated: ${status}` }]
                : newHistory
            };
          }
          return post;
        });
        saveDatabaseToFile();
        return [];
      }
    );
  }

  res.json({ success: true });
});

// 4. Notifications
app.get('/api/notifications', async (req, res) => {
  const data = await executeQuery('SELECT * FROM notifications ORDER BY created_at DESC', [], () => db.notifications);
  res.json(data);
});

app.post('/api/notifications', async (req, res) => {
  const notif = req.body;
  await executeQuery(
    'INSERT INTO notifications (id, target_id, role, title, message, type, read, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    [notif.id, notif.targetId, notif.role, notif.title, notif.message, notif.type, false, notif.createdAt],
    () => {
      const newNotif = {
        id: notif.id,
        targetId: notif.targetId,
        role: notif.role,
        title: notif.title,
        message: notif.message,
        type: notif.type || 'info',
        read: false,
        createdAt: notif.createdAt || new Date().toISOString(),
        timestamp: notif.createdAt || new Date().toISOString()
      };
      db.notifications.unshift(newNotif);
      saveDatabaseToFile();
      return [newNotif];
    }
  );
  res.json({ success: true });
});

// Mark notifications read
app.post('/api/notifications/:id/read', async (req, res) => {
  const { id } = req.params;
  await executeQuery(
    'UPDATE notifications SET read = TRUE WHERE id = $1',
    [id],
    () => {
      db.notifications = db.notifications.map(n => n.id === id ? { ...n, read: true } : n);
      saveDatabaseToFile();
      return [];
    }
  );
  res.json({ success: true });
});

// 5. History
app.get('/api/history', async (req, res) => {
  const data = await executeQuery('SELECT * FROM history ORDER BY date DESC', [], () => db.history);
  res.json(data);
});

app.post('/api/history', async (req, res) => {
  const h = req.body;
  await executeQuery(
    'INSERT INTO history (id, post_id, school_id, collector_id, estimated_weight, date, reason) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [h.id, h.postId, h.schoolId, h.collectorId, h.estimatedWeight, h.date, h.reason],
    () => {
      const newH = {
        id: h.id,
        postId: h.postId,
        schoolId: h.schoolId,
        collectorId: h.collectorId,
        estimatedWeight: h.estimatedWeight,
        date: h.date || new Date().toISOString(),
        reason: h.reason
      };
      db.history.unshift(newH);
      saveDatabaseToFile();
      return [newH];
    }
  );
  res.json({ success: true });
});

// 6. Produce Posts
app.get('/api/produce-posts', async (req, res) => {
  const data = await executeQuery('SELECT * FROM produce_posts ORDER BY created_at DESC', [], () => db.produce_posts || []);
  res.json(data);
});

app.post('/api/produce-posts', async (req, res) => {
  const post = req.body;
  await executeQuery(
    'INSERT INTO produce_posts (id, collector_id, title, quantity, price, delivery_estimate, image_url, description, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
    [post.id, post.collectorId, post.title, post.quantity, post.price, post.deliveryEstimate, post.imageUrl, post.description, 'Available', post.createdAt],
    () => {
      const newPost = {
        id: post.id,
        collectorId: post.collectorId,
        title: post.title,
        quantity: parseFloat(post.quantity || 0),
        price: parseFloat(post.price || 0),
        deliveryEstimate: post.deliveryEstimate,
        imageUrl: post.imageUrl,
        description: post.description,
        status: 'Available',
        claimedBySchoolId: null,
        createdAt: post.createdAt || new Date().toISOString()
      };
      if (!db.produce_posts) db.produce_posts = [];
      db.produce_posts.unshift(newPost);
      saveDatabaseToFile();
      return [newPost];
    }
  );
  res.json({ success: true });
});

app.post('/api/produce-posts/:id/claim', async (req, res) => {
  const { id } = req.params;
  const { schoolId } = req.body;
  await executeQuery(
    'UPDATE produce_posts SET status = $1, claimed_by_school_id = $2 WHERE id = $3',
    ['Claimed', schoolId, id],
    () => {
      if (db.produce_posts) {
        db.produce_posts = db.produce_posts.map(post => {
          if (post.id === id) {
            return {
              ...post,
              status: 'Claimed',
              claimedBySchoolId: schoolId
            };
          }
          return post;
        });
      }
      saveDatabaseToFile();
      return [];
    }
  );
  res.json({ success: true });
});

// Database Auto-Initialization & Seeding
async function initializeDatabase() {
  if (!pool) return;
  console.log('⚡ Running database auto-initialization...');
  try {
    // 1. Read and run schema.sql to create tables if they do not exist
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schemaSql);
      console.log('✅ PostgreSQL tables verified/created successfully.');
    }

    // 2. Check and seed/update schools
    console.log(`🌱 Seeding/Updating ${db.schools.length} schools in database...`);
    for (const s of db.schools) {
      await pool.query(
        `INSERT INTO schools (
          id, name, district, latitude, longitude, student_strength, drum_capacity, contact, address, 
          menu_mon, menu_tue, menu_wed, menu_thu, menu_fri, entry_code, password
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          district = EXCLUDED.district,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          student_strength = EXCLUDED.student_strength,
          drum_capacity = EXCLUDED.drum_capacity,
          contact = EXCLUDED.contact,
          address = EXCLUDED.address,
          menu_mon = EXCLUDED.menu_mon,
          menu_tue = EXCLUDED.menu_tue,
          menu_wed = EXCLUDED.menu_wed,
          menu_thu = EXCLUDED.menu_thu,
          menu_fri = EXCLUDED.menu_fri,
          entry_code = EXCLUDED.entry_code,
          password = EXCLUDED.password`,
        [
          s.id, s.name, s.district, s.latitude, s.longitude, s.student_strength, s.drum_capacity, s.contact, s.address,
          s.menu_mon || '', s.menu_tue || '', s.menu_wed || '', s.menu_thu || '', s.menu_fri || '', s.entry_code || '', s.password || '12345'
        ]
      );
    }
    console.log('✅ Schools synchronized successfully!');

    // 3. Check and seed collectors
    const collectorCheck = await pool.query('SELECT COUNT(*) FROM collectors');
    const collectorCount = parseInt(collectorCheck.rows[0].count);
    if (collectorCount === 0) {
      console.log(`🌱 Seeding database with ${db.collectors.length} collectors...`);
      for (const c of db.collectors) {
        await pool.query(
          'INSERT INTO collectors (id, name, collector_type, vehicle, radius, latitude, longitude, entry_code, password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING',
          [c.id, c.name, c.collector_type || c.collectorType, c.vehicle, c.radius, c.latitude, c.longitude, c.entry_code || '', c.password || '12345']
        );
      }
      console.log('✅ Collectors seeded successfully!');
    } else {
      console.log(`ℹ️ Collectors table already contains ${collectorCount} records. Skipping seed.`);
    }

  } catch (err) {
    console.error('❌ Database auto-initialization/seeding failed:', err.message);
  }
}

// Root check
app.get('/', (req, res) => {
  res.send('IDEX Waste Tracker Cloud Sync API is active!');
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initializeDatabase();
});
