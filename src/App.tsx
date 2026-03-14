import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useInventoryStore } from "@/stores/inventoryStore";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Receipts from "@/pages/warehouse/Receipts";
import Deliveries from "@/pages/warehouse/Deliveries";
import Transfers from "@/pages/warehouse/Transfers";
import Adjustments from "@/pages/warehouse/Adjustments";
import StockLedger from "@/pages/StockLedger";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { isAuthenticated } = useInventoryStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoutes />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/warehouse/receipts" element={<Receipts />} />
            <Route path="/warehouse/deliveries" element={<Deliveries />} />
            <Route path="/warehouse/transfers" element={<Transfers />} />
            <Route path="/warehouse/adjustments" element={<Adjustments />} />
            <Route path="/stock-ledger" element={<StockLedger />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
