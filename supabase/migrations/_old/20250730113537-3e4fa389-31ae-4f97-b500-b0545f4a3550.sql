-- Insert mock profiles (hotel staff)
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

-- Insert mock incidents
INSERT INTO public.incidents (id, title, description, incident_type, priority, status, location, assigned_to) VALUES
('850e8400-e29b-41d4-a716-446655440001', 'Presidential Suite Air Conditioning Issue', 'The Presidential Suite air conditioning system has not been working since last night. Guest is extremely dissatisfied and demanding immediate resolution. System appears to be completely non-responsive.', 'HVAC', 'urgent', 'pending', 'Presidential Suite', 'Jean Dupont'),

('850e8400-e29b-41d4-a716-446655440002', 'Elevator Maintenance Required', 'Main tower elevator making unusual grinding noises. Potential safety concern. Service company contacted for emergency repair.', 'Mechanical', 'high', 'in_progress', 'Main Lobby', 'Thomas Anderson'),

('850e8400-e29b-41d4-a716-446655440003', 'Pool Chemistry Imbalance', 'Chlorine levels detected as too high during morning testing. Pool temporarily closed for safety. Need to rebalance chemicals.', 'Safety', 'high', 'completed', 'Pool Area', 'Pierre Leroy'),

('850e8400-e29b-41d4-a716-446655440004', 'Spa Reception Water Leak', 'Small water leak detected behind reception desk. Carpet is getting wet. Need immediate plumbing intervention.', 'Plumbing', 'medium', 'pending', 'Spa Reception', 'Jean Dupont');

-- Insert mock client requests
INSERT INTO public.client_requests (id, guest_name, room_number, request_type, request_details, preparation_status, arrival_date, priority, assigned_to) VALUES
('950e8400-e29b-41d4-a716-446655440001', 'Mr. Robert Anderson', 'Presidential Suite', 'VIP Service', 'VIP guest requesting premium champagne, fresh flowers daily, and personal butler service. Guest has dietary restrictions: gluten-free and lactose-free meals only.', 'in_progress', '2025-01-28', 'urgent', 'Emma Wilson'),

('950e8400-e29b-41d4-a716-446655440002', 'Mrs. Catherine Dubois', 'Room 305', 'Baby Equipment', 'Guest traveling with 6-month-old baby. Requesting baby crib (already installed), high chair for restaurant, baby bathtub, and extra blankets. Also needs bottle sterilizer.', 'completed', '2025-01-27', 'medium', 'Marie Dubois'),

('950e8400-e29b-41d4-a716-446655440003', 'Dr. James Mitchell', 'Room 207', 'Late Check-in', 'Guest arriving at 11 PM due to delayed flight. Requesting late dinner service and quiet room preparation. Guest is a frequent business traveler.', 'pending', '2025-01-29', 'low', 'Pierre Leroy'),

('950e8400-e29b-41d4-a716-446655440004', 'Wedding Party - Chen Family', 'Multiple Rooms', 'Event Setup', 'Wedding celebration for 150 guests. Bridal suite decoration, special dietary accommodations for 12 vegetarian guests, floral arrangements, and photography permissions needed.', 'in_progress', '2025-01-30', 'high', 'Emma Wilson');

-- Insert mock follow-ups
INSERT INTO public.follow_ups (id, title, recipient, follow_up_type, notes, status, due_date, priority, assigned_to) VALUES
('a50e8400-e29b-41d4-a716-446655440001', 'Presidential Suite AC Technician Follow-up', 'HVAC Service Company', 'Technical', 'Confirm technician arrival time for Presidential Suite AC repair. Guest is VIP and extremely dissatisfied. Need exact ETA and backup plan if repair takes longer than expected.', 'pending', '2025-01-29', 'urgent', 'Sophie Martin'),

('a50e8400-e29b-41d4-a716-446655440002', 'Guest Satisfaction Survey - Mr. Anderson', 'Mr. Robert Anderson', 'Customer Service', 'Follow up with VIP guest about service quality and AC issue resolution. Need to ensure guest satisfaction before checkout and gather feedback for future improvements.', 'pending', '2025-01-30', 'high', 'Emma Wilson'),

('a50e8400-e29b-41d4-a716-446655440003', 'Wedding Vendor Coordination', 'Chen Wedding Vendors', 'Event Coordination', 'Coordinate final details with florist, photographer, and catering team. Confirm setup timeline and special dietary requirements for vegetarian guests.', 'in_progress', '2025-01-29', 'medium', 'Pierre Leroy'),

('a50e8400-e29b-41d4-a716-446655440004', 'Pool Safety Inspection Report', 'Health Department', 'Compliance', 'Submit pool chemistry incident report and corrective actions taken. Include testing logs and new monitoring procedures implemented.', 'completed', '2025-01-28', 'medium', 'Sophie Martin');

