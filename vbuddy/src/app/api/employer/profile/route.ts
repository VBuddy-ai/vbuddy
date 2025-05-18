import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateCSRFToken } from "@/lib/csrf";

export async function PUT(request: Request) {
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

    // Get user and validate CSRF token
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const csrfToken = request.headers.get("x-csrf-token");
    if (!csrfToken || !validateCSRFToken(user.id, csrfToken)) {
      return new NextResponse("Invalid CSRF token", { status: 403 });
    }

    // Get request body
    const body = await request.json();

    // Update profile
    const { error } = await supabase
      .from("employer_profiles")
      .update({
        full_name: body.full_name,
        position: body.position,
        contact_phone: body.contact_phone,
        profile_picture_url: body.profile_picture_url,
        about_me: body.about_me,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Error updating employer profile:", error);
      return new NextResponse("Failed to update profile", { status: 500 });
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Error in employer profile update:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
