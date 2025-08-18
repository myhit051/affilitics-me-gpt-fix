
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [settings, setSettings] = useState({
    autoRefresh: false,
    notifications: true,
    darkMode: false,
    currency: 'THB',
    timezone: 'Asia/Bangkok',
    dataRetention: 30
  });
  
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "บันทึกการตั้งค่าสำเร็จ",
      description: "การตั้งค่าทั้งหมดได้รับการบันทึกแล้ว",
    });
  };

  const handleReset = () => {
    setSettings({
      autoRefresh: false,
      notifications: true,
      darkMode: false,
      currency: 'THB',
      timezone: 'Asia/Bangkok',
      dataRetention: 30
    });
    toast({
      title: "รีเซ็ตการตั้งค่า",
      description: "การตั้งค่าทั้งหมดถูกรีเซ็ตเป็นค่าเริ่มต้นแล้ว",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">⚙️ Settings</h1>
          <p className="text-muted-foreground">จัดการการตั้งค่าระบบและการแสดงผล</p>
        </div>
        <Badge variant="outline">v1.0.0</Badge>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔧 การตั้งค่าทั่วไป</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">รีเฟรชอัตโนมัติ</Label>
              <p className="text-sm text-muted-foreground">อัปเดตข้อมูลอัตโนมัติทุก 5 นาที</p>
            </div>
            <Switch
              checked={settings.autoRefresh}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoRefresh: checked }))}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">การแจ้งเตือน</Label>
              <p className="text-sm text-muted-foreground">รับการแจ้งเตือนเมื่อมีข้อมูลใหม่</p>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifications: checked }))}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="currency">สกุลเงิน</Label>
            <Input
              id="currency"
              value={settings.currency}
              onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
              placeholder="THB"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">เขตเวลา</Label>
            <Input
              id="timezone"
              value={settings.timezone}
              onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
              placeholder="Asia/Bangkok"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">💾 การจัดการข้อมูล</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="retention">ระยะเวลาเก็บข้อมูล (วัน)</Label>
            <Input
              id="retention"
              type="number"
              value={settings.dataRetention}
              onChange={(e) => setSettings(prev => ({ ...prev, dataRetention: parseInt(e.target.value) }))}
              placeholder="30"
            />
            <p className="text-sm text-muted-foreground">
              ข้อมูลจะถูกลบออกจากระบบหลังจากระยะเวลาที่กำหนด
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-medium">🗂️ จัดการไฟล์ที่นำเข้า</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="w-full">
                📤 Export ข้อมูล
              </Button>
              <Button variant="outline" className="w-full">
                🗑️ ลบข้อมูลเก่า
              </Button>
              <Button variant="outline" className="w-full">
                📊 สำรองข้อมูล
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔗 การเชื่อมต่อ API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="shopee-api">Shopee API Key</Label>
            <Input
              id="shopee-api"
              type="password"
              placeholder="ใส่ API Key ของ Shopee"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lazada-api">Lazada API Key</Label>
            <Input
              id="lazada-api"
              type="password"
              placeholder="ใส่ API Key ของ Lazada"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook-token">Facebook Access Token</Label>
            <Input
              id="facebook-token"
              type="password"
              placeholder="ใส่ Access Token ของ Facebook"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6">
        <Button variant="outline" onClick={handleReset}>
          🔄 รีเซ็ต
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            ❌ ยกเลิก
          </Button>
          <Button onClick={handleSave}>
            💾 บันทึก
          </Button>
        </div>
      </div>
    </div>
  );
}
