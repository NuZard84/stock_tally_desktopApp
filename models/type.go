package models

// Company represents a company with its finishes and items
type Company struct {
	Name     string   `json:"company"`
	Finishes []Finish `json:"finishes"`
}

// Finish represents a finish with its items
type Finish struct {
	Name  string `json:"name"`
	Items []Item `json:"items"`
}

// Item represents an item with its quantity and alternates
type Item struct {
	ItemNo     string   `json:"item_no"`
	Quantity   int      `json:"quantity"`
	Alternates []string `json:"alternates"`
}

// FileInfo represents information about a processed file
type FileInfo struct {
	Name         string `json:"name"`
	Path         string `json:"path"`
	OriginalPath string `json:"original_path"`
	LastUsed     string `json:"last_used"`
}

// LowStockItem represents an item with low stock
type LowStockItem struct {
	Company  string `json:"company"`
	Finish   string `json:"finish"`
	ItemNo   string `json:"item_no"`
	Quantity int    `json:"quantity"`
	FilePath string `json:"file_path"`
}

// SearchResult represents a single item found in search results
type SearchResult struct {
	Company  string `json:"company"`
	Finish   string `json:"finish"`
	ItemNo   string `json:"itemNo"`
	Quantity int    `json:"quantity"`
	FilePath string `json:"filePath"`
}
