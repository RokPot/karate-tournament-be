# Frontend: continue public tournament registration

Copy this file into a FE agent prompt. Backend for this flow is already shipped on `karate-tournament-be`. Do not invent extra headers or a second `POST /registrations/public/bulk` as “edit.”

## What changed (product)

Public registration used to be **append-only**: every submit created a new `registration_submissions` row. Staff grouping (`GET /registrations/by-tournament/submissions`) still exists for organizers, but **staff only care about what is registered now**.

**Continue** is a coach flow: after step 1 (email, first name, last name, optional club), if a roster already exists for this **tournament + email + club**, they prove they own the email with an OTP, load the **current merged roster**, edit in the existing wizard, and **PUT** it. The server diffs. No new submission.

`RegistrationStatus.pending` on each row is only a DB default. There is **no approval gate**. Continue treats all current rows as live.

## What not to do

- Do **not** hydrate the wizard from the last bulk POST and `POST /registrations/public/bulk` again. That only adds. Local “remove” would leave people registered. Duplicate person+category returns **409**.
- Do **not** call staff `GET /registrations/by-tournament/submissions` from the public form (auth + no team round-trip).
- Do **not** send `x-roster-access-token`. Token is `accessToken`: **query on GET**, **JSON body on PUT**.
- Do **not** match continue on first/last name. Identity is tournament + email + club only.
- Do **not** silently overwrite an unsaved local `sessionStorage` draft with the server roster. Ask, or only hydrate when the user chose Continue.

## Identity

Same club rules as bulk:

- If `clubName` resolves to a club in DB, match on that `clubId` (and unmatched submissions that typed the same name).
- If `clubName` is typed but no club exists, match on normalized name, no `clubId`.
- If `clubName` is omitted, match the no-club roster.

Two clubs (or club vs no-club) with the same email are **different** rosters. Step 1 must send the **same club string** they used originally.

## Flow

```
Step 1: email, firstName, lastName, optional clubName, tournamentId
  POST /registrations/public/rosters/lookup
  found === false  → existing new-registration wizard → POST /registrations/public/bulk
  found === true   → “Continue previous registration” (show updatedAt)
                      user continues
                      POST /registrations/public/rosters/otp
                      user enters 6-digit code from email
                      POST /registrations/public/rosters/otp/verify
                      store accessToken + expiresAt + updatedAt
                      GET /registrations/public/rosters/current?accessToken=
                      hydrate DraftParticipant / DraftTeam / CoachDetails
                      user edits
                      PUT /registrations/public/rosters/current
                      (body = bulk payload + accessToken + updatedAt from last GET/PUT)
```

After a successful first-time bulk, results can offer **“Edit this registration”** which starts at OTP (lookup will be `found: true`) instead of wiping the wizard.

## API (all public, no Auth0)

Base path: `/registrations`.

### 1. Lookup

`POST /registrations/public/rosters/lookup`

```json
{
  "tournamentId": "uuid",
  "email": "coach@club.com",
  "clubName": "SKIF Ljubljana"
}
```

`clubName` optional.

**200**

```json
{ "found": true, "updatedAt": "2026-04-15T10:00:00.000Z" }
```

or `{ "found": false, "updatedAt": null }`.

**404** tournament missing.

Never returns participants. Use `found` to show the Continue button.

### 2. Request OTP

`POST /registrations/public/rosters/otp`

Same body as lookup.

**200** `{}` normally. If mail is disabled and `STAGE` is not `production`, `{ "debugCode": "123456" }` — use this in local FE only.

**404** no roster (should not happen if lookup was `found`).
**429** wait ~60s before another code.
Code TTL **10 minutes**, 6 digits.

Show a code input. Prefer the emailed code; if `debugCode` is present, you may prefill in dev.

### 3. Verify OTP

`POST /registrations/public/rosters/otp/verify`

```json
{
  "tournamentId": "uuid",
  "email": "coach@club.com",
  "clubName": "SKIF Ljubljana",
  "code": "123456"
}
```

**200**

```json
{
  "accessToken": "base64url...",
  "expiresAt": "2026-04-15T12:00:00.000Z",
  "updatedAt": "2026-04-15T10:00:00.000Z"
}
```

Keep `accessToken` in memory (or session) until `expiresAt` (~2 hours). You will not send the 6-digit code again.

