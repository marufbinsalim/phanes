import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const EMAIL_FROM = "Company <catalystars@catalystars.com>";

interface UserCreationType {
  email: string;
  password: string;
}

interface UserCreationResponse {
  email: string;
  password: string;
  creation_success: boolean;
  error?: string;
}

interface EmailResponse {
  email: string;
  password: string;
  email: string;
  password: string;
  creation_success: boolean;
  email_success: boolean;
  status: string;
  error: string | null;
}

console.log("starting the function");

async function createUsers(users: UserCreationType[]): UserCreationResponse[] {
  // Create a Supabase client with the Auth context of the logged in user.
  const supabaseClient = createClient(URL, ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    },
  });

  let batchRequests = users.map((user) => {
    return supabaseClient.auth.admin.createUser({
      email: user.email,
      password: user.password,
    });
  });

  let responses = await Promise.allSettled(batchRequests);

  let results = responses.map((res, i) => {
    const { data: responseData, error } = res.value;
    return {
      email: users[i].email,
      password: users[i].password,
      creation_success: error ? false : true,
      error: error ? error : null,
    };
  });

  return results;
}

async function sendEmails(data: UserCreationResponse[]): EmailResponse[] {
  let batchRequests = data.map((data) => {
    if (!data.creation_success) {
      return Promise.resolve({
        statusText: "User creation failed",
      });
    }

    return fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: data.email,
        subject: "You are invited to join our platform",
        html: `
          <div>
            <h1>Welcome to our platform</h1>
            <p>Here are your login details:</p>
            <p>Email: ${data.email}</p>
            <p>Password: ${data.password}</p>
            <p>Click <a href="https://example.com/login?password=${data.password}">here</a> to login</p>
          </div>
          `,
      }),
    });
  });

  // Use Promise.allSettled to handle both fulfilled and rejected promises
  let responses = await Promise.allSettled(batchRequests);

  let results = responses.map((res, i) => {
    if (res.value.statusText === "OK") {
      return {
        email: data[i].email,
        password: data[i].password,
        creation_success: data[i].creation_success,
        email_success: true,
        status: "successfully sent email",
        error: null,
      };
    }

    return {
      email: data[i].email,
      password: data[i].password,
      creation_success: data[i].creation_success,
      email_success: false,
      status: `${res.value.statusText}, problems with ${
        data[i].creation_success ? "email sending" : "user creation"
      }`,
      error: res.value.statusText,
    };
  });

  return results;
}

function createRandomPassword(length: number) {
  let result = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

Deno.serve(async (req) => {
  const body = await req.json();

  // return error if emails are not provided with error code 400
  if (!body?.emails) {
    return new Response(JSON.stringify({ error: "Emails are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  // return error if emails is not an array of strings with error code 400

  if (!Array.isArray(body.emails)) {
    return new Response(
      JSON.stringify({ error: "Emails should be an array of strings" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let emails = body.emails;

  let data: EmailDetails[] = emails.map((email) => {
    return {
      email,
      password: createRandomPassword(13),
    };
  });

  let userCreationResults = await createUsers(data);
  let emailSendingResults = await sendEmails(userCreationResults);

  return new Response(JSON.stringify({ result: emailSendingResults }), {
    headers: { "Content-Type": "application/json" },
  });
});

/*

to deploy the supabase edge function:
supabase functions deploy send-email-invites --project-ref atqtnstlgksxrtscusgd

through npx (if you don't have supabase CLI installed):
npx supabase functions deploy send-email-invites --project-ref atqtnstlgksxrtscusgd

to invoke globally:
curl -L -X POST 'https://atqtnstlgksxrtscusgd.supabase.co/functions/v1/send-email-invites' -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0cXRuc3RsZ2tzeHJ0c2N1c2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkzNDg5ODgsImV4cCI6MjA0NDkyNDk4OH0.H6YVBlPaZCFTaWYb1XUyQsENATOfk8vsKoLQahK1v8c'    --data '{"emails": ["waliurrahman324@gmail.com", "darkshadowub57@gmail.com"]}'

secrets to set:
RESEND_API_KEY=your_resend_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

*/
