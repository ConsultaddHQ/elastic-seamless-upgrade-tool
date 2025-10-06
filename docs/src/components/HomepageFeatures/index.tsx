import type { ReactNode } from "react";
import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<"svg">>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Data Snapshot Verification",
    Svg: require("@site/static/img/undraw_backup.svg").default,
    description: (
      <>
        Verify data snapshots and backups before performing upgrades to ensure
        your data is safe and recoverable.
      </>
    ),
  },
  {
    title: "Precheck & Reports",
    Svg: require("@site/static/img/undraw_report.svg").default, // replace with relevant SVG
    description: (
      <>
        Analyze your cluster before upgrading with comprehensive prechecks and
        detailed reports to ensure a smooth transition.
      </>
    ),
  },
  {
    title: "Breaking Changes Detection",
    Svg: require("@site/static/img/undraw_warning.svg").default,
    description: (
      <>
        Identify potential breaking changes in your Elasticsearch cluster and
        plugins, so you can plan upgrades safely.
      </>
    ),
  },
  {
    title: "User-Friendly Upgrade UI",
    Svg: require("@site/static/img/undraw_dashboard.svg").default,
    description: (
      <>
        Upgrade your cluster effortlessly via an intuitive UI with real-time
        status updates on upgrade progress.
      </>
    ),
  },
  {
    title: "Plugin Compatibility Checks",
    Svg: require("@site/static/img/undraw_plugin.svg").default,
    description: (
      <>
        Detect installed plugins and verify their compatibility with the target
        Elasticsearch version before upgrading.
      </>
    ),
  },
  {
    title: "Effortless Cluster Upgrades",
    Svg: require("@site/static/img/undraw_upgrade.svg").default,
    description: (
      <>
        Simplify the upgrade process with automation and guided workflows,
        minimizing downtime and errors.
      </>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4", styles.featureCard)}>
      <div className="card shadow--md hover:shadow--lg transition-all duration-200 h-full">
        <div className="card__body text--center">
          <Svg className={styles.featureSvg} role="img" />
          <Heading as="h3" className="margin-top--sm">
            {title}
          </Heading>
          <p className="margin-top--sm">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={clsx(styles.features, "padding-vert--xl")}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
