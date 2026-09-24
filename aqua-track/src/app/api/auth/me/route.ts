import { NextResponse } from "next/server";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  if (!user || !profile?.is_active) {
    return NextResponse.json(
      {
        authenticated: false,
      },
      { status: 401 },
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
    },
    profile: {
      id: profile.id,
      fullName: profile.full_name,
      role: profile.role,
      isActive: profile.is_active,
    },
  });
}
