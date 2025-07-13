// Simple test script to test automation webhooks
import { ticketService } from './src/services/ticketService.js';
import { automationService } from './src/services/automationService.js';

async function testAutomation() {
  try {
    console.log('🧪 Testing automation webhook system...');
    
    // Get existing automations
    console.log('\n📋 Getting automations...');
    const automations = await automationService.getAutomations();
    console.log(`Found ${automations.length} automations:`);
    automations.forEach(auto => {
      console.log(`- ${auto.name} (${auto.id}) - Active: ${auto.isActive} - Trigger: ${auto.trigger.type}`);
    });
    
    // Create a test ticket
    console.log('\n🎫 Creating test ticket...');
    const testTicket = await ticketService.createTicket({
      title: 'Test automation webhook',
      description: 'This is a test ticket to verify webhook automation',
      customer_email: 'test@example.com',
      customer_name: 'Test User',
      priority: 'medium'
    });
    
    console.log('✅ Test ticket created:', testTicket.id);
    console.log('📊 Ticket details:', {
      id: testTicket.id,
      title: testTicket.title,
      priority: testTicket.priority,
      status: testTicket.status
    });
    
    console.log('\n🚀 Automation should have been triggered!');
    console.log('Check the console logs for DEBUG messages from automation service.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAutomation();