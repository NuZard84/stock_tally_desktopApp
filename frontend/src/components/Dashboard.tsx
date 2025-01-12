import React, { useState, useEffect } from "react";
import {
  ProcessExcelFile,
  GetProcessedFiles,
  GetCompanyData,
  CleanupOldFiles,
} from "../../wailsjs/go/main/App";

interface FileInfo {
  name: string;
  path: string;
  original_path: string;
  last_used: string;
}

const Dashboard: React.FC = () => {
  const [processedFiles, setProcessedFiles] = useState<FileInfo[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDesktopMode, setIsDesktopMode] = useState<boolean>(false);

  // Function to clear messages after a delay
  const clearMessages = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  useEffect(() => {
    // Check if we're running in desktop mode (Wails runtime available)
    // @ts-ignore - window.runtime is added by Wails
    const isDesktop = typeof window.runtime !== "undefined";
    setIsDesktopMode(isDesktop);

    if (isDesktop) {
      loadProcessedFiles();
    }

    // Set up interval to refresh the file list
    const intervalId = setInterval(() => {
      if (isDesktop && !isProcessing) {
        loadProcessedFiles();
      }
    }, 30000); // Refresh every 30 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [isProcessing]);

  const loadProcessedFiles = async (): Promise<void> => {
    if (!isDesktopMode) return;

    try {
      const files = await GetProcessedFiles();
      setProcessedFiles(files || []); // Ensure we always set an array
    } catch (err) {
      console.error("Error loading processed files:", err);
      setError(
        "Error loading processed files. Please try refreshing the page."
      );
      clearMessages();
    }
  };

  const handleFileImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    if (!isDesktopMode) {
      setError("File processing is only available in the desktop application");
      clearMessages();
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    // Clear previous messages
    setError(null);
    setSuccess(null);

    // Check file extension
    const validExtensions = [".xlsx", ".xls"];
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!validExtensions.includes(extension)) {
      setError("Please select an Excel file (.xlsx or .xls)");
      clearMessages();
      return;
    }

    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result;
          if (arrayBuffer instanceof ArrayBuffer) {
            const base64 = btoa(
              new Uint8Array(arrayBuffer).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ""
              )
            );

            await ProcessExcelFile(base64, file.name);
            await loadProcessedFiles();
            setSuccess("File processed successfully!");
            clearMessages();

            // Clear the file input
            if (event.target) {
              event.target.value = "";
            }
          }
        } catch (err: any) {
          // Handle specific error messages from the backend
          if (err.message && err.message.includes("file already exists")) {
            setError(
              `A file with the name "${file.name}" already exists. Please rename the file or delete the existing one.`
            );
          } else if (
            err.message &&
            err.message.includes("file contains no data")
          ) {
            setError(
              "The Excel file appears to be empty. Please check the file and try again."
            );
          } else {
            setError(
              `Error processing file: ${
                err.message || "Unknown error occurred"
              }`
            );
          }
          clearMessages();
        }
      };

      reader.onerror = () => {
        setError("Error reading file. Please try again.");
        clearMessages();
      };

      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      setError(
        `Error reading file: ${err.message || "Unknown error occurred"}`
      );
      clearMessages();
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to refresh the file list manually
  const handleRefresh = async () => {
    if (!isProcessing) {
      await loadProcessedFiles();
    }
  };

  // Show appropriate message for web version
  if (!isDesktopMode) {
    return (
      <div className="p-6">
        <div className="text-red-500">
          This feature is only available in the desktop application. Please
          download and install the desktop version to use file processing
          capabilities.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-primary-dark">
            Import Stock Data
          </h2>
          <button
            onClick={handleRefresh}
            disabled={isProcessing}
            className="px-4 py-2 bg-primary-medium text-primary-pale rounded-lg hover:bg-primary-dark disabled:opacity-50"
          >
            Refresh List
          </button>
        </div>

        {/* File Import Section */}
        <div className="p-4 bg-primary-pale rounded-lg shadow">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Import Excel File
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileImport}
              className="file:border-primary-pale block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-1
                file:text-sm file:font-medium
                file:bg-primary-medium file:text-primary-pale
                hover:file:bg-primary-dark
                cursor-pointer disabled:opacity-50"
              disabled={isProcessing}
            />
          </div>

          {isProcessing && (
            <div className="text-primary-medium animate-pulse">
              Processing file, please wait...
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="text-green-500 text-sm mt-2 p-2 bg-green-50 rounded">
              {success}
            </div>
          )}
        </div>
      </div>

      {/* Processed Files List */}
      <div>
        <h2 className="text-xl font-bold text-primary-dark mb-4">
          Processed Files
        </h2>
        <div className="space-y-4">
          {processedFiles.map((file) => (
            <div
              key={file.path}
              className="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="font-medium text-primary-dark">{file.name}</div>
              <div className="text-sm text-gray-500 mt-1">
                Last processed: {new Date(file.last_used).toLocaleString()}
              </div>
              {file.original_path && (
                <div className="text-sm text-gray-500 mt-1">
                  Original file: {file.original_path}
                </div>
              )}
            </div>
          ))}

          {processedFiles.length === 0 && !isProcessing && (
            <div className="text-gray-500 italic">
              No processed files yet. Import an Excel file to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