-- Insert mock internal tasks
INSERT INTO public.internal_tasks (id, title, description, task_type, priority, status, location, department, due_date, assigned_to) VALUES
('b50e8400-e29b-41d4-a716-446655440001', 'Weekly Pool Chemistry Testing', 'Conduct comprehensive pool water testing including pH, chlorine, alkalinity, and calcium hardness. Document results and adjust chemicals as needed. Implement new 2-hour monitoring schedule.', 'Maintenance', 'high', 'in_progress', 'Pool Area', 'Maintenance', '2025-01-29', 'Pierre Leroy'),

('b50e8400-e29b-41d4-a716-446655440002', 'Staff Training - Emergency Procedures', 'Mandatory training session for all front desk and housekeeping staff on new emergency evacuation procedures. Include fire safety, medical emergencies, and security protocols.', 'Training', 'medium', 'pending', 'Main Lobby', 'Management', '2025-02-01', 'Marcus Johnson'),

('b50e8400-e29b-41d4-a716-446655440003', 'VIP Guest Room Preparation Checklist', 'Prepare detailed checklist for VIP guest room setup. Include premium amenities, personalized welcome items, and special service protocols. Update housekeeping procedures.', 'Administrative', 'medium', 'completed', 'Presidential Suite', 'Housekeeping', '2025-01-28', 'Julie Chen'),

('b50e8400-e29b-41d4-a716-446655440004', 'Restaurant Kitchen Deep Cleaning', 'Monthly deep cleaning of kitchen equipment, exhaust systems, and storage areas. Coordinate with restaurant manager to minimize service disruption.', 'Cleaning', 'low', 'pending', 'Restaurant Kitchen', 'Housekeeping', '2025-02-02', 'Marie Dubois');

-- Insert mock comments
INSERT INTO public.comments (user_id, task_id, task_type, content, comment_type) VALUES
('550e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440001', 'incident', 'AC unit completely unresponsive. Checked electrical connections and filters. Issue appears to be with the main compressor. HVAC technician scheduled for 9 AM tomorrow.', 'comment'),
('550e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', 'incident', 'Guest called front desk again at 11 PM expressing extreme dissatisfaction. Offered complimentary spa services and restaurant credit. Temporary portable AC unit provided.', 'comment'),
('550e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440003', 'incident', 'Pool chemistry rebalanced successfully. pH now at 7.4, chlorine at 2.0 ppm. Pool reopened at 2 PM. Implemented new testing schedule every 2 hours.', 'comment'),
('550e8400-e29b-41d4-a716-446655440005', '950e8400-e29b-41d4-a716-446655440001', 'client_request', 'VIP amenities prepared: Dom Pérignon champagne, daily orchid arrangements ordered. Butler assigned. Dietary requirements communicated to kitchen staff.', 'comment'),
('550e8400-e29b-41d4-a716-446655440003', '950e8400-e29b-41d4-a716-446655440002', 'client_request', 'Baby crib installed and tested. High chair reserved for restaurant. Still waiting for bottle sterilizer delivery from supplier.', 'comment');

-- Insert mock checklists
INSERT INTO public.checklists (task_id, task_type, title, items, created_by) VALUES
('950e8400-e29b-41d4-a716-446655440001', 'client_request', 'VIP Guest Preparation Checklist', 
'[
  {"id": "1", "text": "Champagne service setup", "completed": true, "completedBy": "Emma Wilson", "completedAt": "2025-01-28T10:30:00Z"},
  {"id": "2", "text": "Fresh flower arrangements", "completed": true, "completedBy": "Emma Wilson", "completedAt": "2025-01-28T11:00:00Z"},
  {"id": "3", "text": "Butler assignment and briefing", "completed": false, "completedBy": null, "completedAt": null},
  {"id": "4", "text": "Kitchen dietary restrictions briefing", "completed": true, "completedBy": "Emma Wilson", "completedAt": "2025-01-28T09:15:00Z"},
  {"id": "5", "text": "Room temperature and ambiance check", "completed": false, "completedBy": null, "completedAt": null}
]', '550e8400-e29b-41d4-a716-446655440005'),

('850e8400-e29b-41d4-a716-446655440002', 'incident', 'Elevator Safety Inspection', 
'[
  {"id": "1", "text": "Visual inspection of cables and pulleys", "completed": true, "completedBy": "Thomas Anderson", "completedAt": "2025-01-28T08:00:00Z"},
  {"id": "2", "text": "Test emergency communication system", "completed": true, "completedBy": "Thomas Anderson", "completedAt": "2025-01-28T08:15:00Z"},
  {"id": "3", "text": "Document unusual noises and vibrations", "completed": true, "completedBy": "Thomas Anderson", "completedAt": "2025-01-28T08:30:00Z"},
  {"id": "4", "text": "Contact certified elevator service company", "completed": true, "completedBy": "Thomas Anderson", "completedAt": "2025-01-28T09:00:00Z"},
  {"id": "5", "text": "Install out-of-service signage", "completed": false, "completedBy": null, "completedAt": null}
]', '550e8400-e29b-41d4-a716-446655440006');

