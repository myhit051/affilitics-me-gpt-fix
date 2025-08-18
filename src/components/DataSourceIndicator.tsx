import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, FileText, Cloud, Merge, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

interface DataSourceStats {
  fileImport: number;
  facebookApi: number;
  merged: number;
  total: number;
}

interface MergeStatistics {
  totalOriginal: number;
  totalNew: number;
  totalMerged: number;
  duplicatesFound: number;
  duplicatesResolved: number;
  conflictsFound: number;
  conflictsResolved: number;
}

interface ConflictInfo {
  type: 'date_mismatch' | 'spend_mismatch' | 'performance_anomaly';
  description: string;
  affectedRecords: any[];
  severity: 'low' | 'medium' | 'high';
}

interface ConflictAnalysis {
  conflicts: ConflictInfo[];
  recommendations: string[];
}

interface MergeReport {
  summary: string;
  details: Array<{
    dataType: string;
    originalCount: number;
    newCount: number;
    mergedCount: number;
    duplicatesFound: number;
    conflictsResolved: number;
    status: 'success' | 'warning' | 'error';
  }>;
  recommendations: string[];
}

interface DataSourceIndicatorProps {
  dataSourceStats?: {
    shopee: DataSourceStats;
    lazada: DataSourceStats;
    facebook: DataSourceStats;
  };
  mergeResults?: {
    shopee?: { statistics: MergeStatistics };
    lazada?: { statistics: MergeStatistics };
    facebook?: { statistics: MergeStatistics };
  };
  conflictAnalysis?: ConflictAnalysis;
  mergeReport?: MergeReport;
  showDetails?: boolean;
}

