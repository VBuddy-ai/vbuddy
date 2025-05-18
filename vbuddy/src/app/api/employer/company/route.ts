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

    // Verify that the user has access to this company
    const { data: employerProfile } = await supabase
      .from("employer_profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!employerProfile || employerProfile.company_id !== body.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Update company profile
    const { error } = await supabase
      .from("employer_company_profiles")
      .update({
        name: body.name,
        description: body.description,
        website_url: body.website_url,
        logo_url: body.logo_url,
        industry: body.industry,
        company_size: body.company_size,
        location: body.location,
      })
      .eq("id", body.id);

    if (error) {
      console.error("Error updating company profile:", error);
      return new NextResponse("Failed to update company profile", {
        status: 500,
      });
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Error in company profile update:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
