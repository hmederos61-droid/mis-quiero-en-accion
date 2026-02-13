import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 });
          },
        },
      }
    );

    const body = await request.json().catch(() => ({}));
    const token = body?.token;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { ok: false, error: "TOKEN_REQUIRED" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc(
      "activate_coach_by_token",
      { p_token: token }
    );

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: "RPC_ERROR",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    const result = Array.isArray(data) ? data[0] : null;

    if (!result) {
      return NextResponse.json(
        { ok: false, error: "EMPTY_RPC_RESULT" },
        { status: 500 }
      );
    }

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });

  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "UNEXPECTED_ERROR",
        detail: e?.message ?? String(e),
      },
      { status: 500 }
    );
  }
}
