# Stripe Invoice → HubSpot Integration

A Node.js/Express.js integration that automatically synchronizes Stripe invoice data with a custom object in HubSpot.

## Overview

This service listens for invoice events from Stripe Webhooks, processes the incoming invoice data, and synchronizes it with a dedicated HubSpot Custom Object.

When a relevant invoice event is received, the integration uses the Stripe Invoice ID to determine whether the invoice already exists in HubSpot. It then creates a new record or updates the existing record accordingly, keeping invoice information synchronized between Stripe and HubSpot.

## Integration Flow

```text
Stripe
   │
   │ Invoice Webhook
   ▼
Node.js / Express.js
   │
   │ Process & Map Data
   ▼
HubSpot API
   │
   ▼
HubSpot Custom Object
   │
   ├── Create Invoice
   └── Update Invoice
```

## Key Features

*   **Webhook Listener:** Listens for Stripe invoice webhook events.
*   **Data Mapping:** Processes and maps Stripe invoice data to HubSpot schema.
*   **CRM Sync:** Creates invoice records in a HubSpot Custom Object.
*   **Idempotency:** Updates existing HubSpot records when invoice data changes and uses the Stripe Invoice ID to prevent duplicate records.
*   **Automation:** Provides automated synchronization between Stripe and HubSpot.
*   **Architecture:** Built with a modular Node.js/Express.js backend.

## Technologies

*   Node.js
*   Express.js
*   Stripe Webhooks & Stripe API
*   HubSpot CRM API & Custom Objects
*   REST APIs & Webhook Event Processing
*   Data Synchronization

## Purpose

The integration eliminates manual invoice data entry and makes Stripe invoice information available directly within HubSpot, allowing teams to access relevant billing information alongside their CRM data.
