/*
  # Bringolino Database Schema

  1. New Tables
    - `bringolino_tasks`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `priority` (text)
      - `status` (text)
      - `assigned_to` (text, optional)
      - `department` (text)
      - `location` (text)
      - `due_date` (timestamptz, optional)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `department_data`
      - `id` (uuid, primary key)
      - `department` (text)
      - `date` (text)
      - `completed_tasks` (jsonb)
      - `documentation_checks` (jsonb)
      - `apotheke_checks` (jsonb)
      - `user_points` (integer)
      - `last_update` (bigint)
      - `device_id` (text)
      - `user_id` (text)

    - `dect_locks`
      - `id` (uuid, primary key)
      - `dect_code` (text, unique)
      - `user_id` (text)
      - `user_name` (text)
      - `lock_time` (bigint)
      - `lock_date` (text)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (hospital internal use)

  3. Indexes
    - Add indexes for frequently queried columns
*/

-- Create bringolino_tasks table
CREATE TABLE IF NOT EXISTS bringolino_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed')),
  assigned_to text,
  department text NOT NULL,
  location text NOT NULL,
  due_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create department_data table
CREATE TABLE IF NOT EXISTS department_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
  date text NOT NULL,
  completed_tasks jsonb DEFAULT '[]'::jsonb,
  documentation_checks jsonb DEFAULT '{}'::jsonb,
  apotheke_checks jsonb DEFAULT '{}'::jsonb,
  user_points integer DEFAULT 0,
  last_update bigint DEFAULT extract(epoch from now()) * 1000,
  device_id text NOT NULL,
  user_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create dect_locks table
CREATE TABLE IF NOT EXISTS dect_locks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dect_code text UNIQUE NOT NULL,
  user_id text NOT NULL,
  user_name text NOT NULL,
  lock_time bigint NOT NULL,
  lock_date text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE bringolino_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE dect_locks ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (hospital internal use)
CREATE POLICY "Allow all operations on bringolino_tasks"
  ON bringolino_tasks
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on department_data"
  ON department_data
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on dect_locks"
  ON dect_locks
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bringolino_tasks_department ON bringolino_tasks(department);
CREATE INDEX IF NOT EXISTS idx_bringolino_tasks_status ON bringolino_tasks(status);
CREATE INDEX IF NOT EXISTS idx_bringolino_tasks_priority ON bringolino_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_bringolino_tasks_created_at ON bringolino_tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_department_data_department ON department_data(department);
CREATE INDEX IF NOT EXISTS idx_department_data_date ON department_data(date);
CREATE INDEX IF NOT EXISTS idx_department_data_user_id ON department_data(user_id);
CREATE INDEX IF NOT EXISTS idx_department_data_composite ON department_data(department, date, user_id);

CREATE INDEX IF NOT EXISTS idx_dect_locks_dect_code ON dect_locks(dect_code);
CREATE INDEX IF NOT EXISTS idx_dect_locks_lock_date ON dect_locks(lock_date);

-- Create unique constraint for department_data
CREATE UNIQUE INDEX IF NOT EXISTS idx_department_data_unique 
ON department_data(department, date, user_id);

-- Add updated_at trigger for department_data
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_department_data_updated_at 
    BEFORE UPDATE ON department_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bringolino_tasks_updated_at 
    BEFORE UPDATE ON bringolino_tasks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();