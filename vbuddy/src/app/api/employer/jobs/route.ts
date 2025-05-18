import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { validateCSRFToken } from "@/lib/csrf";

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

    // Fetch company_id from employer_profiles
    const { data: employerProfile, error: employerProfileError } =
      await supabase
        .from("employer_profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

    if (employerProfileError) {
      console.error("Error fetching employer profile:", employerProfileError);
      return new NextResponse("Failed to fetch employer profile", {
        status: 500,
      });
    }

    if (!employerProfile?.company_id) {
      return new NextResponse("Company profile not found", { status: 400 });
    }

    // Create job posting
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        employer_id: user.id,
        company_id: employerProfile.company_id,
        title: body.title,
        description: body.description,
        requirements: body.requirements,
        salary_range: body.salary_range,
        location: body.location,
        job_type: body.job_type,
        experience_level: body.experience_level,
        skills: body.skills,
        status: "open",
      })
      .select()
      .single();

    if (jobError) {
      console.error("Error creating job posting:", jobError);
      return new NextResponse("Failed to create job posting", { status: 500 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error in job posting:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
