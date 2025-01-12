import React, { useState, useEffect } from "react";
import { GetProcessedFiles, GetCompanyData } from "../../wailsjs/go/main/App";

interface Item {
  item_no: string;
  quantity: number;
  alternates: string[];
}

interface Finish {
  name: string;
  items: Item[];
}

interface Company {
  company: string;
  finishes: Finish[];
}

interface FileInfo {
  name: string;
  path: string;
  original_path: string;
  last_used: string;
}

const Products: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [selectedFinish, setSelectedFinish] = useState<string>("");
  const [companyData, setCompanyData] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDesktopMode, setIsDesktopMode] = useState<boolean>(false);

  // Check if Wails runtime is available (desktop mode)
  useEffect(() => {
    // @ts-ignore - window.runtime is added by Wails
    const isDesktop = typeof window.runtime !== "undefined";
    setIsDesktopMode(isDesktop);

    if (isDesktop) {
      loadFiles();
    }
  }, []);

  // Load processed files
  const loadFiles = async () => {
    try {
      const processedFiles = await GetProcessedFiles();
      setFiles(processedFiles);
    } catch (err) {
      setError("Error loading files. Please try again.");
      console.error("Error loading files:", err);
    }
  };

  // Load company data when a file is selected
  useEffect(() => {
    const loadCompanyData = async () => {
      if (selectedFile) {
        try {
          const data = await GetCompanyData(selectedFile);
          setCompanyData(data);
          setError(null);
        } catch (err) {
          setError("Error loading company data. Please try again.");
          console.error("Error loading company data:", err);
        }
      } else {
        setCompanyData(null);
      }
    };

    if (isDesktopMode) {
      loadCompanyData();
    }
  }, [selectedFile, isDesktopMode]);

  const handleFileChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFile(event.target.value);
    setSelectedFinish(""); // Reset finish selection when file changes
  };

  const handleFinishChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFinish(event.target.value);
  };

  const getFinishItems = () => {
    if (!companyData || !selectedFinish) return [];

    const finish = companyData.finishes.find((f) => f.name === selectedFinish);
    return finish ? finish.items : [];
  };

  // Show appropriate message for web version
  if (!isDesktopMode) {
    return (
      <div className="p-6">
        <div className="text-red-500">
          This feature is only available in the desktop application. Please
          download and install the desktop version to use product management
          capabilities.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Products</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Company Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Select Company
          </label>
          <select
            value={selectedFile}
            onChange={handleFileChange}
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
              onChange={handleFinishChange}
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

        {/* Items Table */}
        {selectedFinish && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alternates
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {getFinishItems().map((item) => (
                  <tr key={item.item_no}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.item_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.alternates.join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
