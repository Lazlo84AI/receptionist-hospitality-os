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