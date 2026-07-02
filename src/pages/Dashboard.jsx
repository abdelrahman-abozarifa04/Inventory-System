import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
   Package,
   AlertTriangle,
   ArrowRightLeft,
   Clock,
   TrendingUp,
   ArrowUpRight,
   ArrowDownRight,
   CheckCircle2,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

import useInventory from "../hooks/useInventory";
import useTransactions from "../hooks/useTransactions";
import useAlerts from "../hooks/useAlerts";
import useSystem from "../context/SystemContext";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { DataTable, TableScroll, TableShell, Td, Th } from "../components/ui/Table";
import Skeleton, { SkeletonRows } from "../components/ui/Skeleton";
import AnimatedNumber from "../components/ui/AnimatedNumber";

const Dashboard = () => {
   const { t, i18n } = useTranslation();
   const isRTL = i18n.dir(i18n.language) === "rtl";
   const { systemSettings } = useSystem();
   const storeName = isRTL ? systemSettings.name_ar : systemSettings.name_en;

   // Subscribe to all hooks
   const { items, loading: invLoading } = useInventory();
   const { transactions, loading: txnLoading } = useTransactions();
   const { alerts, loading: alertsLoading } = useAlerts();

   const isLoading = invLoading || txnLoading || alertsLoading;

   // Create lookup map
   const itemMap = items.reduce((acc, item) => {
      acc[item.id] = item;
      if (item.item_id) acc[item.item_id] = item;
      return acc;
   }, {});

   // Compute Statistics dynamically
   const totalItemsCount = items.length;
   const lowStockCount = items.filter(item => item.quantity <= (item.minimum_threshold || 5)).length;
   const expiringSoonCount = items.filter(item => {
      if (!item.expiration_date) return false;
      const daysLeft = (new Date(item.expiration_date) - new Date()) / (1000 * 60 * 60 * 24);
      return daysLeft > 0 && daysLeft <= 30;
   }).length;
   const totalTxnCount = transactions.length;

   const stats = [
      {
         id: "total-items",
         label: t("dashboard.totalItems"),
         value: totalItemsCount,
         icon: Package,
         color: "from-primary to-primary-dark",
         iconColor: "text-highlight",
      },
      {
         id: "low-stock",
         label: t("dashboard.lowStock"),
         value: lowStockCount,
         icon: AlertTriangle,
         color: "from-warning/90 to-warning",
         iconColor: "text-white",
      },
      {
         id: "recent-transactions",
         label: t("dashboard.recentTransactions"),
         value: totalTxnCount,
         icon: ArrowRightLeft,
         color: "from-success/90 to-success",
         iconColor: "text-white",
      },
      {
         id: "expiring-soon",
         label: t("dashboard.expiringItems"),
         value: expiringSoonCount,
         icon: Clock,
         color: "from-danger/90 to-danger",
         iconColor: "text-white",
      },
   ];

   // Prepare Chart Data
   const chartDataMap = {};

   const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const label = d.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
      chartDataMap[d.toDateString()] = { name: label, operations: 0 };
      return d.toDateString();
   });

   transactions.forEach(txn => {
      const d = new Date(txn.date).toDateString();
      if (chartDataMap[d]) {
         chartDataMap[d].operations += 1;
      }
   });

   const chartData = last7Days.map(k => chartDataMap[k]);

   // Framer config
   const containerVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
   };

   const itemVariants = {
      hidden: { opacity: 0, y: 30, scale: 0.95 },
      visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
   };



   return (
      <motion.div
         className="mx-auto flex max-w-7xl flex-col gap-8 lg:gap-10"
         variants={containerVariants}
         initial="hidden"
         animate="visible"
      >
         {/* Welcome Header */}
         <motion.div
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-primary p-10 shadow-medium lg:p-14"
            variants={itemVariants}
         >
            <motion.div
               className="absolute end-6 top-6 opacity-10 lg:end-10"
               animate={{ y: [0, -6, 0] }}
               transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            >
               <Package className="h-24 w-24 text-highlight lg:h-32 lg:w-32" />
            </motion.div>

            <div className="relative z-10">
               <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
                  {t("dashboard.welcome", { storeName })}
               </h2>
               <p className="max-w-2xl text-sm leading-6 text-white/72">
                  {t("dashboard.description")}
               </p>
            </div>
         </motion.div>

         {/* Stats Grid */}
         <motion.div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4" variants={containerVariants}>
            {stats.map((stat) => {
               const Icon = stat.icon;
               return (
                  <motion.div
                     key={stat.id}
                     className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-surface p-7 shadow-card transition-shadow hover:shadow-medium"
                     variants={itemVariants}
                     whileHover={{ y: -4, scale: 1.02 }}
                  >
                     <div className={`absolute top-0 start-0 end-0 h-1 bg-gradient-to-r ${stat.color}`} />
                     <div className="flex flex-col gap-5">
                        <div className="flex items-start justify-between">
                           <div className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-soft`}>
                              <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                           </div>
                           <span className="text-4xl font-bold tabular-nums text-text">
                              {isLoading ? (
                                 <Skeleton className="h-9 w-12" />
                              ) : (
                                 <AnimatedNumber value={stat.value} format={(n) => n.toLocaleString(isRTL ? "ar-EG" : "en-US")} />
                              )}
                           </span>
                        </div>
                        <p className="mt-3 text-sm font-medium text-text-muted">{stat.label}</p>
                     </div>
                  </motion.div>
               );
            })}
         </motion.div>

         {/* Analytics Chart & Attention Panel */}
         <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
            {/* Chart Panel */}
            <motion.div className="col-span-1 lg:col-span-2" variants={itemVariants}>
            <Card className="flex h-full flex-col">
               <CardHeader className="flex items-center justify-between">
                  <div>
                     <h3 className="flex items-center gap-2 text-lg font-bold text-text">
                        <TrendingUp className="h-5 w-5 text-highlight" /> {t("dashboard.chart_title")}
                     </h3>
                     <p className="text-sm text-text-muted">{t("dashboard.chart_desc")}</p>
                  </div>
               </CardHeader>
               <CardContent className="flex h-full flex-col px-8 pb-6 pt-8 lg:px-10">

               <div className="h-[360px] w-full">
                  {isLoading ? (
                     <div className="flex h-full w-full items-center justify-center text-text-muted">{t("dashboard.loading_engine")}</div>
                  ) : (
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                           <defs>
                              <linearGradient id="colorOp" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                                 <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                              </linearGradient>
                           </defs>
                           <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5c6c7e' }} axisLine={false} tickLine={false} />
                           <YAxis tick={{ fontSize: 12, fill: '#5c6c7e' }} axisLine={false} tickLine={false} />
                           <Tooltip
                              contentStyle={{ borderRadius: '12px', border: '1px solid rgba(148,163,184,0.2)', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', backgroundColor: 'var(--color-surface)' }}
                           />
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.25)" />
                           <Area type="monotone" dataKey="operations" stroke="#06B6D4" strokeWidth={3} fillOpacity={1} fill="url(#colorOp)" />
                        </AreaChart>
                     </ResponsiveContainer>
                  )}
               </div>
               </CardContent>
            </Card>
            </motion.div>

            {/* Attention Panel */}
            <motion.div className="col-span-1" variants={itemVariants}>
            <Card className="flex h-full flex-col">
               <CardHeader className="flex items-center gap-3">
                  <div className="rounded-lg bg-danger/10 p-2">
                     <AlertTriangle className="h-5 w-5 text-danger" />
                  </div>
                  <h3 className="text-lg font-bold text-text">{t("dashboard.attention_title")}</h3>
               </CardHeader>
               <CardContent className="max-h-[420px] flex-1 overflow-y-auto">
                  {isLoading ? (
                     <div className="text-sm text-text-muted text-center py-4">{t("dashboard.attention_loading")}</div>
                  ) : alerts.length === 0 ? (
                     <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-text-muted">
                        <CheckCircle2 className="h-8 w-8 text-success" />
                        {t("dashboard.attention_empty")}
                     </div>
                  ) : (
                     <div className="flex flex-col gap-4">
                        {alerts.slice(0, 5).map(al => (
                           <div key={al.id} className="rounded-xl border border-danger/10 bg-danger/5 p-5">
                              <p className="text-xs font-semibold text-danger mb-1">{isRTL ? al.message_ar : al.message_en}</p>
                              <span className="text-[10px] text-text-muted">{new Date(al.created_at).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US')}</span>
                           </div>
                        ))}
                     </div>
                  )}
               </CardContent>
            </Card>
            </motion.div>
         </div>

         {/* Recent Transaction Log */}
         <motion.div className="mt-10" variants={itemVariants}>
            <TableShell>
            <div className="border-b border-gray-100 px-7 py-5">
               <h3 className="text-xl font-bold text-text">{t("dashboard.txn_log_title")}</h3>
            </div>
            <TableScroll>
               <DataTable>
                  <thead>
                     <tr>
                        <Th>{t("dashboard.txn_col_item")}</Th>
                        <Th className="text-center">{t("dashboard.txn_col_type")}</Th>
                        <Th className="text-center">{t("dashboard.txn_col_qty")}</Th>
                        <Th>{t("dashboard.txn_col_user")}</Th>
                        <Th>{t("dashboard.txn_col_date")}</Th>
                     </tr>
                  </thead>
                  <tbody>
                     {isLoading ? (
                        <tr><td colSpan="5"><SkeletonRows rows={4} /></td></tr>
                     ) : transactions.length === 0 ? (
                        <tr><Td colSpan="5" className="py-10 text-center text-text-muted">{t("dashboard.txn_empty")}</Td></tr>
                     ) : transactions.slice(0, 6).map(txn => (
                        <tr key={txn.id} className="border-b border-gray-50 hover:bg-surface-hover transition-colors">
                           <Td className="font-bold text-primary">
                              {isRTL
                                 ? (txn.item_name_ar || itemMap[txn.item_id]?.name_ar || txn.item_id)
                                 : (txn.item_name_en || itemMap[txn.item_id]?.name_en || txn.item_id)
                              }
                           </Td>
                           <Td className="text-center">
                              <span className={`inline-flex items-center gap-1.5 font-bold text-xs px-4 py-1.5 rounded-full uppercase
                              ${txn.type === 'IN' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                 {txn.type === 'IN' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />} {txn.type}
                              </span>
                           </Td>
                           <Td className="text-center text-lg font-bold">{txn.quantity_changed}</Td>
                           <Td className="font-medium">{txn.user_name}</Td>
                           <Td className="text-sm text-text-muted">{new Date(txn.date).toLocaleString(isRTL ? 'ar-EG' : 'en-US')}</Td>
                        </tr>
                     ))}
                  </tbody>
               </DataTable>
            </TableScroll>
            </TableShell>
         </motion.div>
      </motion.div>
   );
};

export default Dashboard;
