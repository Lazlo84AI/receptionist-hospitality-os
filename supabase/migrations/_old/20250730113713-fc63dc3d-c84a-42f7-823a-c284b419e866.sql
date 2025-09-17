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