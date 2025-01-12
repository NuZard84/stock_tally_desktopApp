import React from "react";
import { NavLink } from "react-router-dom";

const Navbar: React.FC = () => {
  return (
    <nav className="fixed w-64 h-screen bg-primary-dark text-white p-4 ">
      <div className="mb-8 ">
        <h1 className="text-xl font-bold text-primary-pale">
          Laminates Stock Manager
        </h1>
      </div>
      <ul className="space-y-2 ">
        <li>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `block p-2 rounded transition-colors ${
                isActive
                  ? "bg-primary-medium text-white border-[1px] border-primary-pale"
                  : "hover:bg-primary-medium"
              }`
            }
          >
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/stock"
            className={({ isActive }) =>
              `block p-2 rounded transition-colors ${
                isActive
                  ? "bg-primary-medium text-white border-[1px] border-primary-pale"
                  : "hover:bg-primary-medium"
              }`
            }
          >
            Stock Management
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `block p-2 rounded transition-colors ${
                isActive
                  ? "bg-primary-medium text-white border-[1px] border-primary-pale"
                  : "hover:bg-primary-medium"
              }`
            }
          >
            Products
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `block p-2 rounded transition-colors ${
                isActive
                  ? "bg-primary-medium text-white border-[1px] border-primary-pale"
                  : "hover:bg-primary-medium"
              }`
            }
          >
            Reports
          </NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
