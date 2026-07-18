CREATE TABLE IF NOT EXISTS schools (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  district VARCHAR(100) DEFAULT 'Coimbatore',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  student_strength INT DEFAULT 400,
  drum_capacity INT DEFAULT 40,
  contact VARCHAR(50),
  address TEXT
);

CREATE TABLE IF NOT EXISTS collectors (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  collector_type VARCHAR(50) NOT NULL,
  vehicle VARCHAR(50) NOT NULL,
  radius DOUBLE PRECISION DEFAULT 15.0,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS waste_posts (
  id VARCHAR(50) PRIMARY KEY,
  school_id VARCHAR(50) REFERENCES schools(id),
  status VARCHAR(50) DEFAULT 'Available',
  drum_level DOUBLE PRECISION NOT NULL,
  estimated_weight DOUBLE PRECISION NOT NULL,
  reason VARCHAR(100) NOT NULL,
  collector_id VARCHAR(50) REFERENCES collectors(id),
  reserved_at VARCHAR(100),
  created_at VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(50) PRIMARY KEY,
  target_id VARCHAR(50) NOT NULL,
  role VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  read BOOLEAN DEFAULT FALSE,
  created_at VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS history (
  id VARCHAR(50) PRIMARY KEY,
  post_id VARCHAR(50) NOT NULL,
  school_id VARCHAR(50) NOT NULL,
  collector_id VARCHAR(50),
  estimated_weight DOUBLE PRECISION NOT NULL,
  date VARCHAR(100) NOT NULL,
  reason VARCHAR(100)
);
