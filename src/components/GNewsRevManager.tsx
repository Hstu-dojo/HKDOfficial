"use client";
import React from "react";
import Script from "next/script";

/**
 * Google News Subscribe with Google (SWG) integration
 * This enables content metering, subscriptions, and analytics for Google News
 * Product ID: CAow9KqvDA:openaccess indicates this is open access content
 */
function GNewsRevManager() {
  return (
    <>
      <Script
        async
        src="https://news.google.com/swg/js/v1/swg-basic.js"
        strategy="afterInteractive"
      />
      <Script
        id="swg-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (self.SWG_BASIC = self.SWG_BASIC || []).push(function(basicSubscriptions) {
              basicSubscriptions.init({
                type: "NewsArticle",
                isPartOfType: ["Product"],
                isPartOfProductId: "CAow9KqvDA:openaccess",
                clientOptions: { theme: "light", lang: "en" },
              });
            });
          `,
        }}
      />
    </>
  );
}

export default GNewsRevManager;
