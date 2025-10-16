---
id: create-user
title: Create a New User
sidebar_label: Create User
---

# Create a New User

This guide explains how to create a new user for the **Seamless Upgrade Tool** using the built-in command-line script.

---

## Why use this method?

The tool does **not expose a public signup UI**.  
Only users with **host-level access** to the server or VM running the tool can create new accounts.  
This ensures that only trusted administrators can manage access.

---

## Prerequisites

- The Seamless Upgrade Tool container is running.
- You have **Docker** or **Podman** access to the host.

Check running containers:

```bash
# Docker
docker ps

# Podman
podman ps
````

Example output:

```
CONTAINER ID   NAME                   STATUS
1234abcd5678   seamless-upgrade-tool  Up 5 minutes
```

---

## Create a User with Docker

Run the interactive user creation script inside the container:

```bash
docker exec -it seamless-upgrade-tool /scripts/create-user
```

You’ll be prompted for:

* **Username**
* **Password**

Example session:

```
Enter username: admin
Enter password: ******
✅ User created successfully!
```

---

## Create a User with Podman

If you are using **Podman**, the command is almost identical:

```bash
podman exec -it seamless-upgrade-tool /scripts/create-user
```

You’ll be prompted for:

* **Username**
* **Password**

Example session:

```
Enter username: admin
Enter password: ******
✅ User created successfully!
```

---

Once the user is created, they can log in from the web UI using their credentials.
