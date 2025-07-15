
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateCSVData(data: any[], columns?: any[]) {
  if (!data || data.length === 0) return '';
  
  const headers = columns ? columns.map(col => col.header || col.key) : Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    const values = columns 
      ? columns.map(col => row[col.key] || '') 
      : Object.values(row);
    return values.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}
