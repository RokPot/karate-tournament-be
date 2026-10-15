# Brevo email templates (BE handoff)

Standalone HTML for Brevo transactional templates. Paste into Brevo (or ship from BE), then send with `params` as documented below.

Unsubscribe / “Odjavi se” stays Brevo-managed — not included in these files.

## Design tokens (KarateApp)

| Token | Hex | Use |
| --- | --- | --- |
| Page background | `#F8F7F4` | Outer email bg (`secondary-75`) |
| Card | `#FFFFFF` | Content surface |
| Border | `#EBEAE6` | Card / athlete rows (`secondary-300`) |
| Body text | `#1C1C1E` | Primary copy |
| Muted text | `#6B7280` | Secondary lines / footer (`neutral-200`) |
| Accent / CTA | `#B8963E` | Buttons & links (`primary-200`) |
| CTA label | `#FFFFFF` | On gold button |
| Brand strip | `#5C481C` | Top bar (`primary-500`) |

**Font:** Roboto (Google Fonts) with `Arial, Helvetica, sans-serif` fallback. Body 16px / 1.5; athlete names weight 500; category lines 14px muted.

---

## 1. Registration confirmation

| | |
| --- | --- |
| **File** | [`registration-confirmation.html`](./registration-confirmation.html) |
| **Suggested Brevo name** | `registration-confirmation` |
| **Suggested subject (EN)** | `Registration confirmed — {{ params.tournamentName }}` (or `Your registration was successful`) |

### Params

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `recipientName` | string | recommended | Greeting name |
| `tournamentName` | string | optional | Shown under success line |
| `clubName` / `clubLine` | string / HTML | optional | Club from the registration submit |
| `registrationCount` | number \| string | optional | e.g. `4` → “4 registrations” |
| `participants` | array | required* | See shape below |
| `fees` / `feesSection` | object / HTML | optional | Amounts due for this submit |
| `registrationsHtml` | string (HTML) | fallback | Use instead of `participants` loop if nested `#each` is awkward |

\*Primary path uses `participants`.

```ts
participants: Array<{
  name: string;
  categories: string[]; // display labels for that athlete
}>;
```

Example payload fragment:

```json
{
  "recipientName": "Rok",
  "tournamentName": "Zlati Pas Open 2026",
  "clubName": "Dragon Karate Club",
  "registrationCount": 4,
  "participants": [
    {
      "name": "Rok 1 pot 1",
      "categories": [
        "Test 10/10 / 1. Mlajši Dečki 2",
        "Test 10/10 / 1. Mlajši malčki",
        "YIJU KUMITE - MALČKI B"
      ]
    }
  ],
  "fees": {
    "participants": [{ "name": "Rok 1 pot 1", "categoryCount": 3, "amount": 30 }],
    "teams": [{ "name": "20. Kate Ekipno A", "amount": 30 }],
    "total": 60
  }
}
```

Athletes are **grouped** with categories listed under each name (no separate tournament category catalog).

---

## 2. Registration updated (continue PUT)

| | |
| --- | --- |
| **File** | [`registration-updated.html`](./registration-updated.html) |
| **Suggested Brevo name** | `registration-updated` |
| **Suggested subject (EN)** | `Registration updated — {{ params.tournamentName }}` |

Sent after a public roster **PUT** (continue/edit). Same athlete grouping and fees as confirmation, but the body is the **full current roster** after edits, not only the last form send.

### Params

Same as [registration confirmation](#1-registration-confirmation). Copy differs: intro is “updated” / “current total”; list heading is “Current registrations”.

---

## 3. Club invitation

| | |
| --- | --- |
| **File** | [`club-invitation.html`](./club-invitation.html) |
| **Suggested Brevo name** | `club-invitation` |
| **Suggested subject (EN)** | `You're invited to join {{ params.clubName }} on Karate App` |

### Params

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `firstName` | string | yes | Greeting |
| `clubName` | string | yes | Club display name |
| `expiresInDays` | number \| string | yes | e.g. `7` |
| `acceptUrl` | string | yes | Absolute URL to `/invite/{token}` |

Example payload fragment:

```json
{
  "firstName": "rok 11",
  "clubName": "Club 1 test",
  "expiresInDays": 7,
  "acceptUrl": "https://app.example.com/invite/d4e5fc5a-ae8a-4bea-bf01-bfa77ffb5aab"
}
```

---

## 4. Registration continue OTP

| | |
| --- | --- |
| **File** | [`registration-otp.html`](./registration-otp.html) |
| **Suggested Brevo name** | `registration-otp` |
| **Suggested subject (EN)** | `Your registration code for {{ params.tournamentName }}` |

No link or button. The coach already has the public form open and types the code there. Do **not** put the 6-digit code in the subject.

### Params

| Param | Type | Required | Notes |
| --- | --- | --- | --- |
| `code` | string | yes | 6 digits |
| `tournamentName` | string | yes | Tournament display name |
| `expiresInMinutes` | number \| string | yes | Currently `10` |
| `firstName` | string | optional | Greeting; omit the `{{#if}}` block if empty |
| `clubName` | string | optional | Which roster this code unlocks |

```json
{
  "code": "123456",
  "tournamentName": "Zlati Pas Open 2026",
  "expiresInMinutes": 10,
  "firstName": "Rok",
  "clubName": "SKIF Ljubljana"
}
```

---

## Brevo notes

- Placeholders use transactional syntax: `{{ params.fieldName }}`.
- Loops use Handlebars-style `{{#each params.participants}}` / `{{#each this.categories}}`. If your Brevo/API setup uses a different loop syntax, keep the HTML structure and adjust delimiters, or inject `registrationsHtml` from the BE.
- For preview in Brevo, seed sample `params` matching the JSON examples above.
