import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
    docs: [
        {
            type: "category",
            label: "Getting Started",
            items: [
                "usage/installation",
                "usage/setup-ssl",
                "usage/setup",
                "usage/usage-guide",
            ],
        }],
    devGuide: [
        {
            type: "category",
            label: "Developer Guide",
            items: [
                "dev/contributing",
                "dev/code-style",
                "dev/project-structure",
            ],
        }],
    features: [
        {
            type: "category",
            label: "Product Features",
            items: [
                "features/overview",
                "features/integrations",
                "features/examples",
            ],
        }],
    releases: [
        {
            type: "category",
            label: "Release Notes",
            items: [
                "releases/v0.0.12",
            ],
        },
    ],
};

export default sidebars;
