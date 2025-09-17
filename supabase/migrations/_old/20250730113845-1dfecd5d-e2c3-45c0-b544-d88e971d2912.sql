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
('550e8400-e29b-41d4-a716-446655440008', 'b50e8400-e29b-41d4-a716-446655440002', 'internal_task', 'assigned', 'Marcus Johnson assigned staff training task to himself', '{"task_type": "Training", "department": "Management"}'),

-- Ajout des nouvelles activités pour convertir les données hardcodées
('550e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440001', 'incident', 'commented', 'JD left a comment', '{"comment_content": "Problem resolved, air conditioning repaired"}'),
('550e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', 'incident', 'reminder_added', 'Sophie Martin scheduled a reminder', '{"reminder_type": "technician_followup", "due_date": "2025-01-29T08:45:00Z"}'),
('550e8400-e29b-41d4-a716-446655440003', '850e8400-e29b-41d4-a716-446655440001', 'incident', 'checklist_completed', 'Marie Dubois completed a checklist task', '{"checklist_item": "Temperature check and adjustment", "completion_status": "completed"}'),
('550e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440001', 'incident', 'attachment_added', 'An attachment was added by Pierre Leroy', '{"attachment_name": "ac_repair_invoice.pdf", "attachment_type": "file"}'),
('550e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440001', 'incident', 'escalated', 'Pierre Leroy escalated via email', '{"escalation_method": "email", "escalated_to": "Marcus Johnson", "reason": "VIP guest complaint"}'),
('550e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', 'incident', 'member_assigned', 'Task assigned to Thomas Anderson by Sophie Martin', '{"assigned_to": "Thomas Anderson", "assigned_by": "Sophie Martin", "role": "maintenance_technician"}'),

-- Activités pour la demande client VIP
('550e8400-e29b-41d4-a716-446655440005', '950e8400-e29b-41d4-a716-446655440001', 'client_request', 'commented', 'Emma Wilson left a comment', '{"comment_content": "VIP amenities prepared successfully, guest satisfied with champagne service"}'),
('550e8400-e29b-41d4-a716-446655440005', '950e8400-e29b-41d4-a716-446655440001', 'client_request', 'checklist_added', 'Emma Wilson added VIP preparation checklist', '{"checklist_name": "VIP Guest Preparation Checklist", "items_count": 5}'),
('550e8400-e29b-41d4-a716-446655440001', '950e8400-e29b-41d4-a716-446655440001', 'client_request', 'status_changed', 'Sophie Martin updated status to In Progress', '{"old_status": "pending", "new_status": "in_progress", "reason": "VIP guest arrival confirmed"}'),
('550e8400-e29b-41d4-a716-446655440005', '950e8400-e29b-41d4-a716-446655440001', 'client_request', 'member_assigned', 'Butler assigned to VIP guest by Emma Wilson', '{"assigned_to": "Jean-Philippe Dubois", "assigned_by": "Emma Wilson", "service_type": "personal_butler"}'),

-- Activités pour l'incident piscine
('550e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440003', 'incident', 'completed', 'Pierre Leroy marked incident as resolved', '{"resolution": "Pool chemistry rebalanced, pH normalized to 7.4", "completion_time": "14:00"}'),
('550e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440003', 'incident', 'commented', 'Pierre Leroy added final report', '{"comment_content": "Pool reopened successfully, new testing schedule implemented every 2 hours"}'),
('550e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440003', 'incident', 'reminder_added', 'Thomas Anderson scheduled maintenance reminder', '{"reminder_type": "routine_check", "frequency": "daily", "next_check": "tomorrow_16:00"}'),

-- Activités récentes pour test en temps réel
('550e8400-e29b-41d4-a716-446655440006', '850e8400-e29b-41d4-a716-446655440002', 'incident', 'commented', 'Maintenance team left status update', '{"comment_content": "Elevator inspection completed, safety certification renewed"}'),
('550e8400-e29b-41d4-a716-446655440001', '950e8400-e29b-41d4-a716-446655440004', 'client_request', 'attachment_added', 'Wedding coordinator uploaded floor plan', '{"attachment_name": "wedding_setup_plan.pdf", "attachment_type": "file"}'),
('550e8400-e29b-41d4-a716-446655440008', 'b50e8400-e29b-41d4-a716-446655440002', 'internal_task', 'status_changed', 'Marcus Johnson approved staff training schedule', '{"old_status": "pending_approval", "new_status": "approved", "training_date": "2025-02-01"}');

