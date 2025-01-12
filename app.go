package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"stock_tally_desktopApp/models"
	"strconv"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"
)

// App struct
type App struct {
	ctx context.Context
	dir *Directory // Use the Directory struct for file operations
}

// Directory struct handles file and directory operations
type Directory struct {
	dataDir string
}

// NewDirectory creates a new Directory instance
func NewDirectory(dataDir string) *Directory {
	// Create necessary directories
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		log.Printf("Error creating data directory: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(dataDir, "files"), 0755); err != nil {
		log.Printf("Error creating files directory: %v", err)
	}
	if err := os.MkdirAll(filepath.Join(dataDir, "processed"), 0755); err != nil {
		log.Printf("Error creating processed directory: %v", err)
	}

	return &Directory{
		dataDir: dataDir,
	}
}

// NewApp creates a new App application struct
func NewApp() *App {
	// Initialize the Directory struct
	dir := NewDirectory("./data")

	return &App{
		dir: dir,
	}
}

//export GetProcessedFiles
func (a *App) GetProcessedFiles() ([]models.FileInfo, error) {
	return a.dir.GetProcessedFiles()
}

//export GetCompanyData
func (a *App) GetCompanyData(filePath string) (*models.Company, error) {
	return a.dir.GetCompanyData(filePath)
}

//export CleanupOldFiles
func (a *App) CleanupOldFiles(retentionDays int) error {
	return a.dir.CleanupOldFiles(retentionDays)
}

// startup is called when the app starts
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	log.Println("App started successfully")
}

// ExportAllToCSV generates a CSV file containing data for all companies and returns the file content as a string
//
//export ExportAllToCSV
func (a *App) ExportAllToCSV() (string, error) {
	// Get all processed files
	files, err := a.dir.GetProcessedFiles()
	if err != nil {
		return "", fmt.Errorf("error getting processed files: %v", err)
	}

	// Create a buffer to store the CSV data
	var buffer strings.Builder

	// Write CSV headers
	headers := []string{"Company", "Finish", "Item No", "Quantity"}
	if _, err := buffer.WriteString(strings.Join(headers, ",") + "\n"); err != nil {
		return "", fmt.Errorf("error writing CSV headers: %v", err)
	}

	// Iterate through all processed files
	for _, file := range files {
		// Read the company data from the JSON file
		company, err := a.dir.GetCompanyData(file.Path)
		if err != nil {
			log.Printf("Error reading company data for %s: %v", file.Name, err)
			continue
		}

		// Write data rows for the company
		for _, finish := range company.Finishes {
			for _, item := range finish.Items {
				row := []string{
					company.Name,
					finish.Name,
					item.ItemNo,
					strconv.Itoa(item.Quantity),
				}
				if _, err := buffer.WriteString(strings.Join(row, ",") + "\n"); err != nil {
					return "", fmt.Errorf("error writing CSV row: %v", err)
				}
			}
		}
	}

	log.Printf("CSV data generated successfully")
	return buffer.String(), nil
}

// CleanupTempFile deletes a temporary file
//
//export CleanupTempFile
func (a *App) CleanupTempFile(filePath string) error {
	if err := os.Remove(filePath); err != nil {
		return fmt.Errorf("error cleaning up temporary file: %v", err)
	}
	log.Printf("Temporary file cleaned up: %s", filePath)
	return nil
}

