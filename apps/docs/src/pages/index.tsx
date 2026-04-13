import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

function HomepageHeader(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary')}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link className="button button--secondary button--lg" to="/docs/intro">
            Get Started
          </Link>
          <Link className="button button--outline button--secondary button--lg" to="/docs/api">
            API Reference
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            href="https://github.com/pradeepmouli/zod-to-form"
          >
            GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description="Schema-driven form generation for Zod v4">
      <HomepageHeader />
      <main>
        <section className="container margin-vert--xl">
          <div className="row">
            <div className="col col--4">
              <Heading as="h3">Runtime rendering</Heading>
              <p>
                Pass a Zod schema to <code>&lt;ZodForm&gt;</code> and get a validated form
                immediately. Zero boilerplate.
              </p>
            </div>
            <div className="col col--4">
              <Heading as="h3">Static codegen</Heading>
              <p>
                Run <code>z2f generate</code> at build time to emit hand-readable <code>.tsx</code>{' '}
                with no zod-to-form runtime.
              </p>
            </div>
            <div className="col col--4">
              <Heading as="h3">Zod v4 native</Heading>
              <p>
                Reads <code>_zod.def</code>, <code>.meta()</code>, and registries directly — no JSON
                Schema intermediate.
              </p>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
