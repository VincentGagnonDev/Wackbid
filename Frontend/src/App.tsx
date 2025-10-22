import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider, lightTheme, type ThemeVars } from '@mysten/dapp-kit';
import '@mysten/dapp-kit/dist/index.css';
import { Networks } from './config/networks';
import { NETWORK } from './config/constants';

// Pages
import HomePage from './pages/HomePage';
import AuctionsPage from './pages/AuctionsPage';
import AuctionDetailPage from './pages/AuctionDetailPage';

// Components
import Navbar from './components/layout/Navbar';

const queryClient = new QueryClient();

// Custom neon green theme for WackBid
const wackbidTheme: ThemeVars = {
  ...lightTheme,
  backgroundColors: {
    ...lightTheme.backgroundColors,
    primaryButton: '#6BFF3B',
    primaryButtonHover: 'rgba(107, 255, 59, 0.9)',
  },
  colors: {
    ...lightTheme.colors,
    primaryButton: '#0B0B0F',
  },
  shadows: {
    ...lightTheme.shadows,
    primaryButton: '0 0 20px rgba(107, 255, 59, 0.4)',
  },
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={Networks} defaultNetwork={NETWORK as 'devnet' | 'testnet' | 'mainnet'}>
        <WalletProvider 
          autoConnect={true}
          theme={wackbidTheme}
          storageAdapter={{
            getItem: (key: string) => {
              return localStorage.getItem(key);
            },
            setItem: (key: string, value: string) => {
              localStorage.setItem(key, value);
            },
            removeItem: (key: string) => {
              localStorage.removeItem(key);
            },
          }}
        >
          <BrowserRouter>
            <div className="min-h-screen bg-wb-bg">
              <Navbar />
              <main className="pt-20">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/auctions" element={<AuctionsPage />} />
                  <Route path="/auction/:id" element={<AuctionDetailPage />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export default App;