// ProcessExcelFile processes the uploaded Excel file and converts it to JSON
func (a *App) ProcessExcelFile(base64Data, originalFileName string) error {
	// Decode base64 data
	data, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		return fmt.Errorf("invalid file format: %v", err)
	}

	// Check if file already exists before processing
	destPath := filepath.Join(a.dir.dataDir, "files", originalFileName)
	if _, err := os.Stat(destPath); err == nil {
		return fmt.Errorf("file already exists: %s", originalFileName)
	}

	// Create a temporary file to hold the decoded data
	tmpFile, err := os.CreateTemp("", "upload-*.xlsx")
	if err != nil {
		return fmt.Errorf("error creating temporary file: %v", err)
	}
	defer os.Remove(tmpFile.Name()) // Clean up the temporary file

	// Write the decoded data to the temporary file
	if err := os.WriteFile(tmpFile.Name(), data, 0644); err != nil {
		return fmt.Errorf("error writing file: %v", err)
	}

	// Process the Excel file
	f, err := excelize.OpenFile(tmpFile.Name())
	if err != nil {
		return fmt.Errorf("invalid Excel file: %v", err)
	}
	defer f.Close()

	// Get all rows from first sheet
	rows, err := f.GetRows(f.GetSheetName(0))
	if err != nil {
		return fmt.Errorf("error reading Excel data: %v", err)
	}

	if len(rows) < 2 {
		return fmt.Errorf("file contains no data rows")
	}

	// Process data and create company map
	companyMap := make(map[string]*models.Company)

	for i := 1; i < len(rows); i++ {
		row := rows[i]
		if len(row) < 4 {
			log.Printf("Warning: Skipping row %d: insufficient columns", i+1)
			continue
		}

		companyName := row[0]
		finishName := row[1]
		itemNo := row[2]
		quantity := row[3]

		// Convert quantity to integer
		qty, err := strconv.Atoi(quantity)
		if err != nil {
			log.Printf("Warning: Skipping row %d: invalid quantity '%s'", i+1, quantity)
			continue
		}

		// Check if the company already exists in the map
		if _, exists := companyMap[companyName]; !exists {
			companyMap[companyName] = &models.Company{
				Name:     companyName,
				Finishes: []models.Finish{},
			}
		}

		// Find or create the finish
		var finish *models.Finish
		for j := range companyMap[companyName].Finishes {
			if companyMap[companyName].Finishes[j].Name == finishName {
				finish = &companyMap[companyName].Finishes[j]
				break
			}
		}
		if finish == nil {
			companyMap[companyName].Finishes = append(companyMap[companyName].Finishes, models.Finish{
				Name:  finishName,
				Items: []models.Item{},
			})
			finish = &companyMap[companyName].Finishes[len(companyMap[companyName].Finishes)-1]
		}

		// Add the item to the finish
		finish.Items = append(finish.Items, models.Item{
			ItemNo:     itemNo,
			Quantity:   qty,
			Alternates: []string{}, // Initialize alternates as empty
		})
	}

	// Save the original file
	if err := a.dir.saveOriginalFile(tmpFile.Name(), originalFileName); err != nil {
		return fmt.Errorf("error saving file: %v", err)
	}

	// Save processed data
	if err := a.dir.saveProcessedData(originalFileName, companyMap); err != nil {
		// If we fail to save processed data, clean up the original file
		os.Remove(destPath)
		return fmt.Errorf("error processing data: %v", err)
	}

	return nil
}

// saveOriginalFile saves a copy of the uploaded file
func (d *Directory) saveOriginalFile(srcPath, originalFileName string) error {
	destPath := filepath.Join(d.dataDir, "files", originalFileName)

	// Check if the file already exists
	if _, err := os.Stat(destPath); err == nil {
		return fmt.Errorf("file already exists: %s", originalFileName)
	}

	// Read the source file
	input, err := os.ReadFile(srcPath)
	if err != nil {
		log.Printf("Error reading file: %v", err)
		return err
	}

	// Write the file to the destination
	if err := os.WriteFile(destPath, input, 0644); err != nil {
		log.Printf("Error writing file: %v", err)
		return err
	}

	log.Printf("Original file saved: %s", destPath)
	return nil
}

// saveProcessedData saves the processed data as JSON files
func (d *Directory) saveProcessedData(originalFileName string, companyMap map[string]*models.Company) error {
	fileName := strings.TrimSuffix(originalFileName, filepath.Ext(originalFileName))

	for companyName, company := range companyMap {
		jsonFileName := fmt.Sprintf("%s_%s.json", fileName, companyName)
		jsonPath := filepath.Join(d.dataDir, "processed", jsonFileName)

		jsonData, err := json.MarshalIndent(company, "", "    ")
		if err != nil {
			log.Printf("Error marshaling JSON for %s: %v", companyName, err)
			return fmt.Errorf("error marshaling JSON for %s: %v", companyName, err)
		}

		if err := os.WriteFile(jsonPath, jsonData, 0644); err != nil {
			log.Printf("Error writing JSON file for %s: %v", companyName, err)
			return fmt.Errorf("error writing JSON file for %s: %v", companyName, err)
		}

		log.Printf("Processed data saved: %s", jsonPath)
	}

	return nil
}

