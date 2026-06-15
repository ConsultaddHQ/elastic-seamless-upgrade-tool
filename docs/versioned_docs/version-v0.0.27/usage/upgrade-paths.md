# Upgrade Paths

This page documents the **supported Elasticsearch upgrade paths** enforced by the **Elastic Seamless Upgrade Tool**.  
The goal is to ensure **safe, predictable, and supported upgrades** while avoiding data loss, cluster instability, or
unsupported states.

---

## General Upgrade Rule (Most Important)

An upgrade is supported **only if the target version was released after the current version**.

This means:

- You **cannot upgrade** to a version that was released earlier, even if the version number appears higher.
- Version numbers alone are **not sufficient**—release order matters.

### Applies To

- Same major upgrades (for example, `8.6 → 8.11`)
- Cross-major upgrades (for example, `8.19 → 9.0`)
- Rolling upgrades and full cluster restarts

❌ Downgrades or **out-of-order upgrades** are never supported.

---

## Supported Upgrade Paths

### Same Major Version

Supported paths:

- `7.x → 7.x`
- `8.x → 8.x`
- `9.x → 9.x`

Conditions:

- The **target version must be released later** than the current version.
- Skipping minor versions is allowed **as long as release order is respected**.

Examples:

- ✅ `8.10.2 → 8.18.1`
- ❌ `8.18.0 → 8.17.5` (target version released earlier)

---

### Upgrade from 8.x to 9.x

Cross-major upgrades require **specific minimum starting versions** due to internal breaking changes and migration
requirements.

#### Upgrade to 9.0.x

- **Minimum required version:** `8.18.x`
- Earlier 8.x versions cannot upgrade directly to 9.0.x

Example:

- ✅ `8.18.0 → 9.0.5`
- ❌ `8.17.9 → 9.0.0`

Reason:

- Version `8.18` introduces the required compatibility and migration changes needed for 9.0.

---

#### Upgrade to 9.1.0 and Later

- **Minimum required version:** `8.19.x`
- `8.18.x` is **not sufficient** for 9.1.x and later

Example:

- ✅ `8.19.0 → 9.3.0`
- ❌ `8.18.2 → 9.1.0`

> **Note:**  
> `8.19` is the **final minor release of the 8.x series** and acts as the primary bridge to newer 9.x versions.

---

### Upgrade from 7.17

Upgrading from 7.x requires **two sequential major upgrades**.

Required sequence:

1. `7.17.x → 8.19.x`
2. `8.19.x → 9.x`

Direct upgrades from `7.17.x → 9.x` are **not supported**.

Examples:

- ✅ `7.17.12 → 8.19.0 → 9.0.3`
- ❌ `7.17.12 → 9.0.0`

---

## Unsupported Upgrade Paths

The following upgrade paths are explicitly unsupported:

- `7.x (< 7.17) → 8.x`
- `8.x (< 8.18) → 9.0.x`
- `8.18.x → 9.1.x+`
- Any downgrade (for example, `8.10 → 8.9`)
- Any upgrade where the target version was released earlier
- Skipping major versions (for example, `7 → 9`)

These paths may result in:

- Cluster startup failures
- Index incompatibility
- Data loss or corruption
- Unsupported cluster states

---

## Clients and Ingest Tools

### Elastic Agent, Beats, and Logstash

- Version **8.19**
    - Compatible with **all 9.x** Elasticsearch versions
    - Recommended when upgrading clusters to 9.x

---

### Elasticsearch Clients

- **8.x clients**
    - Compatible with 9.x clusters using **REST API compatibility mode**
    - Allows gradual client upgrades after the cluster upgrade

**Best practice:**

1. Upgrade the Elasticsearch cluster first
2. Upgrade clients and ingest tools afterward

---

## Best Practices Before Upgrading

Before starting any upgrade:

- Review breaking changes for the target version
- Resolve all deprecation warnings
- Verify index compatibility
- Take and validate full cluster snapshots
- Ensure all plugins are compatible with the target version

---

## Reference

These upgrade rules are based on the **official Elasticsearch upgrade documentation** and are enforced by the **Elastic
Seamless Upgrade Tool** to ensure supported and safe upgrade paths.