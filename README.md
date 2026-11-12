# crossub_mobile_tenant_v2

Tenant app for CROSSUB. It is an Expo client, built in the same workspace shape as the inspector app in `crossub_mobile`.

The phone icon, splash image and Android adaptive icon are the inspector app icon. The bundle id is `com.crossub.tenant`, so it can sit beside CROS Inspect on a device.

## What this build does

Five tabs: Home, Activity, Inbox, Payments, Profile. The screens follow the confirmed tenant prototype: action-first home, one task list, Cros inside Inbox, and payments that change with the accounting source.

Sign in with any email and password. On Profile, switch the preview scenario:

- Full Service · Crossub Trust shows the verified ledger, part payments, receipts and arrears.
- Full Service · Agent Trust, and Self-Manage · Agent Trust, keep contractual rent and published payment instructions. They do not invent paid-to or arrears.
- Self-Manage · Crossub Accounting keeps the agency as the contact and still shows the verified ledger.

There is no Pay Now action. A previous tenancy can be opened from My properties, and new maintenance stays closed there.

## What this build does not do

It does not call the inspector API. Tenant reads and writes need their own facade over the existing tenancy, maintenance, inspection, accounting and conversation services. Until that facade exists, actions update local preview state on the device.

## Run

```bash
pnpm install
pnpm dev:native
```

Web preview:

```bash
pnpm web
```

Node 20+ and pnpm 9+. iOS and Android device builds use the same Expo SDK as the inspector app.
