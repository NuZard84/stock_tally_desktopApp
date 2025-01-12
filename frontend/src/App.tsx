import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import StockManagements from "./components/StockManagement";
import Products from "./components/Products";
import Reports from "./components/Reports";
import Navbar from "./layout/Navbar";

export function App() {
  return (
    <BrowserRouter>
      <div className="flex">
        <Navbar />

        <main className="flex-1 ml-64 overflow-y-auto h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/stock" element={<StockManagements />} />
            <Route path="/products" element={<Products />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
