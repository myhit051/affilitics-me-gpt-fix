
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlatformFilterProps {
  selectedPlatform: string;
  onPlatformChange: (platform: string) => void;
}

export default function PlatformFilter({ selectedPlatform, onPlatformChange }: PlatformFilterProps) {
  return (
    <Select value={selectedPlatform} onValueChange={onPlatformChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="🏪 Platform" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Platforms</SelectItem>
        <SelectItem value="Shopee">🛒 Shopee</SelectItem>
        <SelectItem value="Lazada">🛍️ Lazada</SelectItem>
        <SelectItem value="Facebook">📘 Facebook</SelectItem>
      </SelectContent>
    </Select>
  );
}
