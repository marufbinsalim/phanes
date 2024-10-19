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
