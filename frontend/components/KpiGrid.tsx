// ...existing code...
import React, { useEffect, useState, useRef } from "react";
import KpiCard from "./KpiCard";
import SparklineChart from "./SparklineChart"; // Ensure this file exists
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const sb: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON);

type KpiPayload = {
  totalProducts: number;
  lowStock: { low: number; out: number };
  pendingReceipts: number;
  receiptsTotal?: number;
  receiptsValidated?: number;
  pendingDeliveries: number;
  internalTransfers: number;
  recentMovements: Array<{ id: string; qty: number; created_at: string; type?: string }>;
};

export default function KpiGrid() {
  const [kpis, setKpis] = useState<KpiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const subRef = useRef<any>(null);

  const fetchKpis = async () => {
    try {
      const res = await fetch("/api/kpis");
      if (!res.ok) throw new Error("kpis fetch failed");
      const json: KpiPayload = await res.json();
      setKpis(json);
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchKpis();
    const timer = setInterval(fetchKpis, 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Subscribe to movements changes to trigger near-real-time refresh
    subRef.current = sb
      .channel("public:movements")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "movements" },
        () => {
          fetchKpis();
        }
      )
      .subscribe();

    return () => {
      if (subRef.current) sb.removeChannel(subRef.current);
    };
  }, []);

  const chartPoints =
    (kpis?.recentMovements || [])
      .slice()
      .reverse()
      .map((m) => ({ x: m.created_at, y: Math.max(Math.abs(m.qty || 0), 1) })) || [];

  const receiptsTotal = kpis?.receiptsTotal ?? 0;
  const receiptsValidated = kpis?.receiptsValidated ?? 0;
  const validatedPercent = receiptsTotal ? Math.round((receiptsValidated / receiptsTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <KpiCard
          title="Total Products"
          value={loading ? "…" : kpis?.totalProducts ?? 0}
          subtitle="Aggregate across locations"
          trend={{ direction: "up", percent: 2.4 }}
          onClick={() => (window.location.href = "/products")}
        />

        <KpiCard
          title="Low / Out of Stock"
          value={loading ? "…" : `${kpis?.lowStock.low ?? 0} low, ${kpis?.lowStock.out ?? 0} out`}
          subtitle="Click to view filtered products"
          colorClass="bg-yellow-50"
          onClick={() => (window.location.href = "/products?filter=low")}
        />

        <KpiCard
          title="Pending Receipts"
          value={loading ? "…" : kpis?.pendingReceipts ?? 0}
          subtitle="Incoming shipments waiting validation"
          colorClass="bg-blue-50"
          progress={{ value: validatedPercent, label: `${receiptsValidated ?? 0} validated` }}
          onClick={() => (window.location.href = "/receipts")}
        />

        <KpiCard
          title="Pending Deliveries"
          value={loading ? "…" : kpis?.pendingDeliveries ?? 0}
          subtitle="Orders in Pick/Pack"
          colorClass="bg-red-50"
          badge={kpis && kpis.pendingDeliveries > 0 ? `${kpis.pendingDeliveries} urgent` : undefined}
          onClick={() => (window.location.href = "/deliveries")}
        />

        <KpiCard
          title="Internal Transfers"
          value={loading ? "…" : kpis?.internalTransfers ?? 0}
          subtitle="Queued internal moves"
          colorClass="bg-indigo-50"
          onClick={() => (window.location.href = "/transfers")}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Recent Stock Movements</h3>
          <div className="text-xs text-gray-400">Auto-updates after manager approvals</div>
        </div>
        <SparklineChart points={chartPoints} />
      </div>
    </div>
  );
}