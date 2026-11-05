# Publish the live demo to GitHub + Render

Goal: every visitor to the GitHub repository sees a live demo link, a screenshot of
the failure flow, and CI/live-status badges.

GitHub does not execute code in a README and strips iframes, so the public URL plus
the screenshot is the integration. The app runs on Render; the repository links to
it.

## 1. Create the GitHub repository

From this directory:

```bash
git add .
git commit -m "Proving Ground: sandbox bridge with live Resend alert demo"
gh repo create sandbox-bridge --public --source=. --push
```

If the repository name is not `sandbox-bridge`, update the badge URLs in
`README.md` to match the real `owner/repo`.

## 2. Deploy with the Render Blueprint

1. Push the repository to GitHub.
2. In Render, choose **New → Blueprint** and connect the repository.
3. Render reads `render.yaml` and asks for the secret values:
   - `RESEND_API_KEY` — from <https://resend.com/api-keys>.
   - `ALERT_TO_EMAIL` — where the developer alert is delivered.
   - `ALERT_FROM_EMAIL` — a verified sender, e.g.
     `Proving Ground <alerts@yourdomain.com>`.
   - `APP_URL` — prefilled as `https://proving-ground.onrender.com`. Change it if
     Render assigns a different service name.
4. Apply the Blueprint and wait for the first deploy.
5. Open `https://<your-service>.onrender.com/demo` and run the broken case.

`render.yaml` uses the Starter plan plus a 1 GB disk mounted at
`/opt/render/project/src/data` so SQLite keeps incidents, runs, and alert history.
To use the free plan instead, remove the `disk:` block and set `plan: free`; the
database will reset on every deploy and the service sleeps when idle.

If the first deploy finishes before `APP_URL` is known, set `APP_URL` afterwards
and trigger a manual redeploy so the email's "Open the incident" link is correct.

### Resend notes

- `onboarding@resend.dev` only delivers to the email address that owns the Resend
  account. Verify a domain before sending to anyone else.
- Without `RESEND_API_KEY`, the app still records incidents and shows the email
  preview, but delivery is marked `skipped`.
- Use `DEMO_ALERT_COOLDOWN_SECONDS=0` when demoing to several buyers in a row.

## 3. Turn on the live check

In GitHub: **Settings → Secrets and variables → Actions → Variables → New repository
variable**:

- Name: `DEMO_URL`
- Value: `https://<your-service>.onrender.com`

The `Live demo check` workflow then probes the page and both checkout modes every
30 minutes. The workflow badge proves the public demo is still alive.

## 4. Update the README link

Replace the deployment placeholder in the README badge and the "Live demo" section
with the real URL:

```md
[![Live demo](https://img.shields.io/badge/live_demo-open-7cf5c4?style=flat-square)](https://<your-service>.onrender.com/demo)
```

Visitors now get:

- A live link that opens the working-vs-broken demo.
- A screenshot of the customer message and the Resend email preview.
- A CI badge and a live-demo badge.
- One-click Render Blueprint deployment instructions for their own copy.

## 5. What a buyer sees

1. Open `/demo` from the README.
2. The broken case shows the exact customer-facing message and the technical trace.
3. The developer alert card says it was delivered through Resend, with the request
   ID and a preview of the email.
4. Running the same case again shows duplicate suppression.
5. Running the healthy case sends the recovery email and closes the incident.
6. The Resend delivery log shows both events.

No real card is charged at any point.
