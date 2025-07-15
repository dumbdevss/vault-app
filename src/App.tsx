
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


const metadata = {
  title: 'Vault',
  description: 'Decentralized Finance (DeFi) Platform',
  
};

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
              <Route path="/platforms" element={<PlatformsPage />} />
              <Route path="/nfts" element={<NFTsPage />} />
            </Routes>
          </VaultLayout>
        </TooltipProvider>
      </BrowserRouter>
  );
};

export default App;