// GetProcessedFiles returns a list of processed JSON files
func (d *Directory) GetProcessedFiles() ([]models.FileInfo, error) {
	var files []models.FileInfo
	processedDir := filepath.Join(d.dataDir, "processed")
	originalDir := filepath.Join(d.dataDir, "files")

	// Ensure directories exist
	if err := os.MkdirAll(processedDir, 0755); err != nil {
		return nil, fmt.Errorf("error accessing processed files directory: %v", err)
	}

	entries, err := os.ReadDir(processedDir)
	if err != nil {
		return nil, fmt.Errorf("error reading processed files: %v", err)
	}

	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".json") {
			info, err := entry.Info()
			if err != nil {
				log.Printf("Warning: Error getting file info for %s: %v", entry.Name(), err)
				continue
			}

			// Get original file info
			originalFileName := strings.TrimSuffix(entry.Name(), ".json") + ".xlsx"
			originalFilePath := filepath.Join(originalDir, originalFileName)

			files = append(files, models.FileInfo{
				Name:         strings.TrimSuffix(entry.Name(), ".json"),
				Path:         filepath.Join(processedDir, entry.Name()),
				OriginalPath: originalFilePath,
				LastUsed:     info.ModTime().Format(time.RFC3339),
			})
		}
	}

	// Return empty array instead of nil if no files found
	if files == nil {
		files = []models.FileInfo{}
	}

	return files, nil
}

// GetCompanyData retrieves the data for a specific company
func (d *Directory) GetCompanyData(filePath string) (*models.Company, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		log.Printf("Error reading company data: %v", err)
		return nil, err
	}

	var company models.Company
	if err := json.Unmarshal(data, &company); err != nil {
		log.Printf("Error unmarshaling company data: %v", err)
		return nil, err
	}

	log.Printf("Retrieved company data: %s", filePath)
	return &company, nil
}

// CleanupOldFiles removes files older than the specified number of days
func (d *Directory) CleanupOldFiles(retentionDays int) error {
	threshold := time.Now().AddDate(0, 0, -retentionDays)

	dirs := []string{
		filepath.Join(d.dataDir, "files"),
		filepath.Join(d.dataDir, "processed"),
	}

	for _, dir := range dirs {
		entries, err := os.ReadDir(dir)
		if err != nil {
			log.Printf("Error reading directory %s: %v", dir, err)
			return err
		}

		for _, entry := range entries {
			info, err := entry.Info()
			if err != nil {
				log.Printf("Error getting file info: %v", err)
				continue
			}

			if info.ModTime().Before(threshold) {
				if err := os.Remove(filepath.Join(dir, entry.Name())); err != nil {
					log.Printf("Error removing file %s: %v", entry.Name(), err)
					return err
				}
				log.Printf("Removed old file: %s", entry.Name())
			}
		}
	}

	log.Println("Cleanup completed successfully")
	return nil
}

// UpdateStock updates the stock quantity for a specific item
func (a *App) UpdateStock(filePath, finishName, itemNo string, change int) error {
	// Read the existing company data
	company, err := a.GetCompanyData(filePath)
	if err != nil {
		return fmt.Errorf("error reading company data: %v", err)
	}

	// Find and update the item quantity
	var itemFound bool
	for i := range company.Finishes {
		if company.Finishes[i].Name == finishName {
			for j := range company.Finishes[i].Items {
				if company.Finishes[i].Items[j].ItemNo == itemNo {
					newQuantity := company.Finishes[i].Items[j].Quantity + change
					if newQuantity < 0 {
						return fmt.Errorf("insufficient stock: cannot reduce below 0")
					}
					company.Finishes[i].Items[j].Quantity = newQuantity
					itemFound = true
					break
				}
			}
			break
		}
	}

	if !itemFound {
		return fmt.Errorf("item not found")
	}

	// Update both the processed JSON file and the original Excel file
	if err := a.updateProcessedFile(filePath, company); err != nil {
		return fmt.Errorf("error updating processed file: %v", err)
	}

	if err := a.updateOriginalFile(company, filePath); err != nil {
		return fmt.Errorf("error updating original file: %v", err)
	}

	return nil
}

// updateProcessedFile updates the processed JSON file
func (a *App) updateProcessedFile(filePath string, company *models.Company) error {
	jsonData, err := json.MarshalIndent(company, "", "    ")
	if err != nil {
		return fmt.Errorf("error marshaling JSON: %v", err)
	}

	if err := os.WriteFile(filePath, jsonData, 0644); err != nil {
		return fmt.Errorf("error writing JSON file: %v", err)
	}

	return nil
}

