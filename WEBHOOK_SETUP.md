# Sanity Webhook Configuration Guide

## Overview
This guide explains how to set up webhooks in Sanity Studio to automatically update your Next.js application when featured posts are toggled.

## Prerequisites
- Sanity Studio access
- Next.js application deployed (for production webhooks)
- Environment variable `SANITY_REVALIDATE_SECRET` set

## Setup Instructions

### 1. Configure Environment Variables

Add the following to your `.env` file:

```env
SANITY_REVALIDATE_SECRET=your-webhook-secret-key
```

**Important**: Use a strong, unique secret key. This will be used to authenticate webhook requests.

### 2. Set up Webhook in Sanity Studio

1. Go to your Sanity Studio dashboard (https://sanity.io/manage)
2. Select your project
3. Navigate to "API" → "Webhooks"
4. Click "Create webhook"
5. Configure the webhook:

   **Name**: Featured Posts Auto-Revalidation
   
   **URL**: 
   - For development: `http://localhost:3000/api/revalidate-sanity`
   - For production: `https://yourdomain.com/api/revalidate-sanity`
   
   **Dataset**: production (or your target dataset)
   
   **Trigger on**: Document changes
   
   **Filter**: 
   ```groq
   _type == "project" && defined(isFeatured)
   ```
   
   **HTTP method**: POST
   
   **Secret**: `your-webhook-secret-key` (same as environment variable)
   
   **HTTP Headers**: Leave default (Content-Type: application/json)

6. Click "Save"

### 3. Test the Webhook

#### Method 1: Test in Sanity Studio
1. Open a blog post in Sanity Studio
2. Toggle the "Featured" checkbox
3. Save the document
4. Check your Next.js application - the homepage should update automatically

#### Method 2: Manual Test
Use curl or a similar tool to test the webhook endpoint:

```bash
curl -X POST http://localhost:3000/api/revalidate-manual \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/en",
    "secret": "your-webhook-secret-key"
  }'
```

Expected response:
```json
{
  "revalidated": true,
  "path": "/en",
  "timestamp": "2025-01-22T07:31:13.881Z"
}
```

## How It Works

### 1. ISR (Incremental Static Regeneration)
- Featured posts are cached for 60 seconds
- Cache is tagged with 'featured-posts'
- Components automatically revalidate after cache expires

### 2. Webhook Flow
1. User toggles `isFeatured` in Sanity Studio
2. Sanity sends webhook to `/api/revalidate-sanity`
3. Webhook validates signature and processes update
4. Cache is invalidated using `revalidateTag('featured-posts')`
5. Next request rebuilds the page with fresh data

### 3. Component Architecture
- `FeaturedPostsServer`: Server component that fetches data
- `FeaturedPostsClient`: Client component that renders UI
- Data is cached and updated automatically

## Troubleshooting

### Common Issues

#### Webhook returns 401 "Invalid signature"
- Ensure `SANITY_REVALIDATE_SECRET` matches webhook secret
- Check that the webhook URL is correct
- Verify Sanity is sending the correct signature format

#### Featured posts not updating
- Check webhook is configured correctly in Sanity
- Verify the GROQ filter: `_type == "project" && defined(isFeatured)`
- Ensure blog posts have the `isFeatured` field

#### Development webhook not working
- Make sure Next.js dev server is running on port 3000
- Use `http://localhost:3000/api/revalidate-sanity` for local testing
- Check console logs for error messages

### Debug Commands

Check webhook configuration:
```bash
# Test manual revalidation
curl -X POST http://localhost:3000/api/revalidate-manual \
  -H "Content-Type: application/json" \
  -d '{"path":"/en","secret":"your-webhook-secret-key"}'

# Check if featured posts query works
# (Use your Sanity Studio Vision tab)
*[_type == "project" && isFeatured == true] | order(date desc) [0...3]
```

### Production Deployment

For production:
1. Update webhook URL to your production domain
2. Ensure environment variables are set on your hosting platform
3. Test webhook after deployment
4. Monitor webhook calls in Sanity Studio webhook logs

## Security Considerations

1. **Secret Management**: Keep `SANITY_REVALIDATE_SECRET` secure and unique
2. **HTTPS**: Always use HTTPS in production for webhook URLs
3. **Rate Limiting**: Consider implementing rate limiting for webhook endpoints
4. **Validation**: Webhook validates signature and content type before processing

## Benefits

1. **Real-time Updates**: Changes in Sanity appear immediately on your site
2. **Performance**: ISR provides fast loading while ensuring fresh content
3. **SEO**: Pages are pre-rendered but stay updated automatically
4. **User Experience**: No manual rebuilds or deployments needed for content changes

---

This setup provides a robust, automatic content update system that keeps your featured posts current without manual intervention.
