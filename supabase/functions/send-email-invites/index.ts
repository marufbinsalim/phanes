import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const EMAIL_FROM = "Himanshu <catalystars@catalystars.com>";
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UserCreationType {
  email: string;
  password: string;
  company_id: string;
  base_url: string;
}

interface UserCreationResponse {
  email: string;
  password: string;
  creation_success: boolean;
  invite_url: string;
}

interface EmailResponse {
  email: string;
  password: string;
  creation_success: boolean;
  email_success: boolean;
  invite_url: string;
}

console.log("starting the function");

async function createUsers(
  users: UserCreationType[],
): Promise<UserCreationResponse[]> {
  // Create a Supabase client with the Auth context of the logged in user.
  const supabaseAdminClient = createClient(URL, ANON_KEY, {
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

  const batchRequests = users.map((user) => {
    // @ts-ignore
    return supabaseAdminClient.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { company_id: user.company_id, email: user.email },
    });
  });

  const responses = (await Promise.allSettled(
    batchRequests,
  )) as PromiseSettledResult<{
    error: boolean | null;
  }>[];

  const results = responses.map((res, i) => {
    if (res.status === "rejected") {
      return {
        email: users[i].email,
        password: users[i].password,
        creation_success: false,
      };
    }

    if (!res || !res.value) return null;

    const { error } = res.value as { error: boolean | null };
    return {
      email: users[i].email,
      password: users[i].password,
      creation_success: error ? false : true,
      invite_url: `${users[i].base_url}/invite?email=${
        users[i].email
      }&password=${users[i].password}`,
    };
  });

  return results.filter((result) => result !== null) as UserCreationResponse[];
}

async function sendEmails(
  data: UserCreationResponse[],
): Promise<EmailResponse[]> {
  const batchRequests = data.map((data) => {
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
            <p>Click <a href="${data.invite_url}">here</a> to login</p>
          </div>
          `,
      }),
    });
  });

  const responses = await Promise.allSettled(batchRequests);

  const results = responses.map((res, i) => {
    if (res.status === "fulfilled" && res.value.statusText === "OK") {
      return {
        email: data[i].email,
        password: data[i].password,
        creation_success: data[i].creation_success,
        email_success: true,
        invite_url: data[i].invite_url,
      };
    }

    return {
      email: data[i].email,
      password: data[i].password,
      creation_success: data[i].creation_success,
      email_success: false,
      invite_url: data[i].invite_url,
    };
  });

  return results;
}

function createRandomPassword(length: number) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Expose-Headers": "Content-Length, X-JSON",
        "Access-Control-Allow-Headers":
          "apikey,X-Client-Info, Content-Type, Authorization, Accept, Accept-Language, X-Authorization",
      },
    });
  }
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  );

  // Get the session or user object
  const authHeader = req.headers.get("Authorization")!;
  const token = authHeader.replace("Bearer ", "");

  // @ts-ignore
  const { data: calledBy } = await supabaseClient.auth.getUser(token);

  // if calledBy or calledBy.user is not present, return error
  if (!calledBy || !calledBy.user) {
    return new Response(
      JSON.stringify({ error: "function invoked by unknown user!" }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }

  const { data: requestedByUserData, error: requestedByError } =
    await supabaseClient
      .from("users")
      .select("*")
      .eq("id", calledBy.user.id)
      .single();

  if (requestedByError) {
    return new Response(
      JSON.stringify({ error: "error fetching function invoker data" }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }

  if (!requestedByUserData.company_id) {
    return new Response(
      JSON.stringify({
        error: "function invoker is not associated with a company!",
      }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }

  const body = await req.json();

  if (!body?.url) {
    return new Response(
      JSON.stringify({ error: "'url' : string is required" }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }

  // return error if emails are not provided
  if (!body?.emails) {
    return new Response(
      JSON.stringify({ error: "'emails' : stings[] is required" }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }
  // return error if emails is not an array of strings

  if (!Array.isArray(body.emails)) {
    return new Response(
      JSON.stringify({ error: "'emails' : stings[] is required" }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  }

  const emails = body.emails;

  const data: UserCreationType[] = emails.map((email: string) => {
    return {
      email,
      password: createRandomPassword(13),
      company_id: requestedByUserData.company_id,
      base_url: body.url,
    };
  });

  const userCreationResults = await createUsers(data);
  const emailSendingResults = await sendEmails(userCreationResults);

  const batchRequests = userCreationResults.map((res) => {
    if (!res.creation_success) {
      return Promise.resolve({
        status: "rejected",
        statusText: "ERORR",
      });
    }

    return supabaseClient
      .from("users")
      .update({
        company_id: requestedByUserData.company_id,
      })
      .eq("email", res.email)
      .select("company_id");
  });

  // keep track of the users who were successfully updated
  const responses = await Promise.allSettled(batchRequests);

  const results = responses.map((res, i) => {
    if (res.status === "rejected") {
      return {
        ...emailSendingResults[i],
        company_connected: false,
      };
    }

    if (
      !res || !res.value ||
      (res.value.statusText && res.value.statusText === "ERORR")
    ) {
      return {
        ...emailSendingResults[i],
        company_connected: false,
      };
    }

    const { data } = res.value;
    console.log(
      "res, cs, cid, ",
      res.value.data,
      emailSendingResults[i].creation_success,
      requestedByUserData.company_id,
    );
    return {
      ...emailSendingResults[i],
      company_connected: emailSendingResults[i].creation_success &&
          data &&
          data.length > 0 &&
          data[0].company_id === requestedByUserData.company_id
        ? true
        : false,
    };
  });

  return new Response(JSON.stringify(results), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});
