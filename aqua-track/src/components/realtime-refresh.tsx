"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type RealtimeTable = {
  table: string;
  filter?: string;
};

export function RealtimeRefresh({
  channelName,
  tables,
}: {
  channelName: string;
  tables: RealtimeTable[];
}) {
  const router = useRouter();
  const tablesKey = JSON.stringify(tables);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const parsed = JSON.parse(tablesKey) as RealtimeTable[];
    const supabase = createClient();
    let cancelled = false;

    const scheduleRefresh = () => {
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
      refreshTimer.current = setTimeout(() => {
        if (!cancelled) {
          router.refresh();
        }
      }, 200);
    };

    let channel = supabase.channel(channelName);

    for (const table of parsed) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table.table,
          ...(table.filter ? { filter: table.filter } : {}),
        },
        scheduleRefresh,
      );
    }

    channel.subscribe();

    return () => {
      cancelled = true;
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
      void supabase.removeChannel(channel);
    };
  }, [channelName, tablesKey, router]);

  return null;
}
