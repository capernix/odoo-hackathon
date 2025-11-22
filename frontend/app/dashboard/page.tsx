"use client";
import Sidebar from "@/components/Sidebar";
import DashboardCard from "@/components/DashboardCard";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("@/components/Chart"), { ssr: false });

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-10">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">House Spectrum Ltd</h1>
          <div className="flex gap-4 items-center">
            <div className="text-sm text-gray-500">Edited 7 hrs ago</div>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <DashboardCard title="Sales" value="5.3/10" />
          <DashboardCard title="Profit" value="2.4/10" />
          <DashboardCard title="Customer" value="7.8/10" />
        </div>

        <Chart />

        <div className="mt-8 bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">All Deals</h2>
          <table className="w-full text-left text-gray-700">
            <thead><tr className="border-b"><th>ID</th><th>Deal</th><th>Contact</th><th>Email</th><th>Value</th></tr></thead>
            <tbody>
              <tr className="border-b"><td>01</td><td>Acme</td><td>Tyra</td><td>tyra@acme.com</td><td>$3,912</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
