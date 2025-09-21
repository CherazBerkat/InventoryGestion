# Inventory Management App - MVP Todo

## Files to Create:
1. **src/pages/Index.tsx** - Main inventory management interface
2. **src/components/ExcelImporter.tsx** - Component to import Excel files
3. **src/components/InventoryTable.tsx** - Table to display and edit inventory items
4. **src/components/CountingSession.tsx** - Component for counting sessions (1, 2, 3)
5. **src/lib/excelUtils.ts** - Utilities for Excel file processing
6. **src/types/inventory.ts** - TypeScript types for inventory data

## Features:
- Import Excel files and parse inventory data
- Display inventory items in a table format
- Support 3 counting sessions per item
- Update stock quantities after each counting
- Save data to localStorage (since Supabase is not enabled)
- Modern UI with Shadcn components

## Implementation Plan:
1. Create types for inventory items
2. Build Excel import functionality
3. Create inventory table with counting inputs
4. Implement counting session management
5. Add stock update logic
6. Style with Tailwind CSS and Shadcn components