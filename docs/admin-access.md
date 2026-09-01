# Admin access

The admin dashboard uses the `ADMIN_PASSWORD` environment variable in Vercel.
The same password protects the stats and review API routes.

## Reset the password

From the project directory, run:

```bash
npm run admin:reset-password
```

Enter the new password twice. The command does not display it while you type.
Use at least 16 characters and save it in your password manager.

The command stores `ADMIN_PASSWORD` in the linked Infisical project for `dev`,
`staging`, and `prod`. It then updates Vercel Production, Preview, and
Development before rebuilding the current production deployment. It rebuilds
the existing production source, so uncommitted local files are not deployed.

You need the Infisical and Vercel CLIs installed and signed in. Run the command
from this repository so both tools use the linked Perth Pint Prices projects.

## Google Places approval

The pub submission picker reads `GOOGLE_PLACES_API_KEY` on the server. Keep this
key in Infisical and sync it to the Vercel Development, Preview and Production
environments. Do not expose it through a `NEXT_PUBLIC_` variable.

The same key currently exists as a GitHub Actions secret, but GitHub secrets are
not available to the running Vercel application. The Infisical to Vercel sync
must create the runtime variable before the picker can search.

Restrict the key to Places API (New) in Google Cloud. The application uses Text
Search and Place Details.

## Slack pub-submission notifications

New pub submissions send an incoming-webhook message to
`#all-perth-pint-prices` after the database insert succeeds. A Slack failure is
logged but does not reject the user's submission.

Keep `SLACK_WEBHOOK_URL` in Infisical `dev`, `staging`, and `prod`, with synced
copies in the matching Vercel environments. The webhook URL is server-only and
must not use a `NEXT_PUBLIC_` variable.
