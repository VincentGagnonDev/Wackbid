import { ConnectButton } from '@mysten/dapp-kit';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, Activity, User, Trophy } from 'lucide-react';
import wackbidLogo from '../../assets/wackbid_image.png';

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  icon: React.ComponentType<{ size?: number }>;
}

const NavLink = ({ to, children, icon: Icon }: NavLinkProps) => (
  <Link
    to={to}
    className="flex items-center space-x-2 text-wb-ink hover:text-wb-accent transition-colors duration-150 font-body"
  >
    <Icon size={20} />
    <span>{children}</span>
  </Link>
);

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-wb-bg/80 backdrop-blur-xl border-b border-wb-accent/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <motion.div 
            className="flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/" className="flex items-center space-x-3">
              <img src={wackbidLogo} alt="WackBid" className="h-10 w-auto" />
              <span className="text-2xl font-bold text-wb-accent font-display">WackBid</span>
            </Link>
          </motion.div>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-12">
            <NavLink to="/" icon={Home}>Home</NavLink>
            <NavLink to="/activity" icon={Activity}>Activity</NavLink>
            <NavLink to="/rankings" icon={Trophy}>Rankings</NavLink>
            <NavLink to="/dashboard" icon={User}>Dashboard</NavLink>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
}