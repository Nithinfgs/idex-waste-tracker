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
    { id: 'sch-1', name: 'Corporation Middle School, RS Puram', district: 'Coimbatore', latitude: 11.0084, longitude: 76.9458, student_strength: 380, drum_capacity: 40, contact: '+91 98765 43210', address: 'West RS Puram, Coimbatore, Tamil Nadu 641002' },
    { id: 'sch-2', name: 'Government Girls High School, Gandhipuram', district: 'Coimbatore', latitude: 11.0182, longitude: 76.9631, student_strength: 510, drum_capacity: 60, contact: '+91 98765 43211', address: 'Cross Cut Road, Gandhipuram, Coimbatore, Tamil Nadu 641012' },
    { id: 'sch-3', name: 'Municipal Higher Secondary School, Peelamedu', district: 'Coimbatore', latitude: 11.0268, longitude: 76.9958, student_strength: 420, drum_capacity: 40, contact: '+91 98765 43212', address: 'Peelamedu Main Road, Coimbatore, Tamil Nadu 641004' },
    { id: 'sch-4', name: 'Corporation School, Town Hall', district: 'Coimbatore', latitude: 10.9958, longitude: 76.9592, student_strength: 290, drum_capacity: 30, contact: '+91 98765 43213', address: 'Near Big Bazaar Street, Town Hall, Coimbatore, Tamil Nadu 641001' }
  ],
  collectors: [
    { id: 'col-1', name: 'Kavin Kumar (Organic Pig Farm)', collector_type: 'Farmer', vehicle: 'Mahindra Bolero Pickup', radius: 15.0, latitude: 11.0458, longitude: 76.9158 },
    { id: 'col-2', name: 'Deepak Raj (Coimbatore BioCompost)', collector_type: 'Compost Company', vehicle: 'Tata Ace Mini Truck', radius: 20.0, latitude: 10.9858, longitude: 76.9858 }
  ],
  waste_posts: [],
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

// 2. Collectors
app.get('/api/collectors', async (req, res) => {
  const data = await executeQuery('SELECT * FROM collectors', [], () => db.collectors);
  res.json(data);
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

  await executeQuery(
    'UPDATE waste_posts SET status = $1, collector_id = $2, reserved_at = $3 WHERE id = $4',
    [status, collectorId, reservedAt, id],
    () => {
      db.waste_posts = db.waste_posts.map(post => {
        if (post.id === id) {
          const timestamp = new Date().toISOString();
          const newHistory = post.history || [];
          return {
            ...post,
            status,
            collectorId: collectorId !== undefined ? collectorId : post.collectorId,
            reservedAt: reservedAt !== undefined ? reservedAt : post.reservedAt,
            history: [...newHistory, { status, timestamp, message: `Status updated: ${status}` }]
          };
        }
        return post;
      });
      saveDatabaseToFile();
      return [];
    }
  );
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

    // 2. Check and seed schools
    const schoolCheck = await pool.query('SELECT COUNT(*) FROM schools');
    const schoolCount = parseInt(schoolCheck.rows[0].count);
    if (schoolCount === 0) {
      console.log(`🌱 Seeding database with ${db.schools.length} schools...`);
      for (const s of db.schools) {
        await pool.query(
          'INSERT INTO schools (id, name, district, latitude, longitude, student_strength, drum_capacity, contact, address) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING',
          [s.id, s.name, s.district, s.latitude, s.longitude, s.student_strength, s.drum_capacity, s.contact, s.address]
        );
      }
      console.log('✅ Schools seeded successfully!');
    } else {
      console.log(`ℹ️ Schools table already contains ${schoolCount} records. Skipping seed.`);
    }

    // 3. Check and seed collectors
    const collectorCheck = await pool.query('SELECT COUNT(*) FROM collectors');
    const collectorCount = parseInt(collectorCheck.rows[0].count);
    if (collectorCount === 0) {
      console.log(`🌱 Seeding database with ${db.collectors.length} collectors...`);
      for (const c of db.collectors) {
        await pool.query(
          'INSERT INTO collectors (id, name, collector_type, vehicle, radius, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
          [c.id, c.name, c.collector_type || c.collectorType, c.vehicle, c.radius, c.latitude, c.longitude]
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
