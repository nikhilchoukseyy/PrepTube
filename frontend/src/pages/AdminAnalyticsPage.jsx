import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminReviewsManager from "../components/AdminReviewsManager";
import Navbar from "../components/Navbar";
import { API_URL, authHeaders, getStoredUser } from "../utils/auth";
import { setPageMeta } from "../utils/meta";
import { IC } from "./Icons";

const PIE_COLORS = ["#f97316", "#ef4444"];

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(Number(value || 0));
}

function formatCurrency(value) {
  return `Rs ${formatNumber(value)}`;
}

function formatShortDate(value) {
  if (!value) return "";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
  }).format(parsedDate);
}

function formatDateTime(value) {
  if (!value) return "";
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsedDate);
}

const Card = ({ className = "", children }) => (
  <section className={`rounded-[28px] border border-white/10 bg-white/[0.03] shadow-[0_24px_80px_rgba(0,0,0,0.32)] backdrop-blur-xl ${className}`}>
    {children}
  </section>
);

const MetricCard = ({ label, value, hint, icon: Icon, accent = "from-red-500/20 to-orange-500/10", action }) => (
  <Card className="p-5 sm:p-6">
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.24em] text-white/35 font-semibold">{label}</p>
        <p className="text-3xl sm:text-4xl font-black text-white">{value}</p>
        {hint ? <p className="text-sm text-white/45 font-medium">{hint}</p> : null}
      </div>
      <div className={`w-12 h-12 rounded-2xl border border-white/10 bg-gradient-to-br ${accent} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    {action ? <div className="mt-4">{action}</div> : null}
  </Card>
);

const SkeletonBlock = ({ className = "" }) => (
  <div className={`animate-pulse rounded-2xl bg-white/6 ${className}`} />
);

const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: 5 }, (_, index) => (
        <Card key={index} className="p-5 sm:p-6">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="mt-5 h-10 w-28" />
          <SkeletonBlock className="mt-3 h-3 w-32" />
        </Card>
      ))}
    </div>
    <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
      <Card className="p-5 sm:p-6">
        <SkeletonBlock className="h-5 w-40" />
        <SkeletonBlock className="mt-6 h-72 w-full" />
      </Card>
      <Card className="p-5 sm:p-6">
        <SkeletonBlock className="h-5 w-32" />
        <SkeletonBlock className="mt-6 h-72 w-full" />
      </Card>
    </div>
    <div className="grid gap-6 xl:grid-cols-[1.2fr_1.8fr]">
      <Card className="p-5 sm:p-6">
        <SkeletonBlock className="h-5 w-40" />
        <SkeletonBlock className="mt-6 h-72 w-full" />
      </Card>
      <Card className="p-5 sm:p-6">
        <SkeletonBlock className="h-5 w-36" />
        <SkeletonBlock className="mt-6 h-72 w-full" />
      </Card>
    </div>
  </div>
);

const AdminAnalyticsPage = () => {
  const currentUser = useMemo(() => getStoredUser(), []);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setPageMeta({
      title: "Admin Analytics | PrepTube",
      description: "Internal PrepTube dashboard for signups, premium growth, playlists, and activity trends.",
    });
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      return undefined;
    }

    let active = true;

    const loadAnalytics = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await axios.get(`${API_URL}/admin/analytics`, {
          headers: authHeaders(),
        });

        if (active) {
          setAnalytics(response.data);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.message || "Unable to load admin analytics right now.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      active = false;
    };
  }, [currentUser]);

  const planBreakdownData = useMemo(() => {
    if (!analytics?.planBreakdown) return [];

    return [
      { name: "Free", value: analytics.planBreakdown.free || 0 },
      { name: "Premium", value: analytics.planBreakdown.premium || 0 },
    ];
  }, [analytics]);

  if (!currentUser || currentUser.role !== "admin") {
    return <Navigate to="/courses" replace />;
  }

  const overview = analytics?.overview || {};

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.16),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(239,68,68,0.14),_transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-6 py-8 sm:px-8 sm:py-10 shadow-[0_28px_90px_rgba(0,0,0,0.35)]">
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-[11px] uppercase tracking-[0.28em] text-orange-200/70 font-semibold">Internal Dashboard</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight">PrepTube analytics at a glance.</h1>
              <p className="text-sm sm:text-base text-white/60 font-medium">
                Track growth, premium conversion, and playlist traction here, then jump into PostHog for recordings, funnels, and deeper product behavior.
              </p>
            </div>
            <a
              href="https://app.posthog.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-400/30 bg-orange-500/10 px-4 py-3 text-sm font-semibold text-orange-100 hover:bg-orange-500/15 transition-colors"
            >
              Open PostHog
              <IC.ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        {loading ? (
          <AnalyticsSkeleton />
        ) : error ? (
          <Card className="p-6 sm:p-8">
            <div className="flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <IC.X className="w-5 h-5 text-red-300" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Analytics unavailable</h2>
                <p className="text-white/55 font-medium">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/[0.05] transition-colors cursor-pointer active:scale-0.95"
              >
                <IC.RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          </Card>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                label="Total Visitors"
                value="PostHog"
                hint="Live web analytics and visitor totals"
                icon={IC.Globe}
                accent="from-sky-500/20 to-cyan-500/10"
                action={
                  <a
                    href="https://app.posthog.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-sky-200 hover:text-white transition-colors"
                  >
                    View visitors
                    <IC.ArrowRight className="w-4 h-4" />
                  </a>
                }
              />
              <MetricCard
                label="Total Signups"
                value={formatNumber(overview.totalUsers)}
                hint="All registered PrepTube users"
                icon={IC.User}
              />
              <MetricCard
                label="Active Users"
                value={formatNumber(overview.totalActiveUsers)}
                hint="Users updated in the last 7 days"
                icon={IC.Zap}
                accent="from-amber-500/20 to-orange-500/10"
              />
              <MetricCard
                label="Premium Members"
                value={formatNumber(overview.totalPremiumUsers)}
                hint="Currently active premium plans"
                icon={IC.Crown}
                accent="from-amber-500/20 to-yellow-500/10"
              />
              <MetricCard
                label="Est. Revenue"
                value={formatCurrency(overview.totalRevenue)}
                hint="Approx. active premium users x current plan price"
                icon={IC.BarChart}
                accent="from-emerald-500/20 to-teal-500/10"
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
              <Card className="p-5 sm:p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">Signups Over Time</h2>
                    <p className="text-sm text-white/45 font-medium">Last 30 days of account creation</p>
                  </div>
                  <span className="text-xs text-white/35 font-medium">Daily trend</span>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics?.signups || []}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="date" tickFormatter={formatShortDate} stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111111",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "16px",
                          color: "#ffffff",
                        }}
                        labelFormatter={(value) => formatDateTime(value)}
                      />
                      <Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={3} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-5 sm:p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold">Plan Breakdown</h2>
                  <p className="text-sm text-white/45 font-medium">Free versus premium membership</p>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={planBreakdownData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={75}
                        outerRadius={110}
                        paddingAngle={4}
                      >
                        {planBreakdownData.map((entry, index) => (
                          <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111111",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "16px",
                          color: "#ffffff",
                        }}
                        formatter={(value) => formatNumber(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {planBreakdownData.map((item, index) => (
                    <div key={item.name} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                        {item.name}
                      </div>
                      <p className="mt-2 text-2xl font-black">{formatNumber(item.value)}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.1fr_1.9fr]">
              <Card className="p-5 sm:p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold">Hourly Signup Activity</h2>
                  <p className="text-sm text-white/45 font-medium">Which hours tend to create the most new accounts</p>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.hourlyActivity || []}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="hour" stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} stroke="rgba(255,255,255,0.35)" tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111111",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "16px",
                          color: "#ffffff",
                        }}
                        formatter={(value, name) => [formatNumber(value), name === "signups" ? "Signups" : "Logins"]}
                        labelFormatter={(value) => `${value}:00`}
                      />
                      <Bar dataKey="signups" fill="#ef4444" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">Top Playlists</h2>
                    <p className="text-sm text-white/45 font-medium">Most collaborative rooms by member count</p>
                  </div>
                  <span className="text-xs text-white/35 font-medium">Top 10</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="text-left text-white/35">
                        <th className="pb-3 font-semibold">Title</th>
                        <th className="pb-3 font-semibold">Owner</th>
                        <th className="pb-3 font-semibold">Members</th>
                        <th className="pb-3 font-semibold">Videos</th>
                        <th className="pb-3 font-semibold">Visibility</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analytics?.topPlaylists || []).map((playlist) => (
                        <tr key={`${playlist.title}-${playlist.owner}`} className="border-t border-white/8">
                          <td className="py-4 pr-4 font-semibold text-white">{playlist.title}</td>
                          <td className="py-4 pr-4 text-white/65">@{playlist.owner || "unknown"}</td>
                          <td className="py-4 pr-4 text-white/65">{formatNumber(playlist.memberCount)}</td>
                          <td className="py-4 pr-4 text-white/65">{formatNumber(playlist.videoCount)}</td>
                          <td className="py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${playlist.isPublic ? "bg-emerald-500/12 text-emerald-200 border border-emerald-500/20" : "bg-white/8 text-white/60 border border-white/10"}`}>
                              {playlist.isPublic ? "Public" : "Private"}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(analytics?.topPlaylists || []).length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-white/40 font-medium">
                            No playlist data yet.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Card className="p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">Recent Premium Purchases</h2>
                    <p className="text-sm text-white/45 font-medium">Latest verified premium upgrades stored in memory</p>
                  </div>
                  <span className="text-xs text-white/35 font-medium">Recent {analytics?.recentPurchases?.length || 0}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="text-left text-white/35">
                        <th className="pb-3 font-semibold">Username</th>
                        <th className="pb-3 font-semibold">Date</th>
                        <th className="pb-3 font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(analytics?.recentPurchases || []).map((purchase) => (
                        <tr key={`${purchase.userId}-${purchase.date}`} className="border-t border-white/8">
                          <td className="py-4 pr-4 font-semibold text-white">@{purchase.username}</td>
                          <td className="py-4 pr-4 text-white/65">{formatDateTime(purchase.date)}</td>
                          <td className="py-4 text-white/65">{formatCurrency(purchase.amount)}</td>
                        </tr>
                      ))}
                      {(analytics?.recentPurchases || []).length === 0 ? (
                        <tr>
                          <td colSpan="3" className="py-8 text-center text-white/40 font-medium">
                            No verified premium purchases in the in-memory store yet.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="relative overflow-hidden p-6 sm:p-7">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.18),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(239,68,68,0.18),_transparent_35%)]" />
                <div className="relative z-10 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center">
                    <IC.PlayCircle className="w-5 h-5 text-orange-200" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black">PostHog Deep Dive</h2>
                    <p className="text-white/65 font-medium">
                      For session recordings, funnels, retention, and richer behavioral analysis, continue in the PostHog workspace.
                    </p>
                  </div>
                  <a
                    href="https://app.posthog.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-white text-black px-4 py-3 text-sm font-semibold hover:bg-white/90 transition-colors"
                  >
                    Open PostHog Dashboard
                    <IC.ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </Card>
            </section>
          </>
        )}

        <AdminReviewsManager />
      </main>
    </div>
  );
};

export default AdminAnalyticsPage;
