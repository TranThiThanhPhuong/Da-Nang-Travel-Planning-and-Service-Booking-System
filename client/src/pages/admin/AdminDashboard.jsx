import React, { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  ShieldAlert,
  DollarSign,
  Clock,
  TrendingUp,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "@clerk/clerk-react";

const activityConfig = {
  USER_NEW: {
    icon: <Users size={16} />,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  OWNER_APPROVED: {
    icon: <UserCheck size={16} />,
    color: "text-[#004D40]",
    bg: "bg-[#E0F2F1]",
  },
  PAYMENT: {
    icon: <DollarSign size={16} />,
    color: "text-[#FFAB40]",
    bg: "bg-[#FFAB40]/10",
  },
};

const AdminDashboard = () => {
  const { getToken } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const token = await getToken();

        const response = await fetch("/api/admin/dashboard-stats", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error("Không thể tải dữ liệu phân tích hệ thống.");
        }
        const resJson = await response.json();
        setData(resJson.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [getToken]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="animate-spin text-[#004D40]" size={40} />
        <p className="text-sm font-medium text-gray-500">Đang đồng bộ dữ liệu hệ thống...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-2xl flex items-center gap-3 border border-red-200">
        <AlertCircle size={24} />
        <div>
          <h4 className="font-bold">Lỗi tải dữ liệu</h4>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Tổng Khách hàng",
      value: data.stats.totalUsers.toLocaleString(),
      icon: <Users size={20} className="text-[#004D40]" />,
      percent: "Người dùng",
      isUp: true,
    },
    {
      title: "Đối tác sở hữu",
      value: data.stats.totalOwners.toLocaleString(),
      icon: <UserCheck size={20} className="text-[#00C853]" />,
      percent: "Chủ cơ sở",
      isUp: true,
    },
    {
      title: "Hồ sơ chờ duyệt",
      value: data.stats.pendingApps.toLocaleString(),
      icon: <ShieldAlert size={20} className="text-[#FFAB40]" />,
      percent: "Yêu cầu",
      isUp: data.stats.pendingApps > 0 ? false : true,
    },
    {
      title: "Tổng Doanh Thu",
      value: `${data.stats.totalRevenue.toLocaleString()}đ`,
      icon: <DollarSign size={20} className="text-[#004D40]" />,
      percent: "Tổng thu",
      isUp: true,
    },
  ];

  const totalServices = data.serviceChart.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto">
      {/* 1. STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-white/80 backdrop-blur-[10px] p-6 rounded-tr-[30px] rounded-bl-[30px] rounded-tl-xl rounded-br-xl border border-white/40 shadow-sm flex flex-col justify-between"
          >
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-bold text-xs uppercase tracking-wider">{s.title}</span>
              <div className="p-2 bg-gray-50 rounded-lg">{s.icon}</div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-2xl font-black text-[#004D40]">{s.value}</span>
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
              >
                {s.percent}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. REVENUE LINE CHART */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-[10px] p-6 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl border border-white/40 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[#004D40] flex items-center gap-2">
              <TrendingUp size={18} /> Doanh thu hệ thống
            </h3>
            <select className="text-xs border-none bg-gray-50 rounded-lg p-2 outline-none font-medium">
              <option>Chu kỳ 6 tháng gần nhất</option>
            </select>
          </div>
          <div className="h-80">
            {data.revenueChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.revenueChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af" }}
                    dy={10}
                  />
                  <YAxis
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af" }}
                    tickFormatter={(v) => (v / 1000000).toFixed(1) + "M"}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                    formatter={(v) => v.toLocaleString() + " VNĐ"}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#004D40"
                    strokeWidth={4}
                    dot={{
                      r: 4,
                      fill: "#FFAB40",
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Chưa có dữ liệu phát sinh doanh thu.
              </div>
            )}
          </div>
        </div>

        {/* 3. SERVICE PIE CHART */}
        <div className="bg-white/80 backdrop-blur-[10px] p-6 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl border border-white/40 shadow-sm">
          <h3 className="font-bold text-[#004D40] mb-2">Phân bổ dịch vụ</h3>
          <p className="text-xs text-gray-400 mb-6">Dữ liệu thực tế trên toàn hệ thống</p>
          <div className="h-60 relative">
            {totalServices > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.serviceChart}
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {data.serviceChart.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} dịch vụ`, "Số lượng"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-[#004D40]">{totalServices}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Tổng cơ sở</span>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                Chưa có dịch vụ nào đăng ký.
              </div>
            )}
          </div>
          <div className="mt-6 space-y-3">
            {data.serviceChart.map((item) => (
              <div
                key={item.name}
                className="flex justify-between items-center p-3 bg-[#F5F5F5]/70 rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-bold text-gray-600">{item.name}</span>
                </div>
                <span className="text-xs font-black text-[#004D40]">
                  {totalServices > 0 ? Math.round((item.value / totalServices) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. RECENT ACTIVITIES */}
      <div className="bg-white/80 backdrop-blur-[10px] p-6 rounded-tr-[40px] rounded-bl-[40px] rounded-tl-2xl rounded-br-2xl border border-white/40 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-[#004D40] flex items-center gap-2">
            <Clock size={18} /> Nhật ký hoạt động gần đây
          </h3>
          <span className="text-xs font-bold text-gray-400">Thời gian thực tế</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.recentActivities.length > 0 ? (
            data.recentActivities.map((act) => {
              const config = activityConfig[act.type] || {
                icon: <Clock size={16} />,
                color: "text-gray-500",
                bg: "bg-gray-100",
              };

              return (
                <div
                  key={act.id}
                  className="bg-[#F5F5F5]/60 border border-white/40 p-4 rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md flex items-start gap-4 hover:bg-white hover:shadow-sm transition-all group cursor-default"
                >
                  <div
                    className={`p-2.5 rounded-tr-xl rounded-bl-xl rounded-tl-md rounded-br-md ${config.bg} ${config.color} group-hover:scale-110 transition-transform`}
                  >
                    {config.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-[#004D40] text-sm font-bold truncate">{act.title}</p>
                      <span className="text-[9px] font-bold text-gray-400 shrink-0 whitespace-nowrap">
                        {act.time}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-1 font-medium line-clamp-2">{act.desc}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full p-8 text-center text-gray-400 text-sm">
              Chưa phát sinh hoạt động nào gần đây.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;