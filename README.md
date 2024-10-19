# Panes - A supabase edge function

- created for a client in fiverr


Features:
- takes in a list of emails
- Creates user in supabase with the emails, randomly generated credentials in bulk
- For the created users - sends an email to the users emails, with the login link and password
- Error Handling 

## Made with the following:

- supabase cli
- deno
- supabase sdk
- resend for email sending


## Guidelines to replicate:
- Setup domain in resend to send emails to users
- Email confirmation for authentication should be disabled in supabase project
- To locally run (see supabase edge functions set up guide)
- Tldr, you'd need supabase cli, docker apt, and docker engine setup to run locally

## to deploy the supabase edge function:

```bash
supabase functions deploy send-email-invites --project-ref atqtnstlgksxrtscusgd
```

## through npx (if you don't have supabase CLI installed):

```bash
npx supabase functions deploy send-email-invites --project-ref atqtnstlgksxrtscusgd
```

## to invoke globally:

```bash
curl -L -X POST 'https://<project-ref>.supabase.co/functions/v1/send-email-invites' -H 'Authorization: Bearer <anon>'    --data '{"emails": ["x@gmail.com", "y@gmail.com"]}'
```

## secrets to set:

```bash
RESEND_API_KEY=your_resend_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

