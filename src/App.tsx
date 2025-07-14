
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import VaultLayout from "./components/layout/VaultLayout";
import PortfolioPage from "./pages/PortfolioPage";
import SwapPage from "./pages/SwapPage";
import SendPage from "./pages/SendPage";
import PlatformsPage from "./pages/PlatformsPage";
import NFTsPage from "./pages/NFTsPage";
import { useEffect } from "react";

// Create query client with enhanced configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Application main component
const App = () => {
  useEffect(() => {
    // Force dark mode
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <VaultLayout>
            <Routes>
              <Route path="/" element={<PortfolioPage />} />
              <Route path="/swap" element={<SwapPage />} />
              <Route path="/send" element={<SendPage />} />
              <Route path="/platforms" element={<PlatformsPage />} />
              <Route path="/nfts" element={<NFTsPage />} />
            </Routes>
          </VaultLayout>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
