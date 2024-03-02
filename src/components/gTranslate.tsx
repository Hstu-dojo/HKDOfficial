"use client";
import React from "react";
import { Helmet } from "react-helmet";
function GTranslate() {
  return (
    <div>
      {/* Your component content here */}

      {/* Add the following Helmet component to include the script in the head */}
      <Helmet>
        <script type="text/javascript">
          {`
                function googleTranslateElementInit() {
                new google.translate.TranslateElement(
                        {pageLanguage: 'en'},
                        'google_translate_element'
                );
        }
            `}
        </script>
        <script
          async
          type="text/javascript"
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        ></script>
      </Helmet>
      <div id="google_translate_element"></div>
    </div>
  );
}

export default GTranslate;
