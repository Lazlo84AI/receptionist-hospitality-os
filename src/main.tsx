import { createRoot } from 'react-dom/client'
// Import smoke test pour le dev
import './lib/smokeTest';
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
