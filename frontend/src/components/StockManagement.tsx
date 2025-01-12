import React, { useState, useEffect } from "react";
import {
  GetProcessedFiles,
  GetCompanyData,
  UpdateStock,
} from "../../wailsjs/go/main/App";

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

  useEffect(() => {
    // Check if we're running in desktop mode (Wails runtime available)
    // @ts-ignore - window.runtime is added by Wails
    const isDesktop = typeof window.runtime !== "undefined";
    setIsDesktopMode(isDesktop);

    if (isDesktop) {
      loadFiles();
    }
  }, []);

  // Rest of the existing useEffect hooks...
  useEffect(() => {
    if (selectedFile) {
      loadCompanyData(selectedFile);
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

  // Existing functions...
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

  // Show appropriate message for web version
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
          {/* Rest of the existing JSX... */}
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
    </div>
  );
};

export default StockManagement;
