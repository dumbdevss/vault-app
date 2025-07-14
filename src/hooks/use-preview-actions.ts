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

export function usePreviewActions() {
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const { t } = useTranslation();

  const handleExportModule = async (
    moduleName: string,
    data: any[],
    title?: string,
    columns?: any[]
  ) => {
    setIsActionInProgress(true);
    
    try {
      // Fix: Pass data directly as the third parameter
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

  return {
    isActionInProgress,
    handleExportModule,
  };
}
