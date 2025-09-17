-- First, let's modify the profiles table to not require auth.users for mock data
-- We'll temporarily remove the foreign key constraint for testing
ALTER TABLE public.profiles DROP CONSTRAINT profiles_id_fkey;

-- Insert mock profiles (hotel staff) with generated UUIDs
INSERT INTO public.profiles (id, first_name, last_name, email, role, department, phone, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Sophie', 'Martin', 'sophie.martin@hotel.com', 'manager', 'Front Desk', '+33123456789', true),
('550e8400-e29b-41d4-a716-446655440002', 'Jean', 'Dupont', 'jean.dupont@hotel.com', 'staff', 'Maintenance', '+33123456790', true),
('550e8400-e29b-41d4-a716-446655440003', 'Marie', 'Dubois', 'marie.dubois@hotel.com', 'staff', 'Housekeeping', '+33123456791', true),
('550e8400-e29b-41d4-a716-446655440004', 'Pierre', 'Leroy', 'pierre.leroy@hotel.com', 'staff', 'Concierge', '+33123456792', true),
('550e8400-e29b-41d4-a716-446655440005', 'Emma', 'Wilson', 'emma.wilson@hotel.com', 'manager', 'Guest Services', '+33123456793', true),
('550e8400-e29b-41d4-a716-446655440006', 'Thomas', 'Anderson', 'thomas.anderson@hotel.com', 'maintenance', 'Technical', '+33123456794', true),
('550e8400-e29b-41d4-a716-446655440007', 'Julie', 'Chen', 'julie.chen@hotel.com', 'housekeeping', 'Housekeeping', '+33123456795', true),
('550e8400-e29b-41d4-a716-446655440008', 'Marcus', 'Johnson', 'marcus.johnson@hotel.com', 'admin', 'Management', '+33123456796', true);

-- Insert mock locations
INSERT INTO public.locations (id, name, type, floor, building, capacity, amenities) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'Presidential Suite', 'room', 10, 'Main Tower', 4, '["jacuzzi", "terrace", "butler_service", "premium_minibar"]'),
('650e8400-e29b-41d4-a716-446655440002', 'Room 305', 'room', 3, 'Main Tower', 2, '["city_view", "minibar", "safe"]'),
('650e8400-e29b-41d4-a716-446655440003', 'Room 207', 'room', 2, 'Main Tower', 2, '["garden_view", "minibar"]'),
('650e8400-e29b-41d4-a716-446655440004', 'Grand Ballroom', 'common_area', 1, 'Main Tower', 300, '["stage", "av_equipment", "dance_floor"]'),
('650e8400-e29b-41d4-a716-446655440005', 'Pool Area', 'common_area', 1, 'Main Tower', 100, '["heated_pool", "jacuzzi", "bar"]'),
('650e8400-e29b-41d4-a716-446655440006', 'Spa Reception', 'common_area', 2, 'Spa Wing', 20, '["reception_desk", "waiting_area"]'),
('650e8400-e29b-41d4-a716-446655440007', 'Main Lobby', 'common_area', 1, 'Main Tower', 150, '["reception", "concierge", "lounge"]'),
('650e8400-e29b-41d4-a716-446655440008', 'Corridor 3A', 'corridor', 3, 'Main Tower', 0, '[]'),
('650e8400-e29b-41d4-a716-446655440009', 'Restaurant Kitchen', 'office', 1, 'Main Tower', 15, '["industrial_kitchen", "storage"]'),
('650e8400-e29b-41d4-a716-446655440010', 'Executive Lounge', 'common_area', 8, 'Main Tower', 50, '["bar", "business_center", "city_view"]');

-- Insert mock shifts
INSERT INTO public.shifts (id, user_id, start_time, end_time, status, voice_note_transcription, handover_notes) VALUES
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '30 minutes', 'completed', 
'Hello to the next shift team. Here are the key points to remember for your service: The air conditioning in the Presidential Suite is still out of order. The technician is scheduled to come at 9 AM. Mr. Anderson, who is staying in the suite, will need to be assisted. Note that he is a very demanding VIP guest who already expressed dissatisfaction last night. In Room 305, the Dubois family has a baby crib set up, but they have requested an additional blanket for the baby. The pool area had a minor chlorine imbalance this morning, but it has been resolved. Please monitor the levels every 2 hours. The Grand Ballroom setup for tomorrow''s wedding is 80% complete. The florist will arrive at 6 AM sharp.', 
'Critical: Presidential Suite AC repair at 9 AM. VIP guest needs special attention. Monitor pool chemistry. Wedding setup continues tomorrow 6 AM.'),

('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '16 hours', NOW() - INTERVAL '8 hours', 'completed', 
'Maintenance shift report: Fixed the leak in Room 207 bathroom. Replaced two light bulbs in Corridor 3A. The elevator in the main tower is making unusual noises - I''ve called the service company, they will come tomorrow morning. Please ensure guests use the service elevator until then. The pool pump was serviced and is running smoothly. Kitchen exhaust fan cleaned and tested.', 
'Room 207 leak fixed. Elevator service needed tomorrow. Pool pump serviced. Kitchen exhaust cleaned.'),

('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '2 hours', NULL, 'active', NULL, NULL);