import React, { ReactNode, useState } from 'react';
import Sidebar, { SidebarContext } from './Sidebar';
import TopBar from './TopBar';
import Footer from './Footer';
import TenantStatusBanner from './TenantStatusBanner';
import ActiveTenantBanner from './ActiveTenantBanner';

interface LayoutProps {
  children: ReactNode;
}

const MainContent: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isCollapsed } = React.useContext(SidebarContext);
  
  return (
    <div 
      className="flex-1 flex flex-col overflow-hidden transition-base"
      style={{
        marginLeft: isCollapsed ? '80px' : '260px',
      }}
    >
      <TopBar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6" data-testid="main-content">
        <TenantStatusBanner />
        <ActiveTenantBanner />
        {children}
      </main>
      <Footer />
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <div className="flex h-screen bg-background" data-testid="layout">
        <Sidebar />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarContext.Provider>
  );
};

export default Layout;
