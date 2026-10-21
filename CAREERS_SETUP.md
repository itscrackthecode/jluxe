# JLUXE Careers portal setup

The Careers portal is part of the existing JLUXE Next.js application and uses the existing GitHub repository and Vercel project. It does not require a second Vercel project or a separate backend.

## Before enabling applications

1. Attach `careers.thejluxe.com` to the existing Vercel project and configure the domain's DNS through the responsible domain provider. This repository change does not alter either setting.
2. Ensure the existing PostgreSQL `DATABASE_URL` is configured for the deployment environment. Review `database/migrations/029_careers_portal.sql` and apply it through the established migration process only after explicit deployment/database approval. The migration has not been run as part of this code change.
3. Configure the existing Cloudflare Turnstile site/secret pair in Vercel as `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. Allow the exact production hostname `careers.thejluxe.com` (and any separately used preview hostnames) in the Turnstile widget configuration. The server checks the Siteverify hostname and the `career_application` action.
4. Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in Vercel. Resume uploads use server-authenticated Cloudinary raw assets under `jluxe/careers/resumes/`; the public media upload preset is not used. Keep the API secret server-only. No credentials are included in this repository.
5. Verify an Owner/Admin account can open `/admin/careers`. Editors with the existing `edit-content` permission can manage job descriptions but cannot view candidate information. Only Owners/Admins can review, download, retain, or delete applications.

The two seeded vacancies are drafts. Review and complete their descriptions in the admin interface before publishing. Salary, location, work arrangement, benefits, and deadlines are intentionally left unspecified until JLUXE confirms them.

## Operations and data handling

- Candidate resumes are limited to PDF files up to 5 MB, stored as authenticated Cloudinary assets, and downloaded through an admin-protected, short-lived URL.
- Cloudflare Turnstile and the existing database-backed public API rate limiter protect application submissions. The rate limiter uses the existing `ADMIN_SESSION_SECRET` and trusted Vercel client-IP forwarding.
- No application-received email is sent by this feature. The confirmation page confirms receipt in the browser only.
- Application retention is a manual Owner/Admin action under the Applications section. Each run processes up to 50 records; repeat the action to process additional eligible records. Set a retention period with the organization's privacy/legal owner before using it operationally.
- Review the Careers-specific disclosures in the site's privacy policy and confirm the legal operator, contact, and retention details before public launch.
