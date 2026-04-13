import { themes as prismThemes } from 'prism-react-renderer';
import type { Config, Plugin } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Escape JSX-like tokens in non-code regions of a markdown file so Docusaurus's
 * MDX pipeline doesn't try to parse JSDoc snippets like `<FormProvider>` as
 * unclosed JSX. Leaves fenced code blocks and inline code spans untouched.
 */
function escapeJsxLike(src: string): string {
  let out = '';
  let i = 0;
  let inFence = false;
  const lines = src.split('\n');
  for (let ln = 0; ln < lines.length; ln++) {
    const line = lines[ln] ?? '';
    if (line.startsWith('```')) {
      inFence = !inFence;
      out += line + (ln < lines.length - 1 ? '\n' : '');
      continue;
    }
    if (inFence) {
      out += line + (ln < lines.length - 1 ? '\n' : '');
      continue;
    }
    // Walk the line, skipping inline-code spans.
    let result = '';
    let j = 0;
    while (j < line.length) {
      const ch = line[j];
      if (ch === '`') {
        const close = line.indexOf('`', j + 1);
        if (close !== -1) {
          result += line.slice(j, close + 1);
          j = close + 1;
          continue;
        }
      }
      if (ch === '<') {
        const next = line[j + 1] ?? '';
        // Escape `<Uppercase...`, `</...`, or `<{` — none of these are valid
        // Markdown constructs and all choke MDX when unbalanced.
        if (/[A-Z/{]/.test(next)) {
          result += '&lt;';
          j++;
          continue;
        }
      }
      if (ch === '{') {
        // Escape `{` in prose so MDX doesn't try to parse it as a JSX
        // expression. Safe because fenced code and inline code are already
        // skipped above.
        result += '&#123;';
        j++;
        continue;
      }
      if (ch === '}') {
        result += '&#125;';
        j++;
        continue;
      }
      result += ch;
      j++;
    }
    out += result + (ln < lines.length - 1 ? '\n' : '');
  }
  void i;
  return out;
}

/**
 * Inline Docusaurus plugin: walks `docs/api/` (populated earlier by
 * `docusaurus-plugin-typedoc`) and escapes JSX-like sequences in every
 * generated markdown file. JSDoc descriptions can contain raw angle brackets
 * (e.g. `<FormProvider>`) that MDX would otherwise treat as unclosed JSX.
 */
function patchApiFrontmatterPlugin(): Plugin {
  return {
    name: 'zod-to-form-patch-api-frontmatter',
    async loadContent() {
      const root = join(__dirname, 'docs', 'api');
      const walk = (dir: string): void => {
        let entries: string[];
        try {
          entries = readdirSync(dir);
        } catch {
          return;
        }
        for (const entry of entries) {
          const p = join(dir, entry);
          const s = statSync(p);
          if (s.isDirectory()) {
            walk(p);
            continue;
          }
          if (!entry.endsWith('.md') && !entry.endsWith('.mdx')) continue;
          const src = readFileSync(p, 'utf8');
          writeFileSync(p, escapeJsxLike(src));
        }
      };
      walk(root);
    }
  };
}

// Deploy target: Cloudflare Pages sets CF_PAGES=1 automatically.
// GitHub Pages keeps the legacy /zod-to-form/ subpath.
const isCloudflarePages = process.env.CF_PAGES === '1';

const config: Config = {
  title: 'zod-to-form',
  tagline: 'Schema-driven form generation for Zod v4',
  favicon: 'img/favicon.svg',

  url: isCloudflarePages ? 'https://zod.toform.dev' : 'https://pradeepmouli.github.io',
  baseUrl: isCloudflarePages ? '/' : '/zod-to-form/',

  organizationName: 'pradeepmouli',
  projectName: 'zod-to-form',

  // CF Pages build with baseUrl '/' triggers false-positive broken-link reports
  // on typedoc-generated cross-package relative links. Warn instead of throw.
  onBrokenLinks: isCloudflarePages ? 'warn' : 'throw',
  onBrokenMarkdownLinks: isCloudflarePages ? 'warn' : 'throw',

  headTags: [
    {
      tagName: 'link',
      attributes: { rel: 'preconnect', href: 'https://fonts.googleapis.com' }
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossorigin: 'anonymous'
      }
    }
  ],

  stylesheets: [
    {
      href: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&family=Outfit:wght@500;700&display=swap',
      type: 'text/css'
    }
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en']
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/pradeepmouli/zod-to-form/tree/master/apps/docs/'
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css'
        }
      } satisfies Preset.Options
    ]
  ],

  plugins: [
    [
      'docusaurus-plugin-typedoc',
      {
        id: 'api',
        entryPoints: [
          '../../packages/core/src/index.ts',
          '../../packages/react/src/index.ts',
          '../../packages/cli/src/index.ts',
          '../../packages/codegen/src/index.ts'
        ],
        entryPointStrategy: 'resolve',
        tsconfig: '../../tsconfig.typedoc.json',
        out: './docs/api',
        skipErrorChecking: true,
        excludePrivate: true,
        excludeInternal: true,
        readme: 'none',
        useHTMLEncodedBrackets: true,
        blockTags: [
          '@useWhen',
          '@avoidWhen',
          '@pitfalls',
          '@alpha',
          '@beta',
          '@category',
          '@categoryDescription',
          '@default',
          '@defaultValue',
          '@deprecated',
          '@example',
          '@experimental',
          '@group',
          '@groupDescription',
          '@inheritDoc',
          '@internal',
          '@label',
          '@link',
          '@linkcode',
          '@linkplain',
          '@module',
          '@packageDocumentation',
          '@param',
          '@privateRemarks',
          '@public',
          '@readonly',
          '@remarks',
          '@returns',
          '@sealed',
          '@see',
          '@since',
          '@throws',
          '@typeParam',
          '@virtual'
        ],
        sidebar: {
          autoConfiguration: true,
          pretty: true
        }
      }
    ],
    patchApiFrontmatterPlugin
  ],

  themeConfig: {
    image: 'img/social-card.png',
    navbar: {
      title: 'zod-to-form',
      logo: {
        alt: 'zod-to-form',
        src: 'img/logo.svg',
        width: 36,
        height: 30
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs'
        },
        {
          to: '/docs/api',
          label: 'API Reference',
          position: 'left'
        },
        {
          // TODO: replace with the hosted playground URL once deployed.
          href: 'https://pradeepmouli.github.io/zod-to-form-playground/',
          label: 'Playground',
          position: 'left'
        },
        {
          href: 'https://github.com/pradeepmouli/zod-to-form',
          label: 'GitHub',
          position: 'right'
        }
      ]
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Introduction', to: '/docs/intro' },
            { label: 'Quickstart', to: '/docs/quickstart' },
            { label: 'API Reference', to: '/docs/api' }
          ]
        },
        {
          title: 'Packages',
          items: [
            {
              label: '@zod-to-form/core',
              href: 'https://www.npmjs.com/package/@zod-to-form/core'
            },
            {
              label: '@zod-to-form/react',
              href: 'https://www.npmjs.com/package/@zod-to-form/react'
            },
            {
              label: '@zod-to-form/cli',
              href: 'https://www.npmjs.com/package/@zod-to-form/cli'
            },
            {
              label: '@zod-to-form/codegen',
              href: 'https://www.npmjs.com/package/@zod-to-form/codegen'
            }
          ]
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/pradeepmouli/zod-to-form'
            },
            {
              label: 'Issues',
              href: 'https://github.com/pradeepmouli/zod-to-form/issues'
            }
          ]
        }
      ],
      copyright: `Copyright (c) ${new Date().getFullYear()} Pradeep Mouli. Built with Docusaurus.`
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'tsx', 'typescript']
    },
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: false
    }
  } satisfies Preset.ThemeConfig
};

export default config;
