/**
 * Root Application Component
 * Sets up global providers: Theme, Sidebar, Router
 */
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { SidebarProvider } from './context/SidebarContext';
import AppRoutes from './routes/AppRoutes';

export const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <SidebarProvider>
          <AppRoutes />
        </SidebarProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
