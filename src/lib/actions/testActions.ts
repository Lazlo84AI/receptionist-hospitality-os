import getUserProfiles from './getUserProfiles';
import { getTaskComments } from './getTaskComments';
import getActivityLogs from './getActivityLogs';
import getReminders from './getReminders';

// Test function to verify all actions work
export async function testAllActions() {
  console.log('🧪 Testing all actions...');
  
  try {
    console.log('1️⃣ Testing getUserProfiles...');
    const profiles = await getUserProfiles({ limit: 5 });
    console.log('✅ getUserProfiles success:', profiles?.length || 0, 'records');
    
    console.log('2️⃣ Testing getTaskComments...');
    const comments = await getTaskComments('sample-task-id');
    console.log('✅ getTaskComments success:', comments?.length || 0, 'records');
    
    console.log('3️⃣ Testing getActivityLogs...');
    const logs = await getActivityLogs({ limit: 5 });
    console.log('✅ getActivityLogs success:', logs?.length || 0, 'records');
    
    console.log('4️⃣ Testing getReminders...');
    const reminders = await getReminders({ limit: 5 });
    console.log('✅ getReminders success:', reminders?.length || 0, 'records');
    
    console.log('🎉 All actions tested successfully!');
    
    return {
      profiles: profiles?.length || 0,
      comments: comments?.length || 0,
      logs: logs?.length || 0,
      reminders: reminders?.length || 0
    };
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Auto-run tests in development
if (typeof window !== 'undefined') {
  // Only run in browser
  (window as any).testActions = testAllActions;
  console.log('🔧 Actions created! Run testActions() in console to test them.');
}