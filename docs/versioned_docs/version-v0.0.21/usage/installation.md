# Installation

Welcome to the **Elastic Seamless Upgrade Tool** installation guide. Follow these steps to get your local environment
running and start upgrading Elasticsearch clusters effortlessly.

---

## Prerequisites

Before setting up the Elastic Seamless Upgrade Tool, make sure you have:

- **VM or Local Machine**: A VM to install the tool, or your local machine if it meets all requirements.
- **Network Access**: The VM should be in the same VPC as your Elasticsearch cluster so the tool can reach nodes via
  private IPs.
- **Cluster Access**: Ensure your cluster allows traffic from the VM.
- **Container Runtime**: Docker or Podman installed on the machine.
- **SSH:** Ensure SSH access using a user and key pair, with passwordless sudo privileges enabled.

---

## Running the Seamless Upgrade Tool

Use the official **start script** to launch the tool.

### Using Docker

```bash
curl -fsSL https://raw.githubusercontent.com/ConsultaddHQ/elastic-seamless-upgrade-tool/main/start.sh | sh -s -- v0.0.21
```

### Using Podman

```bash
curl -fsSL https://raw.githubusercontent.com/ConsultaddHQ/elastic-seamless-upgrade-tool/main/start-pm.sh | sh -s -- v0.0.21
````

After starting, access the tool at:

* [https://localhost:8080](https://localhost:8080)

---

## Next Steps

- **Add Cluster**: Add the cluster that needs to be upgraded using the UI.
- **Prechecks**: Perform prechecks before starting upgrades.
- **Review Changes**: Check for breaking changes and plugin compatibility.
- **Upgrade cluster**: Use the tool to upgrade safely with minimal downtime.
