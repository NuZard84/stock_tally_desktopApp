# Stock Tally

**Stock Tally** is a **desktop application** designed to simplify inventory and stock management for businesses. Built with **Wails (Go + React)**, this application provides an intuitive interface for tracking stock levels, managing items, and generating reports. Whether you're a small business owner or a warehouse manager, Stock Tally helps you stay organized and make data-driven decisions.

---

## Features

- **Stock Management**: Easily add, update, and remove items from your inventory.
- **Low Stock Alerts**: Get notified when stock levels fall below a specified threshold.
- **Company & Finish Tracking**: Organize items by company and finish for better categorization.
- **Dynamic Reporting**: Generate detailed reports to analyze stock levels and trends.
- **User-Friendly Interface**: A clean and responsive UI built with **React** for seamless navigation.
- **Cross-Platform**: Runs on **Windows**, **macOS**, and **Linux** thanks to Wails.

---

## Screenshots

![Stock Tally Dashboard](/screenshots/dashboard.png)  
_The intuitive dashboard for managing stock levels._

![Stock organization System](/screenshots/stock_management.png)  
_The management system for adding removing and searching for stocks._

![Products Table](/screenshots/products.png)  
_Get item nomber in Table view for specific folder company and finish name._

![Low Stock Stock Alert](/screenshots/reports.png)  
_Get notified when stock levels are low._

---

## Technologies Used

- **Frontend**: React, Tailwind CSS
- **Backend**: Go (Golang)
- **Framework**: Wails (for building desktop apps with Go and React)
- **Database**: JSON files for lightweight data storage
- **Packaging**: NSIS for creating Windows installers

---

## Installation

### Prerequisites

- **Go** (v1.20 or higher)
- **Node.js** (v16 or higher)
- **Wails CLI** (install via `go install github.com/wailsapp/wails/v2/cmd/wails@latest`)

### Steps

1. **Clone the repository**:

   ```bash
   git clone https://github.com/yourusername/stock-tally.git
   cd stock-tally
   ```

2. **Install frontend dependencies**:

   ```bash
   cd frontend
   npm install
   ```

3. **Build the application**:

   ```bash
   wails build -nsis
   ```

4. **Run the application**:

- Navigate to the `build/bin` directory and run the executable.

## Usage

- **Add Items**: Use the "Add Item" feature to add new items to your inventory.
- **Track Stock**: View and update stock levels for each item.
- **Set Alerts**: Configure low stock alerts to get notified when stock levels are low.
- **Generate Reports**: Use the reporting feature to analyze stock trends and make informed decisions.
