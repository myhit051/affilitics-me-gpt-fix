
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronDown, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface SubIdFilterProps {
  shopeeOrders: any[];
  lazadaOrders: any[];
  facebookAds?: any[];
  selectedSubIds: string[];
  onSubIdChange: (subIds: string[]) => void;
}

export default function SubIdFilter({ 
  shopeeOrders, 
  lazadaOrders, 
  facebookAds = [],
  selectedSubIds, 
  onSubIdChange 
}: SubIdFilterProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const allSubIds = useMemo(() => {
    const subIdCounts = new Map<string, number>();
    
    // Extract SubIDs from Shopee orders - only from specified columns
    shopeeOrders.forEach(order => {
      [order['Sub_id1'], order['Sub_id2'], order['Sub_id3'], order['Sub_id4'], order['Sub_id5']]
        .filter(subId => {
          if (!subId || typeof subId !== 'string') return false;
          const trimmed = subId.trim();
          // Filter out empty strings
          if (trimmed.length === 0) return false;
          return true; // Accept all non-empty string values from the actual data
        })
        .forEach(subId => {
          const trimmed = subId.trim();
          subIdCounts.set(trimmed, (subIdCounts.get(trimmed) || 0) + 1);
        });
    });
    
    // Extract SubIDs from Lazada orders - only from specified columns
    lazadaOrders.forEach(order => {
      [
        order['Aff Sub ID'], 
        order['Sub ID 1'], 
        order['Sub ID 2'], 
        order['Sub ID 3'], 
        order['Sub ID 4'], 
        order['Sub ID 5'], 
        order['Sub ID 6']
      ]
        .filter(subId => {
          if (!subId || typeof subId !== 'string') return false;
          const trimmed = subId.trim();
          // Filter out empty strings
          if (trimmed.length === 0) return false;
          return true; // Accept all non-empty string values from the actual data
        })
        .forEach(subId => {
          const trimmed = subId.trim();
          subIdCounts.set(trimmed, (subIdCounts.get(trimmed) || 0) + 1);
        });
    });
    
    // Sort Sub IDs by count (descending) then by name (ascending)
    const sortedSubIds = Array.from(subIdCounts.keys()).sort((a, b) => {
      const countA = subIdCounts.get(a) || 0;
      const countB = subIdCounts.get(b) || 0;
      
      // First sort by count (descending)
      if (countB !== countA) {
        return countB - countA;
      }
      
      // If counts are equal, sort by name (ascending)
      return a.localeCompare(b);
    });
    
    console.log('Sub ID distribution:', Object.fromEntries(subIdCounts));
    console.log('Sub IDs sorted by count:', sortedSubIds);
    
    return { sortedSubIds, subIdCounts };
  }, [shopeeOrders, lazadaOrders]);

  const filteredSubIds = useMemo(() => {
    if (!searchTerm) return allSubIds.sortedSubIds;
    return allSubIds.sortedSubIds.filter(subId => 
      subId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allSubIds, searchTerm]);

  const handleSubIdToggle = (subId: string) => {
    const newSelection = selectedSubIds.includes(subId)
      ? selectedSubIds.filter(id => id !== subId)
      : [...selectedSubIds, subId];
    onSubIdChange(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedSubIds.length === allSubIds.sortedSubIds.length) {
      onSubIdChange([]);
    } else {
      onSubIdChange(allSubIds.sortedSubIds);
    }
  };

  const handleClearAll = () => {
    onSubIdChange([]);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-between min-w-[200px]">
            {selectedSubIds.length === 0 
              ? "🎯 เลือก Sub ID" 
              : selectedSubIds.length === 1 
              ? selectedSubIds[0]
              : `${selectedSubIds.length} Sub IDs`
            }
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3 border-b">
            <Input
              placeholder="ค้นหา Sub ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
            <div className="flex items-center gap-2 mb-2">
              <Checkbox
                id="select-all"
                checked={selectedSubIds.length === allSubIds.sortedSubIds.length}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                เลือกทั้งหมด ({allSubIds.sortedSubIds.length})
              </label>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                เลือกทั้งหมด
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClearAll}>
                ล้างทั้งหมด
              </Button>
            </div>
          </div>
          <div className="max-h-60 overflow-auto">
            {filteredSubIds.length > 0 ? (
              filteredSubIds.map((subId) => (
                <div
                  key={subId}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 cursor-pointer hover:bg-accent",
                    selectedSubIds.includes(subId) && "bg-accent"
                  )}
                  onClick={() => handleSubIdToggle(subId)}
                >
                  <div className={cn(
                    "flex h-4 w-4 items-center justify-center rounded border",
                    selectedSubIds.includes(subId) && "bg-primary border-primary"
                  )}>
                    {selectedSubIds.includes(subId) && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <span className="text-sm flex items-center justify-between flex-1">
                    <span>{subId}</span>
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded ml-2">
                      {allSubIds.subIdCounts.get(subId) || 0}
                    </span>
                  </span>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-sm text-muted-foreground">
                ไม่พบ Sub ID ที่ตรงกับการค้นหา
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      
      {selectedSubIds.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedSubIds.slice(0, 3).map((subId) => (
            <Badge key={subId} variant="secondary" className="text-xs">
              {subId}
              <X 
                className="ml-1 h-3 w-3 cursor-pointer" 
                onClick={() => handleSubIdToggle(subId)}
              />
            </Badge>
          ))}
          {selectedSubIds.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{selectedSubIds.length - 3} เพิ่มเติม
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
