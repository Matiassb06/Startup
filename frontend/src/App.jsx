import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { MarketingLayout } from "./layouts/MarketingLayout";
import AdminDashboard from "./pages/AdminDashboard";
import { AboutUs } from "./pages/AboutUs";
import { AuthPage } from "./pages/AuthPage";
import { Contact } from "./pages/Contact";
import CompanyDashboard from "./pages/CompanyDashboard";
import CourseLearning from "./pages/CourseLearning";
import { LandingPage } from "./pages/LandingPage";
import { Methodology } from "./pages/Methodology";
import StudentDashboard from "./pages/StudentDashboard";
import { VerifyEmail } from "./pages/VerifyEmail";

export default function App() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/metodologia" element={<Methodology />} />
        <Route path="/nosotros" element={<AboutUs />} />
        <Route path="/contacto" element={<Contact />} />
      </Route>

      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/course/:courseId"
        element={
          <ProtectedRoute requiredRole="student">
            <CourseLearning />
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/dashboard"
        element={
          <ProtectedRoute requiredRole="company">
            <CompanyDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
