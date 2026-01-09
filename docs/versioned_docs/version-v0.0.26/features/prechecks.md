---
title: Prechecks
---

# Prechecks

This document lists all the prechecks supported by the tool.

## Cluster Level Prechecks

- Cluster allocation setting check
- Cluster health check
- Elastic Deprecations
- Even shard distribution across data nodes
- High Availability Check: minimum 2 nodes for each role
- Kibana Deprecations
- Minimum number of master-eligible nodes
- No relocating shards

## Index Level Prechecks

- Mapped Field Count Check
- Lucene index compatibility
- Unassigned or Initializing Shards Check

## Node Level Prechecks

### Elasticsearch
- Support matrix check
- Disk Utilization Check
- Manually Installed Plugins Check
- Elasticsearch Version Check
- File Descriptor Limit Check
- Ingest Node Load Check
- JVM Distribution (Bundled/Custom) Check
- JVM heap settings check
- JVM Heap Usage Check
- CPU Utilization check
- Memory Utilization check

### Kibana
- Support matrix check
- Disk Utilization Check
- Manually Installed Plugins Check
- Kibana Version Check
- CPU Utilization check
- Memory Utilization check
