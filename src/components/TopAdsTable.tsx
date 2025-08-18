
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
import { ChevronUp, ChevronDown, Download } from "lucide-react";

interface TopAdsTableProps {
  facebookAds: any[];
  selectedSubIds?: string[];
  selectedChannels?: string[];
  selectedPlatform?: string;
  dateRange?: any;
}

interface AdData {
  adName: string;
  adSpend: number;
  linkClick: number;
  reach: number;
  cpc: number;
  previewLink: string;
}

type SortField = keyof AdData;
type SortDirection = 'asc' | 'desc';

export default function TopAdsTable({ 
  facebookAds,
  selectedSubIds = [],
  selectedChannels = [],
  selectedPlatform = "all",
  dateRange
}: TopAdsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('adSpend');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const itemsPerPage = 10;

  const parseNumber = (value: string | number | undefined): number => {
    if (value === undefined) return 0;
    if (typeof value === 'number') return value;
    const parsed = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatCurrency = (value: number) => {
    // Round to 2 decimal places and format with commas
    const rounded = Math.round(value * 100) / 100;
    return rounded.toLocaleString('en-US', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    });
  };

  const exportToCSV = () => {
    const headers = ['Ad Name', 'Ad Spend (THB)', 'Link Clicks', 'Reach', 'CPC', 'Preview Link'];
    const csvContent = [
      headers.join(','),
      ...sortedData.map(ad => [
        `"${ad.adName}"`,
        ad.adSpend,
        ad.linkClick,
        ad.reach,
        ad.cpc.toFixed(2),
        `"${ad.previewLink}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `top_ads_spend_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const adData = useMemo(() => {
    // Apply filters to data first
    let filteredFacebookAds = facebookAds;

    // Filter by Sub IDs
    if (selectedSubIds.length > 0) {
      filteredFacebookAds = filteredFacebookAds.filter(ad => 
        selectedSubIds.includes(ad['Sub ID'] || ad['SubID'] || '')
      );
    }

    // Filter by Date Range
    if (dateRange?.from && dateRange?.to) {
      const startDate = new Date(dateRange.from);
      const endDate = new Date(dateRange.to);
      
      filteredFacebookAds = filteredFacebookAds.filter(ad => {
        const adDate = new Date(ad['Day'] || ad['Date']);
        return adDate >= startDate && adDate <= endDate;
      });
    }

    const adMap: { [key: string]: AdData } = {};

    filteredFacebookAds.forEach(ad => {
      const adName = ad['Ad name'] || 'Unknown Ad';
      const adSpend = parseNumber(ad['Amount spent (THB)']);
      const linkClick = parseNumber(ad['Link clicks']);
      const reach = parseNumber(ad['Reach']);
      const previewLink = ad['Preview link'] || ad['Link'] || '';
      
      if (!adMap[adName]) {
        adMap[adName] = {
          adName,
          adSpend: 0,
          linkClick: 0,
          reach: 0,
          cpc: 0,
          previewLink: previewLink,
        };
      }
      
      adMap[adName].adSpend += adSpend;
      adMap[adName].linkClick += linkClick;
      adMap[adName].reach += reach;
      // Keep the first preview link found
      if (!adMap[adName].previewLink && previewLink) {
        adMap[adName].previewLink = previewLink;
      }
    });

    // Calculate CPC for each ad
    Object.values(adMap).forEach(ad => {
      ad.cpc = ad.linkClick > 0 ? ad.adSpend / ad.linkClick : 0;
    });

    return Object.values(adMap);
  }, [facebookAds]);

  const sortedData = useMemo(() => {
    return [...adData].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [adData, sortField, sortDirection]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage]);

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
    <Button
      variant="ghost"
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          sortDirection === 'asc' ? 
            <ChevronUp className="h-4 w-4" /> : 
            <ChevronDown className="h-4 w-4" />
        )}
      </div>
    </Button>
  );

  return (
    <Card className="glass-panel border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-600/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            📢 Top ADS Spend
          </CardTitle>
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
                <TableHead><SortButton field="adName">Ad Name</SortButton></TableHead>
                <TableHead><SortButton field="adSpend">Ad Spend</SortButton></TableHead>
                <TableHead><SortButton field="linkClick">Link Click</SortButton></TableHead>
                <TableHead><SortButton field="reach">Reach</SortButton></TableHead>
                <TableHead><SortButton field="cpc">CPC</SortButton></TableHead>
                <TableHead>Preview Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item, index) => (
                <TableRow key={index} className="hover:bg-secondary/20">
                  <TableCell className="font-medium max-w-xs truncate" title={item.adName}>
                    {item.adName}
                  </TableCell>
                  <TableCell className="text-red-400 font-medium">
                    {formatCurrency(item.adSpend)}
                  </TableCell>
                  <TableCell className="text-blue-400 font-medium">
                    {item.linkClick.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-green-400 font-medium">
                    {item.reach.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-yellow-400 font-medium">
                    {formatCurrency(item.cpc)}
                  </TableCell>
                  <TableCell>
                    {item.previewLink ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(item.previewLink, '_blank')}
                        className="text-xs px-2 py-1 h-7"
                      >
                        🔗 Preview
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-xs">No link</span>
                    )}
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
                
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNumber: number;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNumber)}
                        isActive={currentPage === pageNumber}
                        className="cursor-pointer"
                      >
                        {pageNumber}
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
