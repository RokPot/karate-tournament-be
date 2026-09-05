# Frontend API solve steps

Backend backlog derived from the frontend API requirements. Work top-down. Auth is Auth0 JWT unless an endpoint is marked public. After each change, keep OpenAPI (`/docs-json`) in sync so the frontend can regenerate its client.

Source: [frontend-api-requirements.md](../frontend-api-requirements.md) (copy from `karate-tournament-fe`). Do not treat this doc as a replacement for that spec — it is the implementation checklist against **this** repo.

Existing endpoints the frontend already calls must keep working.

## Status legend

| Status | Meaning |
| --- | --- |
| **done** | Matches FE needs; leave working |
| **partial** | Endpoint or flow exists but is incomplete or incorrect |
| **missing** | Not implemented |

Decided defaults (from FE spec, not open choices):

- Registration counts: **Option A** `GET /registrations/by-tournament/counts?tournamentId=` (do not embed `registrationCount` on the tournament DTO)
- Tournament requests: same `tournaments` entity / `status` field — **no** `tournament_requests` table
- Public lite and unknown/non-approved ids: **`404`** (do not advertise pending requests)
- Public POST register when not approved: **`404`** (same as missing). Be consistent across all public register / suitable-categories endpoints
- Judge `GET /tournaments?status=pending` or `declined`: **`200 []`**
- Existing tournament rows migrate to `status: approved` (never null)

---

## P0 — Registration counts per tournament category

**Problem:** Tournament detail accordion needs a count on every assigned category without fetching every attendee. Today the frontend can only call `GET /registrations/by-tournament?tournamentId=&categoryId=` (the expand path). Categories with zero registrations never appear in that list, so `length` cannot drive collapsed-row counts.

**Status:** missing

Today: no counts endpoint. Expand list exists at [`GET /registrations/by-tournament`](src/modules/registration/registration.controller.ts) (`findByTournament`). Auth is already `admin`, `judge`, or `club_owner` / `club_coach` of the tournament’s club.

### Steps

- [ ] Add `GET /registrations/by-tournament/counts?tournamentId=` (uuid, required). Declare the static `counts` path so it is not swallowed by a parameterized route.
- [ ] Auth / roles: **same as** `GET /registrations/by-tournament` — `admin`; `club_owner` / `club_coach` of that tournament’s club. `403` if authenticated but not allowed. `404` if the tournament does not exist. `401` for missing/invalid JWT.
- [ ] Response `200`: `{ categoryId, registrationCount }[]`. One row per **assigned** category, including `registrationCount: 0`. Never omit zeros. Tournament with no categories → `[]` (not `404`).
- [ ] Order: assignment `sortOrder` ASC (same as tournament category display order).
- [ ] Keep `GET /registrations/by-tournament?tournamentId=&categoryId=` unchanged for accordion expand.

### Key files

- [`src/modules/registration/registration.controller.ts`](src/modules/registration/registration.controller.ts)
- [`src/modules/registration/registration.service.ts`](src/modules/registration/registration.service.ts)
- New query + response DTOs under [`src/modules/registration/dto/`](src/modules/registration/dto/)
- [`src/modules/tournament/tournament-category.entity.ts`](src/modules/tournament/tournament-category.entity.ts) (assignment order)

### Acceptance

- Organizer can load one counts call and show a number on every collapsed category row, including zeros.
- Expand still uses the existing by-tournament list.
- OpenAPI includes the counts route so the frontend can regenerate the client.

---

## P0 — Tournament request approval

**Problem:** Club owner/coach can write a full tournament, but it must not become publicly active until SuperAdmin (`admin`) approves it. Today `POST /tournaments` creates an immediately usable tournament. There is no `status` on [`Tournament`](src/modules/tournament/tournament.entity.ts) or [`TournamentResponseDto`](src/modules/tournament/dto/tournament-response.dto.ts). Public lite and `POST /registrations/public*` work with no approval step.

