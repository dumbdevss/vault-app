
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { generateCSVData } from "@/lib/utils";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { saveAs } from "file-saver";

interface ExportOptions {
  title?: string;
  columns?: any[];
}

interface UsePreviewActionsProps {
  data: any[];
  moduleName: string;
  columns?: any[];
  title?: string;
}

const exportModuleData = async (
  moduleName: string,
  format: 'csv' | 'pdf',
  data: any[],
  options: ExportOptions = {}
): Promise<void> => {
  const { title = moduleName, columns } = options;

  try {
    if (format === 'csv') {
      const csvData = generateCSVData(data, columns);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${title}.csv`);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text(title, 20, 20);
      
      const tableData = data.map(item => 
        columns ? columns.map(col => item[col.accessorKey || col.key] || '') : Object.values(item)
      );
      
      const headers = columns ? columns.map(col => col.header || col.key) : Object.keys(data[0] || {});
      
      (doc as any).autoTable({
        head: [headers],
        body: tableData,
        startY: 30,
      });
      
      doc.save(`${title}.pdf`);
    }
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
};

const generatePreviewHTML = (data: any[], title: string, columns?: any[]): string => {
  if (!data || data.length === 0) return '<p>No data to display</p>';
  
  const headers = columns ? columns.map(col => col.header) : Object.keys(data[0]);
  const headerRow = headers.map(header => `<th>${header}</th>`).join('');
  
  const dataRows = data.map(item => {
    const cells = columns 
      ? columns.map(col => item[col.accessorKey || col.key] || '')
      : Object.values(item);
    return `<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
  }).join('');
  
  return `
    <div class="preview-header">
      <h2>${title}</h2>
    </div>
    <div class="preview-content">
      <table>
        <thead><tr>${headerRow}</tr></thead>
        <tbody>${dataRows}</tbody>
      </table>
      <div class="footer">
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>
    </div>
  `;
};

export function usePreviewActions(props?: UsePreviewActionsProps) {
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHTML, setPreviewHTML] = useState('');

  const handleExportModule = async (
    moduleName: string,
    data: any[],
    title?: string,
    columns?: any[]
  ) => {
    setIsActionInProgress(true);
    
    try {
      await exportModuleData(moduleName, 'pdf', data, {
        title: title || `Report - ${moduleName}`,
        columns: columns
      });
      
      toast({
        title: "Export successful",
        description: "The file has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "An error occurred during export.",
        variant: "destructive",
      });
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleShowPreview = () => {
    if (props) {
      const html = generatePreviewHTML(props.data, props.title || props.moduleName, props.columns);
      setPreviewHTML(html);
      setPreviewOpen(true);
    }
  };

  const handlePrint = () => {
    if (previewHTML) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
              </style>
            </head>
            <body>${previewHTML}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleExportPDF = async () => {
    if (props) {
      await handleExportModule(props.moduleName, props.data, props.title, props.columns);
    }
  };

  return {
    isActionInProgress,
    previewOpen,
    setPreviewOpen,
    previewHTML,
    handlePrint,
    handleShowPreview,
    handleExportPDF,
    handleExportModule,
  };
}
