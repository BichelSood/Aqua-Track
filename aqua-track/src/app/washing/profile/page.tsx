import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/require-role";
import { getWashingFacilityName } from "@/features/washing/get-washing-data";
import { getUserRoleLabel } from "@/lib/labels";

export default async function WashingProfilePage() {
  const profile = await requireRole("WASHING_STAFF");
  const facility = await getWashingFacilityName(profile.facility_id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Profile</h2>
        <p className="text-sm text-muted-foreground">
          Washing staff account details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{profile.full_name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Role: {getUserRoleLabel(profile.role)}</p>
          <p>Phone: {profile.phone ?? "Not set"}</p>
          <p>
            Facility:{" "}
            {facility
              ? `${facility.name}${facility.code ? ` (${facility.code})` : ""}`
              : "Not assigned"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
