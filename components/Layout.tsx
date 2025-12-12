import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Music, Calendar, Settings, Mic2, Disc, Sliders } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DbErrorBanner from './DbErrorBanner';

interface LayoutProps {
  children: React.ReactNode;
}

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `
      flex flex-col items-center justify-center w-full p-3 rounded-2xl transition-all duration-300 group
      ${isActive 
        ? 'text-gray-900 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)]' 
        : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'}
    `}
  >
    <Icon strokeWidth={1.5} size={24} className="mb-1" />
    <span className="text-[10px] font-medium tracking-wide">{label}</span>
  </NavLink>
);

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-sans selection:bg-gray-200 selection:text-black flex">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-24 h-screen fixed left-0 top-0 border-r border-gray-100 bg-white/40 backdrop-blur-xl z-50 items-center py-8 gap-8">
        <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4">
          <Disc strokeWidth={1.5} />
        </div>
        
        <nav className="flex-1 flex flex-col gap-4 w-full px-4">
          <NavItem to="/" icon={LayoutDashboard} label="Home" />
          <NavItem to="/projects" icon={Mic2} label="Projects" />
          <NavItem to="/tones" icon={Sliders} label="Tones" />
          <NavItem to="/schedule" icon={Calendar} label="Plan" />
        </nav>
        
        <div className="pb-4 px-4 w-full">
           <NavItem to="/settings" icon={Settings} label="Settings" />
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50 px-6 py-2 flex justify-between items-center pb-safe">
          <NavItem to="/" icon={LayoutDashboard} label="Home" />
          <NavItem to="/projects" icon={Mic2} label="Projects" />
          <NavItem to="/tones" icon={Sliders} label="Tones" />
          <NavItem to="/schedule" icon={Calendar} label="Plan" />
      </nav>

      {/* Main Content */}
      <main className="flex-1 md:ml-24 p-6 md:p-12 pb-24 md:pb-12 max-w-7xl mx-auto w-full">
        <header className="flex items-center justify-between mb-6">
          <div></div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="text-sm text-gray-700">{user.email}</div>
                <button onClick={handleSignOut} className="px-3 py-1 border rounded text-sm">Sign out</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/signin')} className="px-3 py-1 border rounded text-sm">Sign in</button>
                <button onClick={() => navigate('/signup')} className="px-3 py-1 bg-black text-white rounded text-sm">Sign up</button>
              </>
            )}
          </div>
        </header>

        <DbErrorBanner />
        {children}
      </main>
    </div>
  );
};
