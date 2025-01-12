import React, { useState, useEffect } from "react";
import {
  GetProcessedFiles,
  GetCompanyData,
  UpdateStock,
  SearchItemsAdvanced,
  ExportAllToCSV,
} from "../../wailsjs/go/main/App";

// Extend the Window interface to include runtime
declare global {
  interface Window {
    runtime: any; // Use a more specific type if available
  }
}

interface Item {
  item_no: string;
  alternates: string[];
  quantity: number;
}

interface FinishName {
  name: string;
  items: Item[];
}

interface Company {
  company: string;
  finishes: FinishName[];
}

interface FileInfo {
  name: string;
  path: string;
  original_path: string;
  last_used: string;
}

interface SearchResult {
  company: string;
  finish: string;
  itemNo: string;
  quantity: number;
  filePath: string;
}

const StockManagement: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [selectedFinish, setSelectedFinish] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [companyData, setCompanyData] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number | null>(null);
  const [stockChange, setStockChange] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDesktopMode, setIsDesktopMode] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    const isDesktop = typeof window.runtime !== "undefined";
    setIsDesktopMode(isDesktop);

    if (isDesktop) {
      loadFiles();
    }
  }, []);

  useEffect(() => {
    if (selectedFile) {
      loadCompanyData(selectedFile);
      setSearchResults([]);
    } else {
      resetSelections();
    }
  }, [selectedFile]);

  useEffect(() => {
    if (selectedItem && companyData) {
      const finish = companyData.finishes.find(
        (f) => f.name === selectedFinish
      );
      const item = finish?.items.find((i) => i.item_no === selectedItem);
      setQuantity(item?.quantity ?? null);
    } else {
      setQuantity(null);
    }
  }, [selectedItem, selectedFinish, companyData]);

  const resetSelections = () => {
    setCompanyData(null);
    setSelectedFinish("");
    setSelectedItem("");
    setQuantity(null);
    setStockChange(0);
  };

  const loadFiles = async () => {
    try {
      const processedFiles = await GetProcessedFiles();
      setFiles(processedFiles);
      setError(null);
    } catch (err) {
      setError("Error loading files. Please try again.");
      console.error("Error loading files:", err);
    }
  };

  const loadCompanyData = async (filePath: string) => {
    try {
      const data = await GetCompanyData(filePath);
      setCompanyData(data);
      setError(null);
    } catch (err) {
      setError("Error loading company data. Please try again.");
      console.error("Error loading company data:", err);
    }
  };

  const handleUpdateStock = async (operation: "add" | "remove") => {
    if (!selectedFile || !selectedFinish || !selectedItem || !stockChange) {
      setError("Please select all fields and enter a valid quantity");
      return;
    }

    if (operation === "remove" && quantity !== null && stockChange > quantity) {
      setError("Cannot remove more stock than available");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const change = operation === "add" ? stockChange : -stockChange;
      await UpdateStock(selectedFile, selectedFinish, selectedItem, change);
      await loadCompanyData(selectedFile);
      setSuccess(
        `Successfully ${operation === "add" ? "added" : "removed"} stock`
      );
      setStockChange(0);
    } catch (err) {
      setError(`Failed to ${operation} stock. Please try again.`);
      console.error(`Error updating stock:`, err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const results = await SearchItemsAdvanced(searchTerm);
      setSearchResults(results);
    } catch (err) {
      setSearchError("No items found matching your search.");
      console.error("Error searching items:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultClick = (result: SearchResult) => {
    setSelectedFile(result.filePath);
    setSelectedFinish(result.finish);
    setSelectedItem(result.itemNo);
    setSearchResults([]);
  };

  const handleExportAllToCSV = async () => {
    setIsExporting(true);
    setExportError(null);

    try {
      // Call the backend function to generate the CSV data
      const csvString = await ExportAllToCSV();

      // Convert the CSV string to a Blob
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

      // Create a URL for the Blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element to trigger the download
      const a = document.createElement("a");
      a.href = url;
      a.download = `all_companies_export_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setExportError("Error exporting CSV. Please try again.");
      console.error("Error exporting CSV:", err);
    } finally {
      setIsExporting(false);
    }
  };
  if (!isDesktopMode) {
    return (
      <div className="p-6">
        <div className="text-red-500">
          This feature is only available in the desktop application. Please
          download and install the desktop version to use stock management
          capabilities.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">Stock Management</h2>

        {/* Search Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">
            Search Items
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter finish name or item number..."
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchTerm.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>
          {searchError && (
            <div className="mt-2 p-2 bg-red-50 text-red-600 rounded-lg">
              {searchError}
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Search Results</h3>
            <div className="space-y-2">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSearchResultClick(result)}
                >
                  <p className="text-sm font-medium text-gray-600">
                    {result.company} - {result.finish}
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {result.itemNo}
                  </p>
                  <p className="text-sm text-gray-500">
                    Quantity: {result.quantity}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Existing stock management UI... */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-lg">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Company/File Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Company
            </label>
            <select
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a company...</option>
              {files.map((file) => (
                <option key={file.path} value={file.path}>
                  {file.name}
                </option>
              ))}
            </select>
          </div>

          {/* Finish Selection */}
          {companyData && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Finish
              </label>
              <select
                value={selectedFinish}
                onChange={(e) => {
                  setSelectedFinish(e.target.value);
                  setSelectedItem("");
                }}
                className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a finish...</option>
                {companyData.finishes.map((finish) => (
                  <option key={finish.name} value={finish.name}>
                    {finish.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Item Selection */}
          {selectedFinish && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Item
              </label>
              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select an item...</option>
                {companyData?.finishes
                  .find((f) => f.name === selectedFinish)
                  ?.items.map((item) => (
                    <option key={item.item_no} value={item.item_no}>
                      {item.item_no}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Stock Management Section */}
          {selectedItem && (
            <div className="space-y-4">
              {/* Current Quantity Display */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">
                  Available Quantity
                </p>
                <p className="text-2xl font-bold text-gray-900">{quantity}</p>
              </div>

              {/* Stock Change Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Quantity to Add/Remove
                </label>
                <input
                  type="number"
                  min="1"
                  value={stockChange || ""}
                  onChange={(e) =>
                    setStockChange(Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="block w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => handleUpdateStock("add")}
                  disabled={isProcessing || stockChange === 0}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Stock
                </button>
                <button
                  onClick={() => handleUpdateStock("remove")}
                  disabled={isProcessing || stockChange === 0}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove Stock
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Export All to CSV Button */}
      <div className="mt-6">
        <button
          onClick={handleExportAllToCSV}
          disabled={isExporting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? "Exporting..." : "Export All to CSV"}
        </button>
        {exportError && (
          <div className="mt-2 text-red-500 text-sm">{exportError}</div>
        )}
      </div>
    </div>
  );
};

export default StockManagement;
