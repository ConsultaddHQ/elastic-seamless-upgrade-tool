import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Elastic Seamless Upgrade Tool",
  tagline: "Elastic Upgrades Made Easy.",
  favicon: "img/favicon.ico",

  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  url: "https://ConsultaddHQ.github.io", // Your GitHub Pages URL
  baseUrl: "/elastic-seamless-upgrade-tool/", // Your repository name with a trailing slash
  organizationName: "ConsultaddHQ",
  projectName: "elastic-seamless-upgrade-tool",
  deploymentBranch: "gh-pages", // Optional: default is gh-pages
  trailingSlash: false,
  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },
          onInlineTags: "warn",
          onInlineAuthors: "warn",
          onUntruncatedBlogPosts: "warn",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/docusaurus-social-card.jpg",
    navbar: {
      title: "Elastic Seamless Upgrade Tool",
      logo: {
        alt: "Hyperflex logo",
        src: "img/img.png",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docs",
          position: "left",
          label: "Docs",
        },
        { to: "/blog", label: "Blog", position: "left" },
        {
          href: "https://github.com/ConsultaddHQ/elastic-seamless-upgrade-tool",
          label: "GitHub",
          position: "right",
        },
        {
          type: 'docsVersionDropdown',
          position: 'right',
          dropdownActiveClassDisabled: true,
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Community",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/ConsultaddHQ/elastic-seamless-upgrade-tool",
            },
            {
              label: "Blog",
              to: "/blog",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Hyperflex. All Rights Reserved`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
    colorMode: {
      defaultMode: "dark", // always start in dark mode
      respectPrefersColorScheme: false, // ignore user OS/browser color preference
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
