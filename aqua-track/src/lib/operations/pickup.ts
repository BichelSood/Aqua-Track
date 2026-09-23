import { createClient } from "@/lib/supabase/server";

type CollectBagResult =
  | {
      success: true;
      orderId: string;
      orderNumber: string;
    }
  | {
      success: false;
      error: string;
    };

export async function collectBag(
  bagCode: string,
  pickupSessionId: string,
): Promise<CollectBagResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: "AUTHENTICATION_REQUIRED",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    profile.role !== "DELIVERY_BOY" ||
    !profile.is_active
  ) {
    return {
      success: false,
      error: "DELIVERY_BOY_NOT_ACTIVE",
    };
  }

  const { data: order, error } = await supabase.rpc("collect_bag", {
    p_bag_code: bagCode,
    p_pickup_session_id: pickupSessionId,
    p_delivery_boy_id: user.id,
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    orderId: order.id,
    orderNumber: order.order_number,
  };
}