
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import VaultLayout from "./components/layout/VaultLayout";
import PortfolioPage from "./pages/PortfolioPage";
import SwapPage from "./pages/SwapPage";
import SendPage from "./pages/SendPage";
import PlatformsPage from "./pages/PlatformsPage";
import NFTsPage from "./pages/NFTsPage";
import NotFoundPage from './pages/not_found';
import HyperionPage from './pages/platforms/hyperion';
import LiquidSwapPage from './pages/platforms/liquidswap';
import TappExchangePage from './pages/platforms/tappexchange';
import { useEffect } from "react";


// Application main component
const App = () => {
  useEffect(() => {
    // Force dark mode
    document.documentElement.classList.add('dark');
  }, []);

  return (
      <BrowserRouter>
        <TooltipProvider>
          <VaultLayout>
            <Routes>
              <Route path="/" element={<PortfolioPage />} />
              <Route path="/swap" element={<SwapPage />} />
              <Route path="/send" element={<SendPage />} />
              <Route path="/platforms" element={<PlatformsPage />}>
                <Route path="hyperion" element={<HyperionPage />} />
                <Route path="liquidswap" element={<LiquidSwapPage />} />
                <Route path="tappexchange" element={<TappExchangePage />} />
              </Route>
              <Route path="/nfts" element={<NFTsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </VaultLayout>
        </TooltipProvider>
      </BrowserRouter>
  );
};

export default App;
