/**
 * Facebook Setup Status Component
 * Shows real-time configuration status and setup guidance
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  RefreshCw,
  Settings
} from "lucide-react";
import { 
  validateFacebookConfiguration, 
  testFacebookConnectivity,
  getFacebookAppSetupInstructions,
  generateConfigReport
} from '@/utils/facebook-config-validator';
import { checkPolicyFiles, getFacebookAppUrls, generateFacebookAppInstructions } from '@/utils/policy-checker';
import type { ConfigValidationResult } from '@/utils/facebook-config-validator';
import type { PolicyCheckResult } from '@/utils/policy-checker';

const FacebookSetupStatus: React.FC = () => {
  const [validation, setValidation] = useState<ConfigValidationResult | null>(null);
  const [policyCheck, setPolicyCheck] = useState<PolicyCheckResult | null>(null);
  const [isTestingConnectivity, setIsTestingConnectivity] = useState(false);
  const [isCheckingPolicies, setIsCheckingPolicies] = useState(false);
  const [connectivityResult, setConnectivityResult] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    checkConfiguration();
    checkPolicies();
  }, []);

  const checkConfiguration = () => {
    const result = validateFacebookConfiguration();
    setValidation(result);
    
    // Auto-expand details if there are issues
    if (result.status !== 'ready') {
      setShowDetails(true);
    }
  };

  const checkPolicies = async () => {
    setIsCheckingPolicies(true);
    try {
      const result = await checkPolicyFiles();
      setPolicyCheck(result);
      
      // Auto-expand instructions if policies are not accessible
      if (!result.allAccessible) {
        setShowInstructions(true);
      }
    } catch (error) {
      console.error('Error checking policy files:', error);
    } finally {
      setIsCheckingPolicies(false);
    }
  };

  const testConnectivity = async () => {
    setIsTestingConnectivity(true);
    try {
      const result = await testFacebookConnectivity();
      setConnectivityResult(result);
    } catch (error) {
      setConnectivityResult({
        success: false,
        message: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTestingConnectivity(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getOverallStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'needs_setup':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (!validation) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            Checking configuration...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Facebook Setup Status
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={checkConfiguration}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className={`p-4 rounded-lg border ${getOverallStatusColor(validation.status)}`}>
          <div className="flex items-center gap-2 mb-2">
            {validation.status === 'ready' && <CheckCircle className="h-5 w-5" />}
            {validation.status === 'needs_setup' && <AlertCircle className="h-5 w-5" />}
            {validation.status === 'error' && <XCircle className="h-5 w-5" />}
            <span className="font-medium">
              Status: {validation.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div className="text-sm">
            {validation.isReady ? 
              'Ready to connect to Facebook API' : 
              'Configuration needs attention before connecting'
            }
          </div>
        </div>

        {/* Configuration Checks */}
        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span>Configuration Details</span>
              {showDetails ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 mt-3">
            {validation.checks.map((check, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                {getStatusIcon(check.status)}
                <div className="flex-1">
                  <div className="font-medium">{check.name}</div>
                  <div className="text-sm text-muted-foreground">{check.message}</div>
                  {check.action && (
                    <div className="text-xs text-blue-600 mt-1">
                      Action needed: {check.action}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Policy Files Check */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Policy Files</span>
            <Button
              variant="outline"
              size="sm"
              onClick={checkPolicies}
              disabled={isCheckingPolicies}
            >
              {isCheckingPolicies ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                  Checking...
                </>
              ) : (
                'Check Files'
              )}
            </Button>
          </div>
          
          {policyCheck && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {policyCheck.privacyPolicy.accessible ? 
                  <CheckCircle className="h-4 w-4 text-green-500" /> : 
                  <XCircle className="h-4 w-4 text-red-500" />
                }
                <span>Privacy Policy</span>
                {!policyCheck.privacyPolicy.accessible && policyCheck.privacyPolicy.error && (
                  <span className="text-xs text-red-500">({policyCheck.privacyPolicy.error})</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {policyCheck.termsOfService.accessible ? 
                  <CheckCircle className="h-4 w-4 text-green-500" /> : 
                  <XCircle className="h-4 w-4 text-red-500" />
                }
                <span>Terms of Service</span>
                {!policyCheck.termsOfService.accessible && policyCheck.termsOfService.error && (
                  <span className="text-xs text-red-500">({policyCheck.termsOfService.error})</span>
                )}
              </div>
              
              {!policyCheck.allAccessible && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    Policy files are required for Facebook App activation. Make sure your development server is running and files are accessible.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* Connectivity Test */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">API Connectivity</span>
            <Button
              variant="outline"
              size="sm"
              onClick={testConnectivity}
              disabled={isTestingConnectivity || !validation.isReady}
            >
              {isTestingConnectivity ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
          </div>
          
          {connectivityResult && (
            <Alert variant={connectivityResult.success ? "default" : "destructive"}>
              <AlertDescription>
                <div className="flex items-center gap-2">
                  {connectivityResult.success ? 
                    <CheckCircle className="h-4 w-4 text-green-500" /> : 
                    <XCircle className="h-4 w-4 text-red-500" />
                  }
                  {connectivityResult.message}
                </div>
                {connectivityResult.details && (
                  <div className="text-xs mt-1 text-muted-foreground">
                    {connectivityResult.details}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Next Steps */}
        {validation.nextSteps.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Next Steps:</h4>
            <ul className="list-decimal list-inside space-y-1 text-sm">
              {validation.nextSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Setup Instructions */}
        {validation.status !== 'ready' && (
          <Collapsible open={showInstructions} onOpenChange={setShowInstructions}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>Facebook App Setup Instructions</span>
                {showInstructions ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-4">
                    <div className="font-medium">Complete Facebook App Setup:</div>
                    
                    {/* URLs for copy-paste */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">URLs to add in Facebook App:</div>
                      {(() => {
                        const urls = getFacebookAppUrls();
                        return (
                          <div className="space-y-2">
                            <div>
                              <div className="text-xs text-muted-foreground">Privacy Policy URL:</div>
                              <div className="p-2 bg-gray-100 rounded font-mono text-xs flex items-center justify-between">
                                <span>{urls.privacyPolicyUrl}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(urls.privacyPolicyUrl)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Terms of Service URL:</div>
                              <div className="p-2 bg-gray-100 rounded font-mono text-xs flex items-center justify-between">
                                <span>{urls.termsOfServiceUrl}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(urls.termsOfServiceUrl)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">OAuth Redirect URI:</div>
                              <div className="p-2 bg-gray-100 rounded font-mono text-xs flex items-center justify-between">
                                <span>{urls.oauthRedirectUri}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(urls.oauthRedirectUri)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>
                        Go to{' '}
                        <Button
                          variant="link"
                          className="p-0 h-auto text-blue-600"
                          onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}
                        >
                          Facebook Developer Console
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </li>
                      <li>Select your app (ID: 1264041048749910)</li>
                      <li>Go to <strong>Settings → Basic</strong></li>
                      <li>Fill in: Display Name, App Domains (localhost), Privacy Policy URL, Terms of Service URL</li>
                      <li>Add <strong>Facebook Login</strong> product if not already added</li>
                      <li>Go to <strong>Facebook Login → Settings</strong></li>
                      <li>Add the OAuth Redirect URI above</li>
                      <li>Go to <strong>Roles → Roles</strong> and add yourself as Administrator/Developer</li>
                      <li>Save all changes and test the connection</li>
                    </ol>

                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <div className="text-sm font-medium text-yellow-800">💡 Quick Fix for "App not active":</div>
                      <div className="text-xs text-yellow-700 mt-1">
                        Add your Facebook account as an App Tester in Roles → Roles, or switch the app to Live mode after completing all required fields.
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const report = generateConfigReport();
              copyToClipboard(report);
            }}
          >
            <Copy className="h-3 w-3 mr-2" />
            Copy Report
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('https://developers.facebook.com/apps/', '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-2" />
            Open Facebook Console
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FacebookSetupStatus;