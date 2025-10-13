# Google News Publisher Setup Guide

## Overview
This guide explains how to publish your karate dojo blog to Google News and what has been implemented.

## ✅ What's Been Implemented

### 1. Subscribe with Google (SWG) Integration
**File:** `src/components/GNewsRevManager.tsx`

The SWG script has been added to enable:
- Content analytics and tracking via Google News
- Subscription/metering capabilities (currently set to "openaccess" - free content)
- Enhanced reader engagement metrics

**Your Product ID:** `CAow9KqvDA:openaccess`

This indicates your content is open access (free). If you want to add paywalls later, you can update this in Google Publisher Center.

### 2. NewsArticle Structured Data
**File:** `src/app/(sanity)/blog/post/[slug]/page.tsx`

Each blog post now includes JSON-LD structured data that tells Google News:
- Article headline and description
- Publication and modification dates
- Author information
- Publisher details (HSTU Karate Dojo)
- Article images
- Keywords/tags

This helps Google News properly index and display your articles.

### 3. Sitemaps & RSS Feed
**Configuration Files:**
- `next-sitemap.config.js` - Sitemap configuration
- `public/robots.txt` - Search engine directives
- `src/app/(sanity)/feed.xml/route.js` - RSS feed

**Available URLs:**
- Blog Sitemap: `https://karate.paradox-bd.com/blog/sitemap.xml`
- RSS Feed: `https://karate.paradox-bd.com/feed.xml`
- Main Sitemap: `https://karate.paradox-bd.com/sitemap.xml`

## 📝 How to Submit to Google News

### Step 1: Create/Access Google Publisher Center Account
1. Go to [Google Publisher Center](https://publishercenter.google.com/)
2. Sign in with your Google account
3. If first time, create a new publication

### Step 2: Add Your Publication
1. Click **"Add Publication"** or manage your existing one
2. Enter your publication details:
   - **Publication Name:** HSTU Karate Dojo Blog
   - **Website URL:** `https://karate.paradox-bd.com`
   - **Language:** English (en)
   - **Country:** Your primary country

### Step 3: Verify Website Ownership
You'll need to verify you own the website. Choose one method:
1. **HTML file upload** (easiest)
2. **HTML meta tag** (add to your site's `<head>`)
3. **Google Analytics**
4. **Google Tag Manager**
5. **DNS record**

### Step 4: Configure Content Settings
1. **Content Type:** News and magazine articles
2. **Update Frequency:** Select how often you publish
3. **RSS Feed URL:** `https://karate.paradox-bd.com/feed.xml`
4. **Sitemap URL:** `https://karate.paradox-bd.com/blog/sitemap.xml`

### Step 5: Set Up Sections (Optional)
Create sections for better organization:
- Training Tips
- Events
- News & Updates
- Tournament Results
etc.

### Step 6: Submit for Review
1. Review all your settings
2. Click **"Submit for Review"**
3. Google will review your publication (typically 1-3 business days)

## 🔍 Google Search Console Setup

### Add Your Property
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://karate.paradox-bd.com`
3. Verify ownership (similar to Publisher Center)

### Submit Sitemaps
1. Go to **Sitemaps** section
2. Add these sitemaps:
   - `sitemap.xml`
   - `blog/sitemap.xml`
   - `feed.xml`

### Monitor Performance
Check the **Google News** performance report to see:
- How your articles appear in Google News
- Click-through rates
- Impressions
- Search queries

## 📋 Best Practices for Google News

### Content Guidelines
1. **Original Content:** Write unique, original articles
2. **Timeliness:** Publish newsworthy, timely content
3. **Transparency:** Include author bylines and publication dates
4. **Quality:** Well-written, factual content with proper grammar
5. **Accuracy:** Verify facts and provide sources

### Technical Requirements
✅ HTTPS enabled (you have this)
✅ Mobile-friendly design
✅ Fast loading times
✅ Clear site structure
✅ Proper metadata and structured data (implemented)

### What to Avoid
- ❌ Duplicate content from other sites
- ❌ Clickbait or sensational headlines
- ❌ Paywalls without proper signaling (you're using openaccess)
- ❌ Excessive ads that obstruct content
- ❌ Thin or low-quality content

## 🧪 Testing Your Implementation

### 1. Test Structured Data
Use Google's Rich Results Test:
1. Go to [Rich Results Test](https://search.google.com/test/rich-results)
2. Enter a blog post URL: `https://karate.paradox-bd.com/blog/post/[your-slug]`
3. Check for NewsArticle schema validation

### 2. Verify SWG Script
1. Open any blog post
2. Open browser DevTools (F12)
3. Check Console for SWG initialization
4. Look for network requests to `news.google.com/swg`

### 3. Check Sitemaps
Visit these URLs in your browser:
- `https://karate.paradox-bd.com/blog/sitemap.xml`
- `https://karate.paradox-bd.com/feed.xml`

Verify they load and contain your blog posts.

### 4. Robots.txt Validation
Check: `https://karate.paradox-bd.com/robots.txt`
Should list all your sitemaps.

## 📊 Monitoring & Analytics

### Google Publisher Center
- Check approval status
- Monitor content performance
- View reader engagement metrics
- Track subscription analytics (if enabled)

### Google Search Console
- Monitor indexing status
- Check for crawl errors
- View search performance
- Track Google News appearances

### Google Analytics (if configured)
- Track traffic from Google News
- Monitor user engagement
- Analyze reader behavior
- Set up custom reports

## 🔄 Maintenance

### Regular Tasks
1. **Publish consistently** - Regular updates help rankings
2. **Monitor errors** - Check Search Console weekly
3. **Update sitemaps** - Happens automatically with new posts
4. **Review policies** - Google News policies can change

### When You Publish New Content
The system automatically:
- ✅ Adds posts to sitemap
- ✅ Updates RSS feed
- ✅ Includes structured data
- ✅ Notifies Google via SWG

You don't need to do anything manually!

## 🆘 Troubleshooting

### Articles Not Appearing in Google News
1. **Check approval status** in Publisher Center
2. **Verify sitemaps** are accessible and contain recent posts
3. **Ensure structured data** is valid (use Rich Results Test)
4. **Review content quality** - does it meet Google News guidelines?
5. **Be patient** - indexing can take 24-48 hours

### SWG Script Issues
1. Check browser console for errors
2. Verify script loads: `https://news.google.com/swg/js/v1/swg-basic.js`
3. Confirm Product ID is correct in Publisher Center

### Sitemap Errors
1. Check `next-sitemap.config.js` configuration
2. Verify `SITE_URL` environment variable is set
3. Rebuild your site: `npm run build`

## 📚 Additional Resources

- [Google News Publisher Center Help](https://support.google.com/news/publisher-center)
- [Google News Content Policies](https://support.google.com/news/publisher-center/answer/6204050)
- [Subscribe with Google Documentation](https://developers.google.com/news/subscribe)
- [News Sitemaps Documentation](https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap)
- [Schema.org NewsArticle](https://schema.org/NewsArticle)

## ✉️ Support

If you need help:
1. Check Google Publisher Center support
2. Visit Google Search Central community forums
3. Review this documentation

---

**Last Updated:** October 13, 2025
**Implementation Status:** ✅ Complete and Ready for Submission
