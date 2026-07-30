// supabase/functions/send-customer-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, email } = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ELVRE Orders <orders@elvre.in>",
        to: [email],
        subject: "Your ELVRE Jaggery Powder Order",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <p>Hi ${name},</p>

            <p>
              Thank you for choosing <b>ELVRE Jaggery Powder</b>.
              Your jaggery powder is currently being prepared fresh.
              Once ready, it will be carefully packed and dispatched
              straight to your doorstep.
            </p>

            <p>
              For any assistance, feel free to contact ELVRE Customer Care.
            </p>

            <br/>

            <p>
              Warm regards,<br/>
              <b>Team 𝓔𝓵𝓿𝓻𝓮</b><br/>
              +91 79063 96629
            </p>

            <br/>

            <!-- ELVRE Logo -->
            <img 
              src="https://sgknwujmmkiqogvplljz.supabase.co/storage/v1/object/public/email-assets/elvregreen1.jpeg"
              alt="ELVRE Logo"
              width="100"
              style="margin-top: 10px;"
            />
          </div>
        `,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw data;

    return new Response(JSON.stringify({ success: true }), {
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
