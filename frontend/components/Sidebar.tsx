import Link from "next/link";
import { Home, BarChart2, LayoutDashboard } from "lucide-react";

export default function Sidebar() {
  return (
    <div className="w-64 bg-white border-r p-6 flex flex-col gap-6 min-h-screen">
      
      <h2 className="text-2xl font-bold">Prody</h2>

      <nav className="flex flex-col gap-4 text-gray-700">
        <Link href="/dashboard" className="flex items-center gap-3 hover:text-black">
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        <Link href="#" className="flex items-center gap-3 hover:text-black">
          <Home size={18} />
          Projects
        </Link>

        <Link href="#" className="flex items-center gap-3 hover:text-black">
          <BarChart2 size={18} />
          Analytics
        </Link>
      </nav>
    </div>
  );
}
