/**
 * Facebook OAuth Callback Page
 * Handles the OAuth callback from Facebook and communicates with the parent window
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const FacebookCallback: React.FC = () => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing Facebook authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');

        // Check for errors first
        if (error) {
          let errorMessage = 'Authentication failed';
          
          switch (error) {
            case 'access_denied':
              errorMessage = 'Access was denied. Please grant the required permissions.';
              break;
            case 'server_error':
              errorMessage = 'Facebook server error. Please try again.';
              break;
            case 'temporarily_unavailable':
              errorMessage = 'Facebook service is temporarily unavailable. Please try again later.';
              break;
            default:
              errorMessage = errorDescription || `Authentication error: ${error}`;
          }

          setStatus('error');
          setMessage(errorMessage);

          // Send error to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'FACEBOOK_OAUTH_ERROR',
              error: errorMessage,
            }, window.location.origin);
          }

          // Close popup after delay
          setTimeout(() => {
            window.close();
          }, 3000);

          return;
        }

        // Check for authorization code
        if (!code) {
          setStatus('error');
          setMessage('No authorization code received from Facebook');

          if (window.opener) {
            window.opener.postMessage({
              type: 'FACEBOOK_OAUTH_ERROR',
              error: 'No authorization code received',
            }, window.location.origin);
          }

          setTimeout(() => {
            window.close();
          }, 3000);

          return;
        }

        // Validate state parameter (basic check)
        if (!state) {
          setStatus('error');
          setMessage('Invalid state parameter - possible security issue');

          if (window.opener) {
            window.opener.postMessage({
              type: 'FACEBOOK_OAUTH_ERROR',
              error: 'Invalid state parameter',
            }, window.location.origin);
          }

          setTimeout(() => {
            window.close();
          }, 3000);

          return;
        }

        // Success - send code to parent window
        setStatus('success');
        setMessage('Authentication successful! Redirecting...');

        console.log('Sending success message to parent:', {
          type: 'FACEBOOK_OAUTH_SUCCESS',
          codeLength: code.length,
          state: state.substring(0, 8) + '...',
          hasOpener: !!window.opener,
          origin: window.location.origin
        });

        if (window.opener) {
          window.opener.postMessage({
            type: 'FACEBOOK_OAUTH_SUCCESS',
            code,
            state,
          }, window.location.origin);
        } else {
          console.error('No window.opener available to send message to');
        }

        // Close popup after short delay
        setTimeout(() => {
          window.close();
        }, 1500);

      } catch (error) {
        console.error('Error handling Facebook callback:', error);
        
        setStatus('error');
        setMessage('An unexpected error occurred during authentication');

        if (window.opener) {
          window.opener.postMessage({
            type: 'FACEBOOK_OAUTH_ERROR',
            error: 'Unexpected error during authentication',
          }, window.location.origin);
        }

        setTimeout(() => {
          window.close();
        }, 3000);
      }
    };

    handleCallback();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Facebook Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              {getStatusIcon()}
            </div>
            <p className={`text-sm ${getStatusColor()}`}>
              {message}
            </p>
            {status === 'error' && (
              <p className="text-xs text-gray-500">
                This window will close automatically in a few seconds.
              </p>
            )}
            {status === 'success' && (
              <p className="text-xs text-gray-500">
                Redirecting back to the application...
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacebookCallback;