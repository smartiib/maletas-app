import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import { QueryClient } from './integrations/react-query/client';
import Labels from './pages/Labels';

function App() {
  return (
    <BrowserRouter>
      <QueryClient>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/labels" element={<Labels />} />
        </Routes>
      </QueryClient>
    </BrowserRouter>
  );
}

export default App;
