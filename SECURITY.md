# Security policy

## Reporting a vulnerability

If you find a security issue, please **don't** open a public GitHub issue. Instead:

1. Use GitHub's [private security advisory form](https://github.com/iamjohnnymac/perthpintprices/security/advisories/new) — preferred
2. Or email `macca.mck+security@gmail.com` with the subject line `[security] Perth Pint Prices`

Please include:
- A clear description of the issue
- Steps to reproduce
- Affected URLs / endpoints / commits
- Your assessment of impact and severity

You'll get an acknowledgement within 72 hours. Real fixes ship within 7 days for high-impact issues, sooner if it's actively exploitable.

## Scope

Reports about the following are in scope:
- The site at perthpintprices.com
- The API routes in `src/app/api/*`
- The GitHub repo (this one)
- The Vercel project configuration
- The Supabase project (`ifxkoblvgttelzboenpi`)
- The ElevenLabs voice agent (Andrew) and its webhook integrations

Out of scope:
- Social engineering of the maintainer
- Physical attacks
- Anything requiring access to a personal device or account
- Vulnerabilities in third-party services we depend on (report to them directly)

## Supported versions

Only the latest deploy on `main` is supported. There are no LTS branches.

## Acknowledgements

Will list responsibly-disclosed reporters here unless they prefer otherwise.
