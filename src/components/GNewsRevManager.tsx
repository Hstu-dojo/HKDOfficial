"use client";
import React from "react";
import { Helmet } from "react-helmet";
function GNewsRevManager() {
  return (
    <div>
      {/* Your component content here */}

      {/* Add the following Helmet component to include the script in the head */}
      <Helmet>
        <script
          async
          type="application/javascript"
          src="https://news.google.com/swg/js/v1/swg-basic.js"
        ></script>
        <script type="text/javascript">
          {" "}
          {`
  (self.SWG_BASIC = self.SWG_BASIC || []).push( basicSubscriptions => {
    basicSubscriptions.init({
      type: "NewsArticle",
      isPartOfType: ["Product"],
      isPartOfProductId: "CAow9KqvDA:openaccess",
      clientOptions: { theme: "light", lang: "en" },
    });
  });`}
        </script>
      </Helmet>
    </div>
  );
}

export default GNewsRevManager;
