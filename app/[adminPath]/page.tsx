'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface TopProduct {
  productId: string;
  name: string;
  unitsSold: number;
  totalRevenue: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  category: string;
  price: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  city: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: Array<{ id: string; name: string; quantity: number }>;
}

interface DailyRevenuePoint {
  date: string;
  displayDate: string;
  revenue: number;
  orders: number;
}

interface DashboardStats {
  revenue: {
    today: number;
    sevenDays: number;
    thirtyDays: number;
    allTime: number;
  };
  orders: {
    total: number;
    pending: number;
    inTransit: number;
    deliveredThisMonth: number;
  };
  lowStockProducts: LowStockProduct[];
  lowStockCount: number;
  topProducts: TopProduct[];
  recentOrders: RecentOrder[];
  dailyRevenue: DailyRevenuePoint[];
}

export default function AdminDashboardPage({
  params,
}: {
  params: { adminPath: string };
}) {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const basePath = `/${params.adminPath}`;

  useEffect(() => {
    setMounted(true);
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(json => {
        if (json.success && json.stats) {
          setData(json.stats);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'packed':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'confirmed':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'placed':
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-8 max-w-7xl pb-16">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#553E23]">
            Executive Dashboard
          </h1>
          <p className="text-sm text-[#7A5B37] mt-1">
            Real-time business performance, 30-day revenue analytics & order fulfillment
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`${basePath}/orders`}
            className="bg-[#1E6B5C] hover:bg-[#165A4A] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <span>📦</span>
            <span>Manage Orders</span>
          </Link>
          <Link
            href={`${basePath}/products/new`}
            className="bg-white hover:bg-[#FFF8EC] text-[#553E23] border border-[#E8DCC8] px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
          >
            + New Product
          </Link>
        </div>
      </div>

      {/* 4 Revenue Cards: Today, 7d, 30d, All-Time */}
      <div>
        <div className="text-xs font-bold text-[#7A5B37] uppercase tracking-wider mb-3">
          Revenue Overview
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DCC8] shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#1E6B5C] uppercase tracking-wider">
              <span>Today</span>
              <span className="p-1.5 rounded-lg bg-[#1E6B5C]/10 text-sm">📅</span>
            </div>
            <div className="text-2xl font-bold font-serif text-[#553E23] mt-2">
              {loading ? '...' : formatCurrency(data?.revenue.today || 0)}
            </div>
            <div className="text-[11px] text-[#7A5B37] mt-0.5">Orders placed today</div>
          </div>

          {/* 7 Days */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DCC8] shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#1E6B5C] uppercase tracking-wider">
              <span>Last 7 Days</span>
              <span className="p-1.5 rounded-lg bg-[#1E6B5C]/10 text-sm">📈</span>
            </div>
            <div className="text-2xl font-bold font-serif text-[#553E23] mt-2">
              {loading ? '...' : formatCurrency(data?.revenue.sevenDays || 0)}
            </div>
            <div className="text-[11px] text-[#7A5B37] mt-0.5">Rolling 7-day intake</div>
          </div>

          {/* 30 Days */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DCC8] shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#1E6B5C] uppercase tracking-wider">
              <span>Last 30 Days</span>
              <span className="p-1.5 rounded-lg bg-[#1E6B5C]/10 text-sm">💳</span>
            </div>
            <div className="text-2xl font-bold font-serif text-[#553E23] mt-2">
              {loading ? '...' : formatCurrency(data?.revenue.thirtyDays || 0)}
            </div>
            <div className="text-[11px] text-[#7A5B37] mt-0.5">Monthly gross revenue</div>
          </div>

          {/* All-Time */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DCC8] shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
              <span>All-Time Gross</span>
              <span className="p-1.5 rounded-lg bg-[#D4AF37]/10 text-sm">👑</span>
            </div>
            <div className="text-2xl font-bold font-serif text-[#553E23] mt-2">
              {loading ? '...' : formatCurrency(data?.revenue.allTime || 0)}
            </div>
            <div className="text-[11px] text-[#7A5B37] mt-0.5">Lifetime fulfilled revenue</div>
          </div>
        </div>
      </div>

      {/* 4 Orders Cards: Total, Pending, In Transit, Delivered This Month */}
      <div>
        <div className="text-xs font-bold text-[#7A5B37] uppercase tracking-wider mb-3">
          Fulfillment Pipeline
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Orders */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DCC8] shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#553E23] uppercase tracking-wider">
              <span>Total Orders</span>
              <span className="p-1.5 rounded-lg bg-[#553E23]/10 text-sm">🧾</span>
            </div>
            <div className="text-2xl font-bold font-serif text-[#553E23] mt-2">
              {loading ? '...' : data?.orders.total || 0}
            </div>
            <div className="text-[11px] text-[#7A5B37] mt-0.5">Lifetime customer orders</div>
          </div>

          {/* Pending Orders */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DCC8] shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-amber-700 uppercase tracking-wider">
              <span>Pending Orders</span>
              <span className="p-1.5 rounded-lg bg-amber-100 text-sm">⏳</span>
            </div>
            <div className="text-2xl font-bold font-serif text-amber-800 mt-2">
              {loading ? '...' : data?.orders.pending || 0}
            </div>
            <div className="text-[11px] text-[#7A5B37] mt-0.5">Awaiting packing / dispatch</div>
          </div>

          {/* In Transit (Shipped) */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DCC8] shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-blue-700 uppercase tracking-wider">
              <span>In Transit</span>
              <span className="p-1.5 rounded-lg bg-blue-100 text-sm">🚚</span>
            </div>
            <div className="text-2xl font-bold font-serif text-blue-800 mt-2">
              {loading ? '...' : data?.orders.inTransit || 0}
            </div>
            <div className="text-[11px] text-[#7A5B37] mt-0.5">With courier / dispatched</div>
          </div>

          {/* Delivered this month */}
          <div className="bg-white rounded-2xl p-5 border border-[#E8DCC8] shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700 uppercase tracking-wider">
              <span>Delivered (Month)</span>
              <span className="p-1.5 rounded-lg bg-emerald-100 text-sm">✓</span>
            </div>
            <div className="text-2xl font-bold font-serif text-emerald-800 mt-2">
              {loading ? '...' : data?.orders.deliveredThisMonth || 0}
            </div>
            <div className="text-[11px] text-[#7A5B37] mt-0.5">Successfully received</div>
          </div>
        </div>
      </div>

      {/* Line Chart: Daily Revenue Last 30 Days */}
      <div className="bg-white rounded-2xl border border-[#E8DCC8] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#553E23]">
              Daily Revenue Trend (Last 30 Days)
            </h2>
            <p className="text-xs text-[#7A5B37] mt-0.5">
              Fluctuations in daily customer order totals
            </p>
          </div>
          <div className="text-xs font-bold text-[#1E6B5C]">
            30d Total: {formatCurrency(data?.revenue.thirtyDays || 0)}
          </div>
        </div>

        <div className="h-72 w-full">
          {mounted && data?.dailyRevenue ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.dailyRevenue}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F0E6D8" />
                <XAxis
                  dataKey="displayDate"
                  stroke="#7A5B37"
                  fontSize={11}
                  tickLine={false}
                  interval={3}
                />
                <YAxis
                  stroke="#7A5B37"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val) || 0), 'Revenue']}
                  labelFormatter={(lbl: any) => `Date: ${lbl}`}
                  contentStyle={{
                    backgroundColor: '#FFF8EC',
                    border: '1px solid #E8DCC8',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#553E23',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1E6B5C"
                  strokeWidth={2.5}
                  dot={{ fill: '#1E6B5C', r: 3 }}
                  activeDot={{ r: 6, fill: '#D4AF37' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-[#7A5B37] animate-pulse">
              Loading analytics chart...
            </div>
          )}
        </div>
      </div>

      {/* Two Column Section: Low-stock list & Top 5 products by units sold */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low-stock List (stock < 10) */}
        <div className="bg-white rounded-2xl border border-[#E8DCC8] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-[#E8DCC8] pb-3">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#BA3D3D] flex items-center gap-2">
                <span>⚠️ Low Stock Inventory</span>
                <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold">
                  {data?.lowStockCount || 0}
                </span>
              </h2>
              <p className="text-xs text-[#7A5B37] mt-0.5">Products with fewer than 10 units</p>
            </div>
            <Link
              href={`${basePath}/products`}
              className="text-xs font-bold text-[#1E6B5C] hover:underline"
            >
              All Products →
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-[#7A5B37]">Loading inventory...</div>
          ) : !data?.lowStockProducts || data.lowStockProducts.length === 0 ? (
            <div className="py-8 text-center text-xs text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">
              ✓ All inventory levels are healthy! No items below 10 units.
            </div>
          ) : (
            <div className="divide-y divide-[#E8DCC8]/60 max-h-72 overflow-y-auto">
              {data.lowStockProducts.map(prod => (
                <div key={prod.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-[#121212]">{prod.name}</div>
                    <div className="text-[10px] text-[#7A5B37]">
                      {prod.category} • ₹{prod.price.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                      {prod.stock} left
                    </span>
                    <Link
                      href={`${basePath}/products/${prod.id}`}
                      className="text-xs font-bold text-[#1E6B5C] hover:underline"
                    >
                      Restock →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top 5 Products by Units Sold (30d) */}
        <div className="bg-white rounded-2xl border border-[#E8DCC8] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-[#E8DCC8] pb-3">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#553E23]">
                Top 5 Products by Units Sold (30d)
              </h2>
              <p className="text-xs text-[#7A5B37] mt-0.5">Best-selling fragrances in last month</p>
            </div>
            <span className="text-base">🏆</span>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-[#7A5B37]">Loading sales...</div>
          ) : !data?.topProducts || data.topProducts.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#7A5B37]">
              No product sales recorded in the past 30 days.
            </div>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((prod, idx) => (
                <div
                  key={prod.productId || idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#FFF8EC]/60 border border-[#E8DCC8]/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#553E23] text-[#FFF8EC] font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#121212]">{prod.name}</div>
                      <div className="text-[10px] text-[#7A5B37]">
                        Revenue: {formatCurrency(prod.totalRevenue)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#1E6B5C] bg-[#1E6B5C]/10 px-2.5 py-1 rounded-lg">
                      {prod.unitsSold} units
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent 10 Orders Table */}
      <div className="bg-white rounded-2xl border border-[#E8DCC8] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#553E23]">
              Recent 10 Orders
            </h2>
            <p className="text-xs text-[#7A5B37] mt-0.5">Latest customer transactions</p>
          </div>
          <Link
            href={`${basePath}/orders`}
            className="text-xs font-bold text-[#1E6B5C] hover:underline"
          >
            View All Orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E8DCC8] bg-[#FFF8EC]/60 text-[11px] font-bold uppercase tracking-wider text-[#7A5B37]">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DCC8]/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-[#7A5B37]">
                    Loading transactions...
                  </td>
                </tr>
              ) : !data?.recentOrders || data.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-[#7A5B37]">
                    No customer orders recorded yet.
                  </td>
                </tr>
              ) : (
                data.recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-[#FFF8EC]/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1E6B5C]">
                      {order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#121212]">
                      {order.customerName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#7A5B37]">
                      {order.phone}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#7A5B37]">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#553E23]">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`${basePath}/orders/${order.id}`}
                        className="text-xs font-bold text-[#1E6B5C] hover:text-[#165A4A]"
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
