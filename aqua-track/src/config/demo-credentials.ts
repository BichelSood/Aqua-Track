export const demoRoleKeys = ["student", "delivery", "washing", "admin"] as const;

export type DemoRoleKey = (typeof demoRoleKeys)[number];

export type DemoCredentials = {
  email: string;
  password: string;
};

export const demoCredentials: Record<DemoRoleKey, DemoCredentials> = {
  student: {
    email: "h3.04@aquatrack.local",
    password: "DevPass123!",
  },
  delivery: {
    email: "d2@aquatrack.local",
    password: "DevPass123!",
  },
  washing: {
    email: "washing@aquatrack.local",
    password: "DevPass123!",
  },
  admin: {
    email: "admin@aquatrack.local",
    password: "DevPass123!",
  },
};

export function getDemoCredentials(role: string | undefined) {
  if (!role || !demoRoleKeys.includes(role as DemoRoleKey)) {
    return null;
  }

  return demoCredentials[role as DemoRoleKey];
}