// updateOriginalFile updates the original Excel file
func (a *App) updateOriginalFile(company *models.Company, jsonPath string) error {
	// Get the original Excel file path
	originalPath := strings.TrimSuffix(jsonPath, ".json") + ".xlsx"
	originalPath = strings.Replace(originalPath, "processed", "files", 1)

	// Create new Excel file
	f := excelize.NewFile()
	defer f.Close()

	// Create headers
	headers := []string{"Company", "Finish", "Item No", "Quantity"}
	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue("Sheet1", cell, header)
	}

	// Add data
	row := 2
	for _, finish := range company.Finishes {
		for _, item := range finish.Items {
			f.SetCellValue("Sheet1", fmt.Sprintf("A%d", row), company.Name)
			f.SetCellValue("Sheet1", fmt.Sprintf("B%d", row), finish.Name)
			f.SetCellValue("Sheet1", fmt.Sprintf("C%d", row), item.ItemNo)
			f.SetCellValue("Sheet1", fmt.Sprintf("D%d", row), item.Quantity)
			row++
		}
	}

	// Save the file
	if err := f.SaveAs(originalPath); err != nil {
		return fmt.Errorf("error saving Excel file: %v", err)
	}

	return nil
}

// GetLowStockItems returns items with stock less than the specified criteria
func (a *App) GetLowStockItems(criteria int) ([]models.LowStockItem, error) {
	// Get all processed files
	files, err := a.dir.GetProcessedFiles()
	if err != nil {
		return nil, fmt.Errorf("error getting processed files: %v", err)
	}

	var lowStockItems []models.LowStockItem

	// Iterate through all files
	for _, file := range files {
		// Get company data
		company, err := a.dir.GetCompanyData(file.Path)
		if err != nil {
			log.Printf("Error reading company data for %s: %v", file.Name, err)
			continue
		}

		// Iterate through finishes and items
		for _, finish := range company.Finishes {
			for _, item := range finish.Items {
				if item.Quantity < criteria {
					lowStockItems = append(lowStockItems, models.LowStockItem{
						Company:  company.Name,
						Finish:   finish.Name,
						ItemNo:   item.ItemNo,
						Quantity: item.Quantity,
						FilePath: file.Path,
					})
				}
			}
		}
	}

	if len(lowStockItems) == 0 {
		return nil, fmt.Errorf("no items found with stock less than %d", criteria)
	}

	return lowStockItems, nil
}

// SearchItems searches for items based on search criteria
// Add this function to your App struct in the backend
func (a *App) SearchItemsAdvanced(searchTerm string) ([]models.SearchResult, error) {
	// Split the search term into potential finish and item number
	parts := strings.Fields(searchTerm) // This splits on whitespace

	files, err := a.dir.GetProcessedFiles()
	if err != nil {
		return nil, fmt.Errorf("error getting files: %v", err)
	}

	var results []models.SearchResult

	for _, file := range files {
		company, err := a.dir.GetCompanyData(file.Path)
		if err != nil {
			log.Printf("Error reading company data for %s: %v", file.Name, err)
			continue
		}

		for _, finish := range company.Finishes {
			// If we have two parts (like "HG 1092"), check both finish and item number
			if len(parts) > 1 {
				finishMatches := strings.Contains(
					strings.ToLower(finish.Name),
					strings.ToLower(parts[0]),
				)

				for _, item := range finish.Items {
					itemMatches := strings.Contains(
						strings.ToLower(item.ItemNo),
						strings.ToLower(parts[1]),
					)

					if finishMatches && itemMatches {
						results = append(results, models.SearchResult{
							Company:  company.Name,
							Finish:   finish.Name,
							ItemNo:   item.ItemNo,
							Quantity: item.Quantity,
							FilePath: file.Path,
						})
					}
				}
			} else {
				// If we only have one part, search in both finish and item number
				searchLower := strings.ToLower(searchTerm)
				finishMatches := strings.Contains(strings.ToLower(finish.Name), searchLower)

				for _, item := range finish.Items {
					itemMatches := strings.Contains(strings.ToLower(item.ItemNo), searchLower)

					if finishMatches || itemMatches {
						results = append(results, models.SearchResult{
							Company:  company.Name,
							Finish:   finish.Name,
							ItemNo:   item.ItemNo,
							Quantity: item.Quantity,
							FilePath: file.Path,
						})
					}
				}
			}
		}
	}

	if len(results) == 0 {
		return nil, fmt.Errorf("no items found matching '%s'", searchTerm)
	}

	return results, nil
}
