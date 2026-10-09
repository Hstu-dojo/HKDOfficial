import Document, { Head, Html, Main, NextScript } from "next/document";


class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <link rel="icon" href="/favicon.ico" />
          <meta name="description" content="See pictures from Kaizen belt test." />
          <meta property="og:site_name" content="karate.paradox-bd.com" />
          <meta
            property="og:description"
            content="See pictures from Kaizen belt test."
          />
          <meta property="og:title" content="Kaizen belt test 2024 Pictures" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="Kaizen belt test 2024 Pictures" />
          <meta
            name="twitter:description"
            content="See pictures from Kaizen belt test."
          />
        </Head>
        <body className="antialiased">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
