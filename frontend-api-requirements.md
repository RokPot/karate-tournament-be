# Frontend API requirements

Copy this file into the backend repo and implement against it. Source: karate tournament frontend (`karate-tournament-fe`). Auth is **Auth0 JWT** on every endpoint unless marked **public**. After each change, keep OpenAPI (`/docs-json`) in sync — the frontend regenerates its client from that.

## Roles

`UserResponseDto.roles` values:

`admin` | `club_owner` | `club_coach` | `club_member` | `free_member` | `judge`

Frontend resolves the dashboard from the first match: admin → club_owner / club_coach → club_member → judge → free_member.

## Remaining work

| Priority | Work | Why |
| --- | --- | --- |
| **P0** | [§2 Tournament request approval](#2-p0-tournament-request-approval) | Club owner/coach create a **request**; SuperAdmin (`admin`) must approve before registration / public access open |
| **P0** | [§1 Registration counts per tournament category](#1-p0-registration-counts-per-tournament-category) | Tournament detail accordion needs a count on every category without fetching every registration |

Existing endpoints the frontend already calls must keep working.

---

## 1. P0 — Registration counts per tournament category

### Problem

Tournament detail is an accordion of assigned categories. Each collapsed row must show **how many people registered in that category** so organizers can scan the whole tournament without opening every panel.

Today the frontend can only derive a count by fetching the full list:

```
GET /registrations/by-tournament?tournamentId=&categoryId=
```

That is the **expand** path (keep it). It is the wrong path for header counts:

- Opening every category just to read `registrations.length` downloads every attendee
- Categories with **zero** registrations never appear in a list response, so `length` cannot drive the accordion — empty categories would look the same as “unknown”

The frontend ships with `0` on every category until this exists. Do not make the frontend call a counts URL that 404s.

### Required: counts for every assigned category, including zero

One summary that includes **every category assigned to the tournament**, including `registrationCount: 0`. Never omit zeros.

**Option A (preferred)**

```
GET /registrations/by-tournament/counts?tournamentId=
```

Query:

| Param | Type | Notes |
| --- | --- | --- |
| `tournamentId` | uuid, required | Tournament to summarize |

Response `200`:

```json
[
  { "categoryId": "123e4567-e89b-12d3-a456-426614174000", "registrationCount": 12 },
  { "categoryId": "223e4567-e89b-12d3-a456-426614174001", "registrationCount": 0 }
]
```

| Field | Type | Notes |
| --- | --- | --- |
| `categoryId` | uuid | Must be assigned to this tournament |
| `registrationCount` | integer ≥ 0 | Registrations in that category for this tournament |

Auth / roles: **same as** `GET /registrations/by-tournament` — `admin`; `club_owner` / `club_coach` of that tournament’s club.

| Status | When |
| --- | --- |
| `200` | Body is an array. Tournament with **no** categories → `[]`. Empty is not `404` |
| `401` | Missing/invalid JWT |
| `403` | Authenticated but not allowed to see this tournament’s registrations |
| `404` | Tournament does not exist |

One row per assigned category. Order should match tournament category assignment order when the API already has one.

**Option B:** embed `registrationCount` on each assigned category when the tournament is loaded (`GET /tournaments/:id` returns full categories the way public lite already returns `categories[]`). Same zero-included rule. Prefer Option A if you do not want to change the tournament DTO.

### Already available — do not rebuild

Accordion **expand** already uses:

```
GET /registrations/by-tournament?tournamentId=&categoryId=
```

Keep that for the attendee table inside the panel. This section is **only** the collapsed-row counts. Keep OpenAPI (`/docs-json`) in sync so the frontend can regenerate the client.

---

## 2. P0 — Tournament request approval

### Problem

Club owner/coach can write up a full tournament (name, dates, location, categories), but that must **not** become publicly active until a SuperAdmin (`admin`) approves it. Until then it is a **tournament request**.

Today `POST /tournaments` creates an immediately usable tournament: public lite, registration page, and `POST /registrations/public*` all work with no approval step. There is **no** `status` on `TournamentResponseDto`.

### Product rules

| Actor | Create | After create | Registration / public |
| --- | --- | --- | --- |
| `admin` | Unchanged. Tournament is **approved** immediately | Full detail, same as today | Unlocked |
| `club_owner` / `club_coach` | Same create body as today. Result is `status: pending` | They **can** open authenticated detail and finish setup (categories, dates, assign categories) | **Locked** until approved |
| Other roles / anonymous | Cannot create | Pending/declined tournaments are invisible (`404`) | Only `approved` tournaments exist |

Declined requests stay visible to the creating club. Registration stays locked. Club staff may edit and **resubmit** (`pending` again). Admin Pending tab lists **`pending` only**; a declined request reappears there after resubmit.

**Migration:** every existing tournament row must be `status: approved`. Do not leave `status` null.

Frontend surfaces:

- Admin `/tournaments/`: tabs **Active** (`status=approved`) and **Pending** (`status=pending`). Approve / Decline on the pending list and on detail.
- Admin dashboard: Active only (`GET /tournaments?status=approved`).
- Club `/tournaments/` and `GET /clubs/:id/tournaments`: status column; create for owner **and** coach.
- Tournament detail: status pill; Registration button enabled only when `approved`; admin Approve/Decline when `pending`; club Resubmit when `declined`.
- Public `/tournament/:id/registration`: unavailable unless `approved`.

### 2.1 Model — add approval status on the tournament

Same entity. Do **not** introduce a separate `tournament_requests` table/resource.

Include on **`TournamentResponseDto`** (list, get-by-id, create, update, assign-categories, approve, decline, resubmit):

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `status` | `pending` \| `approved` \| `declined` | yes | Approval state. Not a lifecycle (upcoming/ongoing/completed) |
| `reviewedAt` | ISO-8601 datetime \| null | yes (nullable) | Set on approve and decline. Cleared on resubmit. Null until first review |
| `reviewedBy` | uuid \| null | yes (nullable) | Admin user id who last approved/declined. Null until first review |
| `reviewNote` | string \| null | yes (nullable) | Decline reason when provided. Null on approve. Club may send a note on resubmit; otherwise clear |

Existing fields stay (`id`, `name`, `location`, `startDate`, `registrationDeadline`, `createdBy`, `createdByUser`, `clubId`, `club`, `categoryIds`, `createdAt`, `updatedAt`).

`TournamentPublicLiteResponseDto` does **not** need `status`. Public lite is `404` unless the tournament is `approved` (see §2.6).

### 2.2 Create — `POST /tournaments`

Body unchanged (`CreateTournamentDto`: `name`, `location`, `startDate`, `registrationDeadline`, optional `clubId`).

| Caller | `clubId` | Resulting `status` |
| --- | --- | --- |
| `admin` | Optional. Omit/null → unassigned. Set → that club | `approved`. `reviewedAt` / `reviewedBy` / `reviewNote` remain null (no review happened) |
| `club_owner` | Force caller’s `user.clubId`. Ignore a different id or `403` | `pending` |
| `club_coach` | Same as owner | `pending` |
| Other roles | — | `403` |

Club staff **must** have a `clubId` on the user. `400` if a club user has no club.

Response `201`: `TournamentResponseDto` including `status`.

Club staff may immediately `PUT /tournaments/:id`, `PUT /tournaments/:id/categories`, and `POST /categories/create-and-assign` on a **pending** tournament they own — setup is allowed before approval.

### 2.3 List — `GET /tournaments?status=`

```
GET /tournaments
GET /tournaments?status=pending
GET /tournaments?status=approved
GET /tournaments?status=declined
```

| Param | Type | Notes |
| --- | --- | --- |
| `status` | `pending` \| `approved` \| `declined` | Optional. When set, filter to that value **and** still apply the role visibility rules below |

Visibility (apply **after** the optional status filter):

| Caller | Omitted `status` | `status=approved` | `status=pending` | `status=declined` |
| --- | --- | --- | --- | --- |
| `admin` | All tournaments | All approved | All pending | All declined |
| `club_owner` / `club_coach` | All **approved** (any club) **plus** their club’s pending and declined | All approved | **Own club only** | **Own club only** |
| `judge` | Approved only | Approved only | `403` or empty `[]` (preferred: `[]`) | `[]` |
| `free_member` / `club_member` | Do not use this list for dashboards (`/registered` or club). If called: approved only | Approved only | `[]` | `[]` |
| Other | `403` | `403` | `403` | `403` |

Club staff must **never** see another club’s pending or declined requests.

Sort: same as today (`startDate` descending, or current default). Empty list: `200` `[]`, not `404`.

Admin UI:

| Tab | Call |
| --- | --- |
| Active | `GET /tournaments?status=approved` |
| Pending | `GET /tournaments?status=pending` |

Club `/tournaments/` calls **omitted** `status` so the table can show approved tournaments plus the club’s own requests, with a status column.

### 2.4 Club list — `GET /clubs/:id/tournaments`

Auth unchanged (admin, or member of `:id`).

Return **all statuses** for that club (`pending`, `approved`, `declined`). Include `status` / review fields on each row.

Club members of another club still `403`.

### 2.5 Get by id — authenticated `GET /tournaments/:id`

| Caller | `approved` | `pending` / `declined` |
| --- | --- | --- |
| `admin` | `200` | `200` |
| `club_owner` / `club_coach` of the tournament’s club | `200` | `200` (needed for setup and status) |
| Other authenticated users | `200` | `404` (do not leak that a request exists) |
| Unknown id | `404` | `404` |

Same `404` for “does not exist” and “you may not see this pending request”.

### 2.6 Public lite and public registration — only approved

```
GET /tournaments/public/:id
```

**Public.** `200` only when `status === approved`. Otherwise `404` (same as unknown id). Do not return pending/declined payloads.

All public registration endpoints that take a `tournamentId` must reject non-approved tournaments:

```
POST /registrations/public
POST /registrations/public/bulk
GET  /registrations/public/suitable-categories
POST /registrations/public/suitable-categories/bulk
POST /registrations/public/suitable-categories/by-category
```

| Status | When |
| --- | --- |
| `404` | Tournament missing **or** not `approved` (preferred for public GET lite — do not advertise pending ids) |
| `400` | Acceptable on POST register if you prefer an explicit “registration is not open” message. Be consistent |

Authenticated `POST /registrations` (non-public) must also refuse unless `approved` (`400`). Organizers listing registrations on a pending tournament may get `200` `[]`.

`GET /tournaments/registered` must only return **approved** tournaments (a user cannot have a registration on a pending request if public register is locked; still filter).

### 2.7 Approve — `POST /tournaments/:id/approve`

**Auth:** `admin` only. Other roles: `403`.

No body (or empty object).

| Current `status` | Result |
| --- | --- |
| `pending` | Set `approved`. Set `reviewedAt` now, `reviewedBy` = caller. Clear `reviewNote` |
| `declined` | Same as pending — admin may approve a declined request from detail if they still have the id. Preferred path is club resubmit first |
| `approved` | `400` — already approved |

Response `200`: `TournamentResponseDto`.

`404` if the tournament does not exist.

Approving **unlocks** public lite and public registration. No other fields change.

### 2.8 Decline — `POST /tournaments/:id/decline`

**Auth:** `admin` only.

```json
{
  "reason": "Dates clash with an existing championship"
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `reason` | no | Max length 1000. Stored as `reviewNote`. Empty/omitted → `reviewNote` null |

| Current `status` | Result |
| --- | --- |
| `pending` | Set `declined`. Set `reviewedAt`, `reviewedBy`. Set `reviewNote` from `reason` |
| `approved` | `400` — do not silently take an active tournament offline this way. (If product later wants “unpublish”, that is a separate endpoint) |
| `declined` | `400` — already declined |

Response `200`: `TournamentResponseDto`.

Club staff still see the tournament on their lists and may keep editing categories/dates while declined.

### 2.9 Resubmit — `POST /tournaments/:id/resubmit`

**Auth:** `admin` no. `club_owner` / `club_coach` of the tournament’s club only.

No required body. Optional:

```json
{
  "note": "Updated start date and added missing kata categories"
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `note` | no | Max 1000. Stored as `reviewNote` so admin sees context. If omitted, clear `reviewNote` |

| Current `status` | Result |
| --- | --- |
| `declined` | Set `pending`. Clear `reviewedAt` / `reviewedBy`. Apply `note` as `reviewNote` |
| `pending` | `400` — already awaiting review |
| `approved` | `400` |

Response `200`: `TournamentResponseDto`.

The request reappears on `GET /tournaments?status=pending` for admin.

### 2.10 Mutations while pending / declined

| Endpoint | Pending | Declined | Approved |
| --- | --- | --- | --- |
| `PUT /tournaments/:id` (name, dates, location, clubId) | Allowed for admin and owning club owner/coach | Same | Same as today |
| `PUT /tournaments/:id/categories` | Allowed (setup) | Allowed | Allowed |
| `POST /categories/create-and-assign` | Allowed if caller may mutate that catalog | Same | Same |
| `DELETE /tournaments/:id` | Admin, or owning club owner (if you already allow club delete). Keep current delete auth if stricter | Same | Same |
| Public / authenticated **create registration** | Forbidden (§2.6) | Forbidden | Allowed (existing validation) |

Changing `status` is **only** via approve / decline / resubmit. `UpdateTournamentDto` must **not** accept `status`. Club staff must not self-approve.

Admin `PUT` must not flip `status` either.

### 2.11 Errors

Use the same JSON error shape as the rest of the API.

| Status | When |
| --- | --- |
| `200` / `201` | Success |
| `400` | Invalid transition (approve already-approved, decline already-declined, resubmit when not declined, club user with no `clubId`, validation) |
| `401` | Missing/invalid JWT (except public lite / public register, which stay public) |
| `403` | Authenticated but wrong role (non-admin approve/decline, other club’s resubmit, create by `club_member` / `free_member` / `judge`) |
| `404` | Unknown tournament; **or** public/other-role access to a non-approved tournament |

Empty lists: `200` `[]`.

### 2.12 OpenAPI

Add `status`, `reviewedAt`, `reviewedBy`, `reviewNote` to `TournamentResponseDto`.

Add query `status` on `GET /tournaments`.

Add:

- `POST /tournaments/{id}/approve`
- `POST /tournaments/{id}/decline`
- `POST /tournaments/{id}/resubmit`

Keep `/docs-json` in sync so the frontend can regenerate the client.

### 2.13 Acceptance

- Admin creates a tournament → `status=approved` → appears on Active tab → public lite `200` → registration works.
- Club coach or owner creates a tournament → `status=pending` → they can open detail and assign categories → Registration CTA is locked → `GET /tournaments/public/:id` is `404` → public bulk register is `404`/`400`.
- Admin Pending tab lists that request → Decline with optional reason → club sees `declined` and `reviewNote` → public still closed.
- Club resubmits → back to Pending tab → Admin approves → public lite `200` and registration unlock.
- Judge / free-member lists never include pending or declined requests.
- Club A never sees Club B’s pending/declined rows on `GET /tournaments?status=pending`.
- Existing tournaments after migrate: `status=approved`, registration unchanged.
