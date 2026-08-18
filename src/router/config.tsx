import type { RouteObject } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import Home from "@/pages/home/page";
import PerformersPage from "@/pages/performers/page";
import PerformerDetailPage from "@/pages/performers/detail/page";
import LoginPage from "@/pages/login/page";
import RegisterPage from "@/pages/register/page";
import RequestsPage from "@/pages/requests/page";
import RequestNewPage from "@/pages/requests/new/page";
import RequestDetailPage from "@/pages/requests/detail/page";
import MatchingPage from "@/pages/matching/page";
import AuthCallbackPage from "@/pages/auth/callback/page";
import ForgotPasswordPage from "@/pages/auth/forgot-password/page";
import ResetPasswordPage from "@/pages/auth/reset-password/page";
import DashboardPage from "@/pages/dashboard/page";
import PerformerProfilePage from "@/pages/performer/profile/page";
import SchedulePage from "@/pages/schedule/page";
import QuotesPage from "@/pages/quotes/page";
import AdminPage from "@/pages/admin/page";
import NotificationsPage from "@/pages/notifications/page";
import PaymentCheckoutPage from "@/pages/payment/checkout/page";
import PaymentSuccessPage from "@/pages/payment/success/page";
import PaymentFailPage from "@/pages/payment/fail/page";
import TermsPage from "@/pages/legal/terms/page";
import PrivacyPage from "@/pages/legal/privacy/page";
import FaqPage from "@/pages/faq/page";
import GuidePage from "@/pages/guide/page";
import PricingPage from "@/pages/pricing/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/performers",
    element: <PerformersPage />,
  },
  {
    path: "/performers/:id",
    element: <PerformerDetailPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/auth/callback",
    element: <AuthCallbackPage />,
  },
  {
    path: "/auth/reset-password",
    element: <ResetPasswordPage />,
  },
  {
    path: "/dashboard/performer",
    element: <DashboardPage />,
  },
  {
    path: "/dashboard/client",
    element: <DashboardPage />,
  },
  {
    path: "/performer/profile",
    element: <PerformerProfilePage />,
  },
  {
    path: "/schedule",
    element: <SchedulePage />,
  },
  {
    path: "/quotes",
    element: <QuotesPage />,
  },
  {
    path: "/admin",
    element: <AdminPage />,
  },
  {
    path: "/notifications",
    element: <NotificationsPage />,
  },
  {
    path: "/payment/checkout/:quoteId",
    element: <PaymentCheckoutPage />,
  },
  {
    path: "/payment/success",
    element: <PaymentSuccessPage />,
  },
  {
    path: "/payment/fail",
    element: <PaymentFailPage />,
  },
  {
    path: "/requests",
    element: <RequestsPage />,
  },
  {
    path: "/requests/new",
    element: <RequestNewPage />,
  },
  {
    path: "/requests/:id",
    element: <RequestDetailPage />,
  },
  {
    path: "/matching",
    element: <MatchingPage />,
  },
  {
    path: "/terms",
    element: <TermsPage />,
  },
  {
    path: "/privacy",
    element: <PrivacyPage />,
  },
  {
    path: "/faq",
    element: <FaqPage />,
  },
  {
    path: "/guide",
    element: <GuidePage />,
  },
  {
    path: "/pricing",
    element: <PricingPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;