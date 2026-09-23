import { NextResponse } from "next/server";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  if (!user) {
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
    profile,
  });
}