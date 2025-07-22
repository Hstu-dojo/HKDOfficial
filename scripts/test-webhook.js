// Simple webhook test script
const testWebhook = async () => {
  const webhookUrl = 'http://localhost:3000/api/revalidate';
  
  const payload = {
    path: '/en',
    secret: 'your-webhook-secret-key'
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.text();
    console.log('Webhook Response Status:', response.status);
    console.log('Webhook Response:', result);
  } catch (error) {
    console.error('Webhook Test Error:', error);
  }
};

// Run the test
testWebhook();
