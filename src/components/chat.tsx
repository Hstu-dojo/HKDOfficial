"use client";
import React from "react";
import { Helmet } from "react-helmet";
function ChatPlugin() {
  return (
    <div>
      {/* Your component content here */}

      {/* Add the following Helmet component to include the script in the head */}
      <Helmet>
        {/* <script type="text/javascript">
          {`
            window.$crisp = [];
            window.CRISP_WEBSITE_ID = "72630f29-8348-44df-8169-779a54df07a9";
            (function() {
              var d = document;
              var s = d.createElement("script");
              s.src = "https://client.crisp.chat/l.js";
              s.async = 1;
              d.getElementsByTagName("head")[0].appendChild(s);
            })();
          `}
        </script> */}
          <script type="text/javascript">{`
          var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
          (function(){
          var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
          s1.async=true;
          s1.src='https://embed.tawk.to/67323edc4304e3196ae0452b/1ice4b3gm';
          s1.charset='UTF-8';
          s1.setAttribute('crossorigin','*');
          s0.parentNode.insertBefore(s1,s0);
          })();`}
          </script>
      </Helmet>
    </div>
  );
}

export default ChatPlugin;
