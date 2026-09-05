# Tournament lifecycle status

Copy this file into the backend repo and implement against it. Source: karate tournament frontend (`karate-tournament-fe`). Auth is **Auth0 JWT** on every endpoint unless marked **public**. After each change, keep OpenAPI (`/docs-json`) in sync — the frontend regenerates its client from that.

This spec **extends** tournament `status`. It does **not** replace request approval (`pending` | `approved` | `declined`). Approval rules in `docs/frontend-api-requirements.md` §2 stay in force. This document only adds lifecycle after a tournament is approved.

## Problem

Today `status` is an **approval** state only: `pending`, `approved`, `declined`. An approved tournament stays `approved` forever. Registration close is inferred from dates (`registrationDeadline`, `startDate`), not from an explicit “this event has begun / this event is finished” state.

The product needs two more statuses:

| Status | Meaning now | Later (out of scope here) |
| --- | --- | --- |
| `in_progress` | Tournament has begun. Registrations are closed. | Live tournament updates |
| `ended` | Tournament has finished and is no longer in play. | End-of-tournament statistics |

Transitions are **manual**. Do **not** auto-flip status from `startDate` or `registrationDeadline`.

## Product rules

- Status strings: `in_progress` and `ended` (snake_case, same style as `approved`).
- Who can start and end: `admin`, plus the owning club’s `club_owner` / `club_coach`.
- Start: `approved` → `in_progress`. End: `in_progress` → `ended`. No skipping, no reversing.
- Persist actual transition times: `startedAt`, `endedAt`. Persist actors: `startedBy`, `endedBy` (same audit pattern as `reviewedBy`).
- `startDate` remains the **scheduled** start. `startedAt` is the moment someone marked the tournament in progress.
- Registration create is allowed only while `status === approved` (plus any existing date-window validation). `in_progress` and `ended` always refuse new registrations, even if dates would still allow it (starting early closes registration immediately).
- `in_progress` and `ended` are **visible** the same way `approved` is. `pending` / `declined` stay club-private as today.
- Live updates and statistics APIs are **not** part of this spec. The new statuses exist so those can land later.

## Remaining work

| Priority | Work | Why |
| --- | --- | --- |
| **P0** | Extend `status` enum and add start/end endpoints | Frontend cannot show in-progress / ended, or close registration by lifecycle, until this exists |

Existing endpoints the frontend already calls must keep working.

---

## 1. Model — extend tournament status

Same entity. Do **not** introduce a separate table/resource.

### 1.1 `status` enum

`TournamentResponseDto.status` becomes:

`pending` | `approved` | `declined` | `in_progress` | `ended`

Include `status` on **every** `TournamentResponseDto` (list, get-by-id, create, update, assign-categories, approve, decline, resubmit, start, end).

### 1.2 New fields on `TournamentResponseDto`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `startedAt` | ISO-8601 datetime \| null | yes (nullable) | Set when entering `in_progress`. Never auto-set from `startDate`. Null until started |
| `endedAt` | ISO-8601 datetime \| null | yes (nullable) | Set when entering `ended`. Null until ended |
| `startedBy` | uuid \| null | yes (nullable) | User id of the caller who started. Null until started |
| `endedBy` | uuid \| null | yes (nullable) | User id of the caller who ended. Null until ended |

Existing fields stay (`id`, `name`, `location`, `startDate`, `registrationDeadline`, `createdBy`, `createdByUser`, `clubId`, `club`, `categoryIds`, `status`, `reviewedAt`, `reviewedBy`, `reviewNote`, `createdAt`, `updatedAt`).

`UpdateTournamentDto` must **not** accept `status`, `startedAt`, `endedAt`, `startedBy`, or `endedBy`. Those change **only** via dedicated endpoints (`approve` / `decline` / `resubmit` / `start` / `end`). Admin `PUT` must not flip them either.

### 1.3 Public lite

`GET /tournaments/public/:id` returns `200` for `approved` | `in_progress` | `ended`. Still `404` for `pending` / `declined` / unknown id (do not leak requests).

Add to `TournamentPublicLiteResponseDto`:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `status` | `approved` \| `in_progress` \| `ended` | yes | So the public registration page can show closed vs open instead of treating `200` as “registration open” |
| `startedAt` | ISO-8601 datetime \| null | yes (nullable) | Optional for FE now; include so public pages can show when play began |
| `endedAt` | ISO-8601 datetime \| null | yes (nullable) | Same for when play ended |

Do not put `startedBy` / `endedBy` on the public lite DTO.

### 1.4 Migration

- Existing rows keep their current `status` (`pending` / `approved` / `declined`).
- New timestamp/actor fields are `null`.
- Do **not** backfill `in_progress` from `startDate`. A tournament whose `startDate` is in the past stays `approved` until someone calls start.

