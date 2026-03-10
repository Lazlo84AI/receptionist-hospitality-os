import { AdminLayout } from './AdminLayout';
import { Brain } from 'lucide-react';

export default function KnowledgeAssistance() {
  return (
    <AdminLayout>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-1">
            <Brain className="h-6 w-6" style={{ color: '#BBA57A' }} />
            <h1 className="text-2xl font-semibold text-white">Knowledge Assistance</h1>
          </div>
          <p className="text-sm" style={{ color: 'rgba(187,165,122,0.55)' }}>
            Gestion de la base de connaissances et de l'IA documentaire
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {['Documents indexés', 'Requêtes ce mois', 'Sources actives'].map((label) => (
            <div
              key={label}
              className="rounded-xl p-6 border"
              style={{
                backgroundColor: 'rgba(30,26,55,0.8)',
                borderColor: 'rgba(187,165,122,0.2)',
              }}
            >
              <p className="text-sm mb-2" style={{ color: 'rgba(187,165,122,0.55)' }}>
                {label}
              </p>
              <p className="text-3xl font-bold text-white">—</p>
            </div>
          ))}
        </div>

        {/* Placeholder */}
        <div
          className="rounded-xl border p-12 flex flex-col items-center justify-center text-center"
          style={{
            backgroundColor: 'rgba(30,26,55,0.5)',
            borderColor: 'rgba(187,165,122,0.15)',
            borderStyle: 'dashed',
          }}
        >
          <Brain className="h-12 w-12 mb-4 opacity-30" style={{ color: '#BBA57A' }} />
          <p className="text-white font-medium mb-1">Module en construction</p>
          <p className="text-sm" style={{ color: 'rgba(187,165,122,0.45)' }}>
            Upload de documents, RAG, gestion des sources et supervision de l'IA
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
