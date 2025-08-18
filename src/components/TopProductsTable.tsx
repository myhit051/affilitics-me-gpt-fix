import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface TopProductsTableProps {
  shopeeOrders: any[];
  lazadaOrders: any[];
  selectedSubIds?: string[];
  selectedChannels?: string[];
  selectedPlatform?: string;
  dateRange?: any;
}

interface ProductData {
  products: string;
  totalCom: number;
  totalOrder: number;
  amount: number;
  platform: string;
}

type SortField = keyof ProductData;
type SortDirection = 'asc' | 'desc';

export default function TopProductsTable({ 
  shopeeOrders, 
  lazadaOrders, 
  selectedSubIds = [], 
  selectedChannels = [],
  selectedPlatform = "all",
  dateRange
}: TopProductsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('totalCom');
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
    const headers = ['Product', 'Total Com', 'Total Orders', 'Amount', 'Platform'];
    const csvContent = [
      headers.join(','),
      ...sortedData.map(product => [
        `"${product.products}"`,
        product.totalCom,
        product.totalOrder,
        product.amount,
        product.platform
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `top_products_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter orders based on all filters
  const filteredShopeeOrders = useMemo(() => {
    let filtered = shopeeOrders;
    
    // Filter by Sub IDs
    if (selectedSubIds.length > 0) {
      filtered = filtered.filter(order => {
        const orderSubIds = [
          order['Sub_id1'], order['Sub_id2'], order['Sub_id3'],
          order['Sub_id4'], order['Sub_id5']
        ].filter(Boolean);
        return orderSubIds.some(subId => selectedSubIds.includes(subId));
      });
    }
    
    // Filter by Channels
    if (selectedChannels.length > 0) {
      filtered = filtered.filter(order => 
        selectedChannels.includes(order['ช่องทาง'] || order['Channel'] || '')
      );
    }
    
    // Filter by Date Range
    if (dateRange?.from && dateRange?.to) {
      const startDate = new Date(dateRange.from);
      const endDate = new Date(dateRange.to);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order['เวลาที่สั่งซื้อ']);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }
    
    return filtered;
  }, [shopeeOrders, selectedSubIds, selectedChannels, dateRange]);

  const filteredLazadaOrders = useMemo(() => {
    let filtered = lazadaOrders;
    
    // Filter by Sub IDs
    if (selectedSubIds.length > 0) {
      filtered = filtered.filter(order => {
        const orderSubIds = [
          order['Aff Sub ID'], order['Sub ID 1'], order['Sub ID 2'],
          order['Sub ID 3'], order['Sub ID 4']
        ].filter(Boolean);
        return orderSubIds.some(subId => selectedSubIds.includes(subId));
      });
    }
    
    // Filter by Date Range
    if (dateRange?.from && dateRange?.to) {
      const startDate = new Date(dateRange.from);
      const endDate = new Date(dateRange.to);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order['Conversion Time'] || order['Order Time']);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }
    
    return filtered;
  }, [lazadaOrders, selectedSubIds, dateRange]);

  const productData = useMemo(() => {
    const productMap: { [key: string]: ProductData } = {};

    // Process Shopee orders if platform allows
    if (selectedPlatform === "all" || selectedPlatform === "Shopee") {
      // เตรียม map สำหรับเก็บ order id ที่ไม่ซ้ำต่อสินค้า
      const productOrderSet: { [key: string]: Set<string> } = {};
      filteredShopeeOrders.forEach(order => {
        const productName = order['ชื่อรายการสินค้า'] || 'Unknown Product';
        const commission = parseNumber(order['คอมมิชชั่นสินค้าโดยรวม(฿)']);
        const amount = parseNumber(order['มูลค่าซื้อ(฿)']);
        const orderId = order['เลขที่คำสั่งซื้อ'];
        const key = `${productName}_Shopee`;
        if (!productMap[key]) {
          productMap[key] = {
            products: productName,
            totalCom: 0,
            totalOrder: 0,
            amount: 0,
            platform: 'Shopee'
          };
        }
        productMap[key].totalCom += commission;
        productMap[key].amount += amount;
        // นับ order เฉพาะ order id ที่ไม่ซ้ำ
        if (!productOrderSet[key]) productOrderSet[key] = new Set();
        productOrderSet[key].add(orderId);
      });
      // สรุปจำนวน order ต่อสินค้า
      Object.keys(productOrderSet).forEach(key => {
        productMap[key].totalOrder = productOrderSet[key].size;
      });
    }

    // Process Lazada orders if platform allows
    if (selectedPlatform === "all" || selectedPlatform === "Lazada") {
      filteredLazadaOrders.forEach(order => {
        const productName = order['Product Name'] || 'Unknown Product';
        const commission = parseNumber(order['Payout']);
        const amount = parseNumber(order['Order Amount']);
        
        const key = `${productName}_Lazada`;
        if (!productMap[key]) {
          productMap[key] = {
            products: productName,
            totalCom: 0,
            totalOrder: 0,
            amount: 0,
            platform: 'Lazada'
          };
        }
        productMap[key].totalCom += commission;
        productMap[key].totalOrder += 1;
        productMap[key].amount += amount;
      });
    }

    return Object.values(productMap);
  }, [filteredShopeeOrders, filteredLazadaOrders, selectedPlatform]);

  const sortedData = useMemo(() => {
    return [...productData].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [productData, sortField, sortDirection]);

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
      setSortDirection(field === 'totalCom' ? 'desc' : 'asc');
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

  const getPlatformBadge = (platform: string) => {
    const colors = {
      'Shopee': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'Lazada': 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };
    return colors[platform as keyof typeof colors] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            🏆 Top Products
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
                <TableHead><SortButton field="products">Products</SortButton></TableHead>
                <TableHead><SortButton field="totalCom">Total Com</SortButton></TableHead>
                <TableHead><SortButton field="totalOrder">Total Order</SortButton></TableHead>
                <TableHead><SortButton field="amount">Amount</SortButton></TableHead>
                <TableHead><SortButton field="platform">Platform</SortButton></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item, index) => (
                <TableRow key={index} className="hover:bg-secondary/20">
                  <TableCell className="font-medium max-w-xs truncate" title={item.products}>
                    {item.products}
                  </TableCell>
                  <TableCell className="text-green-400 font-medium">
                    {formatCurrency(item.totalCom)}
                  </TableCell>
                  <TableCell className="text-orange-400 font-medium">
                    {item.totalOrder.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-blue-400 font-medium">
                    {formatCurrency(item.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${getPlatformBadge(item.platform)}`}>
                      {item.platform}
                    </Badge>
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
