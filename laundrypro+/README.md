# LaundryPro — one Vercel deployment

Customer order portal and secure admin dashboard in one Next.js application.

## Current features
- Public customer guest checkout (`/order`) with name, mobile, address, service, pickup date/time, estimated weight and notes.
- Secure admin sign-in (`/admin/login`), server-side admin-role verification and protected admin routes.
- Dashboard, order status management, customer directory and payment recording.
- Admin email notification using Resend when a customer order is created.
- Ready-for-pickup SMS integration using Twilio; the status action fails visibly if SMS credentials are not configured.
- Supabase schema with RLS policies.

## Important deployment note
This is a starter requiring configuration and verification, not a claim that it is already live or production-certified. Never expose the Supabase service-role key in browser code. Guest order inserts use a server-only service-role client. Before launch, test build, database policies, email, SMS, and abuse/rate limiting.

## Setup
1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase/schema.sql`.
3. Create the initial administrator in Supabase Authentication (Authentication → Users → Add user). Copy that user's UUID.
4. In SQL Editor, assign the role to that exact UUID:
   ```sql
   insert into public.profiles (id, full_name, role)
   values ('PASTE_AUTH_USER_UUID', 'LaundryPro Admin', 'admin')
   on conflict (id) do update set role='admin', full_name='LaundryPro Admin';
   ```
   Never expose a public admin registration page. Keep the service-role key private.
5. Copy `.env.example` to `.env.local` and fill in values:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server only; do not prefix with `NEXT_PUBLIC_`)
   - `RESEND_API_KEY`, `ADMIN_NOTIFICATION_EMAIL`, `FROM_EMAIL`
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
   - `NEXT_PUBLIC_SITE_URL`
6. Install dependencies and run locally:
   ```bash
   npm install
   npm run dev
   ```
7. Push the project to a private Git repository, import it in Vercel, add the same environment variables in Vercel Project Settings, then deploy.
8. Configure Resend with a verified sender domain. Configure Twilio with an approved sender/number and sufficient balance. SMS costs extra and delivery depends on provider/carrier/region.

## Security checklist before production
- Add rate limiting / bot protection to guest order endpoint.
- Configure Supabase backup and retention policies.
- Test RLS with anon and non-admin users.
- Use a verified domain for email.
- Verify Twilio account and Philippines delivery/sender requirements with provider before buying credits.
- Set `NEXT_PUBLIC_SITE_URL` to the real deployment URL.
- Add monitoring and error reporting.
- Customer order tracking should use a hard-to-guess reference plus phone OTP; do not expose customer data through a public lookup.
- Run `npm run build` before deployment.

## Limitations in this starter
- This project must be configured and tested against your actual Supabase, Resend and Twilio accounts.
- The guest order route uses a server-only Supabase client initialized with `SUPABASE_SERVICE_ROLE_KEY` to insert orders while keeping public direct database writes disabled by RLS. This key is used only in a server route and must never be exposed in client-side code. Add rate limiting/bot protection before public launch.
- Email errors are logged server-side; add durable retries/notification logs for production.
- Customer order tracking and pickup calendar UI are future enhancements.

## Admin login troubleshooting
- The sign-in screen is `/admin/login`. It is intentionally outside the protected admin workspace layout so logged-out users can reach it.
- In Vercel → Project → Settings → Environment Variables, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Production (and Preview if testing there), then redeploy.
- In Supabase → Authentication → Users, create the administrator account with email and password.
- Copy the user's UUID, then run the administrator profile SQL in the Setup section above. The profile must have `role = 'admin'` and its `id` must match the Auth user's UUID.
- If login reports a credential error, verify the email/password in Supabase Auth. If it reports an admin-role error, verify the matching row exists in `public.profiles` and the role is exactly `admin`.
- After changing Vercel environment variables, redeploy for changes to take effect. Never put the Supabase service-role key in a `NEXT_PUBLIC_` variable.

The admin login and session handling are being addressed here. The order-workflow button is intentionally left for a later step.