**Status:** missing

Current conflicts with this spec (must change):

- [`POST /tournaments`](src/modules/tournament/tournament.controller.ts) allows `admin` and `club_owner` only; **`club_coach` is `403`**. Spec: coach can create, result `pending`.
- [`findVisibleToUser`](src/modules/tournament/tournament.service.ts) returns club staff **only their club**. Spec: club staff see **all approved** plus **own** pending and declined; optional `?status=`.

### Steps

#### Model

- [ ] Add `status` (`pending` | `approved` | `declined`), `reviewedAt` (nullable datetime), `reviewedBy` (nullable uuid, admin who last reviewed), `reviewNote` (nullable string) on the tournament entity. Same table — do not add a requests resource.
- [ ] Migration: backfill every existing row to `status: approved`. Do not leave `status` null.
- [ ] Expose those four fields on `TournamentResponseDto` (list, get-by-id, create, update, assign-categories, approve, decline, resubmit). Do **not** add `status` to `TournamentPublicLiteResponseDto`.

#### Create — `POST /tournaments`

- [ ] Body unchanged (`CreateTournamentDto`).
- [ ] `admin`: optional `clubId` (omit/null → unassigned). Result `approved`. Leave `reviewedAt` / `reviewedBy` / `reviewNote` null.
- [ ] `club_owner` / `club_coach`: force `clubId` to caller’s `user.clubId`. Different id → `403`. No `user.clubId` → `400`. Result `pending`.
- [ ] Other roles: `403`.
- [ ] Club staff may immediately `PUT /tournaments/:id`, `PUT /tournaments/:id/categories`, and `POST /categories/create-and-assign` on a **pending** tournament they own.

#### List — `GET /tournaments?status=`

- [ ] Optional query `status` = `pending` | `approved` | `declined`. When set, filter to that value **then** apply visibility.
- [ ] Visibility:

  | Caller | Omitted `status` | `status=approved` | `status=pending` | `status=declined` |
  | --- | --- | --- | --- | --- |
  | `admin` | All | All approved | All pending | All declined |
  | `club_owner` / `club_coach` | All **approved** (any club) **plus** their club’s pending and declined | All approved | **Own club only** | **Own club only** |
  | `judge` | Approved only | Approved only | `[]` | `[]` |
  | `free_member` / `club_member` | Approved only | Approved only | `[]` | `[]` |
  | Other | `403` | `403` | `403` | `403` |

- [ ] Club staff must never see another club’s pending or declined rows.
- [ ] Empty list: `200 []`. Sort: keep current list default (`startDate` ASC, then `createdAt` DESC) unless you change it globally.

#### Club list, get-by-id, public, register

- [ ] `GET /clubs/:id/tournaments`: auth unchanged (admin or member of `:id`). Return **all** statuses for that club, including review fields.
- [ ] Authenticated `GET /tournaments/:id`: admin → always `200` if exists. Owning club owner/coach → `200` for pending/declined (setup). Other authenticated users → `200` if `approved`, else **`404`** (same as unknown id).
- [ ] `GET /tournaments/public/:id`: `200` only when `approved`; otherwise `404`.
- [ ] Reject non-approved `tournamentId` with **`404`** on: `POST /registrations/public`, `POST /registrations/public/bulk`, `GET /registrations/public/suitable-categories`, `POST /registrations/public/suitable-categories/bulk`, `POST /registrations/public/suitable-categories/by-category`.
- [ ] Authenticated `POST /registrations` (non-public): refuse unless `approved` (`400`). Organizers listing registrations on a pending tournament may get `200 []`.
- [ ] `GET /tournaments/registered`: **approved** tournaments only.

#### Approve / decline / resubmit

Declare static routes **before** `GET /tournaments/:id`.

