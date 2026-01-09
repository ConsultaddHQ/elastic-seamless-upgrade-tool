---
id: user-management
title: User Management
sidebar_label: User Management
---

# User Management

The Seamless Upgrade Tool includes a built-in CLI for managing users inside the container.  
This guide covers how to create, list, remove, and reset passwords for user accounts.

---

## Why use this CLI?

- There is **no public signup UI** for the tool.
- User management is restricted to trusted administrators.
- The CLI must be run from **inside the container** with host-level access.

---

## Prerequisites

- The Seamless Upgrade Tool container is running.
- You have Docker or Podman access to the host machine.

Check running containers:

```bash
docker ps
# or
podman ps
````

Expected output:

```
CONTAINER ID   NAME                   STATUS
1234abcd5678   seamless-upgrade-tool  Up 5 minutes
```

---

## Command Overview

Supported commands:

| Command          | Description             |
| ---------------- | ----------------------- |
| `create`         | Create a new user       |
| `list`           | List all existing users |
| `remove`         | Remove (delete) a user  |
| `reset-password` | Reset a user's password |

---

## Creating a User

### Docker

```bash
docker exec -it seamless-upgrade-tool /scripts/user create
```

### Podman

```bash
podman exec -it seamless-upgrade-tool /scripts/user create
```

You will be prompted for:

* **Username**
* **Password**

Example output:

```
Creating a new user...
Username: admin
Password: ********
Response Code: 201
User 'admin' created successfully.
```

---

## Listing Users

```bash
docker exec -it seamless-upgrade-tool /scripts/user list
```

Example output:

```
Fetching user list...
Response Code: 200
Users:
- admin
- alice
- bob
```

If no users exist:

```
Response Code: 200
No users found.
```

---

## Removing a User

```bash
docker exec -it seamless-upgrade-tool /scripts/user remove
```

You will be prompted for the username to remove.

Example output:

```
Username to remove: alice
Response Code: 200
User 'alice' removed successfully.
```

If the user doesn’t exist:

```
Response Code: 404
User 'alice' not found.
```

---

## Resetting a Password

```bash
docker exec -it seamless-upgrade-tool /scripts/user reset-password
```

You will be prompted for:

* **Username**
* **New Password**

Example output:

```
Username to reset password: admin
New password: ********
Response Code: 200
Password for user 'admin' was reset successfully.
```

---

## Notes

* All passwords are entered securely (input hidden).
* The script does **not accept passwords as command-line arguments** for security reasons.
* Responses include the HTTP status code for debugging and clarity.

---

## Need Help?

If you're having issues running the script, ensure:

* The container is running and healthy.
* You are using the correct container name (e.g. `seamless-upgrade-tool`).
* The script has executable permissions inside the container.
