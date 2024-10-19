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

## to deploy the supabase edge function:
bash```
supabase functions deploy send-email-invites --project-ref atqtnstlgksxrtscusgd
```


through npx (if you don't have supabase CLI installed):
npx supabase functions deploy send-email-invites --project-ref atqtnstlgksxrtscusgd

to invoke globally:
curl -L -X POST 'https://atqtnstlgksxrtscusgd.supabase.co/functions/v1/send-email-invites' -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0cXRuc3RsZ2tzeHJ0c2N1c2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkzNDg5ODgsImV4cCI6MjA0NDkyNDk4OH0.H6YVBlPaZCFTaWYb1XUyQsENATOfk8vsKoLQahK1v8c'    --data '{"emails": ["waliurrahman324@gmail.com", "darkshadowub57@gmail.com"]}'

secrets to set:
RESEND_API_KEY=your_resend_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