- [ ] `POST /tournaments/:id/approve` — `admin` only. No body. `pending` or `declined` → `approved`, set `reviewedAt` now, `reviewedBy` = caller, clear `reviewNote`. Already `approved` → `400`. Response `200` `TournamentResponseDto`.
- [ ] `POST /tournaments/:id/decline` — `admin` only. Optional `{ reason }` (max 1000, stored as `reviewNote`; empty/omit → null). `pending` → `declined` + review fields. `approved` or already `declined` → `400`.
- [ ] `POST /tournaments/:id/resubmit` — owning `club_owner` / `club_coach` only (not admin). Optional `{ note }` (max 1000). `declined` → `pending`, clear `reviewedAt` / `reviewedBy`, apply `note` as `reviewNote` (omit → clear). `pending` or `approved` → `400`.

#### Mutations and OpenAPI

- [ ] Pending and declined: allow `PUT /tournaments/:id`, `PUT /tournaments/:id/categories`, `POST /categories/create-and-assign` for callers who may already mutate that resource. Delete: keep current delete auth.
- [ ] Changing `status` is **only** via approve / decline / resubmit. `UpdateTournamentDto` must not accept `status`. Admin `PUT` must not flip `status`. Club staff must not self-approve.
- [ ] OpenAPI: four fields on `TournamentResponseDto`; query `status` on `GET /tournaments`; the three POST review routes.

### Key files

- [`src/modules/tournament/tournament.entity.ts`](src/modules/tournament/tournament.entity.ts)
- [`src/modules/tournament/tournament.service.ts`](src/modules/tournament/tournament.service.ts)
- [`src/modules/tournament/tournament.controller.ts`](src/modules/tournament/tournament.controller.ts)
- [`src/modules/tournament/dto/tournament-response.dto.ts`](src/modules/tournament/dto/tournament-response.dto.ts)
- [`src/modules/tournament/dto/create-tournament.dto.ts`](src/modules/tournament/dto/create-tournament.dto.ts)
- [`src/modules/tournament/dto/update-tournament.dto.ts`](src/modules/tournament/dto/update-tournament.dto.ts)
- [`src/modules/club/club.service.ts`](src/modules/club/club.service.ts) (`getTournaments`)
- [`src/modules/registration/registration.service.ts`](src/modules/registration/registration.service.ts) (public + authenticated create; suitable-categories)
- New migration; new approve/decline/resubmit DTOs as needed
- [`src/common/enums/index.ts`](src/common/enums/index.ts)

### Acceptance

- Admin creates a tournament → `status=approved` → Active tab (`?status=approved`) → public lite `200` → registration works.
- Club coach or owner creates → `status=pending` → they can open detail and assign categories → public lite `404` → public bulk register `404`.
- Admin Pending tab lists that request → Decline with optional reason → club sees `declined` and `reviewNote` → public still closed.
- Club resubmits → back on Pending → Admin approves → public lite `200` and registration unlock.
- Judge / free-member lists never include pending or declined requests.
- Club A never sees Club B’s pending/declined rows on `GET /tournaments?status=pending`.
- Existing tournaments after migrate: `status=approved`, registration unchanged.

---

## Error conventions

Keep the existing API JSON error shape.

| Status | When |
| --- | --- |
| `200` / `201` | Success |
| `400` | Invalid transition (approve already-approved, decline already-declined, resubmit when not declined, club user with no `clubId`, validation) |
| `401` | Missing/invalid JWT (except public lite / public register, which stay public) |
| `403` | Authenticated but wrong role (non-admin approve/decline, other club’s resubmit, create by `club_member` / `free_member` / `judge`, counts/list for another club’s tournament) |
| `404` | Unknown tournament; **or** public/other-role access to a non-approved tournament |

Empty lists are `200` with `[]`, not `404`.

---

## Out of scope

- Pagination (lists are unbounded today)
- Option B: embedding `registrationCount` on tournament category payloads
- A separate `tournament_requests` table or resource
- Unpublish / take an approved tournament offline (decline of `approved` stays `400`)
