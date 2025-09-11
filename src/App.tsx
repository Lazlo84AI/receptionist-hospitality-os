import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ShiftManagement from "./pages/ShiftManagement";
import Connaissances from "./pages/Connaissances";
import Assistant from "./pages/Assistant";
import MesShifts from "./pages/MesShifts";
import TeamDispatch from "./pages/TeamDispatch";
import ServiceControl from "./pages/ServiceControl";
import ServiceControl2 from "./pages/ServiceControl2";
import LocationCleanupPage from "./pages/LocationCleanup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/shift" element={<ProtectedRoute><ShiftManagement /></ProtectedRoute>} />
            <Route path="/connaissances" element={<ProtectedRoute><Connaissances /></ProtectedRoute>} />
            <Route path="/assistant" element={<ProtectedRoute><Assistant /></ProtectedRoute>} />
            <Route path="/mes-shifts" element={<ProtectedRoute><MesShifts /></ProtectedRoute>} />
            <Route path="/team-dispatch" element={<ProtectedRoute><TeamDispatch /></ProtectedRoute>} />
            <Route path="/service-control" element={<ProtectedRoute><ServiceControl2 /></ProtectedRoute>} />
            <Route path="/service-control2" element={<ProtectedRoute><ServiceControl2 /></ProtectedRoute>} />
            <Route path="/location-cleanup" element={<ProtectedRoute><LocationCleanupPage /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
