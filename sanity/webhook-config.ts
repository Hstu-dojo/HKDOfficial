// Sanity Webhook Configuration
// Add this to your Sanity Studio webhooks settings

export const webhookConfig = {
  name: 'Next.js Revalidation Webhook',
  url: process.env.NEXT_PUBLIC_SITE_URL + '/api/revalidate-sanity',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  triggers: [
    {
      name: 'Project Updates',
      filter: '_type == "project"',
      projection: `{
        _id,
        _type,
        "slug": slug.current,
        isFeatured,
        title,
        _updatedAt
      }`,
    },
    {
      name: 'Settings Updates', 
      filter: '_type == "settings"',
      projection: `{
        _id,
        _type,
        _updatedAt
      }`,
    },
    {
      name: 'Home Page Updates',
      filter: '_type == "home"',
      projection: `{
        _id,
        _type,
        _updatedAt
      }`,
    }
  ],
  secret: process.env.SANITY_REVALIDATE_SECRET,
};

/*
To set up the webhook in Sanity Studio:

1. Go to https://sanity.io/manage/personal/project/YOUR_PROJECT_ID/webhooks
2. Click "Create webhook"
3. Set the following:
   - Name: "Next.js Revalidation"
   - URL: https://yourdomain.com/api/revalidate-sanity
   - Trigger: On create, update, delete
   - Filter: _type in ["project", "settings", "home"]
   - Projection: { _id, _type, "slug": slug.current, isFeatured, _updatedAt }
   - Secret: Your SANITY_REVALIDATE_SECRET environment variable

Environment Variables needed:
- SANITY_REVALIDATE_SECRET=your-webhook-secret-key
- NEXT_PUBLIC_SITE_URL=https://yourdomain.com (your production URL)

For local development, use ngrok or similar to expose your local server:
- URL: https://your-ngrok-url.ngrok.io/api/revalidate-sanity
*/
