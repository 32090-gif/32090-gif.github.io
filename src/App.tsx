import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./forceRebuild.js"; // Force rebuild
import DiscordWidget from "@/components/layout/DiscordWidget";
import Index from "./pages/Index";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Promotions from "./pages/Promotions";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Topup from "./pages/Topup";
import Vouchers from "./pages/Vouchers";
import OrderHistory from "./pages/OrderHistory";
import GetKey from "./pages/GetKey";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Profile from "./pages/Profile";
import ScriptManager from "./pages/ScriptManager";
import WebhookLogs from "./pages/WebhookLogs";
import Dashboard from "./pages/Dashboard";
import TBSkyenPage from "./pages/TBSkyenPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/topup" element={<Topup />} />
          <Route path="/vouchers" element={<Vouchers />} />
          <Route path="/order-history" element={<OrderHistory />} />
          <Route path="/get-key" element={<GetKey />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/scripts" element={<ScriptManager />} />
          <Route path="/webhook-logs" element={<WebhookLogs />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/:game" element={<Dashboard />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/TBSkyen" element={<TBSkyenPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <DiscordWidget />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
// Timestamp: 02/14/2026 18:35:51
