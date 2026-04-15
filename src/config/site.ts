export type SiteConfig = typeof siteConfig;

export const WP_REST_BASE_URL =
  "https://wordpress-597675-3975829.cloudwaysapps.com/wp-json/wp/v2";

export const siteConfig = {
  name: "HSTU Karate Dojo",
  description:
    "Power up your skill with HSTU Karate Dojo. We offer junior to senior level karate trainings. Let us take you to your next level⚡",
  keywords: [
    "HSTU Karate Dojo",
    "HKD",
    "HSTU",
    "Hajee Mohammad Danesh Science & Technology University",
    "Karate club in Dinajpur",
    "Martial arts training",
    "Karate training",
    "Self-defense classes",
    "Karate championships",
    "Karate workshops",
    "Karate seminars",
    "Physical fitness",
    "Mental acuity",
    "Karate instructors",
    "Community engagement",
    "Social responsibility",
    "Martial arts community",
    "Karate curriculum",
    "Karate values",
    "Discipline in karate",
    "Respect in martial arts",
    "Self-improvement through karate",
    "Karate for students",
    "University karate club",
    "Inclusive training environment",
    "Integrity in martial arts",
    "Perseverance in karate",
    "Camaraderie in martial arts",
    "Karate activities",
    "Join HSTU Karate Dojo",
    "Karate development",
    "Technical proficiency in karate",
    "Karate physical fitness",
  ],
  url: "https://www.hstuma.com/",
  ogImage: "https://www.hstuma.com/og-image.png",
};

export const mainNav = [
  {
    title: "Pages",
    i18nKey: "header.pages",
    items: [
      {
        title: "About",
        i18nKey: "header.about",
        href: "/about",
        items: [],
      },
      // {
      //   title: "Services",
      //   href: "/services",
      //   items: [],
      // },
      // {
      //   title: "Pricing",
      //   href: "/pricing",
      //   items: [],
      // },
      {
        title: "Contact",
        i18nKey: "header.contact",
        href: "/contact",
        items: [],
      },
      {
        title: "Programs",
        i18nKey: "header.programs",
        href: "/karate/programs",
        items: [],
      },
      {
        title: "Courses",
        i18nKey: "header.courses",
        href: "/karate/courses",
        items: [],
      },
      {
        title: "Download App",
        i18nKey: "header.downloadApp",
        href: "/dashboard/apk-download",
        items: [],
      },
      {
        title: "Developer",
        i18nKey: "header.developer",
        href: "/dev",
        items: [],
      },
    ],
  },
  // {
  //   title: "Projects",
  //   items: [
  //     {
  //       title: "Projects Listing",
  //       href: "/projects",
  //       items: [],
  //     },
  //     {
  //       title: "Single Project",
  //       href: "/projects/rocking-the-rank-1-in-the-events-industry",
  //       items: [],
  //     },
  //   ],
  // },

  // {
  //   title: "Posts",
  //   items: [
  //     {
  //       title: "Blog Listing",
  //       href: "/posts",
  //       items: [],
  //     },
  //     {
  //       title: "Single Post",
  //       href: "/posts/effective-marketing-for-start-ups",
  //       items: [],
  //     },
  //   ],
  // },
  {
    title: "EN / বাং / ने",
    i18nKey: "header.language",
    isLocaleSwitcher: true,
    items: [
      {
        title: "English",
        i18nKey: "header.languageEnglish",
        locale: "en",
        items: [],
      },
      {
        title: "বাংলা",
        i18nKey: "header.languageBangla",
        locale: "bn",
        items: [],
      },
      {
        title: "नेपाली",
        i18nKey: "header.languageNepali",
        locale: "ne",
        items: [],
      },
    ],
  },
  {
    title: "Blog",
    i18nKey: "header.blog",
    href: "/blog",
    skipLocale: true,
  },
] satisfies MainNavItem[];

export const footerNav = [
  {
    title: "Resources",
    i18nKey: "footer.resources",
    items: [
      {
        title: "About",
        i18nKey: "header.about",
        href: "/about",
        external: false,
      },
      // {
      //   title: "Services",
      //   href: "/services",
      //   external: false,
      // },
      // {
      //   title: "Pricing",
      //   href: "/pricing",
      //   external: false,
      // },
      {
        title: "Blog",
        i18nKey: "header.blog",
        href: "/blog",
        external: false,
        skipLocale: true,
      },
      {
        title: "Contact",
        i18nKey: "header.contact",
        href: "/contact",
        external: false,
      },
    ],
  },
  {
    title: "Updates",
    i18nKey: "footer.updates",
    items: [
      {
        title: "Gallery",
        i18nKey: "header.gallery",
        href: "/gallery",
        external: false,
      },
    ],
  },
] satisfies FooterItem[];

export const footerNav2 = [
  {
    title: "Solutions",
    items: [
      {
        title: "SEO Marketing",
        href: "#",
        external: false,
      },
      {
        title: "Search engine optimization",
        href: "#",
        external: false,
      },
      {
        title: "Email marketing",
        href: "#",
        external: false,
      },
      {
        title: "Social Media",
        href: "#",
        external: false,
      },
      {
        title: "Conversion rate optimization",
        href: "#",
        external: false,
      },
    ],
  },
  {
    title: "Quick Links",
    items: [
      {
        title: "Marketing Strategy",
        href: "#",
        external: false,
      },
      {
        title: "Keyword Research Explained",
        href: "#",
        external: false,
      },
      {
        title: "Why SEO Matters",
        href: "#",
        external: false,
      },
      {
        title: "Google Ads",
        href: "#",
        external: false,
      },
    ],
  },
  {
    title: "Company",
    items: [
      {
        title: "About Company",
        href: "/about",
        external: false,
      },
      // {
      //   title: "Services & Pricing",
      //   href: "/services",
      //   external: false,
      // },
      {
        title: "SEO Blog & News",
        href: "/posts",
        external: false,
      },
      {
        title: "Contact",
        href: "/contact",
        external: false,
      },
    ],
  },
] satisfies FooterItem[];
