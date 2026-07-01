import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import useAlerts from "../hooks/useAlerts";
import { Card } from "../components/ui/Card";
import Button from "../components/ui/Button";
import { SkeletonRows } from "../components/ui/Skeleton";

const Alerts = () => {
  const { t, i18n } = useTranslation();
  const { alerts, loading, markAsRead } = useAlerts();
  const isRTL = i18n.dir(i18n.language) === "rtl";

  return (
    <div className="relative z-10 mx-auto flex h-full max-w-4xl flex-col">
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="mb-2 text-2xl font-bold text-text sm:text-3xl">{t("alerts.title")}</h2>
        <p className="text-sm text-text-muted">{t("alerts.description")}</p>
      </div>

      {/* Main List */}
      <Card className="flex-1 overflow-hidden p-7 text-text sm:p-8">
        {loading ? (
          <SkeletonRows rows={5} />
        ) : alerts.length === 0 ? (
          <div className="flex h-80 flex-col items-center justify-center text-center">
             <div className="mb-4 rounded-2xl bg-success/10 p-5">
                <CheckCircle2 className="h-16 w-16 text-success" />
             </div>
            <h3 className="mt-5 mb-1 text-2xl font-bold text-text">{t("alerts.all_clear")}</h3>
            <p className="text-text-muted">{t("alerts.no_alerts")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <AnimatePresence>
              {alerts.map((alert, index) => {
                const Icon = alert.type === "LOW_STOCK" ? AlertTriangle : Clock;
                const msg = isRTL ? alert.message_ar : alert.message_en;
                const dateFmt = new Date(alert.created_at).toLocaleString(isRTL ? 'ar-EG' : 'en-US');

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      relative rounded-2xl border p-6 transition-all sm:p-7
                      ${alert.is_read 
                        ? "bg-gray-50 border-gray-100 opacity-70" 
                        : "bg-danger/6 border-danger/20 shadow-sm"
                      }
                    `}
                  >
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {/* Icon Block */}
                      <div className={`shrink-0 rounded-2xl p-4 ${alert.is_read ? 'bg-gray-100 text-text-muted' : 'bg-danger/20 text-danger'}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      
                      {/* Message Block */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className={`font-semibold ${alert.is_read ? 'text-text-muted' : 'text-danger'}`}>
                            {msg}
                          </p>
                          {!alert.is_read && (
                            <span className="shrink-0 px-2.5 py-0.5 bg-danger text-white text-[10px] uppercase font-bold rounded-full">
                              {t("alerts.unread")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted font-mono bg-surface px-2.5 py-1 inline-block rounded-lg shadow-sm border border-gray-100">
                          {dateFmt}
                        </p>
                      </div>

                      {/* Action */}
                      {!alert.is_read && (
                        <Button
                          onClick={() => markAsRead(alert.id)}
                          variant="secondary"
                          size="sm"
                        >
                          {t("alerts.mark_read")}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Alerts;
