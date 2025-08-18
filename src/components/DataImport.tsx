
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, AlertCircle, CheckCircle, History, X, Database, Sparkles, Link, Unlink, RefreshCw, Settings } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import * as XLSX from 'xlsx';
import { getFacebookOAuthService } from "@/lib/facebook-oauth-service";
import { getFacebookAPIService } from "@/lib/facebook-api-service";
import { FacebookConnectionState, FacebookAdAccount } from "@/types/facebook";
import { SyncProgress } from "@/lib/facebook-api-service";

interface DataImportProps {
  onDataImported: (data: any) => void;
  onNavigateToDashboard?: () => void;
  storedData?: {
    shopee: StoredData | null;
    lazada: StoredData | null;
    facebook: StoredData | null;
  };
  onStoredDataUpdate?: (data: {
    shopee: StoredData | null;
    lazada: StoredData | null;
    facebook: StoredData | null;
  }) => void;
  facebookConnection?: FacebookConnectionState;
  onFacebookConnectionChange?: (state: FacebookConnectionState) => void;
}

interface ImportedFile {
  name: string;
  type: 'shopee' | 'lazada' | 'facebook';
  timestamp: Date;
  size: number;
}

interface StoredData {
  data: any[];
  fileName: string;
  timestamp: Date;
  size: number;
  rowCount: number;
}

