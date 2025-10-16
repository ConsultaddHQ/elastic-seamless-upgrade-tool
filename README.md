# Seamless Upgrade Tool

[![Build Elastic Seamless Upgrade Tool](https://github.com/ConsultaddHQ/elastic-seamless-upgrade-tool/actions/workflows/deploy-docker.yml/badge.svg)](https://github.com/ConsultaddHQ/elastic-seamless-upgrade-tool/actions/workflows/deploy-docker.yml)

## Overview

The **Seamless Upgrade Tool** is a containerized **Java + React** application designed to facilitate **seamless upgrades of on-premise Elasticsearch clusters**. It provides a user-friendly interface for monitoring cluster status, triggering upgrades, and tracking real-time progress.

### Key Features

-   **Cluster Overview**: Displays **node count, health status, shard information**, and more.
-   **Upgrade Management**: Users can **trigger node upgrades** with a single click.
-   **Real-Time Monitoring**: Progress tracking and status updates during the upgrade process.
-   **Failure Handling**: Automatic **rollback playbook** (coming soon) for failed upgrades.

---

## Use Cases

-   **Seamless version upgrades** of on-premise **Elasticsearch clusters**.
-   **Cluster health monitoring** before and after the upgrade.
-   **Automated node upgrade management** with minimal downtime.

---

## Get Started

The way to set up the Seamless Upgrade Tool is by using **Start Script**.

### Prerequisites

-   [Docker](https://www.docker.com/get-started) installed on your machine.
-   Elasticsearch cluster accessible with **SSH credentials**.

### Run Seamless Upgrade Tool on local

To set up the **seamless-upgrade-tool** locally, use the `start.sh` script:

#### Run the latest version:

```bash
curl -fsSL https://raw.githubusercontent.com/ConsultaddHQ/elastic-seamless-upgrade-tool/main/start.sh | sh
```

#### Run a specific version:

```bash
curl -fsSL https://raw.githubusercontent.com/ConsultaddHQ/elastic-seamless-upgrade-tool/main/start.sh | sh -s -- v0.0.1
```

Once the tool is running, you can access it at:

-   **Seamless-upgrade-tool**: [http://localhost:8080](http://localhost:8080)

---

## Upgrade Process

To upgrade an Elasticsearch node:

1. **Select a node** from the UI.
2. **Click the "Upgrade" button**.
3. **Monitor real-time progress** in the dashboard.
4. **Check logs** for errors (if any).

**Rollback Feature:** Coming soon! In case of a failure, the system will trigger a rollback playbook automatically.

---

## UI walk thorugh

Step by step UI walk thorugh

### 1. Linking Elastic Search Cluster

1.  Once you'r app is up and running you will be on cluster login page where you can select on-cloud or on-premise infrastructure type.

2.  Now you will have to enter the cluster details here , elastic-search url ,kibana url ,username , password and ssh key for elastic search cluster (note: the key should be correct and should give root access to the cluster).

![Cluster details](https://i.postimg.cc/90ZsPBq3/Screenshot-2025-03-06-at-2-55-31-AM.png)

3.  On clicking continue you will be on cert upload page, here you can upload the certs if it is used to login into your cluster.

### 2. Cluster Details

Once you have completed with the details subimission our tool will fetch the cluster health and display you on cluster details page as shown
You need to select the target version you wanted to upgrade your cluster to by clicking on upgrade available dropdown

![cluster-details](https://i.postimg.cc/3xPbYC1z/Screenshot-2025-03-06-at-3-10-49-AM.png)

### 3. Upgrade assistant

1. Once selecting the target version you will be redirected to the upgrade assistant

2. it includes multiple step , first it will check whether you cluster has a snapshot within last 24 hrs , if not it will want you to take one , to know more about how to do it [click here](https://www.elastic.co/guide/en/elasticsearch/reference/current/snapshots-take-snapshot.html)

3. After validating the snapshot condition there will

4. After the step is completed then you can view the deprecated settings which you need to resolve , you cant proceed without resolving all the critical deprecated settings for both elastic-search and kibana

![upgrade assistant](https://i.postimg.cc/T1TTR072/Screenshot-2025-03-06-at-6-43-05-PM.png)

5. Once second step is completed you can go to the node-upgrade page

### 4. Elasticsearch Node upgradation

1. You can view all the nodes and there state here at this page

    ![node details](https://i.postimg.cc/x81Bx4pm/Screenshot-2025-03-06-at-6-46-12-PM.png)

2. And can trigger the update of nodes one by one note that you need to follow the order
   first data then master eligible then master nodes to know why [click here](https://www.elastic.co/guide/en/elasticsearch/reference/7.17/rolling-upgrades.html)

### 5. Kibana Upgradation

1. After upgrading elasticsearch you can go to upgrade assist page again and now you can see the option to upgrade kibana enabled

## Troubleshooting

-   **Cannot connect to Elasticsearch?**

    -   Verify **Elasticsearch is running** and accessible.
    -   Check **Docker network settings**.

-   **Upgrade stuck?**
    -   View backend logs: `docker logs backend`
    -   Check **logs** in `/app/backend/logs/app.log`

---

## Contribute

We welcome contributions! To report a bug or request a feature, create an issue on our [GitHub repository](https://github.com/ConsultaddHQ/elastic-seamless-upgrade-tool).

Need help? Join our community on Slack or our discussion forums!

---

## Documentation

For detailed documentation, visit our official [docs page](https://coda.io/d/_dVxN2aEwIbw/Elastic-Upgradation-Tool-Internal-Technical-Documentation_suY1qTH_).

---

## License

This project is licensed under the [Business Source License 1.1](./LICENSE) provided by [Hyperflex](https://hyperflex.co/) (a subsidiary of Consultadd Inc.).  
Production use is restricted until the Change Date, after which it will convert to GPL v3.0 or later.
