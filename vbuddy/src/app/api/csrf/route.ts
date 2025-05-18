import { NextResponse } from "next/server";
import { generateCSRFToken } from "@/lib/csrf";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
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
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const token = await generateCSRFToken(user.id);

    return new NextResponse(null, {
      status: 200,
      headers: {
        "x-csrf-token": token,
      },
    });
  } catch (error) {
    console.error("Error generating CSRF token:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
