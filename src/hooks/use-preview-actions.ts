
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import { generateCSVData } from "@/lib/utils";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { saveAs } from 'file-saver';

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
) => {
  if (!data || data.length === 0) {
    throw new Error("No data to export.");
  }

  const { title = `Rapport - ${moduleName}`, columns } = options;

  if (format === 'csv') {
    const csvData = generateCSVData(data, columns);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `${title}.csv`);
  } else if (format === 'pdf') {
    const doc = new jsPDF();
    (doc as any).autoTable({
      head: columns ? columns.map(col => col.header) : Object.keys(data[0]),
      body: data.map(item => columns ? columns.map(col => item[col.accessorKey]) : Object.values(item)),
      title: title,
    });
    doc.save(`${title}.pdf`);
  } else {
    throw new Error(`Unsupported format: ${format}`);
  }
};

const generatePreviewHTML = (data: any[], title: string, columns?: any[]): string => {
  if (!data || data.length === 0) return '<p>Aucune donnée à afficher</p>';
  
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
        <p>Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
      </div>
    </div>
  `;
};

export function usePreviewActions(props?: UsePreviewActionsProps) {
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHTML, setPreviewHTML] = useState('');
  const { t } = useTranslation();

  const handleExportModule = async (
    moduleName: string,
    data: any[],
    title?: string,
    columns?: any[]
  ) => {
    setIsActionInProgress(true);
    
    try {
      await exportModuleData(moduleName, 'pdf', data, {
        title: title || `Rapport - ${moduleName}`,
        columns: columns
      });
      
      toast({
        title: "Export réussi",
        description: `Les données de ${moduleName} ont été exportées avec succès.`,
      });
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast({
        title: "Erreur d'export",
        description: "Une erreur s'est produite lors de l'export des données.",
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
              <title>Impression</title>
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
