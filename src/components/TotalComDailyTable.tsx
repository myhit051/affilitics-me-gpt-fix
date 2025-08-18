import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ChevronUp, ChevronDown, Download, Calendar } from "lucide-react";
import { format } from "date-fns";

interface TotalComDailyTableProps {
  dailyMetrics: DailyData[];
}

interface DailyData {
  date: string;
  totalCom: number;
  adSpend: number;
  profit: number;
  roi: number;
}

type SortField = keyof DailyData;
type SortDirection = 'asc' | 'desc';

export default function TotalComDailyTable({
  dailyMetrics
}: TotalComDailyTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const itemsPerPage = 10;

  const parseNumber = (value: string | number | undefined): number => {
    if (value === undefined) return 0;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatCurrency = (value: number) => {
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Total Com', 'Ad Spend', 'Profit', 'ROI (%)'];
    const csvContent = [
      headers.join(','),
      ...sortedData.map(item => [
        item.date,
        item.totalCom,
        item.adSpend,
        item.profit,
        item.roi.toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `total_com_daily_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Use the pre-calculated daily metrics
  const dailyData = dailyMetrics;

  const sortedData = useMemo(() => {
    return [...dailyData].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [dailyData, sortField, sortDirection]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-white transition-colors"
    >
      {children}
      {sortField === field && (
        sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      )}
    </button>
  );

  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              📊 Total Com Daily
            </CardTitle>
            <div className="text-sm text-muted-foreground mt-2">
              แสดง {Math.min(itemsPerPage, sortedData.length - (currentPage - 1) * itemsPerPage)} จาก {sortedData.length} รายการ
              {totalPages > 1 && ` (หน้า ${currentPage} จาก ${totalPages})`}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30">
                <TableHead><SortButton field="date">Date</SortButton></TableHead>
                <TableHead><SortButton field="totalCom">Total Com</SortButton></TableHead>
                <TableHead><SortButton field="adSpend">Ad Spend</SortButton></TableHead>
                <TableHead><SortButton field="profit">Profit</SortButton></TableHead>
                <TableHead><SortButton field="roi">ROI (%)</SortButton></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item, index) => (
                <TableRow key={index} className="hover:bg-secondary/20">
                  <TableCell className="font-medium">
                    {format(new Date(item.date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-green-400 font-medium">
                    {formatCurrency(item.totalCom)}
                  </TableCell>
                  <TableCell className="text-red-400 font-medium">
                    {formatCurrency(item.adSpend)}
                  </TableCell>
                  <TableCell className={`font-medium ${item.profit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    {formatCurrency(item.profit)}
                  </TableCell>
                  <TableCell className={`font-medium ${item.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {item.roi.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}