---

## 2. State machine

```
club create  → pending
admin create → approved

pending  --admin approve-->  approved
pending  --admin decline-->  declined
declined --club resubmit-->  pending
declined --admin approve-->  approved

approved     --start-->  in_progress
in_progress  --end-->    ended
```

Approve / decline / resubmit rules for `pending` / `approved` / `declined` are unchanged from the approval spec.

### Invalid transitions — HTTP `400`

| Action | Current `status` | Result |
| --- | --- | --- |
| Start | anything except `approved` | `400` |
| End | anything except `in_progress` | `400` |
| Start when already `in_progress` | `in_progress` | `400` |
| End when already `ended` | `ended` | `400` |
| Skip `approved` → `ended` | `approved` | `400` (must start first) |
| Reverse `in_progress` → `approved` | `in_progress` | `400` (no reverse) |
| Reverse `ended` → `in_progress` | `ended` | `400` (no reverse) |
| Approve / decline / resubmit | `in_progress` or `ended` | `400` |

Unknown tournament: `404` (not `400`).

---

## 3. Start — `POST /tournaments/:id/start`

**Auth:** `admin`, or `club_owner` / `club_coach` of the tournament’s `clubId`.

| Caller | Result |
| --- | --- |
| `admin` | Allowed for any tournament |
| `club_owner` / `club_coach` of that tournament’s club | Allowed |
| `club_owner` / `club_coach` of a **different** club | `403` |
| Other roles (`club_member`, `free_member`, `judge`, …) | `403` |
| Club staff when `clubId` is null (unassigned tournament) | `403` — admin only |

No body (or empty object).

| Current `status` | Result |
| --- | --- |
| `approved` | Set `in_progress`. Set `startedAt` = now, `startedBy` = caller. Leave `endedAt` / `endedBy` null. Do **not** change `reviewedAt` / `reviewedBy` / `reviewNote` |
| anything else | `400` |

Response `200`: `TournamentResponseDto`.

`404` if the tournament does not exist.

Starting **closes registration** immediately. Public lite stays `200` with `status: in_progress`.

---

## 4. End — `POST /tournaments/:id/end`

**Auth:** same as start.

No body (or empty object).

| Current `status` | Result |
| --- | --- |
| `in_progress` | Set `ended`. Set `endedAt` = now, `endedBy` = caller. **Keep** `startedAt` / `startedBy` |
| anything else | `400` |

Response `200`: `TournamentResponseDto`.

`404` if the tournament does not exist.

Ending does not clear start audit fields.

---

## 5. List filter — `GET /tournaments?status=`

```
GET /tournaments
GET /tournaments?status=pending
GET /tournaments?status=approved
GET /tournaments?status=declined
GET /tournaments?status=in_progress
GET /tournaments?status=ended
```

| Param | Type | Notes |
| --- | --- | --- |
| `status` | `pending` \| `approved` \| `declined` \| `in_progress` \| `ended` | Optional. When set, filter to that value **and** still apply role visibility |

Treat `in_progress` and `ended` like `approved` for **who can see them**. `pending` / `declined` stay club-private as today.

Visibility (apply **after** the optional status filter):

| Caller | Omitted `status` | `approved` / `in_progress` / `ended` | `pending` / `declined` |
| --- | --- | --- | --- |
| `admin` | All tournaments | All of that status | All of that status |
| `club_owner` / `club_coach` | All **approved, in_progress, ended** (any club) **plus** their club’s pending and declined | All of that status (any club) | **Own club only** |
| `judge` | Approved + in_progress + ended | Those statuses | `[]` |
| `free_member` / `club_member` | Approved + in_progress + ended (if this list is called) | Those statuses | `[]` |
| Other | `403` | `403` | `403` |

Club staff must **never** see another club’s pending or declined requests.

Sort: same as today. Empty list: `200` `[]`, not `404`.

---

## 6. Other reads

### 6.1 Authenticated `GET /tournaments/:id`

| Caller | `approved` / `in_progress` / `ended` | `pending` / `declined` |
| --- | --- | --- |
| `admin` | `200` | `200` |
| `club_owner` / `club_coach` of the tournament’s club | `200` | `200` |
| Other authenticated users | `200` | `404` (do not leak that a request exists) |
| Unknown id | `404` | `404` |

### 6.2 Club list — `GET /clubs/:id/tournaments`

Auth unchanged (admin, or member of `:id`).

Return **all statuses** for that club, including `in_progress` and `ended`. Include the new timestamp/actor fields on each row.

### 6.3 Registered — `GET /tournaments/registered`

Return tournaments the user is registered in even after they start or end:

`approved` | `in_progress` | `ended`