export default function DataSourceIndicator({ 
  dataSourceStats, 
  mergeResults, 
  conflictAnalysis,
  mergeReport,
  showDetails = false 
}: DataSourceIndicatorProps) {
  if (!dataSourceStats && !mergeResults) {
    return null;
  }

  const formatNumber = (num: number) => num.toLocaleString();

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'file': return <FileText className="h-4 w-4" />;
      case 'api': return <Cloud className="h-4 w-4" />;
      case 'merged': return <Merge className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'file': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'api': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'merged': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-blue-600 bg-blue-500/10 border-blue-500/20';
      default: return 'text-gray-600 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <XCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const totalRecords = dataSourceStats ? 
    dataSourceStats.shopee.total + dataSourceStats.lazada.total + dataSourceStats.facebook.total : 0;

  const totalFileRecords = dataSourceStats ?
    dataSourceStats.shopee.fileImport + dataSourceStats.lazada.fileImport + dataSourceStats.facebook.fileImport : 0;

  const totalApiRecords = dataSourceStats ?
    dataSourceStats.shopee.facebookApi + dataSourceStats.lazada.facebookApi + dataSourceStats.facebook.facebookApi : 0;

  const totalMergedRecords = dataSourceStats ?
    dataSourceStats.shopee.merged + dataSourceStats.lazada.merged + dataSourceStats.facebook.merged : 0;

  const totalDuplicatesResolved = mergeResults ?
    (mergeResults.shopee?.statistics.duplicatesResolved || 0) +
    (mergeResults.lazada?.statistics.duplicatesResolved || 0) +
    (mergeResults.facebook?.statistics.duplicatesResolved || 0) : 0;

  const totalConflictsResolved = mergeResults ?
    (mergeResults.shopee?.statistics.conflictsResolved || 0) +
    (mergeResults.lazada?.statistics.conflictsResolved || 0) +
    (mergeResults.facebook?.statistics.conflictsResolved || 0) : 0;

  return (
    <Card className="glass-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            📊 Data Source Overview
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Shows data sources and merge statistics</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <div className="text-2xl font-bold text-foreground">{formatNumber(totalRecords)}</div>
            <div className="text-xs text-muted-foreground">Total Records</div>
          </div>
          
          <div className="text-center p-3 bg-blue-500/10 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{formatNumber(totalFileRecords)}</div>
            <div className="text-xs text-muted-foreground">File Import</div>
          </div>
          
          <div className="text-center p-3 bg-green-500/10 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{formatNumber(totalApiRecords)}</div>
            <div className="text-xs text-muted-foreground">Facebook API</div>
          </div>
          
          <div className="text-center p-3 bg-purple-500/10 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{formatNumber(totalMergedRecords)}</div>
            <div className="text-xs text-muted-foreground">Merged</div>
          </div>
        </div>

        {/* Data Source Breakdown */}
        {dataSourceStats && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Platform Breakdown</h4>
            
            {Object.entries(dataSourceStats).map(([platform, stats]) => (
              <div key={platform} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {platform === 'shopee' ? '🛒' : platform === 'lazada' ? '🛍️' : '📘'}
                  </span>
                  <div>
                    <div className="font-medium capitalize">{platform}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatNumber(stats.total)} total records
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {stats.fileImport > 0 && (
                    <Badge className={getSourceColor('file')}>
                      {getSourceIcon('file')}
                      <span className="ml-1">{formatNumber(stats.fileImport)}</span>
                    </Badge>
                  )}
                  
                  {stats.facebookApi > 0 && (
                    <Badge className={getSourceColor('api')}>
                      {getSourceIcon('api')}
                      <span className="ml-1">{formatNumber(stats.facebookApi)}</span>
                    </Badge>
                  )}
                  
                  {stats.merged > 0 && (
                    <Badge className={getSourceColor('merged')}>
                      {getSourceIcon('merged')}
                      <span className="ml-1">{formatNumber(stats.merged)}</span>
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Merge Statistics */}
        {mergeResults && (totalDuplicatesResolved > 0 || totalConflictsResolved > 0) && (
          <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Merge className="h-4 w-4" />
              Merge Operations
            </h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-orange-600">{formatNumber(totalDuplicatesResolved)}</div>
                <div className="text-muted-foreground">Duplicates Resolved</div>
              </div>
              
              <div>
                <div className="font-medium text-red-600">{formatNumber(totalConflictsResolved)}</div>
                <div className="text-muted-foreground">Conflicts Resolved</div>
              </div>
            </div>
          </div>
        )}

        {/* Merge Report Summary */}
        {mergeReport && (
          <div className="mt-6">
            <Alert className="border-green-500/20 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Merge Complete</AlertTitle>
              <AlertDescription className="text-green-700">
                {mergeReport.summary}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Conflict Analysis */}
        {conflictAnalysis && conflictAnalysis.conflicts.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Data Quality Issues
            </h4>
            
            {conflictAnalysis.conflicts.map((conflict, index) => (
              <Alert key={index} className={getSeverityColor(conflict.severity)}>
                {getSeverityIcon(conflict.severity)}
                <AlertTitle className="capitalize">{conflict.severity} Priority</AlertTitle>
                <AlertDescription>
                  {conflict.description}
                </AlertDescription>
              </Alert>
            ))}

            {conflictAnalysis.recommendations.length > 0 && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h5 className="text-sm font-medium text-blue-800 mb-2">Recommendations</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  {conflictAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Detailed Statistics (Optional) */}
        {showDetails && mergeResults && (
          <div className="mt-6 space-y-4">
            <h4 className="text-sm font-medium text-foreground">Detailed Merge Statistics</h4>
            
            {Object.entries(mergeResults).map(([platform, result]) => {
              if (!result) return null;
              
              return (
                <div key={platform} className="p-3 bg-secondary/10 rounded-lg">
                  <div className="font-medium capitalize mb-2">{platform}</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div>
                      <div className="font-medium">{formatNumber(result.statistics.totalOriginal)}</div>
                      <div className="text-muted-foreground">Original</div>
                    </div>
                    <div>
                      <div className="font-medium">{formatNumber(result.statistics.totalNew)}</div>
                      <div className="text-muted-foreground">New</div>
                    </div>
                    <div>
                      <div className="font-medium">{formatNumber(result.statistics.duplicatesFound)}</div>
                      <div className="text-muted-foreground">Duplicates</div>
                    </div>
                    <div>
                      <div className="font-medium">{formatNumber(result.statistics.conflictsFound)}</div>
                      <div className="text-muted-foreground">Conflicts</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detailed Merge Report */}
        {showDetails && mergeReport && (
          <div className="mt-6 space-y-4">
            <h4 className="text-sm font-medium text-foreground">Merge Report Details</h4>
            
            {mergeReport.details.map((detail, index) => (
              <div key={index} className="p-3 bg-secondary/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">{detail.dataType}</div>
                  <Badge className={detail.status === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'}>
                    {detail.status === 'success' ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                    {detail.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 text-xs">
                  <div>
                    <div className="font-medium">{formatNumber(detail.originalCount)}</div>
                    <div className="text-muted-foreground">Original</div>
                  </div>
                  <div>
                    <div className="font-medium">{formatNumber(detail.newCount)}</div>
                    <div className="text-muted-foreground">New</div>
                  </div>
                  <div>
                    <div className="font-medium">{formatNumber(detail.mergedCount)}</div>
                    <div className="text-muted-foreground">Merged</div>
                  </div>
                  <div>
                    <div className="font-medium">{formatNumber(detail.duplicatesFound)}</div>
                    <div className="text-muted-foreground">Duplicates</div>
                  </div>
                  <div>
                    <div className="font-medium">{formatNumber(detail.conflictsResolved)}</div>
                    <div className="text-muted-foreground">Resolved</div>
                  </div>
                </div>
              </div>
            ))}

            {mergeReport.recommendations.length > 0 && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h5 className="text-sm font-medium text-blue-800 mb-2">Additional Recommendations</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  {mergeReport.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}