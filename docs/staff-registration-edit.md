# Staff registration edit

Staff manage tournament registrations from the tournament detail **Registrations** tab. All three write endpoints below are implemented.

## Authorization

Allowed callers (create, edit identity, delete):

- platform `admin`
- owning club `club_owner` (`tournament.clubId` matches the caller's club)

Everyone else (including owning club `club_coach`, and the athlete's own club) receives **403**.

`PUT /registrations/:id` (category, status, final weight) keeps its broader staff check and is not used by this tab.

## Locking

Writes are allowed while the tournament is `approved` or `in_progress`. Any other status (`pending`, `declined`, `ended`) returns **400** `Registration is not open`.

An existing schedule does not block anything, and it is not rebuilt:

- A deleted registration stays in the saved draw until the category schedule is regenerated.
- A later bracket PDF shows the current names, so an identity edit appears there.

## Endpoints

### Create (add participant to a category)

`POST /registrations/staff`

Body:

- `tournamentId`, `categoryId`
- `firstName`, `lastName`, `gender`, `dateOfBirth`, `beltLevel`
- optional `weight`, `finalWeight`, `clubId`, `email`

Behavior:

- With `email`, that user is found or created (same temp-user rule as the public form). Without it, club + name + date of birth identify the person.
- Creates one registration with status `pending`. No confirmation email is sent.
- **404** tournament, category, or club missing, or the category is not part of the tournament.
- **400** the person does not fit the category (age, weight, belt, gender). The user row is untouched in that case.
- **409** already registered in that category.
- **400** team categories are rejected. Team rosters are not managed here.

### Update participant identity

`PATCH /registrations/:id`

Optional fields: `firstName`, `lastName`, `gender`, `dateOfBirth`, `weight`, `beltLevel`, `finalWeight`.

- Identity fields are written on the user, so the person's other registrations show the same data. `finalWeight` is stored on this registration only.
- Every individual-category registration the person has in this tournament is re-checked with the new values. If any would no longer fit, the response is **400** with the reason and nothing is saved. Team categories are not re-checked.
- The user row is shared, so the change also applies to the person outside this tournament.
- Participants created without a real email keep their original placeholder identity key. Registering the same person again later under the new name can create a second user.
- **404** if the registration is missing.

### Remove one category registration

`DELETE /registrations/:id`

- Removes only that registration. Other categories for the same person remain.
- Team roster rows for it are removed.
- **404** / **403** / **400** (not open) as above.

## Participants view (no new list API)

`GET /registrations/by-tournament?tournamentId=` (no `categoryId`) is enough. The FE groups by `userId` and shows category pills and per-registration remove.

## Teams

Roster composition (starters and reserves) is out of scope here. A follow-up is needed if staff should manage team rosters from this tab.
