// Test script to verify the revalidate-sanity endpoint works with the updated internal call
const crypto = require('crypto');

const testSanityWebhook = async () => {
  const webhookUrl = 'http://localhost:3000/api/revalidate-sanity';
  const secret = 'your-webhook-secret-key';
  
  const payload = {
    _type: 'project',
    _id: 'test-featured-post',
    slug: { current: 'test-slug' },
    isFeatured: true
  };

  const body = JSON.stringify(payload);
  
  // Create signature like Sanity would
  const signature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'sanity-webhook-signature': `sha256=${signature}`
      },
      body: body
    });

    const result = await response.text();
    console.log('Sanity Webhook Response Status:', response.status);
    console.log('Sanity Webhook Response:', result);
  } catch (error) {
    console.error('Sanity Webhook Test Error:', error);
  }
};

// Run the test
testSanityWebhook();