-- Insert mock reminders
INSERT INTO public.reminders (task_id, task_type, title, message, reminder_time, frequency, created_by) VALUES
('850e8400-e29b-41d4-a716-446655440001', 'incident', 'HVAC Technician Arrival Check', 'Confirm HVAC technician arrival for Presidential Suite AC repair. Guest is VIP and waiting.', '2025-01-29 08:45:00+00', 'once', '550e8400-e29b-41d4-a716-446655440001'),
('b50e8400-e29b-41d4-a716-446655440001', 'internal_task', 'Pool Chemistry Testing', 'Regular pool chemistry testing - check pH, chlorine, alkalinity levels', '2025-01-29 16:00:00+00', 'daily', '550e8400-e29b-41d4-a716-446655440004'),
('950e8400-e29b-41d4-a716-446655440004', 'client_request', 'Wedding Setup Coordination', 'Final wedding setup coordination with vendors', '2025-01-30 06:00:00+00', 'once', '550e8400-e29b-41d4-a716-446655440004'),
('a50e8400-e29b-41d4-a716-446655440002', 'follow_up', 'VIP Guest Satisfaction Follow-up', 'Follow up with Mr. Anderson about service quality and overall satisfaction', '2025-01-30 14:00:00+00', 'once', '550e8400-e29b-41d4-a716-446655440005');

-- Insert mock task members (assignments)
INSERT INTO public.task_members (task_id, task_type, user_id, role, added_by) VALUES
('850e8400-e29b-41d4-a716-446655440001', 'incident', '550e8400-e29b-41d4-a716-446655440002', 'assignee', '550e8400-e29b-41d4-a716-446655440001'),
('850e8400-e29b-41d4-a716-446655440001', 'incident', '550e8400-e29b-41d4-a716-446655440006', 'observer', '550e8400-e29b-41d4-a716-446655440001'),
('950e8400-e29b-41d4-a716-446655440001', 'client_request', '550e8400-e29b-41d4-a716-446655440005', 'assignee', '550e8400-e29b-41d4-a716-446655440001'),
('950e8400-e29b-41d4-a716-446655440001', 'client_request', '550e8400-e29b-41d4-a716-446655440004', 'observer', '550e8400-e29b-41d4-a716-446655440005'),
('b50e8400-e29b-41d4-a716-446655440001', 'internal_task', '550e8400-e29b-41d4-a716-446655440004', 'assignee', '550e8400-e29b-41d4-a716-446655440001'),
('950e8400-e29b-41d4-a716-446655440004', 'client_request', '550e8400-e29b-41d4-a716-446655440005', 'assignee', '550e8400-e29b-41d4-a716-446655440001'),
('950e8400-e29b-41d4-a716-446655440004', 'client_request', '550e8400-e29b-41d4-a716-446655440004', 'observer', '550e8400-e29b-41d4-a716-446655440005');

-- Insert mock escalations
INSERT INTO public.escalations (task_id, task_type, escalated_to, escalated_by, method, recipient_email, message) VALUES
('850e8400-e29b-41d4-a716-446655440001', 'incident', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440001', 'email', 'marcus.johnson@hotel.com', 'URGENT: Presidential Suite AC failure affecting VIP guest Mr. Anderson. Guest extremely dissatisfied. Need immediate management intervention and potential compensation decision.'),
('950e8400-e29b-41d4-a716-446655440001', 'client_request', '550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440005', 'internal', NULL, 'VIP guest Mr. Anderson requires special attention due to AC incident. Requesting approval for premium compensation package including spa services and dining credits.');

-- Insert mock activity log
INSERT INTO public.activity_log (user_id, task_id, task_type, action, description, metadata) VALUES
('550e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', 'incident', 'created', 'Sophie Martin created incident: Presidential Suite Air Conditioning Issue', '{"priority": "urgent", "location": "Presidential Suite"}'),
('550e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440001', 'incident', 'commented', 'Jean Dupont added a comment about AC diagnosis', '{"comment_id": "1"}'),
('550e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', 'incident', 'escalated', 'Sophie Martin escalated to management', '{"escalated_to": "Marcus Johnson", "method": "email"}'),
('550e8400-e29b-41d4-a716-446655440005', '950e8400-e29b-41d4-a716-446655440001', 'client_request', 'created', 'Emma Wilson created client request for VIP guest Mr. Anderson', '{"guest_name": "Mr. Robert Anderson", "room": "Presidential Suite"}'),
('550e8400-e29b-41d4-a716-446655440005', '950e8400-e29b-41d4-a716-446655440001', 'client_request', 'checklist_added', 'Emma Wilson added VIP preparation checklist', '{"checklist_items": 5}'),
('550e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440003', 'incident', 'completed', 'Pierre Leroy completed pool chemistry incident', '{"resolution": "Chemistry rebalanced, pool reopened"}'),
('550e8400-e29b-41d4-a716-446655440001', 'a50e8400-e29b-41d4-a716-446655440001', 'follow_up', 'created', 'Sophie Martin created follow-up for HVAC technician coordination', '{"due_date": "2025-01-29", "priority": "urgent"}'),
('550e8400-e29b-41d4-a716-446655440008', 'b50e8400-e29b-41d4-a716-446655440002', 'internal_task', 'assigned', 'Marcus Johnson assigned staff training task to himself', '{"task_type": "Training", "department": "Management"}')