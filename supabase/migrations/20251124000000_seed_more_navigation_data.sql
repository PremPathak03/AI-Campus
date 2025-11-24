-- Insert more sample data for campus navigation

-- Insert new buildings
INSERT INTO public.buildings (name, code, description) VALUES
  ('Science Complex', 'H', 'Advanced research labs and science classrooms'),
  ('Business School', 'I', 'School of Business and Economics'),
  ('Performing Arts Center', 'J', 'Theater, music rooms, and performance halls');

-- Insert rooms for Science Complex (H)
INSERT INTO public.rooms (building_id, room_number, floor, room_type, description)
SELECT id, '101', '1', 'Lecture Hall', 'Large science lecture hall' FROM public.buildings WHERE code = 'H'
UNION ALL
SELECT id, '102', '1', 'Lab', 'Biology Lab' FROM public.buildings WHERE code = 'H'
UNION ALL
SELECT id, '201', '2', 'Lab', 'Chemistry Lab' FROM public.buildings WHERE code = 'H'
UNION ALL
SELECT id, '301', '3', 'Office', 'Department Chair Office' FROM public.buildings WHERE code = 'H';

-- Insert rooms for Business School (I)
INSERT INTO public.rooms (building_id, room_number, floor, room_type, description)
SELECT id, '101', '1', 'Classroom', 'Business Ethics Classroom' FROM public.buildings WHERE code = 'I'
UNION ALL
SELECT id, '102', '1', 'Auditorium', 'Main Auditorium' FROM public.buildings WHERE code = 'I'
UNION ALL
SELECT id, '201', '2', 'Computer Lab', 'Financial Trading Lab' FROM public.buildings WHERE code = 'I'
UNION ALL
SELECT id, '202', '2', 'Meeting Room', 'Group Study Room' FROM public.buildings WHERE code = 'I';

-- Insert rooms for Performing Arts Center (J)
INSERT INTO public.rooms (building_id, room_number, floor, room_type, description)
SELECT id, '100', '1', 'Theater', 'Main Stage Theater' FROM public.buildings WHERE code = 'J'
UNION ALL
SELECT id, '101', '1', 'Studio', 'Dance Studio' FROM public.buildings WHERE code = 'J'
UNION ALL
SELECT id, '201', '2', 'Practice Room', 'Music Practice Room A' FROM public.buildings WHERE code = 'J'
UNION ALL
SELECT id, '202', '2', 'Practice Room', 'Music Practice Room B' FROM public.buildings WHERE code = 'J';

-- Add more rooms to existing buildings
-- Library (A)
INSERT INTO public.rooms (building_id, room_number, floor, room_type, description)
SELECT id, '205', '2', 'Quiet Zone', 'Silent study area' FROM public.buildings WHERE code = 'A'
UNION ALL
SELECT id, '305', '3', 'Meeting Room', 'Group project room' FROM public.buildings WHERE code = 'A';

-- Student Center (E)
INSERT INTO public.rooms (building_id, room_number, floor, room_type, description)
SELECT id, '105', '1', 'Bookstore', 'Campus Bookstore' FROM public.buildings WHERE code = 'E'
UNION ALL
SELECT id, '106', '1', 'Coffee Shop', 'Campus Coffee' FROM public.buildings WHERE code = 'E';
