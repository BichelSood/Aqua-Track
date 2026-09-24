import { createClient } from "@/lib/supabase/server";
import { toAppError } from "@/lib/errors";
import type { AppResult } from "@/types";

export type CollectedOrder = {
  orderId: string;
  orderNumber: string;
};

export async function collectBag(input: {
  identifier: string;
  pickupSessionId: string;
}): Promise<AppResult<CollectedOrder>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: toAppError("AUTHENTICATION_REQUIRED"),
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
      error: toAppError("DELIVERY_BOY_NOT_ACTIVE"),
    };
  }

  const { data: order, error } = await supabase.rpc(
    "collect_bag_by_identifier",
    {
      p_identifier: input.identifier,
      p_pickup_session_id: input.pickupSessionId,
    },
  );

  if (error) {
    return {
      success: false,
      error: toAppError(error),
    };
  }

  return {
    success: true,
    data: {
      orderId: order.id,
      orderNumber: order.order_number,
    },
  };
}

export async function createPickupSession(input: {
  hostelId: string;
  deliveryBoyId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
}): Promise<AppResult<{ id: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: toAppError("AUTHENTICATION_REQUIRED"),
    };
  }

  const { data, error } = await supabase.rpc("create_pickup_session", {
    p_hostel_id: input.hostelId,
    p_delivery_boy_id: input.deliveryBoyId,
    p_scheduled_date: input.scheduledDate,
    p_start_time: input.startTime,
    p_end_time: input.endTime,
  });

  if (error) {
    return {
      success: false,
      error: toAppError(error),
    };
  }

  const session = Array.isArray(data) ? data[0] : data;

  return {
    success: true,
    data: { id: session.id },
  };
}

export async function announcePickupSession(
  pickupSessionId: string,
): Promise<AppResult<{ id: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: toAppError("AUTHENTICATION_REQUIRED"),
    };
  }

  const { data, error } = await supabase.rpc("announce_pickup_session", {
    p_pickup_session_id: pickupSessionId,
  });

  if (error) {
    return {
      success: false,
      error: toAppError(error),
    };
  }

  const session = Array.isArray(data) ? data[0] : data;

  return {
    success: true,
    data: { id: session.id },
  };
}

export async function startPickupSession(
  pickupSessionId: string,
): Promise<AppResult<{ id: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: toAppError("AUTHENTICATION_REQUIRED"),
    };
  }

  const { data, error } = await supabase.rpc("start_pickup_session", {
    p_pickup_session_id: pickupSessionId,
  });

  if (error) {
    return {
      success: false,
      error: toAppError(error),
    };
  }

  const session = Array.isArray(data) ? data[0] : data;

  return {
    success: true,
    data: { id: session.id },
  };
}

export async function completePickupSession(
  pickupSessionId: string,
): Promise<AppResult<{ id: string }>> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: toAppError("AUTHENTICATION_REQUIRED"),
    };
  }

  const { data, error } = await supabase.rpc("complete_pickup_session", {
    p_pickup_session_id: pickupSessionId,
  });

  if (error) {
    return {
      success: false,
      error: toAppError(error),
    };
  }

  const session = Array.isArray(data) ? data[0] : data;

  return {
    success: true,
    data: { id: session.id },
  };
}