**400** invalid/expired code (5 failed tries burns the code).
**404** no roster.

### 4. Get current roster

`GET /registrations/public/rosters/current?accessToken=`

**200** — merged current state (not one historical send):

```ts
{
  email: string
  firstName: string
  lastName: string
  clubName: string | null
  clubId: string | null
  tournamentId: string
  updatedAt: string // send this back on PUT unchanged until you save
  participants: Array<{
    userId: string
    firstName: string
    lastName: string
    weight: number | null
    dateOfBirth: string // ISO date-time
    gender: 'male' | 'female' | 'other' | null
    beltLevel: string | null // e.g. '10-kyu'
    registrations: Array<{ id: string; categoryId: string }> // individual categories only
  }>
  teams: Array<{
    id: string
    name: string
    categoryId: string
    starters: number[] // indexes into participants[]
    reserves?: number[]
  }>
  fees?: { /* same shape as tournament fee calculation */ }
}
```

Team categories are **not** duplicated inside `participants[].registrations`. Membership is only in `teams[]`. People who are only on teams still appear in `participants` with `registrations: []`.

**401** bad/expired `accessToken`. Send the user back to OTP.
**404** roster gone.

### 5. Put current roster

`PUT /registrations/public/rosters/current`

Body = existing **bulk public registration** payload **plus**:

| Field | Required | Notes |
| --- | --- | --- |
| `accessToken` | yes | from verify |
| `updatedAt` | yes | exact string from last GET/PUT |
| `participants[].userId` | for existing people | from GET; omit for newly added athletes |
| `teams[].id` | for existing teams | from GET; omit to create a new team |
| `teams[].name` | optional | keep GET `name` so labels do not churn |

Also send the same coach `email`, `firstName`, `lastName`, `clubName`, `tournamentId` as bulk today. Email/tournament must match the session (changing club/email is not supported on PUT).

**200** same `RosterResponseDto` as GET (new `updatedAt` + `fees`). Replace stored `updatedAt` with the response.

**409** roster changed since load — `GET` again, merge or ask the user to reload.
**401** token expired — OTP again.
**400** validation / person not on this roster / unknown `teams[].id`.

Server behaviour on PUT (FE does **not** compute a diff):

- Creates/updates/deletes athletes and categories to match the payload.
- Updates user identity (name, weight, belt, DOB, gender) when `userId` is sent.
- Teams omitted from the payload are deleted; new teams without `id` are created.
- Does **not** create a new submission. If the roster still spanned multiple historical submits, remaining registrations are moved onto the **oldest** one and the siblings are deleted (staff grouping then sees a single submit).

## Wizard mapping

Reuse the current public wizard (`DraftParticipant`, `DraftTeam`, `CoachDetails`, `mapToBulkDto`).

On GET:

- Coach fields from `email` / `firstName` / `lastName` / `clubName`.
- Each participant: keep `userId` beside the draft (do not lose it). Map `registrations[].categoryId` into the existing category-id list. You can keep registration `id` locally if useful; PUT only needs `userId` + `categoryId` (+ optional `finalWeight`).
- `clientId` for team memberships: start as `userId` so starter/reserve indexes stay stable while editing.
- Teams: keep `id` + `name`; `starters` / `reserves` are indexes into the **GET participant order**. If you reorder participants in the UI, recompute indexes the same way bulk already does.

On submit when continuing:

- Call `mapToBulkDto` as today.
- Add `accessToken`, `updatedAt`.
- Ensure every existing participant still has `userId` and every existing team still has `id`.
- **PUT**, not POST.

First-time path is unchanged: `POST /registrations/public/bulk` (optional `userId` / `teams[].id` on that POST are ignored).

Do not replace a dirty local draft with GET without confirmation.

## UX copy (suggested)

- Lookup found: `You already registered for this tournament on {date}. Continue editing?`
- After bulk success: `Edit this registration` (starts continue: OTP → GET).
- 409: `This registration was updated in another tab. Reload the current list?`
- 401 on GET/PUT: `Your session expired. We sent (or will send) a new code.`

## Local / mail-off

If OTP **200** includes `debugCode`, the backend did not send mail. Show or prefill that code in non-prod only.

## Out of scope for this FE work

- Organizer submissions grouping UI (backend still returns groups; not used by the public wizard).
- Changing email or club on an existing roster.
- Auth0 login for coaches.
- Custom headers.
