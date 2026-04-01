import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import ShiftManagement from "./pages/ShiftManagement";
import Connaissances from "./pages/Connaissances";
import TrainingManagement from "./pages/TrainingManagement";
import Assistant from "./pages/Assistant";
import MyShifts from "./pages/MyShifts";
import TeamDispatch from "./pages/TeamDispatch";
import ServiceControl from "./pages/ServiceControl";
import ServiceControl2 from "./pages/ServiceControl2";
import LocationCleanupPage from "./pages/LocationCleanup";
import MyStatistics from "./pages/MyStatistics";
import TrainingStatistics from "./pages/TrainingStatistics";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import TeamOnboarding from "./pages/admin/TeamOnboarding";
import TeamAnalytics from "./pages/admin/TeamAnalytics";
import AdminTraining from "./pages/admin/AdminTraining";
import KnowledgeAssistance from "./pages/admin/KnowledgeAssistance";

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
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/shift" element={<ProtectedRoute><ShiftManagement /></ProtectedRoute>} />
            <Route path="/connaissances" element={<ProtectedRoute><Connaissances /></ProtectedRoute>} />
            <Route path="/training" element={<ProtectedRoute><TrainingManagement /></ProtectedRoute>} />
            <Route path="/assistant" element={<ProtectedRoute><Assistant /></ProtectedRoute>} />
            <Route path="/team-shifts" element={<ProtectedRoute><MyShifts /></ProtectedRoute>} />
            <Route path="/team-dispatch" element={<ProtectedRoute><TeamDispatch /></ProtectedRoute>} />
            <Route path="/service-control" element={<ProtectedRoute><ServiceControl2 /></ProtectedRoute>} />
            <Route path="/service-control2" element={<ProtectedRoute><ServiceControl2 /></ProtectedRoute>} />
            <Route path="/location-cleanup" element={<ProtectedRoute><LocationCleanupPage /></ProtectedRoute>} />
            <Route path="/my-statistics" element={<ProtectedRoute><MyStatistics /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/training-statistics" element={<ProtectedRoute><TrainingStatistics /></ProtectedRoute>} />
            {/* ── ADMIN ROUTES (direction only) ────────────────────────── */}
            <Route path="/admin/onboarding" element={<AdminProtectedRoute><TeamOnboarding /></AdminProtectedRoute>} />
            <Route path="/admin/analytics"  element={<AdminProtectedRoute><TeamAnalytics /></AdminProtectedRoute>} />
            <Route path="/admin/training"   element={<AdminProtectedRoute><AdminTraining /></AdminProtectedRoute>} />
            <Route path="/admin/knowledge"  element={<AdminProtectedRoute><KnowledgeAssistance /></AdminProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
