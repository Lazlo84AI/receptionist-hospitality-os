import { AdminLayout } from './AdminLayout';
import { BarChart3 } from 'lucide-react';

export default function TeamAnalytics() {
  return (
    <AdminLayout>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-1">
            <BarChart3 className="h-6 w-6" style={{ color: '#BBA57A' }} />
            <h1 className="text-2xl font-semibold text-white">Team Analytics</h1>
          </div>
          <p className="text-sm" style={{ color: 'rgba(187,165,122,0.55)' }}>
            Performance globale de l'équipe Decœur Hotels — vue Direction
          </p>
        </div>

        {/* KPI row placeholder */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {['Shifts actifs', 'Tâches du jour', 'Taux résolution', 'Membres en ligne'].map((label) => (
            <div
              key={label}
              className="rounded-xl p-5 border"
              style={{
                backgroundColor: 'rgba(30,26,55,0.8)',
                borderColor: 'rgba(187,165,122,0.2)',
              }}
            >
              <p className="text-xs mb-2" style={{ color: 'rgba(187,165,122,0.55)' }}>
                {label}
              </p>
              <p className="text-2xl font-bold text-white">—</p>
            </div>
          ))}
        </div>

        {/* Charts placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['Performance par service', 'Évolution mensuelle'].map((title) => (
            <div
              key={title}
              className="rounded-xl border p-10 flex flex-col items-center justify-center text-center"
              style={{
                backgroundColor: 'rgba(30,26,55,0.5)',
                borderColor: 'rgba(187,165,122,0.15)',
                borderStyle: 'dashed',
              }}
            >
              <BarChart3 className="h-10 w-10 mb-3 opacity-25" style={{ color: '#BBA57A' }} />
              <p className="text-white font-medium text-sm">{title}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(187,165,122,0.4)' }}>
                Graphique à venir
              </p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
