import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Body = { token?: string };

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) {
      return NextResponse.json(
        { ok: false, code: "NOT_AUTHENTICATED" },
        { status: 401 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const token = (body.token || "").trim();

    if (!token) {
      return NextResponse.json(
        { ok: false, code: "MISSING_TOKEN" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("activate_coach_by_token", {
      p_token: token,
    });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          code: error.code || "RPC_ERROR",
          message: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, code: "SERVER_ERROR", message: String(e?.message || e) },
      { status: 500 }
    );
  }
}
