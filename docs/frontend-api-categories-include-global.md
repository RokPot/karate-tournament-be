# P0 — List global + club categories for tournament setup

Copy this file into the backend repo and implement against it. Source: karate tournament frontend (`karate-tournament-fe`). Auth is **Auth0 JWT** on every endpoint. After implementation, keep OpenAPI (`/docs-json`) in sync so the frontend can regenerate its client.

Do **not** add a new endpoint. Extend `GET /categories`. Frontend work waits until this ships.

Roles: `admin` | `club_owner` | `club_coach` | …

---

## Problem

Club owner/coach tournament setup calls:

```
GET /categories?clubId=<tournament.clubId>
```

Today that returns **only** that club’s custom categories. Global catalog rows (`clubId` null) are omitted. `global=true` is admin-only and means **globals only**, so it cannot be used as the union.

If the club has no custom categories, the assign-category picker is empty. Assigned global IDs also fail to hydrate on tournament detail.

---

## 1. `GET /categories` — add `includeGlobal`

Existing params stay as they are:

| Param | Type | Meaning today |
| --- | --- | --- |
| `clubId` | uuid, optional | Filter to that club’s custom categories |
| `global` | boolean, optional | When `true`, list **only** global categories (`clubId` null). Admin only. Unchanged. |

**Add:**

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `includeGlobal` | boolean, optional | `false` | When `true` **together with** `clubId`, also include global rows |

### Union rule (both params required)

When `includeGlobal=true` **and** `clubId=<uuid>`:

```
clubId IS NULL OR clubId = :clubId
```

Return both sets in **one** array of the existing `CategoryResponseDto`. Order does not matter.

Do **not** reuse `global=true` for this union. `global` stays “globals only”.

### Query matrix

| Caller | Query | Result |
| --- | --- | --- |
| `club_owner` / `club_coach` | `clubId=<own>` | Unchanged: own club only (no globals) |
| `club_owner` / `club_coach` | `clubId=<own>&includeGlobal=true` | Global ∪ own club |
| `club_owner` / `club_coach` | `clubId=<other>` (with or without `includeGlobal`) | `403` |
| `club_owner` / `club_coach` | `includeGlobal=true` without `clubId` | `400` — both params required |
| `admin` | none / `clubId=` / `global=true` | Unchanged |
| `admin` | `clubId=<uuid>&includeGlobal=true` | Same union: global ∪ that club |
| any | `global=true` together with `includeGlobal=true` | `400` — mutually exclusive |

Do **not** change the no-params default for club staff.

### Create / update / delete

Unchanged for club staff: they cannot create, edit, or delete global rows (`clubId` null). Create still defaults to the caller club.

### Status codes (`GET /categories`)

| Status | When |
| --- | --- |
| `200` | Array of `CategoryResponseDto`. Empty catalog → `[]`, not `404` |
| `400` | `includeGlobal=true` without `clubId`, or `global=true` combined with `includeGlobal=true` |
| `401` | Missing/invalid JWT |
| `403` | Club staff passing another club’s `clubId`, or roles that cannot list |

### OpenAPI

Document `includeGlobal` (boolean, optional): when `true` and `clubId` is set, list global categories (`clubId` null) **and** that club’s categories. Club staff may only pass their own `clubId`. Keep `global=true` described as “globals only”.

---

## 2. Assign categories — allow global IDs

The existing assign-categories endpoint (e.g. `POST /tournaments/:id/assign-categories`) must accept a mix of:

- global categories (`clubId` null)
- categories owned by **this tournament’s club**

Reject (`400`) IDs that belong to **another** club.

Club staff of that tournament’s club must be able to assign globals. Do **not** require `category.clubId === tournament.clubId`.

Apply the same rule if assignment is validated on create/update elsewhere.

---

## Frontend usage (after this ships)

Tournament setup / detail:

```
GET /categories?clubId=<tournament.clubId>&includeGlobal=true
```

Category catalog page stays:

```
GET /categories?clubId=<own>
```

(`includeGlobal` omitted — club custom only.)
