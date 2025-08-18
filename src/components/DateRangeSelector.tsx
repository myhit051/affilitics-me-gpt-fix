
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { subDays, startOfDay } from "date-fns";

interface DateRangeSelectorProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (dateRange: DateRange | undefined) => void;
}

export default function DateRangeSelector({ dateRange, onDateRangeChange }: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(dateRange);
  const [isSelectingRange, setIsSelectingRange] = useState(false);

  const formatDate = (date?: Date) => {
    return date?.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) || "";
  };

  const handlePresetSelect = (preset: string) => {
    const today = startOfDay(new Date());
    let range: DateRange | undefined;

    switch (preset) {
      case "today":
        range = { from: today, to: today };
        break;
      case "yesterday":
        const yesterday = subDays(today, 1);
        range = { from: yesterday, to: yesterday };
        break;
      case "7days":
        range = { from: subDays(today, 6), to: today };
        break;
      case "30days":
        range = { from: subDays(today, 29), to: today };
        break;
      default:
        range = undefined;
    }

    setTempDateRange(range);
    onDateRangeChange(range);
    setIsSelectingRange(false);
    setIsOpen(false);
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      // If we're in the middle of selecting a range and user clicks the same date again,
      // complete the range with the same date (single day range)
      if (isSelectingRange && tempDateRange?.from) {
        const finalRange = { from: tempDateRange.from, to: tempDateRange.from };
        setTempDateRange(finalRange);
        onDateRangeChange(finalRange);
        setIsSelectingRange(false);
        setIsOpen(false);
      } else {
        // No date selected, reset
        setTempDateRange(undefined);
        setIsSelectingRange(false);
      }
      return;
    }

    if (!isSelectingRange || !tempDateRange?.from) {
      // First click - set start date only
      setTempDateRange({ from: selectedDate, to: undefined });
      setIsSelectingRange(true);
    } else {
      // Second click - set end date
      const startDate = tempDateRange.from;
      const endDate = selectedDate;
      
      // Allow same date selection (single day range)
      // Ensure start date is before or equal to end date
      const finalRange = startDate <= endDate 
        ? { from: startDate, to: endDate }
        : { from: endDate, to: startDate };
      
      setTempDateRange(finalRange);
      onDateRangeChange(finalRange);
      setIsSelectingRange(false);
      setIsOpen(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Reset temp range and selection state when opening
      setTempDateRange(undefined);
      setIsSelectingRange(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={
            "w-[300px] justify-start text-left font-normal" +
            (dateRange?.from ? " pl-3.5" : "")
          }
        >
          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
          {dateRange?.from ? (
            formatDate(dateRange.from) + " - " + formatDate(dateRange.to)
          ) : (
            <span>📅 เลือกช่วงวันที่</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetSelect("today")}
            >
              วันนี้
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetSelect("yesterday")}
            >
              เมื่อวาน
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetSelect("7days")}
            >
              7 วันล่าสุด
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePresetSelect("30days")}
            >
              30 วันล่าสุด
            </Button>
          </div>
        </div>
        <Calendar
          mode="single"
          defaultMonth={tempDateRange?.from || dateRange?.from}
          selected={tempDateRange?.from}
          onSelect={handleDateSelect}
          numberOfMonths={2}
          className="pointer-events-auto"
        />
        {isSelectingRange && tempDateRange?.from && (
          <div className="p-3 border-t text-sm text-muted-foreground text-center">
            เลือกวันสิ้นสุดเพื่อยืนยันช่วงวันที่ (เริ่มต้น: {formatDate(tempDateRange.from)})
            <br />
            <span className="text-xs">💡 เลือกวันเดียวกันได้หากต้องการดูข้อมูลเฉพาะวันนั้น</span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
