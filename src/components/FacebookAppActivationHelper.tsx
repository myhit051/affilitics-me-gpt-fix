/**
 * Facebook App Activation Helper
 * Component to guide users through Facebook App activation process
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Copy,
  Settings,
  Users,
  Globe,
  FileText
} from "lucide-react";
import { getFacebookAppUrls } from '@/utils/policy-checker';

const FacebookAppActivationHelper: React.FC = () => {
  const [copiedText, setCopiedText] = useState<string>('');
  const urls = getFacebookAppUrls();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const CopyableField: React.FC<{ label: string; value: string; description?: string }> = ({ 
    label, 
    value, 
    description 
  }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <Button
          size="sm"
          variant="outline"
          onClick={() => copyToClipboard(value, label)}
          className="h-6 px-2"
        >
          <Copy className="h-3 w-3 mr-1" />
          {copiedText === label ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <div className="p-2 bg-gray-50 border rounded text-sm font-mono break-all">
        {value}
      </div>
      {description && (
        <div className="text-xs text-muted-foreground">{description}</div>
      )}
    </div>
  );

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Facebook App Activation Required
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Your Facebook App needs to be activated to work properly.</div>
              <div className="text-sm">
                The "App not active" error occurs because your Facebook App is missing required information 
                or is still in Development mode. Follow the steps below to fix this.
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="basic-info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic-info">Basic Info</TabsTrigger>
            <TabsTrigger value="facebook-login">Facebook Login</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="activation">Activation</TabsTrigger>
          </TabsList>

          <TabsContent value="basic-info" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-medium">Step 1: Basic App Information</h3>
            </div>

            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                Go to <strong>Settings → Basic</strong> in your Facebook App and fill in the following information:
              </AlertDescription>
            </Alert>

            <div className="grid gap-4">
              <CopyableField
                label="Display Name"
                value="Affilitics.me"
                description="The name users will see when authorizing your app"
              />

              <CopyableField
                label="App Domains"
                value="localhost"
                description="For development. Use your actual domain for production."
              />

              <CopyableField
                label="Privacy Policy URL"
                value={urls.privacyPolicyUrl}
                description="Required for app activation. Make sure your dev server is running."
              />

              <CopyableField
                label="Terms of Service URL"
                value={urls.termsOfServiceUrl}
                description="Required for app activation. Make sure your dev server is running."
              />

              <div className="space-y-1">
                <label className="text-sm font-medium">Category</label>
                <div className="p-2 bg-gray-50 border rounded text-sm">
                  Business
                </div>
                <div className="text-xs text-muted-foreground">Select "Business" from the dropdown</div>
              </div>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> You'll also need to upload an App Icon (1024x1024 pixels) 
                and provide an App Description. These are required for app activation.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="facebook-login" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-medium">Step 2: Facebook Login Setup</h3>
            </div>

            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div>1. Go to <strong>Products</strong> and click <strong>Add Product</strong></div>
                  <div>2. Find <strong>Facebook Login</strong> and click <strong>Set Up</strong></div>
                  <div>3. Select <strong>Web</strong> platform</div>
                  <div>4. Go to <strong>Facebook Login → Settings</strong></div>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <CopyableField
                label="Valid OAuth Redirect URIs"
                value={urls.oauthRedirectUri}
                description="This is where Facebook will redirect users after authorization"
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Client OAuth Login</label>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Enable (Yes)
                  </Badge>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Web OAuth Login</label>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Enable (Yes)
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-medium">Step 3: Permissions & Access</h3>
            </div>

            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                Go to <strong>App Review → Permissions and Features</strong> to request the following permissions:
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="p-3 border rounded">
                <div className="font-medium">ads_read</div>
                <div className="text-sm text-muted-foreground">
                  Required to read advertising data from Facebook Ads Manager
                </div>
              </div>
              <div className="p-3 border rounded">
                <div className="font-medium">ads_management</div>
                <div className="text-sm text-muted-foreground">
                  Required to access campaign insights and performance data
                </div>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> These permissions may require Facebook review for production use. 
                For development and testing, you can use them without review.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="activation" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-medium">Step 4: App Activation</h3>
            </div>

            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Choose one of these options to fix the "App not active" error:</strong>
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                <Card className="p-4">
                  <h4 className="font-medium text-green-700 mb-2">Option 1: Development Mode (Recommended for testing)</h4>
                  <div className="space-y-2 text-sm">
                    <div>1. Go to <strong>Roles → Roles</strong></div>
                    <div>2. Click <strong>Add People</strong></div>
                    <div>3. Add your Facebook account as <strong>Administrator</strong> or <strong>Developer</strong></div>
                    <div>4. Accept the role invitation in your Facebook notifications</div>
                  </div>
                  <Badge variant="outline" className="mt-2 bg-green-50 text-green-700">
                    ✅ Quick & Easy for Development
                  </Badge>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium text-blue-700 mb-2">Option 2: Live Mode (For production)</h4>
                  <div className="space-y-2 text-sm">
                    <div>1. Complete all required fields in <strong>Settings → Basic</strong></div>
                    <div>2. Upload App Icon (1024x1024 pixels)</div>
                    <div>3. Add App Description</div>
                    <div>4. Go to <strong>Settings → Basic</strong></div>
                    <div>5. Click <strong>"Switch to Live"</strong> or toggle the app status</div>
                  </div>
                  <Badge variant="outline" className="mt-2 bg-blue-50 text-blue-700">
                    🚀 For Production Use
                  </Badge>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex gap-3">
          <Button
            onClick={() => window.open('https://developers.facebook.com/apps/1264041048749910/', '_blank')}
            className="flex-1"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Your Facebook App
          </Button>
          
          <Button
            variant="outline"
            onClick={() => window.open('https://developers.facebook.com/docs/facebook-login/web', '_blank')}
          >
            <FileText className="mr-2 h-4 w-4" />
            Documentation
          </Button>
        </div>

        <Alert className="mt-4">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>After completing these steps:</strong> Refresh this page and try connecting to Facebook again. 
            The "App not active" error should be resolved.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default FacebookAppActivationHelper;