// ...existing code...
import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // 1) total products
    const { count: totalProducts } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("deleted", false);

    // 2) pending receipts and validated receipts
    const { count: pendingReceipts } = await supabase
      .from("receipts")
      .select("id", { count: "exact", head: true })
      .in("status", ["waiting", "ready"]);

    const { count: receiptsValidated } = await supabase
      .from("receipts")
      .select("id", { count: "exact", head: true })
      .eq("validated", true);

    const { count: receiptsTotal } = await supabase
      .from("receipts")
      .select("id", { count: "exact", head: true });

    // 3) pending deliveries
    const { count: pendingDeliveries } = await supabase
      .from("deliveries")
      .select("id", { count: "exact", head: true })
      .in("status", ["pick", "pack"]);

    // 4) internal transfers scheduled
    const { count: internalTransfers } = await supabase
      .from("transfers")
      .select("id", { count: "exact", head: true })
      .eq("status", "scheduled");

    // 5) low/out of stock: aggregate in JS by reading stock_levels
    const { data: stockRows } = await supabase
      .from("stock_levels")
      .select("product_id, qty");

    const productTotals: Record<string, number> = {};
    (stockRows || []).forEach((r: any) => {
      productTotals[r.product_id] = (productTotals[r.product_id] || 0) + (r.qty || 0);
    });

    const LOW_THRESHOLD = 10;
    let low = 0;
    let out = 0;
    Object.values(productTotals).forEach((t) => {
      if (t <= LOW_THRESHOLD) low++;
      if (t <= 0) out++;
    });

    // 6) recent movements (last 20)
    const { data: recentMovements } = await supabase
      .from("movements")
      .select("id, qty, created_at, type")
      .order("created_at", { ascending: false })
      .limit(20);

    res.status(200).json({
      totalProducts: totalProducts ?? 0,
      pendingReceipts: pendingReceipts ?? 0,
      receiptsValidated: receiptsValidated ?? 0,
      receiptsTotal: receiptsTotal ?? 0,
      pendingDeliveries: pendingDeliveries ?? 0,
      internalTransfers: internalTransfers ?? 0,
      lowStock: { low, out },
      recentMovements: recentMovements ?? [],
    });
  } catch (err) {
    console.error("kpis error", err);
    res.status(500).json({ error: "Failed to fetch KPIs" });
  }
}