import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/require-role";
import { getStudentProfilePageData } from "@/features/student/get-dashboard-data";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await requireRole("STUDENT");
  const { profile, hostel, bags } = await getStudentProfilePageData(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Your contact details and assigned bags.
        </p>
      </div>

      <ProfileForm
        fullName={profile.full_name}
        phone={profile.phone}
        roomNumber={profile.room_number}
      />

      <Card>
        <CardHeader>
          <CardTitle>Hostel and roll number</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Hostel: {hostel?.name ?? "Not assigned"}
            {hostel?.code ? ` (${hostel.code})` : ""}
          </p>
          <p>Roll number: {profile.roll_number ?? "Not set"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bags</CardTitle>
        </CardHeader>
        <CardContent>
          {bags.length === 0 ? (
            <EmptyState message="No bags are assigned to you yet." />
          ) : (
            <ul className="space-y-2 text-sm">
              {bags.map((bag) => (
                <li key={bag.id}>
                  {bag.bag_code}
                  {bag.is_active ? "" : " (inactive)"}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-sm">
        <Link href="/complaints" className="underline">
          View or submit complaints
        </Link>
      </p>
    </div>
  );
}
