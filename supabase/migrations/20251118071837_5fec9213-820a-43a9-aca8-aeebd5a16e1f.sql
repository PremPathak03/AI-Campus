-- Create buildings table
CREATE TABLE public.buildings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  floor TEXT NOT NULL,
  room_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(building_id, room_number)
);

-- Create favorite_locations table
CREATE TABLE public.favorite_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  nickname TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, room_id)
);

-- Create recent_searches table
CREATE TABLE public.recent_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  searched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_searches ENABLE ROW LEVEL SECURITY;

-- Buildings policies (public read)
CREATE POLICY "Buildings are viewable by everyone"
ON public.buildings FOR SELECT
USING (true);

-- Rooms policies (public read)
CREATE POLICY "Rooms are viewable by everyone"
ON public.rooms FOR SELECT
USING (true);

-- Favorite locations policies
CREATE POLICY "Users can view their own favorites"
ON public.favorite_locations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
ON public.favorite_locations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their favorites"
ON public.favorite_locations FOR DELETE
USING (auth.uid() = user_id);

-- Recent searches policies
CREATE POLICY "Users can view their recent searches"
ON public.recent_searches FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add recent searches"
ON public.recent_searches FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their recent searches"
ON public.recent_searches FOR DELETE
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_rooms_building_id ON public.rooms(building_id);
CREATE INDEX idx_rooms_floor ON public.rooms(floor);
CREATE INDEX idx_favorite_locations_user_id ON public.favorite_locations(user_id);
CREATE INDEX idx_recent_searches_user_id ON public.recent_searches(user_id);
CREATE INDEX idx_recent_searches_searched_at ON public.recent_searches(searched_at DESC);

-- Insert sample campus data
INSERT INTO public.buildings (name, code, description) VALUES
  ('Main Library', 'A', 'Campus Library with study rooms, computer labs, and resources'),
  ('Administration & Student Services', 'B', 'Administrative offices, student services, and academic advising'),
  ('Engineering & Sciences', 'C', 'Engineering and science departments with labs'),
  ('Arts & Humanities', 'D', 'Arts, humanities, and social sciences departments'),
  ('Student Center', 'E', 'Cafeteria, student lounge, and meeting spaces'),
  ('Recreation Center', 'F', 'Gym, pool, and recreation facilities'),
  ('Health & Wellness', 'G', 'Health center and counseling services');

-- Insert sample rooms for Building A (Library)
INSERT INTO public.rooms (building_id, room_number, floor, room_type, description)
SELECT id, '101', '1', 'Computer Lab', 'Main computer lab with 50 workstations' FROM public.buildings WHERE code = 'A'
UNION ALL
SELECT id, '102', '1', 'Study Room', 'Group study room' FROM public.buildings WHERE code = 'A'
UNION ALL
SELECT id, '201', '2', 'Computer Lab', 'Secondary computer lab' FROM public.buildings WHERE code = 'A'
UNION ALL
SELECT id, '301', '3', 'Study Hall', 'Quiet study area' FROM public.buildings WHERE code = 'A'
UNION ALL
SELECT id, '401', '4', 'Archives', 'Special collections and archives' FROM public.buildings WHERE code = 'A'
UNION ALL
-- Building B (Admin)
SELECT id, '101', '1', 'Office', 'Student Services Office' FROM public.buildings WHERE code = 'B'
UNION ALL
SELECT id, '102', '1', 'Office', 'Financial Aid Office' FROM public.buildings WHERE code = 'B'
UNION ALL
SELECT id, '103', '1', 'Office', 'Registrar Office' FROM public.buildings WHERE code = 'B'
UNION ALL
SELECT id, '201', '2', 'Office', 'Academic Advising' FROM public.buildings WHERE code = 'B'
UNION ALL
SELECT id, '202', '2', 'Office', 'Career Services' FROM public.buildings WHERE code = 'B'
UNION ALL
-- Building C (Engineering)
SELECT id, '101', '1', 'Computer Lab', 'Engineering computer lab' FROM public.buildings WHERE code = 'C'
UNION ALL
SELECT id, '102', '1', 'Classroom', 'Engineering lecture hall' FROM public.buildings WHERE code = 'C'
UNION ALL
SELECT id, '201', '2', 'Lab', 'Physics laboratory' FROM public.buildings WHERE code = 'C'
UNION ALL
SELECT id, '301', '3', 'Lab', 'Chemistry laboratory' FROM public.buildings WHERE code = 'C'
UNION ALL
-- Building D (Arts)
SELECT id, '101', '1', 'Classroom', 'Humanities classroom' FROM public.buildings WHERE code = 'D'
UNION ALL
SELECT id, '102', '1', 'Studio', 'Art studio' FROM public.buildings WHERE code = 'D'
UNION ALL
SELECT id, '201', '2', 'Classroom', 'Language lab' FROM public.buildings WHERE code = 'D'
UNION ALL
-- Building E (Student Center)
SELECT id, '101', '1', 'Cafeteria', 'Main cafeteria' FROM public.buildings WHERE code = 'E'
UNION ALL
SELECT id, '102', '1', 'Lounge', 'Student lounge' FROM public.buildings WHERE code = 'E'
UNION ALL
SELECT id, '201', '2', 'Meeting Room', 'Student organization meeting room' FROM public.buildings WHERE code = 'E'
UNION ALL
-- Building F (Recreation)
SELECT id, '101', '1', 'Gym', 'Main gymnasium' FROM public.buildings WHERE code = 'F'
UNION ALL
SELECT id, '102', '1', 'Pool', 'Indoor swimming pool' FROM public.buildings WHERE code = 'F'
UNION ALL
SELECT id, '201', '2', 'Fitness', 'Fitness center' FROM public.buildings WHERE code = 'F'
UNION ALL
-- Building G (Health)
SELECT id, '101', '1', 'Clinic', 'Health clinic' FROM public.buildings WHERE code = 'G'
UNION ALL
SELECT id, '102', '1', 'Office', 'Counseling services' FROM public.buildings WHERE code = 'G';