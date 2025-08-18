
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ChevronDown } from "lucide-react";

interface ChannelFilterProps {
  shopeeOrders: any[];
  selectedChannels: string[];
  onChannelChange: (channels: string[]) => void;
}

export default function ChannelFilter({ shopeeOrders, selectedChannels, onChannelChange }: ChannelFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get unique channels from Shopee orders "ช่องทาง" column only
  const channels = Array.from(new Set(
    shopeeOrders
      .map(order => {
        const channel = order['ช่องทาง'];
        return channel;
      })
      .filter(channel => {
        // Only include valid string channels
        if (!channel || typeof channel !== 'string') return false;
        const trimmed = channel.trim();
        // Filter out empty strings
        if (trimmed.length === 0) return false;
        return true; // Accept all non-empty string values from the actual data
      })
      .map(channel => channel.trim()) // Trim whitespace
  ));

  // Count occurrences of each channel
  const channelCounts = shopeeOrders.reduce((acc, order) => {
    const channel = order['ช่องทาง'];
    if (channel && typeof channel === 'string' && channel.trim()) {
      const trimmed = channel.trim();
      acc[trimmed] = (acc[trimmed] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Sort channels by count (descending) then by name (ascending)
  const sortedChannels = channels.sort((a, b) => {
    const countA = channelCounts[a] || 0;
    const countB = channelCounts[b] || 0;
    
    // First sort by count (descending)
    if (countB !== countA) {
      return countB - countA;
    }
    
    // If counts are equal, sort by name (ascending)
    return a.localeCompare(b);
  });

  console.log('Channel distribution:', channelCounts);
  console.log('Channels sorted by count:', sortedChannels);

  const handleChannelToggle = (channel: string) => {
    if (selectedChannels.includes(channel)) {
      onChannelChange(selectedChannels.filter(c => c !== channel));
    } else {
      onChannelChange([...selectedChannels, channel]);
    }
  };

  const handleSelectAll = () => {
    if (selectedChannels.length === sortedChannels.length) {
      onChannelChange([]);
    } else {
      onChannelChange(sortedChannels);
    }
  };

  const getDisplayText = () => {
    if (selectedChannels.length === 0) {
      return "🛒 ช่องทาง (Shopee)";
    }
    if (selectedChannels.length === 1) {
      return `ช่องทาง (Shopee): ${selectedChannels[0]}`;
    }
      return `ช่องทาง (Shopee): ${selectedChannels.length} รายการ`;
  };

  // Don't render if no channels available
  if (channels.length === 0) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="min-w-[180px] justify-between">
          {getDisplayText()}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">ช่องทาง (เฉพาะ Shopee)</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs"
            >
              {selectedChannels.length === sortedChannels.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
            </Button>
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-2">
            {sortedChannels.map((channel) => (
              <div key={channel} className="flex items-center space-x-2">
                <Checkbox
                  id={channel}
                  checked={selectedChannels.includes(channel)}
                  onCheckedChange={() => handleChannelToggle(channel)}
                />
                <label
                  htmlFor={channel}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 flex items-center justify-between"
                >
                  <span>{channel}</span>
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                    {channelCounts[channel] || 0}
                  </span>
                </label>
              </div>
            ))}
          </div>
          
          {selectedChannels.length > 0 && (
            <div className="border-t pt-3">
              <div className="text-xs text-muted-foreground mb-2">รายการที่เลือก:</div>
              <div className="flex flex-wrap gap-1">
                {selectedChannels.map((channel) => (
                  <Badge key={channel} variant="secondary" className="text-xs">
                    {channel}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