export default function DataImport({ 
  onDataImported, 
  onNavigateToDashboard, 
  storedData: propStoredData, 
  onStoredDataUpdate,
  facebookConnection,
  onFacebookConnectionChange 
}: DataImportProps) {
  const [files, setFiles] = useState<{
    shopee: File | null;
    lazada: File | null;
    facebook: File | null;
  }>({
    shopee: null,
    lazada: null,
    facebook: null,
  });
  
  // Use stored data from props or default empty state
  const storedData = propStoredData || {
    shopee: null,
    lazada: null,
    facebook: null,
  };
  
  const setStoredData = (updater: any) => {
    if (onStoredDataUpdate) {
      const newData = typeof updater === 'function' ? updater(storedData) : updater;
      onStoredDataUpdate(newData);
    }
  };
  
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentProcessing, setCurrentProcessing] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [fileHistory, setFileHistory] = useState<ImportedFile[]>([]);

  // Facebook API connection state
  const [facebookConnecting, setFacebookConnecting] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [facebookError, setFacebookError] = useState<string>('');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncError, setSyncError] = useState<string>('');
  
  // Initialize Facebook services
  const facebookOAuthService = getFacebookOAuthService();
  const facebookAPIService = getFacebookAPIService();

  // Initialize selected accounts when connection changes
  useEffect(() => {
    if (facebookConnection?.isConnected && facebookConnection.connectedAccounts.length > 0) {
      // Auto-select all accounts by default when first connected
      if (selectedAccounts.length === 0) {
        setSelectedAccounts(facebookConnection.connectedAccounts.map(account => account.id));
      }
    } else {
      // Clear selection when disconnected
      setSelectedAccounts([]);
    }
  }, [facebookConnection?.isConnected, facebookConnection?.connectedAccounts]);

  const parseCSV = (text: string): any[] => {
    try {
      const lines = text.split('\n');
      if (lines.length < 2) {
        throw new Error('ไฟล์ CSV ต้องมีอย่างน้อย 2 บรรทัด (header + data)');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      if (headers.length === 0) {
        throw new Error('ไม่พบ header ในไฟล์ CSV');
      }

      const data = [];
      let processedRows = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        try {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: any = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          data.push(row);
          processedRows++;
          
          // Yield control periodically for large files
          if (processedRows % 5000 === 0) {
            // This allows the UI to remain responsive
            console.log(`Processed ${processedRows} CSV rows...`);
          }
        } catch (rowError) {
          console.warn(`Skipping invalid CSV row ${i}:`, rowError);
        }
      }
      
      if (data.length === 0) {
        throw new Error('ไม่พบข้อมูลที่ถูกต้องในไฟล์ CSV');
      }
      
      return data;
    } catch (error) {
      console.error('CSV parsing error:', error);
      throw error instanceof Error ? error : new Error('เกิดข้อผิดพลาดในการอ่านไฟล์ CSV');
    }
  };

  const parseExcel = (buffer: ArrayBuffer): any[] => {
    try {
      console.log('Parsing Excel file...');
      
      const workbook = XLSX.read(buffer, { 
        type: 'array',
        cellDates: true,
        cellNF: false,
        cellText: false
      });
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('ไฟล์ Excel ไม่มี worksheet');
      }
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        throw new Error('ไม่สามารถอ่าน worksheet ได้');
      }
      
      console.log(`Processing Excel sheet: ${sheetName}`);
      
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: false
      });
      
      if (!Array.isArray(jsonData)) {
        throw new Error('ไม่สามารถแปลงข้อมูล Excel ได้');
      }
      
      if (jsonData.length < 2) {
        throw new Error('ไฟล์ Excel ต้องมีอย่างน้อย 2 บรรทัด (header + data)');
      }
      
      // Convert array of arrays to array of objects
      const headers = jsonData[0] as string[];
      const data = [];
      
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (!row || row.every(cell => !cell && cell !== 0)) continue; // Skip empty rows
        
        const rowObj: any = {};
        headers.forEach((header, index) => {
          rowObj[header] = row[index] !== undefined ? row[index] : '';
        });
        
        data.push(rowObj);
        
        // Yield control periodically for large files
        if (i % 5000 === 0) {
          console.log(`Processed ${i} Excel rows...`);
        }
      }
      
      if (data.length === 0) {
        throw new Error('ไม่พบข้อมูลที่ถูกต้องในไฟล์ Excel');
      }
      
      console.log(`Excel parsing completed: ${data.length} rows`);
      return data;
    } catch (error) {
      console.error('Excel parsing error:', error);
      throw error instanceof Error ? error : new Error('ไม่สามารถอ่านไฟล์ Excel ได้');
    }
  };

  const handleFileChange = (platform: 'shopee' | 'lazada' | 'facebook', file: File | null) => {
    setFiles(prev => ({ ...prev, [platform]: file }));
    setErrors([]);
    setSuccess(false);
  };

  // Delete stored data for a specific platform
  const handleDeleteData = (platform: 'shopee' | 'lazada' | 'facebook') => {
    const newStoredData = { ...storedData, [platform]: null };
    setStoredData(newStoredData);
    setFiles(prev => ({ ...prev, [platform]: null }));
    
    // Update the parent component with current data
    const updatedData = {
      shopeeOrders: platform === 'shopee' ? [] : (newStoredData.shopee?.data || []),
      lazadaOrders: platform === 'lazada' ? [] : (newStoredData.lazada?.data || []),
      facebookAds: platform === 'facebook' ? [] : (newStoredData.facebook?.data || []),
      totalRows: 0,
      errors: [],
    };
    
    // Calculate total rows
    updatedData.totalRows = updatedData.shopeeOrders.length + 
                            updatedData.lazadaOrders.length + 
                            updatedData.facebookAds.length;
    
    onDataImported(updatedData);
    console.log(`Deleted ${platform} data`);
  };

  // Clear all stored data
  const handleClearAllData = () => {
    const newStoredData = {
      shopee: null,
      lazada: null,
      facebook: null,
    };
    setStoredData(newStoredData);
    setFiles({
      shopee: null,
      lazada: null,
      facebook: null,
    });
    
    onDataImported({
      shopeeOrders: [],
      lazadaOrders: [],
      facebookAds: [],
      totalRows: 0,
      errors: [],
    });
    
    console.log('Cleared all data');
  };

  const processFile = async (file: File): Promise<any[]> => {
    // Check file size limit (50MB)
    const maxFileSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxFileSize) {
      throw new Error(`ไฟล์ใหญ่เกินไป (${formatFileSize(file.size)}). ขนาดสูงสุด 50MB`);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const result = e.target?.result;
          if (!result) {
            reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
            return;
          }

          let data: any[];
          
          // Add progress indication for large files
          if (file.size > 5 * 1024 * 1024) { // 5MB+
            console.log(`Processing large file: ${file.name} (${formatFileSize(file.size)})`);
          }
          
          if (file.name.endsWith('.csv')) {
            data = parseCSV(result as string);
          } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            data = parseExcel(result as ArrayBuffer);
          } else {
            reject(new Error('รองรับเฉพาะไฟล์ .csv และ .xlsx เท่านั้น'));
            return;
          }

          // Validate data
          if (!Array.isArray(data)) {
            reject(new Error('รูปแบบข้อมูลไม่ถูกต้อง'));
            return;
          }

          if (data.length === 0) {
            reject(new Error('ไฟล์ว่างเปล่า'));
            return;
          }

          // Limit rows for very large datasets (100k rows max)
          if (data.length > 100000) {
            console.warn(`Large dataset detected: ${data.length} rows. Limiting to 100,000 rows.`);
            data = data.slice(0, 100000);
          }

          console.log(`Parsed ${file.name}: ${data.length} rows`);
          
          // Small delay for large files to prevent blocking
          if (data.length > 10000) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          resolve(data);
        } catch (error) {
          console.error('Error processing file:', error);
          reject(error instanceof Error ? error : new Error('เกิดข้อผิดพลาดในการประมวลผลไฟล์'));
        }
      };

      reader.onerror = () => reject(new Error('เกิดข้อผิดพลาดในการอ่านไฟล์'));
      
      reader.onprogress = (e) => {
        if (e.lengthComputable && file.size > 10 * 1024 * 1024) { // 10MB+
          const percentLoaded = Math.round((e.loaded / e.total) * 100);
          console.log(`Reading ${file.name}: ${percentLoaded}%`);
        }
      };

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file, 'utf-8');
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const handleImport = async () => {
    if (!files.shopee && !files.lazada && !files.facebook) {
      setErrors(["กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์"]);
      return;
    }

    setUploading(true);
    setProgress(0);
    setErrors([]);
    setSuccess(false);

    try {
      // Start with existing data from stored data
      let shopeeOrders: any[] = storedData.shopee?.data || [];
      let lazadaOrders: any[] = storedData.lazada?.data || [];
      let facebookAds: any[] = storedData.facebook?.data || [];
      let totalRows = 0;
      const processingErrors: string[] = [];
      const newFileHistory: ImportedFile[] = [];

      // Count total files to process for accurate progress
      const filesToProcess = [
        files.shopee ? { file: files.shopee, type: 'shopee' as const } : null,
        files.lazada ? { file: files.lazada, type: 'lazada' as const } : null,
        files.facebook ? { file: files.facebook, type: 'facebook' as const } : null,
      ].filter(Boolean);

      const totalFiles = filesToProcess.length;
      let processedFiles = 0;

      // Process files sequentially to avoid memory overload
      for (const fileInfo of filesToProcess) {
        if (!fileInfo) continue;

        const { file, type } = fileInfo;
        const baseProgress = (processedFiles / totalFiles) * 100;
        const fileProgress = (1 / totalFiles) * 100;

        try {
          setProgress(baseProgress + fileProgress * 0.1); // Start processing
          setCurrentProcessing(`กำลังประมวลผล ${type.charAt(0).toUpperCase() + type.slice(1)}: ${file.name}`);
          
          console.log(`Processing ${type} file: ${file.name} (${formatFileSize(file.size)})`);
          
          // Add small delay to prevent UI blocking
          await new Promise(resolve => setTimeout(resolve, 100));
          
          setProgress(baseProgress + fileProgress * 0.5); // Mid processing
          
          const data = await processFile(file);
          
          if (!data || !Array.isArray(data) || data.length === 0) {
            throw new Error(`ไม่สามารถประมวลผลไฟล์ ${file.name} ได้ - ไฟล์อาจเสียหายหรือรูปแบบไม่ถูกต้อง`);
          }
          
          console.log(`Successfully processed ${type} file:`, data.length, 'rows');
          setProgress(baseProgress + fileProgress * 0.9); // Almost done
          
          // Store data based on type and update stored data
          // Only replace data for the platform being uploaded
          switch (type) {
            case 'shopee':
              shopeeOrders = data; // Replace only Shopee data
              setStoredData({
                ...storedData,
                shopee: {
                  data: data,
                  fileName: file.name,
                  timestamp: new Date(),
                  size: file.size,
                  rowCount: data.length
                }
              });
              console.log('Shopee data processed:', data.length, 'rows');
              break;
            case 'lazada':
              lazadaOrders = data; // Replace only Lazada data
              setStoredData({
                ...storedData,
                lazada: {
                  data: data,
                  fileName: file.name,
                  timestamp: new Date(),
                  size: file.size,
                  rowCount: data.length
                }
              });
              console.log('Lazada data processed:', data.length, 'rows');
              if (data.length > 0) {
                console.log('Lazada columns:', Object.keys(data[0]));
              }
              break;
            case 'facebook':
              facebookAds = data; // Replace only Facebook data
              setStoredData({
                ...storedData,
                facebook: {
                  data: data,
                  fileName: file.name,
                  timestamp: new Date(),
                  size: file.size,
                  rowCount: data.length
                }
              });
              console.log('Facebook data processed:', data.length, 'rows');
              break;
          }

          // totalRows will be calculated at the end with all merged data
          newFileHistory.push({
            name: file.name,
            type: type,
            timestamp: new Date(),
            size: file.size
          });

          processedFiles++;
          setProgress(baseProgress + fileProgress); // Complete this file
          
          // Force garbage collection hint
          if (window.gc) {
            window.gc();
          }
          
        } catch (error: any) {
          console.error(`Error processing ${type} file:`, error);
          const errorMessage = error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
          processingErrors.push(`${type.charAt(0).toUpperCase() + type.slice(1)}: ${errorMessage}`);
          
          // Continue processing other files even if one fails
          console.log(`Continuing with other files despite ${type} error`);
          processedFiles++;
        }

        // Small delay between files to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      setProgress(100);
      setCurrentProcessing('เสร็จสิ้นการประมวลผล');

      if (processingErrors.length > 0 && totalRows === 0) {
        setErrors(processingErrors);
        setCurrentProcessing('');
        return;
      }

      // Update file history
      setFileHistory(prev => [...newFileHistory, ...prev].slice(0, 10));

      // Use the current data arrays which now contain the merged data
      // (existing data + newly uploaded data for specific platforms)
      const finalTotalRows = shopeeOrders.length + lazadaOrders.length + facebookAds.length;

      const importedData = {
        shopeeOrders: shopeeOrders,
        lazadaOrders: lazadaOrders,
        facebookAds: facebookAds,
        totalRows: finalTotalRows,
        errors: processingErrors,
      };

      console.log('Data import completed:', {
        shopee: shopeeOrders.length,
        lazada: lazadaOrders.length,
        facebook: facebookAds.length,
        totalRows: finalTotalRows,
        processingErrors: processingErrors.length
      });

      console.log('Sending data to parent:', importedData);

      // Small delay before calling onDataImported to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 200));
      
      onDataImported(importedData);
      setSuccess(true);

    } catch (error: any) {
      console.error('Import error:', error);
      setErrors([error.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล']);
    } finally {
      setUploading(false);
      setCurrentProcessing('');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPlatformIcon = (type: string) => {
    switch (type) {
      case 'shopee': return '🛒';
      case 'lazada': return '🛍️';
      case 'facebook': return '📘';
      default: return '📄';
    }
  };

  const getPlatformColor = (type: string) => {
    switch (type) {
      case 'shopee': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'lazada': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'facebook': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  // Facebook API connection handlers
  const handleFacebookConnect = async () => {
    setFacebookConnecting(true);
    setFacebookError('');
    
    try {
      // Initiate OAuth flow
      await facebookOAuthService.initiateAuth();
      
      // Get access token and set it for API service
      const tokens = facebookOAuthService.getStoredTokens();
      if (tokens) {
        facebookAPIService.setAccessToken(tokens.accessToken);
        
        // Fetch user's ad accounts
        const accounts = await facebookAPIService.getAdAccounts();
        
        // Update connection state
        const newConnectionState: FacebookConnectionState = {
          isConnected: true,
          connectedAccounts: accounts,
          lastSyncTime: undefined,
          syncStatus: 'idle',
        };
        
        onFacebookConnectionChange?.(newConnectionState);
        console.log('Facebook connection successful:', accounts.length, 'accounts found');
      }
    } catch (error: any) {
      console.error('Facebook connection failed:', error);
      setFacebookError(error.message || 'Failed to connect to Facebook API');
      
      // Update connection state to show error
      const errorConnectionState: FacebookConnectionState = {
        isConnected: false,
        connectedAccounts: [],
        syncStatus: 'error',
        error: error.message || 'Connection failed',
      };
      
      onFacebookConnectionChange?.(errorConnectionState);
    } finally {
      setFacebookConnecting(false);
    }
  };

  const handleFacebookDisconnect = async () => {
    try {
      // Get current tokens
      const tokens = facebookOAuthService.getStoredTokens();
      
      // Revoke token if available
      if (tokens?.accessToken) {
        await facebookOAuthService.revokeToken(tokens.accessToken);
      }
      
      // Clear tokens
      facebookOAuthService.clearTokens();
      
      // Update connection state
      const disconnectedState: FacebookConnectionState = {
        isConnected: false,
        connectedAccounts: [],
        syncStatus: 'idle',
      };
      
      onFacebookConnectionChange?.(disconnectedState);
      console.log('Facebook disconnected successfully');
    } catch (error: any) {
      console.error('Facebook disconnect error:', error);
      // Still update state even if revocation fails
      const disconnectedState: FacebookConnectionState = {
        isConnected: false,
        connectedAccounts: [],
        syncStatus: 'idle',
      };
      
      onFacebookConnectionChange?.(disconnectedState);
    } finally {
      setShowDisconnectDialog(false);
    }
  };

  const handleFacebookRefresh = async () => {
    if (!facebookConnection?.isConnected) return;
    
    setFacebookConnecting(true);
    setFacebookError('');
    
    try {
      // Validate and refresh token if needed
      const tokens = await facebookOAuthService.validateAndRefreshToken();
      
      if (tokens) {
        facebookAPIService.setAccessToken(tokens.accessToken);
        
        // Fetch updated ad accounts
        const accounts = await facebookAPIService.getAdAccounts();
        
        // Update connection state
        const refreshedConnectionState: FacebookConnectionState = {
          ...facebookConnection,
          connectedAccounts: accounts,
          error: undefined,
        };
        
        onFacebookConnectionChange?.(refreshedConnectionState);
        console.log('Facebook connection refreshed:', accounts.length, 'accounts found');
      } else {
        // Token refresh failed, need to reconnect
        handleFacebookConnect();
      }
    } catch (error: any) {
      console.error('Facebook refresh failed:', error);
      setFacebookError(error.message || 'Failed to refresh Facebook connection');
      
      // Update connection state to show error
      const errorConnectionState: FacebookConnectionState = {
        ...facebookConnection,
        syncStatus: 'error',
        error: error.message || 'Refresh failed',
      };
      
      onFacebookConnectionChange?.(errorConnectionState);
    } finally {
      setFacebookConnecting(false);
    }
  };

  // Account selection handlers
  const handleAccountSelection = (accountId: string, checked: boolean) => {
    setSelectedAccounts(prev => {
      if (checked) {
        return [...prev, accountId];
      } else {
        return prev.filter(id => id !== accountId);
      }
    });
  };

  const handleSelectAllAccounts = (checked: boolean) => {
    if (checked && facebookConnection?.connectedAccounts) {
      setSelectedAccounts(facebookConnection.connectedAccounts.map(account => account.id));
    } else {
      setSelectedAccounts([]);
    }
  };

  const isAccountSelected = (accountId: string) => {
    return selectedAccounts.includes(accountId);
  };

  const areAllAccountsSelected = () => {
    if (!facebookConnection?.connectedAccounts || facebookConnection.connectedAccounts.length === 0) {
      return false;
    }
    return facebookConnection.connectedAccounts.every(account => 
      selectedAccounts.includes(account.id)
    );
  };

  const areSomeAccountsSelected = () => {
    return selectedAccounts.length > 0 && !areAllAccountsSelected();
  };

  // Facebook data sync handlers
  const handleFacebookSync = async () => {
    if (!facebookConnection?.isConnected || selectedAccounts.length === 0) {
      setSyncError('Please select at least one account to sync');
      return;
    }

    setSyncing(true);
    setSyncError('');
    setSyncProgress(0);

    try {
      // Validate and refresh token if needed
      const tokens = await facebookOAuthService.validateAndRefreshToken();
      
      if (!tokens) {
        throw new Error('Authentication expired. Please reconnect.');
      }

      facebookAPIService.setAccessToken(tokens.accessToken);

      // Sync data from selected accounts
      const syncResult = await facebookAPIService.syncAllData({
        accountIds: selectedAccounts,
        includeInsights: true,
        onProgress: (progress: SyncProgress) => {
          const totalProgress = progress.totalCampaigns > 0 
            ? Math.round((progress.campaignsProcessed / progress.totalCampaigns) * 100)
            : 0;
          setSyncProgress(totalProgress);
        },
      });

      // Transform and merge Facebook data with existing data
      const transformedData = {
        shopeeOrders: storedData.shopee?.data || [],
        lazadaOrders: storedData.lazada?.data || [],
        facebookAds: syncResult.campaigns || [],
        totalRows: (storedData.shopee?.data?.length || 0) + 
                  (storedData.lazada?.data?.length || 0) + 
                  (syncResult.campaigns?.length || 0),
        errors: syncResult.errors || [],
      };

      // Update stored data for Facebook
      setStoredData({
        ...storedData,
        facebook: {
          data: syncResult.campaigns,
          fileName: `Facebook API Sync (${selectedAccounts.length} accounts)`,
          timestamp: new Date(),
          size: JSON.stringify(syncResult.campaigns).length,
          rowCount: syncResult.campaigns.length
        }
      });

      // Update connection state with last sync time
      const updatedConnectionState: FacebookConnectionState = {
        ...facebookConnection,
        lastSyncTime: new Date(),
        syncStatus: 'idle',
      };
      
      onFacebookConnectionChange?.(updatedConnectionState);

      // Send data to parent component
      onDataImported(transformedData);

      console.log('Facebook sync completed:', {
        campaigns: syncResult.campaigns.length,
        totalSpend: syncResult.totalSpend,
        errors: syncResult.errors.length
      });

    } catch (error: any) {
      console.error('Facebook sync failed:', error);
      setSyncError(error.message || 'Sync failed');
      
      // Update connection state to show error
      const errorConnectionState: FacebookConnectionState = {
        ...facebookConnection,
        syncStatus: 'error',
        error: error.message || 'Sync failed',
      };
      
      onFacebookConnectionChange?.(errorConnectionState);
    } finally {
      setSyncing(false);
      setSyncProgress(0);
    }
  };

  const handleRetrySyncError = () => {
    setSyncError('');
    if (facebookConnection?.error) {
      const clearedConnectionState: FacebookConnectionState = {
        ...facebookConnection,
        syncStatus: 'idle',
        error: undefined,
      };
      onFacebookConnectionChange?.(clearedConnectionState);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30">
            <Database className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold luxury-text">นำเข้าข้อมูลสำหรับการวิเคราะห์</h1>
        </div>
        <p className="text-white/70 max-w-2xl mx-auto">
          อัปโหลดไฟล์ข้อมูลจาก Shopee, Lazada และ Facebook Ads เพื่อเริ่มต้นการวิเคราะห์ที่แม่นยำ
        </p>
        
        {/* Current Data Files Display */}
        {(storedData.shopee || storedData.lazada || storedData.facebook) && (
          <div className="mt-6 p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/30 max-w-4xl mx-auto">
            <div className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
              <Database className="h-5 w-5" />
              ไฟล์ข้อมูลที่ใช้งานอยู่ ({[storedData.shopee, storedData.lazada, storedData.facebook].filter(Boolean).length} ไฟล์):
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {storedData.shopee && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🛒</span>
                    <span className="font-medium text-orange-300">Shopee</span>
                  </div>
                  <div className="text-sm text-orange-200 font-medium truncate" title={storedData.shopee.fileName}>
                    {storedData.shopee.fileName}
                  </div>
                  <div className="text-xs text-orange-300/70 mt-1">
                    {storedData.shopee.rowCount.toLocaleString()} แถว • {formatFileSize(storedData.shopee.size)}
                  </div>
                </div>
              )}
              {storedData.lazada && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🛍️</span>
                    <span className="font-medium text-purple-300">Lazada</span>
                  </div>
                  <div className="text-sm text-purple-200 font-medium truncate" title={storedData.lazada.fileName}>
                    {storedData.lazada.fileName}
                  </div>
                  <div className="text-xs text-purple-300/70 mt-1">
                    {storedData.lazada.rowCount.toLocaleString()} แถว • {formatFileSize(storedData.lazada.size)}
                  </div>
                </div>
              )}
              {storedData.facebook && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">📘</span>
                    <span className="font-medium text-blue-300">Facebook</span>
                  </div>
                  <div className="text-sm text-blue-200 font-medium truncate" title={storedData.facebook.fileName}>
                    {storedData.facebook.fileName}
                  </div>
                  <div className="text-xs text-blue-300/70 mt-1">
                    {storedData.facebook.rowCount.toLocaleString()} แถว • {formatFileSize(storedData.facebook.size)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Current Data Status */}
      {(storedData.shopee || storedData.lazada || storedData.facebook) && (
        <Card className="modern-card border-green-500/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-green-400 flex items-center gap-2">
                <Database className="h-5 w-5" />
                ข้อมูลที่เก็บไว้ในระบบ
              </CardTitle>
              <Button
                onClick={handleClearAllData}
                variant="outline"
                size="sm"
                className="text-red-400 border-red-500/30 hover:bg-red-500/10"
              >
                <X className="h-4 w-4 mr-2" />
                ลบทั้งหมด
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Shopee Status */}
              <div className={`p-4 rounded-lg border ${storedData.shopee ? 'bg-orange-500/10 border-orange-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🛒</span>
                    <span className="font-medium text-orange-400">Shopee</span>
                  </div>
                  {storedData.shopee && (
                    <Button
                      onClick={() => handleDeleteData('shopee')}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-400 hover:bg-red-500/20"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {storedData.shopee ? (
                  <div className="space-y-1 text-xs">
                    <div className="font-medium text-orange-300">{storedData.shopee.fileName}</div>
                    <div className="text-white/60">{storedData.shopee.rowCount.toLocaleString()} แถว</div>
                    <div className="text-white/60">{formatFileSize(storedData.shopee.size)}</div>
                    <div className="text-white/60">
                      {storedData.shopee.timestamp.toLocaleDateString('th-TH', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">ไม่มีข้อมูล</div>
                )}
              </div>

              {/* Lazada Status */}
              <div className={`p-4 rounded-lg border ${storedData.lazada ? 'bg-purple-500/10 border-purple-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🛍️</span>
                    <span className="font-medium text-purple-400">Lazada</span>
                  </div>
                  {storedData.lazada && (
                    <Button
                      onClick={() => handleDeleteData('lazada')}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-400 hover:bg-red-500/20"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {storedData.lazada ? (
                  <div className="space-y-1 text-xs">
                    <div className="font-medium text-purple-300">{storedData.lazada.fileName}</div>
                    <div className="text-white/60">{storedData.lazada.rowCount.toLocaleString()} แถว</div>
                    <div className="text-white/60">{formatFileSize(storedData.lazada.size)}</div>
                    <div className="text-white/60">
                      {storedData.lazada.timestamp.toLocaleDateString('th-TH', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">ไม่มีข้อมูล</div>
                )}
              </div>

              {/* Facebook Status */}
              <div className={`p-4 rounded-lg border ${storedData.facebook ? 'bg-blue-500/10 border-blue-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📘</span>
                    <span className="font-medium text-blue-400">Facebook</span>
                  </div>
                  {storedData.facebook && (
                    <Button
                      onClick={() => handleDeleteData('facebook')}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-400 hover:bg-red-500/20"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {storedData.facebook ? (
                  <div className="space-y-1 text-xs">
                    <div className="font-medium text-blue-300">{storedData.facebook.fileName}</div>
                    <div className="text-white/60">{storedData.facebook.rowCount.toLocaleString()} แถว</div>
                    <div className="text-white/60">{formatFileSize(storedData.facebook.size)}</div>
                    <div className="text-white/60">
                      {storedData.facebook.timestamp.toLocaleDateString('th-TH', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">ไม่มีข้อมูล</div>
                )}
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2 text-sm text-green-300">
                <CheckCircle className="h-4 w-4" />
                <span>
                  รวมข้อมูลทั้งหมด: {' '}
                  <span className="font-semibold">
                    {((storedData.shopee?.rowCount || 0) + 
                      (storedData.lazada?.rowCount || 0) + 
                      (storedData.facebook?.rowCount || 0)).toLocaleString()} แถว
                  </span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="modern-card">
        <CardContent className="p-8 space-y-6">
          {/* Upload Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Shopee Data Section */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold flex items-center gap-2 text-orange-400">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                Shopee Data
              </Label>
              <div className="shopee-gradient border border-orange-500/20 rounded-xl p-4 text-center hover:border-orange-400/40 transition-all duration-300 group">
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => handleFileChange('shopee', e.target.files?.[0] || null)}
                  className="hidden"
                  id="shopee-upload"
                />
                <Label 
                  htmlFor="shopee-upload" 
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="p-3 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
                    <Upload className="h-6 w-6 text-orange-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-white">
                      {files.shopee ? files.shopee.name : 
                       storedData.shopee ? "แทนที่ไฟล์ Shopee" : "เลือกไฟล์ Shopee"}
                    </div>
                    <div className="text-xs text-white/60">
                      {storedData.shopee ? "อัปโหลดใหม่เพื่อแทนที่" : "CSV, XLSX"}
                    </div>
                    {files.shopee && (
                      <Badge className="bg-orange-500/20 text-orange-400 text-xs">
                        {formatFileSize(files.shopee.size)}
                      </Badge>
                    )}
                  </div>
                </Label>
              </div>
            </div>

            {/* Lazada Data Section */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold flex items-center gap-2 text-purple-400">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                Lazada Data
              </Label>
              <div className="lazada-gradient border border-purple-500/20 rounded-xl p-4 text-center hover:border-purple-400/40 transition-all duration-300 group">
                <Input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => handleFileChange('lazada', e.target.files?.[0] || null)}
                  className="hidden"
                  id="lazada-upload"
                />
                <Label 
                  htmlFor="lazada-upload" 
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="p-3 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                    <Upload className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-white">
                      {files.lazada ? files.lazada.name : 
                       storedData.lazada ? "แทนที่ไฟล์ Lazada" : "เลือกไฟล์ Lazada"}
                    </div>
                    <div className="text-xs text-white/60">
                      {storedData.lazada ? "อัปโหลดใหม่เพื่อแทนที่" : "CSV, XLSX"}
                    </div>
                    {files.lazada && (
                      <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                        {formatFileSize(files.lazada.size)}
                      </Badge>
                    )}
                  </div>
                </Label>
              </div>
            </div>

            {/* Facebook API Section */}
            <div className="space-y-3">
              <Label className="text-lg font-semibold flex items-center gap-2 text-blue-400">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                Facebook API
              </Label>
              
              {/* Facebook Connection Status */}
              {facebookConnection?.isConnected ? (
                <div className="facebook-gradient border border-blue-500/20 rounded-xl p-4 space-y-4">
                  {/* Connection Status Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <Link className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-green-400">Connected</div>
                        <div className="text-xs text-white/60">
                          {facebookConnection.connectedAccounts.length} ad account(s)
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleFacebookRefresh}
                        disabled={facebookConnecting}
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:bg-blue-500/10"
                      >
                        <RefreshCw className={`h-4 w-4 ${facebookConnecting ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        onClick={() => setShowDisconnectDialog(true)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:bg-red-500/10"
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Connected Accounts Display with Selection */}
                  {facebookConnection.connectedAccounts.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-white/80">Connected Accounts:</div>
                        <Button
                          onClick={() => setShowAccountSelector(!showAccountSelector)}
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:bg-blue-500/10 text-xs h-6"
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          {showAccountSelector ? 'Hide' : 'Select'}
                        </Button>
                      </div>

                      {/* Account Selection Interface */}
                      {showAccountSelector && (
                        <div className="space-y-2 p-3 bg-blue-500/5 rounded-lg border border-blue-500/10">
                          {/* Select All Checkbox */}
                          <div className="flex items-center space-x-2 pb-2 border-b border-blue-500/10">
                            <Checkbox
                              id="select-all-accounts"
                              checked={areAllAccountsSelected()}
                              onCheckedChange={handleSelectAllAccounts}
                              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <label
                              htmlFor="select-all-accounts"
                              className="text-xs font-medium text-blue-300 cursor-pointer"
                            >
                              Select All ({facebookConnection.connectedAccounts.length} accounts)
                            </label>
                          </div>

                          {/* Individual Account Selection */}
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {facebookConnection.connectedAccounts.map((account) => (
                              <div
                                key={account.id}
                                className="flex items-center space-x-2 p-2 hover:bg-blue-500/5 rounded"
                              >
                                <Checkbox
                                  id={`account-${account.id}`}
                                  checked={isAccountSelected(account.id)}
                                  onCheckedChange={(checked) => 
                                    handleAccountSelection(account.id, checked as boolean)
                                  }
                                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                <div className="flex-1 min-w-0">
                                  <label
                                    htmlFor={`account-${account.id}`}
                                    className="text-xs font-medium text-blue-300 truncate cursor-pointer block"
                                  >
                                    {account.name}
                                  </label>
                                  <div className="text-xs text-white/50">
                                    {account.currency} • {account.accountStatus}
                                  </div>
                                </div>
                                <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                                  {account.id.replace('act_', '')}
                                </Badge>
                              </div>
                            ))}
                          </div>

                          {/* Selection Summary */}
                          <div className="pt-2 border-t border-blue-500/10">
                            <div className="text-xs text-blue-300">
                              {selectedAccounts.length} of {facebookConnection.connectedAccounts.length} accounts selected
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Compact Account List (when selector is hidden) */}
                      {!showAccountSelector && (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {facebookConnection.connectedAccounts.map((account) => (
                            <div
                              key={account.id}
                              className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                                isAccountSelected(account.id)
                                  ? 'bg-blue-500/10 border-blue-500/20'
                                  : 'bg-blue-500/5 border-blue-500/10'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isAccountSelected(account.id) && (
                                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium text-blue-300 truncate">
                                    {account.name}
                                  </div>
                                  <div className="text-xs text-white/50">
                                    {account.currency} • {account.accountStatus}
                                  </div>
                                </div>
                              </div>
                              <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                                {account.id.replace('act_', '')}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sync Controls */}
                  <div className="space-y-3 pt-3 border-t border-blue-500/20">
                    {/* Sync Status and Last Sync Time */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-white/80">Sync Status:</div>
                        <div className="flex items-center gap-2">
                          {syncing ? (
                            <>
                              <RefreshCw className="h-3 w-3 text-blue-400 animate-spin" />
                              <span className="text-xs text-blue-400">Syncing... {syncProgress}%</span>
                            </>
                          ) : facebookConnection.syncStatus === 'error' ? (
                            <>
                              <AlertCircle className="h-3 w-3 text-red-400" />
                              <span className="text-xs text-red-400">Error</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3 text-green-400" />
                              <span className="text-xs text-green-400">Ready</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {facebookConnection.lastSyncTime && (
                        <div className="text-right">
                          <div className="text-xs text-white/60">Last sync:</div>
                          <div className="text-xs text-white/80">
                            {facebookConnection.lastSyncTime.toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sync Progress Bar */}
                    {syncing && (
                      <div className="space-y-1">
                        <Progress value={syncProgress} className="w-full h-2" />
                        <div className="text-xs text-blue-300 text-center">
                          Fetching campaign data from {selectedAccounts.length} account(s)...
                        </div>
                      </div>
                    )}

                    {/* Manual Sync Button */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleFacebookSync}
                        disabled={syncing || selectedAccounts.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                        size="sm"
                      >
                        {syncing ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Sync Data
                          </>
                        )}
                      </Button>
                      
                      {selectedAccounts.length === 0 && (
                        <div className="text-xs text-yellow-400">
                          Select accounts to sync
                        </div>
                      )}
                    </div>

                    {/* Sync Error Display */}
                    {(syncError || facebookConnection.error) && (
                      <Alert className="border-red-500/30 bg-red-500/10">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="text-red-300 flex items-center justify-between">
                          <span>{syncError || facebookConnection.error}</span>
                          <Button
                            onClick={handleRetrySyncError}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:bg-red-500/20 h-6 px-2"
                          >
                            Retry
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Data Freshness Indicator */}
                    {facebookConnection.lastSyncTime && (
                      <div className="text-xs text-white/60">
                        {(() => {
                          const timeDiff = Date.now() - facebookConnection.lastSyncTime.getTime();
                          const minutes = Math.floor(timeDiff / (1000 * 60));
                          const hours = Math.floor(minutes / 60);
                          const days = Math.floor(hours / 24);
                          
                          if (days > 0) {
                            return `Data is ${days} day(s) old`;
                          } else if (hours > 0) {
                            return `Data is ${hours} hour(s) old`;
                          } else if (minutes > 0) {
                            return `Data is ${minutes} minute(s) old`;
                          } else {
                            return 'Data is fresh';
                          }
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Connection Error */}
                  {facebookConnection.error && (
                    <Alert className="border-red-500/30 bg-red-500/10">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-300">
                        {facebookConnection.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                /* Facebook Connect Button */
                <div className="facebook-gradient border border-blue-500/20 rounded-xl p-4 text-center hover:border-blue-400/40 transition-all duration-300 group">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                      <Link className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-white">
                        Connect Facebook API
                      </div>
                      <div className="text-xs text-white/60">
                        Access your Facebook Ads data directly
                      </div>
                    </div>
                    <Button
                      onClick={handleFacebookConnect}
                      disabled={facebookConnecting}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      {facebookConnecting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Link className="h-4 w-4 mr-2" />
                          Connect Facebook
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Connection Error */}
                  {facebookError && (
                    <Alert className="mt-3 border-red-500/30 bg-red-500/10">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-300">
                        {facebookError}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* File Upload Alternative */}
                  <div className="mt-4 pt-4 border-t border-blue-500/20">
                    <div className="text-xs text-white/60 mb-2">Or upload a file instead:</div>
                    <Input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => handleFileChange('facebook', e.target.files?.[0] || null)}
                      className="hidden"
                      id="facebook-upload"
                    />
                    <Label 
                      htmlFor="facebook-upload" 
                      className="cursor-pointer inline-flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300"
                    >
                      <Upload className="h-3 w-3" />
                      {files.facebook ? files.facebook.name : 
                       storedData.facebook ? "Replace Facebook file" : "Upload CSV/XLSX"}
                    </Label>
                    {files.facebook && (
                      <Badge className="ml-2 bg-blue-500/20 text-blue-400 text-xs">
                        {formatFileSize(files.facebook.size)}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>{currentProcessing || 'กำลังประมวลผล...'}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              {currentProcessing && (
                <div className="text-xs text-muted-foreground text-center">
                  💡 กำลังประมวลผลไฟล์ทีละไฟล์เพื่อประสิทธิภาพที่ดีที่สุด
                </div>
              )}
            </div>
          )}

          {/* Error Messages */}
          {errors.length > 0 && (
            <Alert className="border-destructive/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <div key={index} className="text-sm">{error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div className="flex items-center justify-between w-full">
                <AlertDescription className="text-green-400">
                  ✅ นำเข้าข้อมูลสำเร็จแล้ว!
                </AlertDescription>
                {onNavigateToDashboard && (
                  <Button
                    onClick={onNavigateToDashboard}
                    className="ml-4 bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    ไปที่ Dashboard
                  </Button>
                )}
              </div>
            </Alert>
          )}

          {/* Import Button */}
          <div className="flex justify-center gap-4 pt-4">
            {/* Import/Update Button */}
            <Button 
              onClick={handleImport} 
              disabled={uploading || (!files.shopee && !files.lazada && !files.facebook)}
              size="lg"
              className={`px-8 py-4 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group ${
                success 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
              } text-white`}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  กำลังประมวลผล...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="mr-3 h-5 w-5 text-green-200" />
                  ✅ นำเข้าข้อมูลสำเร็จ
                </>
              ) : (
                <>
                  <Sparkles className="mr-3 h-5 w-5 group-hover:animate-pulse" />
                  {(files.shopee || files.lazada || files.facebook) ? 'อัปเดตข้อมูล' : 'เริ่มวิเคราะห์ข้อมูล'}
                </>
              )}
            </Button>

            {/* Use Current Data Button */}
            {(storedData.shopee || storedData.lazada || storedData.facebook) && 
             !files.shopee && !files.lazada && !files.facebook && (
              <>
                <Button 
                  onClick={() => {
                    const currentData = {
                      shopeeOrders: storedData.shopee?.data || [],
                      lazadaOrders: storedData.lazada?.data || [],
                      facebookAds: storedData.facebook?.data || [],
                      totalRows: (storedData.shopee?.rowCount || 0) + 
                                (storedData.lazada?.rowCount || 0) + 
                                (storedData.facebook?.rowCount || 0),
                      errors: [],
                    };
                    console.log('Using current stored data:', {
                      shopee: currentData.shopeeOrders.length,
                      lazada: currentData.lazadaOrders.length,
                      facebook: currentData.facebookAds.length,
                      total: currentData.totalRows
                    });
                    onDataImported(currentData);
                    setSuccess(true);
                    setTimeout(() => setSuccess(false), 3000);
                  }}
                  size="lg"
                  variant="outline"
                  className="px-8 py-4 border-green-500/30 text-green-400 hover:bg-green-500/10 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Database className="mr-3 h-5 w-5" />
                  ใช้ข้อมูลปัจจุบัน
                </Button>
                
                {/* Clear Data Button */}
                <Button 
                  onClick={() => {
                    if (confirm('คุณแน่ใจหรือไม่ที่จะลบข้อมูลทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
                      // Clear localStorage
                      localStorage.removeItem('affiliateData');
                      localStorage.removeItem('affiliateRawData');
                      localStorage.removeItem('affiliateMetrics');
                      localStorage.removeItem('affiliateSubIdAnalysis');
                      localStorage.removeItem('affiliatePlatformAnalysis');
                      localStorage.removeItem('affiliateDailyMetrics');
                      
                      // Clear stored data
                      if (onStoredDataUpdate) {
                        onStoredDataUpdate({
                          shopee: null,
                          lazada: null,
                          facebook: null
                        });
                      }
                      
                      // Reset files
                      setFiles({
                        shopee: null,
                        lazada: null,
                        facebook: null
                      });
                      
                      // Reset states
                      setSuccess(false);
                      setError(null);
                      setProgress(0);
                      
                      console.log('✅ All data cleared');
                      alert('ลบข้อมูลทั้งหมดเรียบร้อยแล้ว');
                    }
                  }}
                  size="lg"
                  variant="outline"
                  className="px-8 py-4 border-red-500/30 text-red-400 hover:bg-red-500/10 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <X className="mr-3 h-5 w-5" />
                  ลบข้อมูลทั้งหมด
                </Button>
              </>
            )}
          </div>

          {/* File History */}
          {fileHistory.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-semibold">ประวัติไฟล์ที่นำเข้า</h4>
              </div>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {fileHistory.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getPlatformIcon(file.type)}</span>
                      <div>
                        <div className="font-medium text-sm">{file.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {file.timestamp.toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPlatformColor(file.type)}>
                        {file.type.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {formatFileSize(file.size)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 mt-6">
            <h4 className="font-semibold text-white/90 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              คำแนะนำการใช้งาน
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/70">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  รองรับไฟล์ CSV และ XLSX
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  อัปโหลดได้ทีละหลายแพลตฟอร์ม
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  จดจำข้อมูลล่าสุดของแต่ละแพลตฟอร์ม
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  ขนาดไฟล์สูงสุด 50MB ต่อไฟล์
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  ประมวลผลทีละไฟล์เพื่อประสิทธิภาพ
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  รองรับข้อมูลสูงสุด 100,000 แถว
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  ลบหรือแทนที่ข้อมูลได้ตามต้องการ
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-400" />
                  เก็บประวัติไฟล์ล่าสุด 10 ไฟล์
                </div>
              </div>
            </div>
            
            {/* Performance Tips */}
            <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-300">
                  <div className="font-medium mb-1">เคล็ดลับการใช้งาน:</div>
                  <div>• ระบบจดจำข้อมูลล่าสุดของแต่ละแพลตฟอร์ม สามารถอัปโหลดทีละไฟล์ได้</div>
                  <div>• อัปโหลดไฟล์ใหม่จะแทนที่ข้อมูลเดิมของแพลตฟอร์มนั้น</div>
                  <div>• สามารถลบข้อมูลแต่ละแพลตฟอร์มหรือทั้งหมดได้</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Facebook Disconnect Confirmation Dialog */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlink className="h-5 w-5 text-red-400" />
              Disconnect Facebook API
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect from Facebook API? This will remove access to your Facebook Ads data and you'll need to reconnect to sync data again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDisconnectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleFacebookDisconnect}
            >
              <Unlink className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
