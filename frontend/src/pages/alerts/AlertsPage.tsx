/** Alerts page — actionable reminders derived from DB state. */

import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useAlerts } from '@/features/alerts/hooks';

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-red-200 border-2 border-red-800 text-red-900 shadow-[2px_2px_0px_#991b1b]',
  medium:
    'bg-amber-200 border-2 border-amber-800 text-amber-900 shadow-[2px_2px_0px_#92400e]',
  low: 'bg-blue-200 border-2 border-blue-800 text-blue-900 shadow-[2px_2px_0px_#1e40af]',
};

export default function AlertsPage() {
  const { data: response, isLoading } = useAlerts();
  const alerts = response?.data || [];

  return (
    <div
      className="min-h-screen px-4 sm:px-6 py-8"
      style={
        {
          // background: '#f4f1ea',
          // backgroundImage: 'radial-gradient(#d1d5db 0.5px, transparent 0.5px)',
          // backgroundSize: '15px 15px',
        }
      }
    >
      <div className="mx-auto max-w-3xl">
        <div className="relative mb-8">
          <div
            className="absolute -top-1 left-0 w-24 h-5 pointer-events-none"
            style={{
              background: 'rgba(251, 191, 36, 0.5)',
              transform: 'rotate(-3deg)',
              border: '1px solid rgba(0,0,0,0.05)',
            }}
          />
          <h1
            className="text-3xl text-gray-900"
            style={{
              fontFamily: '"Permanent Marker", cursive',
              transform: 'rotate(-1deg)',
            }}
          >
            Alerts
          </h1>
          <p
            className="text-gray-500 text-lg mt-1"
            style={{ fontFamily: '"Caveat", cursive', transform: 'rotate(1deg)' }}
          >
            Actionable reminders derived from live DB state.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl border bg-card animate-pulse" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div
            className="bg-white border-2 border-gray-800 p-10 text-center shadow-[4px_4px_0px_#333] relative"
            style={{ transform: 'rotate(0.5deg)' }}
          >
            <Sparkles className="h-10 w-10 mx-auto text-gray-400 mb-3" />
            <h2
              className="text-xl text-gray-900"
              style={{ fontFamily: '"Permanent Marker", cursive' }}
            >
              All caught up
            </h2>
            <p
              className="text-gray-500 text-lg mt-1"
              style={{ fontFamily: '"Caveat", cursive' }}
            >
              No actions pending right now.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, i) => (
              <div
                key={alert.id}
                className="bg-white border-2 border-gray-800 p-4 shadow-[4px_4px_0px_#333] transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_#333]"
                style={{ transform: `rotate(${i % 2 === 0 ? 0.5 : -0.5}deg)` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      PRIORITY_STYLES[alert.priority] || PRIORITY_STYLES.low
                    }`}
                  >
                    {alert.priority}
                  </span>
                </div>
                <div className="mt-4">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-2 border-gray-800 shadow-[2px_2px_0px_#333] font-bold text-gray-900 hover:bg-yellow-200 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] transition-all"
                  >
                    <Link to={alert.cta_route}>{alert.cta_label}</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
