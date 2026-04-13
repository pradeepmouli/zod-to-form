import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

function HeroBanner(): ReactNode {
  const dark = useBaseUrl('img/banner-dark.svg');
  const light = useBaseUrl('img/banner-light.svg');
  return (
    <div className="z2f-hero-banner">
      <img className="z2f-hero-banner__dark" src={dark} alt="zod-to-form" />
      <img className="z2f-hero-banner__light" src={light} alt="zod-to-form" />
    </div>
  );
}

function HomepageHeader(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary')}>
      <div className="container" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <HeroBanner />
        <p
          className="hero__subtitle"
          style={{ fontSize: '1.25rem', maxWidth: '680px', margin: '0 auto 2.5rem' }}
        >
          {siteConfig.tagline}
        </p>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          <Link className="button button--primary button--lg" to="/docs/intro">
            Get Started
          </Link>
          <Link className="button button--outline button--lg" to="/docs/api">
            API Reference
          </Link>
          <Link
            className="button button--outline button--lg"
            href="https://github.com/pradeepmouli/zod-to-form"
            style={{ borderColor: 'var(--z2f-brand)' }}
          >
            View on GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

function Feature({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return (
    <div className="col col--4" style={{ marginBottom: '1.5rem' }}>
      <div className="z2f-feature-card">
        <Heading as="h3">{title}</Heading>
        <p>{children}</p>
      </div>
    </div>
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
            <Feature title="Runtime rendering">
              Pass a Zod schema to <code>&lt;ZodForm&gt;</code> and get a validated form
              immediately. Zero boilerplate.
            </Feature>
            <Feature title="Static codegen">
              Run <code>z2f generate</code> at build time to emit hand-readable <code>.tsx</code>{' '}
              with no zod-to-form runtime.
            </Feature>
            <Feature title="Zod v4 native">
              Reads <code>_zod.def</code>, <code>.meta()</code>, and registries directly — no JSON
              Schema intermediate.
            </Feature>
          </div>
        </section>
      </main>
    </Layout>
  );
}
