import { AdminLayout } from './AdminLayout';
import { UserPlus, CheckCircle2, Clock, Users } from 'lucide-react';

const statCards = [
  { label: 'En attente', value: '—', icon: Clock, color: '#DEAE35' },
  { label: 'En cours', value: '—', icon: Users, color: '#BBA57A' },
  { label: 'Complétés', value: '—', icon: CheckCircle2, color: '#4ade80' },
];

export default function TeamOnboarding() {
  return (
    <AdminLayout>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-1">
            <UserPlus className="h-6 w-6" style={{ color: '#BBA57A' }} />
            <h1 className="text-2xl font-semibold text-white">Team Onboarding</h1>
          </div>
          <p className="text-sm" style={{ color: 'rgba(187,165,122,0.55)' }}>
            Gérez l'intégration des nouveaux collaborateurs Decœur Hotels
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl p-6 border"
              style={{
                backgroundColor: 'rgba(30,26,55,0.8)',
                borderColor: 'rgba(187,165,122,0.2)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: 'rgba(187,165,122,0.6)' }}>
                  {card.label}
                </span>
                <card.icon className="h-4 w-4" style={{ color: card.color }} />
              </div>
              <p className="text-3xl font-bold text-white">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Placeholder content */}
        <div
          className="rounded-xl border p-12 flex flex-col items-center justify-center text-center"
          style={{
            backgroundColor: 'rgba(30,26,55,0.5)',
            borderColor: 'rgba(187,165,122,0.15)',
            borderStyle: 'dashed',
          }}
        >
          <UserPlus className="h-12 w-12 mb-4 opacity-30" style={{ color: '#BBA57A' }} />
          <p className="text-white font-medium mb-1">Module en construction</p>
          <p className="text-sm" style={{ color: 'rgba(187,165,122,0.45)' }}>
            Fiches d'onboarding, checklist d'intégration et suivi des nouveaux membres
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
