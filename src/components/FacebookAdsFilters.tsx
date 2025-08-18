import { useState } from "react";
import { Calendar, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface FacebookAdsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onClearFilters: () => void;
}

const FacebookAdsFilters = ({
  searchTerm,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  onClearFilters,
}: FacebookAdsFiltersProps) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const formatDateRange = () => {
    if (!dateRange.from) return "เลือกช่วงวันที่";
    if (!dateRange.to) return format(dateRange.from, "dd MMM yyyy", { locale: th });
    return `${format(dateRange.from, "dd MMM yyyy", { locale: th })} - ${format(dateRange.to, "dd MMM yyyy", { locale: th })}`;
  };

  const hasActiveFilters = searchTerm || dateRange.from || dateRange.to;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="ค้นหาชื่อแคมเปญ, ชื่อโฆษณา..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Date Range Picker */}
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto justify-start text-left font-normal"
              >
                <Calendar className="mr-2 h-4 w-4" />
                {formatDateRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-4">
                <div className="space-y-4">
                  {/* Quick Date Presets */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        onDateRangeChange({ from: today, to: today });
                      }}
                    >
                      วันนี้
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        onDateRangeChange({ from: yesterday, to: yesterday });
                      }}
                    >
                      เมื่อวาน
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const lastWeek = new Date(today);
                        lastWeek.setDate(lastWeek.getDate() - 7);
                        onDateRangeChange({ from: lastWeek, to: today });
                      }}
                    >
                      7 วันที่แล้ว
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const today = new Date();
                        const lastMonth = new Date(today);
                        lastMonth.setDate(lastMonth.getDate() - 30);
                        onDateRangeChange({ from: lastMonth, to: today });
                      }}
                    >
                      30 วันที่แล้ว
                    </Button>
                  </div>

                  {/* Calendar */}
                  <CalendarComponent
                    mode="range"
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to,
                    }}
                    onSelect={(range) => {
                      if (range) {
                        onDateRangeChange({
                          from: range.from,
                          to: range.to,
                        });
                      }
                    }}
                    numberOfMonths={2}
                    className="rounded-md border"
                  />

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onDateRangeChange({ from: undefined, to: undefined });
                      }}
                    >
                      ล้างวันที่
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setIsDatePickerOpen(false)}
                    >
                      ตกลง
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Clear All Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              ล้างตัวกรอง
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-4">
            {searchTerm && (
              <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-md text-sm">
                <Search className="h-3 w-3" />
                ค้นหา: "{searchTerm}"
                <button
                  onClick={() => onSearchChange("")}
                  className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {(dateRange.from || dateRange.to) && (
              <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-md text-sm">
                <Calendar className="h-3 w-3" />
                วันที่: {formatDateRange()}
                <button
                  onClick={() => onDateRangeChange({ from: undefined, to: undefined })}
                  className="ml-1 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FacebookAdsFilters;