Do not drop a row because the tournament is no longer `approved`.

---

## 7. Registration must close on start / end

All **create** registration paths (public and authenticated) succeed only when `status === approved`, plus any existing date-window validation you already enforce.

| Current `status` | Create registration |
| --- | --- |
| `approved` | Allowed (existing validation: dates, categories, etc.) |
| `in_progress` | Forbidden |
| `ended` | Forbidden |
| `pending` / `declined` | Forbidden (already required by the approval spec) |

Preferred error: `400` with a clear “registration is not open” message. `404` is acceptable on **public** create if that is already the not-approved pattern — pick one and be consistent across public register endpoints.

Starting early closes registration immediately even if `startDate` / `registrationDeadline` are still in the future.

This spec does **not** replace date checks. Keep them if they already exist. Status is an additional gate.

**Listing** registrations on an in-progress or ended tournament stays allowed for the same roles as today (organizers still need the attendee list / counts).

Endpoints that must refuse create when not `approved`:

```
POST /registrations
POST /registrations/public
POST /registrations/public/bulk
```

Suitable-category helpers that imply registration is open should also refuse `in_progress` / `ended` the same way they refuse non-approved:

```
GET  /registrations/public/suitable-categories
POST /registrations/public/suitable-categories/bulk
POST /registrations/public/suitable-categories/by-category
```

---

## 8. Mutations while in progress / ended

| Endpoint | `in_progress` | `ended` |
| --- | --- | --- |
| `PUT /tournaments/:id` | Same auth as `approved` (admin / owning club owner/coach) | Same |
| `PUT /tournaments/:id/categories` | Same | Same |
| `POST /categories/create-and-assign` | Same | Same |
| `DELETE /tournaments/:id` | Keep current delete auth | Same |
| Create registration | Forbidden (§7) | Forbidden |
| `POST .../approve` \| `decline` \| `resubmit` | `400` | `400` |
| `POST .../start` | `400` | `400` |
| `POST .../end` | Allowed from `in_progress` | `400` |

Changing `status` is **only** via approve / decline / resubmit / start / end.

---

## 9. Errors

Use the same JSON error shape as the rest of the API.

| Status | When |
| --- | --- |
| `200` | Success (start / end / reads) |
| `400` | Invalid transition; validation; registration when not `approved` |
| `401` | Missing/invalid JWT (except public lite / public register, which stay public) |
| `403` | Authenticated but wrong role (other club’s start/end, member/judge start, club start on unassigned tournament) |
| `404` | Unknown tournament; **or** public/other-role access to a pending/declined request |

Empty lists: `200` `[]`.

---

## 10. OpenAPI

- Extend `status` enum on `TournamentResponseDto` and on `GET /tournaments` query `status`.
- Add `startedAt`, `endedAt`, `startedBy`, `endedBy` to `TournamentResponseDto`.
- Add `status`, `startedAt`, `endedAt` to `TournamentPublicLiteResponseDto`.
- Add:
  - `POST /tournaments/{id}/start`
  - `POST /tournaments/{id}/end`

Keep `/docs-json` in sync so the frontend can regenerate the client (`yarn codegen`).

---

## 11. Out of scope (do not build in this change)

- Live tournament updates, brackets, or scoring payloads
- End-of-tournament statistics endpoints
- Auto-start when `startDate` is reached
- Auto-end (there is no scheduled end date today)
- Reversing `in_progress` back to `approved`, or `ended` back to `in_progress`
- Accepting `status` on `UpdateTournamentDto`

---

## 12. Acceptance

- Admin or owning club owner/coach starts an **approved** tournament → `status=in_progress`, `startedAt` and `startedBy` set → public lite `200` with `status: in_progress` → create registration fails (`400`/`404`).
- Same caller ends it → `status=ended`, `endedAt` and `endedBy` set, `startedAt` / `startedBy` still present → cannot start again (`400`).
- Owning club coach can start/end. Other club’s owner/coach cannot (`403`). `club_member` / `judge` / `free_member` cannot (`403`).
- Unassigned tournament (`clubId` null): only admin can start/end.
- Pending tournament cannot be started (`400`). Declined cannot be started (`400`). Approve/decline/resubmit on in-progress or ended is `400`.
- `GET /tournaments?status=in_progress` and `?status=ended` filter correctly. Omitted `status` includes them for callers who can see `approved`.
- `GET /tournaments/registered` still returns a tournament after it is started or ended.
- `GET /tournaments/public/:id` is `200` for approved / in_progress / ended, and `404` for pending / declined.
- Existing approved tournaments after migrate: still `approved`, `startedAt`/`endedAt` null, registration unchanged until someone starts them.
- Dates do not auto-change status: a tournament with `startDate` in the past stays `approved` until `POST .../start`.