-- Insert mock shift data with voice notes and transcriptions
INSERT INTO public.shifts (id, user_id, start_time, end_time, status, voice_note_url, voice_note_transcription, handover_notes) VALUES
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '2025-01-28 06:00:00+00', '2025-01-28 14:00:00+00', 'completed', 
'https://example.com/voice-notes/shift-2025-01-28-morning.mp3', 
'Hello to the next shift team. Here are the key points to remember for your service: The air conditioning in the Presidential Suite is still out of order. The technician is scheduled to come at 9 AM. Mr. Anderson, who is staying in the suite, will need to be assisted. Note that he is a very demanding VIP guest who already expressed dissatisfaction last night. In Room 305, the Dubois family has a baby crib set up, but they have requested additional hypoallergenic products for their child. Marie from the housekeeping team has the contact details for the specialized supplier. Dr. Williams in Suite 102 expressed satisfaction with the office setup. He wants to extend his stay by two additional nights. His reservation needs to be modified and availability must be checked with reservations. The housekeeping team is short-staffed today. Prioritize VIP rooms and scheduled departures. Please note, three team members are absent due to illness.', 
'Morning shift completed successfully. All VIP guest needs addressed. AC technician arrived on time at 9 AM for Presidential Suite.'),

('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '2025-01-28 14:00:00+00', '2025-01-28 22:00:00+00', 'completed', 
'https://example.com/voice-notes/shift-2025-01-28-afternoon.mp3', 
'Hello afternoon team. The Presidential Suite AC has been fully repaired and Mr. Anderson expressed satisfaction. The Dubois family baby supplies have been delivered and set up. Dr. Williams reservation extension has been processed for two additional nights in Suite 102. The housekeeping team situation has improved - two staff members returned from sick leave. The main elevator had some minor issues this morning but has been inspected and cleared by maintenance. Please continue monitoring. There is a corporate group of 15 arriving at 4 PM for their welcome event. Special cocktail setup is ready in the main lounge.', 
'Afternoon shift handover: All morning issues resolved. Corporate event successfully launched. Elevator functioning normally.'),

('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '2025-01-28 22:00:00+00', null, 'active', 
'https://example.com/voice-notes/shift-2025-01-28-night.mp3', 
'Night shift team, here is the current status. The corporate event concluded at 9 PM without issues. All 15 guests were satisfied with the cocktail reception. Mr. Anderson from the Presidential Suite has checked out and left positive feedback about the AC repair resolution. The Dubois family is settled and all baby equipment is working perfectly. Dr. Williams is happy with his extended stay. Three new guests checked in for tomorrow: VIP client in Suite 201, business traveler in Room 450, and family group in Rooms 380-382. Kitchen staff reported the dishwasher had a minor issue but has been resolved. Pool area is clean and ready for tomorrow. Please monitor the main entrance as we have early checkout scheduled at 6 AM.', 
'Night shift in progress. Current occupancy: 87%. All systems operational. Early checkout preparations completed.');

-- Insert recent shift for current user (for testing)
INSERT INTO public.shifts (id, user_id, start_time, status, voice_note_url, voice_note_transcription, handover_notes) VALUES
('750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '8 hours', 'completed',
'https://example.com/voice-notes/current-shift-handover.mp3',
'Good morning team! Here are the key points for today. The Presidential Suite air conditioning has been completely resolved and the guest was very satisfied. We have three priority tasks today: Room 305 needs additional baby supplies delivery at 10 AM, the corporate event setup for 15 people needs final confirmation, and Dr. Williams wants to extend his stay. The elevator maintenance was completed successfully. Housekeeping is back to full staff. Pool chemistry levels are perfect. Please prioritize the VIP guests and check the reservation system twice as it had some minor glitches yesterday.',
'Previous shift completed all priority tasks. Focus on VIP service and system monitoring today.');

-- Add column to track which profile user was during this shift
ALTER TABLE public.shifts ADD COLUMN full_name TEXT;
UPDATE public.shifts SET full_name = 'Sophie Martin' WHERE user_id = '550e8400-e29b-41d4-a716-446655440001';
UPDATE public.shifts SET full_name = 'Jean Dupont' WHERE user_id = '550e8400-e29b-41d4-a716-446655440002';
UPDATE public.shifts SET full_name = 'Marie Dubois' WHERE user_id = '550e8400-e29b-41d4-a716-446655440003';