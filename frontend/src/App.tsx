import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

import TriangleNav from "@/components/TriangleNav";
import LoadingScreen from "@/components/LoadingScreen";
import LandingPage from "@/pages/LandingPage";
import UserLogin from "@/pages/UserLogin";
import UserRegister from "@/pages/UserRegister";
import OTPVerification from "@/pages/OTPVerification";
import IdentityVerification from "@/pages/IdentityVerification";
import SignatureSetup from "@/pages/SignatureSetup";
import UserDashboard from "@/pages/UserDashboard";
import DocumentHistory from "@/pages/DocumentHistory";
import DocumentReview from "@/pages/DocumentReview";
import AdminLogin from "@/pages/AdminLogin";
import AdminRegister from "@/pages/AdminRegister";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminDocuments from "@/pages/AdminDocuments";
import CreateAgreement from "@/pages/CreateAgreement";
import VerificationManagement from "@/pages/VerificationManagement";
import ProfilePage from "@/pages/ProfilePage";
import AdminAgreements from "@/pages/AdminAgreements";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const RouteLoader = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Don't show the loading screen when navigating within dashboard areas
    const path = location.pathname;
    if (path.startsWith("/user/") || path.startsWith("/admin/")) return;

    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      <AnimatePresence>{loading && <LoadingScreen />}</AnimatePresence>
      {!loading && children}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RouteLoader>
          <Routes>
            <Route path="/" element={<TriangleNav />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/user/login" element={<UserLogin />} />
            <Route path="/user/register" element={<UserRegister />} />
            <Route path="/user/otp" element={<OTPVerification />} />
            <Route path="/user/identity-verification" element={<IdentityVerification />} />
            <Route path="/user/signature" element={<SignatureSetup />} />
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/documents" element={<DocumentHistory />} />
            <Route path="/user/pending" element={<DocumentReview />} />
            <Route path="/user/verification" element={<IdentityVerification />} />
            <Route path="/user/profile" element={<ProfilePage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/register" element={<AdminRegister />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/documents" element={<AdminDocuments />} />
            <Route path="/admin/agreements" element={<AdminAgreements />} />
            <Route path="/admin/users" element={<AdminDashboard />} />
            <Route path="/admin/create-agreement" element={<CreateAgreement />} />
            <Route path="/admin/verifications" element={<VerificationManagement />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </RouteLoader>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
