import React, { useState } from "react";
import { GetLowStockItems } from "../../wailsjs/go/main/App";

interface LowStockItem {
  company: string;
  finish: string;
  item_no: string;
  quantity: number;
  file_path: string;
}

const Reports: React.FC = () => {
  const [criteria, setCriteria] = useState<number>(5); // Default criteria
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleCriteriaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value)) {
      setCriteria(value);
    }
  };

  const fetchLowStockItems = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const items = await GetLowStockItems(criteria);
      setLowStockItems(items);
    } catch (err) {
      // Handle the 'unknown' type error
      if (err instanceof Error) {
        setError(err.message || "Failed to fetch low stock items.");
      } else {
        setError("An unknown error occurred.");
      }
      setLowStockItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Low Stock Reports</h1>

      {/* Criteria Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Set Criteria (Stock Less Than):
        </label>
        <input
          type="number"
          value={criteria}
          onChange={handleCriteriaChange}
          className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          min="1"
        />
        <button
          onClick={fetchLowStockItems}
          disabled={isLoading}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Loading..." : "Get Low Stock Items"}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Low Stock Items Table */}
      {lowStockItems.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Finish
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lowStockItems.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.company}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.finish}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.item_no}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reports;
