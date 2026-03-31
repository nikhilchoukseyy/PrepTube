import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from 'react';
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import ResetPasswordPage from "./components/ResetPasswordPage";
import Loader from "./components/Loader";

const LandingPage  = lazy(() => import('./pages/LandingPage'))
const CoursesPage  = lazy(() => import('./pages/CoursesPage'))
const ExplorePage  = lazy(() => import('./pages/ExplorePage'))
const PricingPage  = lazy(() => import('./pages/PricingPage'))
const VideoPage    = lazy(() => import('./pages/VideoPage'))
const ProfilePage  = lazy(() => import('./pages/ProfilePage'))
const LoginPage    = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const JoinPage     = lazy(() => import('./pages/JoinPage'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))

function App() {
  return (
    <Router>
      <Suspense fallback={<div><Loader /></div>}>
        <Routes>
          <Route path="/"                   element={<LandingPage />} />
          <Route path="/courses"            element={<CoursesPage />} />
          <Route path="/explore"            element={<ExplorePage />} />
          <Route path="/pricing"            element={<PricingPage />} />
          <Route path="/join/:token"        element={<JoinPage />} />
          <Route path="/login"              element={<LoginPage />} />
          <Route path="/register"           element={<RegisterPage />} />
          <Route path="/video/:id"          element={<VideoPage />} />
          <Route path="/profile"            element={<ProfilePage />} />
          <Route path="/auth/callback"      element={<AuthCallback />} />
          <Route path="/forgot-password"    element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;