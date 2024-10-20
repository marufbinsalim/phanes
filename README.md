# Panes - A supabase edge function

- created for a client in fiverr

Features:

- takes in a list of emails
- Creates user in supabase with the emails, randomly generated credentials in bulk
- For the created users - sends an email to the users emails, with the login link and password
- Error Handling
- company id connection to new account

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

## Dpcumentation for the function

### Description

This function is used to send email invites to users. It takes a list of emails and sends an email to each email with a randomly generated password.
The email contains the email and password of the user and a link to login to the platform.

### Request

- Method: POST
- Endpoint: <url>/functions/v1/send-email-invites
- Headers:
  - Authorization: Bearer <Supabase Anon Key>
- Body:
  - emails: string[]
    - list of emails to send invites to

## Example Request

curl -L -X POST 'https://<ref>.supabase.co/functions/v1/send-email-invites' -H 'Authorization

## Example Response

creation_success: true if the user was created successfully, false otherwise
email_success: true if the email was sent successfully, false otherwise
company_connected: true if the user was successfully connected to the company, false otherwise

```json
[
  {
    "email": "user1@gmail.com",
    "password": "password1",
    "creation_success": true,
    "email_success": true,
    "company_connected": true
  },
  {
    "email": "user2@gmail.com",
    "password": "password2",
    "creation_success": false,
    "email_success": false,
    "company_connected": false
  }
]
```

## Invoke the function using the Supabase client:

```ts
const { data, error } = await supabase.functions.invoke("send-email-invites", {
  body: { emails: ["user1@gmail.com", "user2@gmail.com"] },
});
```

set up the function in the supabase dashboard:

```bash
- supabase secrets set RESEND_API_KEY=your_resend_api_key
- other secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY are already set in the function by default
```
