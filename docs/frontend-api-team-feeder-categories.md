# Frontend: team feeder categories

Copy this file into an FE agent prompt. Backend is already shipped on `karate-tournament-be`. Regenerate the OpenAPI client if you use one (`/docs-json`).

## Product

A **team** category (`teamSize` set) may name other catalog categories (feeders) and a **maximum** number of athletes on one roster who do not fit this category but do fit a feeder.

Example: kata team ages 10–12, `feederParticipantLimit: 1`, feeders are the 8–10 categories. The team may be three kids who all fit 10–12. It may also include **one** kid who only fits 8–10. A second such kid is rejected. Using **zero** feeder kids is always valid. The limit is not a minimum.

The limit is one shared budget for **starters and reserves** on that team, not one per feeder category.

This is only for team disciplines (`teamSize` set). Individual categories ignore these fields.

## What not to do

- Do **not** require the coach to pick someone from the feeder list.
- Do **not** put a feeder-only athlete in `participants[].registrations` for the team category. They only belong on `teams[].starters` or `teams[].reserves`. A direct individual registration into the team category stays strict and will 400.
- Do **not** use `GET/POST /registrations/public/suitable-categories` (per person) to offer the older team to a younger kid. That lookup stays strict. The team picker must use **by-category** and `otherEligibleParticipants`.
- Do **not** invent a link from category name or age. The admin selects feeder category IDs.
- A feeder category does **not** have to be assigned to the tournament. Eligibility uses the catalog row.

## Category form (admin)

Show the two fields only when `teamSize` is set. Hide them and omit them (or send empty + null) when `teamSize` is cleared.

| Field | Type | Notes |
| --- | --- | --- |
| `feederCategoryIds` | `uuid[]` | Multi-select from `GET /categories` (same catalog the form already loads). Optional. `[]` or omit = none. |
| `feederParticipantLimit` | `number \| null` | Max feeder-only people on one team. `null` or `0` = no feeder spots. Example: `1`. |

Suggested select filter (BE does **not** enforce this): same discipline, and for yako the same `subDiscipline`, younger age band (`ageMax <= this ageMin` or the overlapping younger band). The admin still picks the rows. Do not include the category being edited.

Create and update:

- `POST /categories`
- `POST /categories/create-and-assign` (same body + `tournamentId`)
- `PUT /categories/:id`

```json
{
  "name": "31. Mlajši Dečki/Deklice",
  "discipline": "kata-team",
  "ageMin": 10,
  "ageMax": 12,
  "teamSize": 3,
  "teamReservesSize": 1,
  "feederCategoryIds": ["uuid-of-8-10-category"],
  "feederParticipantLimit": 1
}
```

Clearing `teamSize` (`null`) also clears feeders and the limit, even if the client still sends them. Sending feeders or a positive limit **without** `teamSize` returns **400**: `Feeder categories are only allowed when teamSize is set`.

Other 400s: duplicate IDs in `feederCategoryIds`, or the category lists itself. Unknown IDs are **404**.

On update, omit `feederCategoryIds` to keep the current list. Send `[]` to clear it. Omit `feederParticipantLimit` to keep it.

Duplicate (`POST /categories/duplicate`) copies the limit and the same feeder IDs (still pointing at the originals).

## Category response

`Category` on `GET /categories`, `GET /categories/:id`, create/update, and `GET /tournaments/public/:id` (`categories[]`) includes:

```ts
{
  teamSize: number | null
  teamReservesSize: number | null
  feederCategoryIds: string[] // always present; [] when none
  feederParticipantLimit: number | null
}
```

`feederCategoryIds` is empty and `feederParticipantLimit` is null when this is not a team category.

## Team picker (public registration)

Keep using:

`POST /registrations/public/suitable-categories/by-category`

Body is unchanged (`tournamentId` + `participants[]`).

Each item:

```ts
{
  category: Category // includes feederCategoryIds + feederParticipantLimit
  participants: SuitableParticipant[] // fully fit this category
  otherEligibleParticipants: SuitableParticipant[] // feeder-only
}
```

`SuitableParticipant` is unchanged (`participantIndex`, name, weight, dateOfBirth, gender, beltLevel). `participantIndex` is the index in the request `participants` array.

`otherEligibleParticipants` is **empty** unless all of these are true:

- `category.teamSize != null`
- `feederCategoryIds.length > 0`
- `feederParticipantLimit > 0`

Someone who fits the team category is only in `participants`, even if they also fit a feeder. They do **not** use a feeder slot.

UI:

- Main list = `participants`.
- Extra list = `otherEligibleParticipants`, labeled as optional younger / other-category athletes.
- Cap how many of that extra list can be placed on **this** team (starters + reserves together) by `category.feederParticipantLimit`.
- Do not block submit when the extra list is unused.

Bulk `POST /registrations/public/bulk` and continue `PUT /registrations/public/rosters/current` team payloads are unchanged: `teams[].starters` / `reserves` are indexes into `participants[]`. The server counts how many of those indexes are feeder-only.

## Server errors on submit

Same team payload as today. New failures:

- `Team {n}: participant {i} is not eligible for this category` — fits neither this category nor a feeder (or the limit is 0 / null).
- `Team {n}: at most {limit} participant(s) may come from other allowed categories` — too many feeder-only people on that team.

Existing checks still apply (`teamSize`, reserves, duplicate person, identical roster).
