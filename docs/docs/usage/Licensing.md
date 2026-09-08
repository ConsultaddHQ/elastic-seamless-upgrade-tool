# Product Licensing System
High-Level Architecture & Workflow (Interceptor-Based)

---

## 1. Purpose of This Document

This document describes the complete high-level licensing flow used in the product, including:

- How licenses are generated on the vendor side
- How customers upload the license file
- How the product validates licenses offline
- How the application restricts access when no valid license is present
- How Interceptors enforce licensing rules

This document focuses on architecture, not implementation code.

---

## 2. License Model Overview

The product uses a file-based, digitally signed licensing system.

A license file contains:

- Customer information
- Product ID and version
- Validity dates (start and expiry)
- Optional machine binding
- Feature-level permissions
- A cryptographic signature created by the vendor’s private key

The product verifies this signature using a public key bundled in the codebase.

---

## 3. Vendor-Side License Builder

The vendor uses a separate tool ("license builder") to generate license files.

Responsibilities:

1. Collect customer metadata (validity period, feature set, machine ID if required)
2. Construct the license payload
3. Digitally sign the payload using the vendor’s private key
4. Produce a `.license` file
5. Deliver the file to the customer

The license builder runs offline.  
The private key never leaves the vendor environment.

---

## 4. Product-Side License Upload Flow

The customer uploads the license file through the product UI or API.

Process:

1. Customer selects and uploads the `.license` file
2. Product reads the file and extracts the signed license data
3. Product verifies the signature using the embedded public key
4. Product parses and validates metadata (dates, machine ID, features, product ID)
5. Product stores the validated license in a secure internal location

If validation fails, the product rejects the license.

---

## 5. Continuous License Validation

The product performs regular validation to ensure the license remains valid.

Validation checks include:

- Signature validity
- Expiry and start dates
- Product ID matching
- Machine binding (if used)
- Feature rules

If a license becomes invalid (expired, tampered, missing), the product switches to an unlicensed state.

---

## 6. Feature Restriction Using Interceptors

The product uses a Spring MVC Interceptor to enforce licensing rules at request time.

Behavior:

- The interceptor runs before controllers
- It checks whether a valid license is present
- If the license is invalid, the request is blocked
- If valid, the request proceeds normally

Configuration includes:

- Paths that require a valid license
- Paths that remain open (e.g., license upload endpoint)

This ensures consistent enforcement across all protected endpoints.

---

## 7. Role of the License Service

The License Service manages the lifecycle of the license.

Responsibilities:

- Parse uploaded license files
- Validate signatures and metadata
- Store the current license state
- Supply license information to the Interceptor

The interceptor depends on this service for all license checks.

---

## 8. Application Startup Behavior

On startup:

1. The application attempts to load any previously stored license
2. The license is validated immediately
3. If valid, the product starts in an unlocked state
4. If invalid or missing, the product starts in locked mode

Locked mode restricts functionality until a valid license is uploaded.

---



This structure is conceptual and may vary based on actual implementation choices.

---

## 10. Customer Workflow Summary

1. Customer installs the product (initially locked)
2. Customer uploads the license file
3. Product validates the license
4. If valid, product unlocks full functionality
5. When the license expires, the product locks again
6. Customer requests a renewed license from the vendor

---

## 11. Security Summary

- Signature-based validation prevents tampering
- Private key stays with vendor only
- License verification works fully offline
- Interceptor ensures consistent enforcement
- License metadata rules allow flexible licensing models

---

## 12. Summary

This licensing system ensures:

- Full offline support
- Secure and tamper-proof licenses
- Simple customer experience
- Clear separation between vendor tools and product enforcement
- Consistent enforcement across protected endpoints
- Extendability for machine binding, user limits, feature-based licensing, etc.

This document provides the high-level understanding needed to implement, maintain, and extend the licensing system.

