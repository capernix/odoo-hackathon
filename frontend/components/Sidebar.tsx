'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Warehouse as WarehouseIcon,
  Truck, 
  ClipboardCheck,
  Settings,
  LogOut,
  User,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    name: 'Stock Overview',
    href: '/stock',
    icon: <Package className="w-5 h-5" />,
  },
  {
    name: 'Internal Transfers',
    href: '/transfers',
    icon: <Truck className="w-5 h-5" />,
  },
  {
    name: 'Stock Adjustments',
    href: '/adjustments',
    icon: <ClipboardCheck className="w-5 h-5" />,
  },
  {
    name: 'Warehouses',
    href: '/warehouses',
    icon: <WarehouseIcon className="w-5 h-5" />,
  },
  {
    name: 'Products',
    href: '/products',
    icon: <Package className="w-5 h-5" />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-zinc-900 rounded-lg shadow-lg"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-zinc-900 dark:text-zinc-50" />
        ) : (
          <Menu className="w-6 h-6 text-zinc-900 dark:text-zinc-50" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 transition-transform",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-500">
              StockMaster
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Inventory Management
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                        isActive
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium"
                          : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      )}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Link
                href="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  pathname === '/settings'
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                )}
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </Link>
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-zinc-50 dark:bg-zinc-800">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                  Inventory Manager
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  manager@stock.com
                </p>
              </div>
            </div>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              onClick={() => {
                // Handle logout
                console.log('Logout clicked');
              }}
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
