
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateCSVData(data: any[], columns?: any[]): string {
  if (!data || data.length === 0) return '';
  
  let headers: string[];
  let rows: string[][];
  
  if (columns && columns.length > 0) {
    // Use provided columns
    headers = columns.map(col => col.header || col.key);
    rows = data.map(item => 
      columns.map(col => {
        const value = item[col.accessorKey || col.key];
        return typeof value === 'object' ? JSON.stringify(value) : String(value || '');
      })
    );
  } else {
    // Use all keys from first object
    headers = Object.keys(data[0]);
    rows = data.map(item => 
      headers.map(header => {
        const value = item[header];
        return typeof value === 'object' ? JSON.stringify(value) : String(value || '');
      })
    );
  }
  
  // Escape CSV values that contain commas, quotes, or newlines
  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  
  const csvHeaders = headers.map(escapeCSV).join(',');
  const csvRows = rows.map(row => row.map(escapeCSV).join(',')).join('\n');
  
  return `${csvHeaders}\n${csvRows}`;
}
