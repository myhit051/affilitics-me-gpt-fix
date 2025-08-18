# Facebook API Configuration Guide

This document provides comprehensive information about configuring the Facebook API integration for the affiliate marketing dashboard.

## Environment Variables

### Required Variables

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `VITE_FACEBOOK_APP_ID` | Your Facebook App ID | Yes | - | `123456789012345` |

### Optional Variables

| Variable | Description | Required | Default | Example |
|----------|-------------|----------|---------|---------|
| `VITE_FACEBOOK_API_VERSION` | Facebook API version | No | `v19.0` | `v19.0` |
| `VITE_FACEBOOK_REDIRECT_URI` | OAuth redirect URI | No | Auto-generated | `http://localhost:8080/auth/facebook/callback` |
| `VITE_FACEBOOK_SCOPES` | Required permissions (comma-separated) | No | `ads_read,ads_management` | `ads_read,ads_management` |

### Feature Flags

| Variable | Description | Default | Values |
|----------|-------------|---------|--------|
| `VITE_ENABLE_FACEBOOK_INTEGRATION` | Enable/disable Facebook integration | `true` | `true`, `false` |
| `VITE_FACEBOOK_AUTO_SYNC` | Enable automatic data synchronization | `true` | `true`, `false` |
| `VITE_FACEBOOK_BATCH_REQUESTS` | Enable batch API requests | `true` | `true`, `false` |
| `VITE_FACEBOOK_RATE_LIMITING` | Enable rate limiting protection | `true` | `true`, `false` |
| `VITE_FACEBOOK_DATA_CACHING` | Enable data caching | `true` | `true`, `false` |
| `VITE_FACEBOOK_ERROR_RECOVERY` | Enable automatic error recovery | `true` | `true`, `false` |
| `VITE_FACEBOOK_VIRTUAL_SCROLLING` | Enable virtual scrolling for large datasets | `true` | `true`, `false` |
| `VITE_FACEBOOK_PERFORMANCE_MONITORING` | Enable performance monitoring | `false` | `true`, `false` |

### Sync Configuration

| Variable | Description | Default | Range |
|----------|-------------|---------|-------|
| `VITE_FACEBOOK_SYNC_INTERVAL` | Auto-sync interval in minutes | `60` | `5-1440` |
| `VITE_FACEBOOK_BATCH_SIZE` | Number of requests per batch | `50` | `1-50` |
| `VITE_FACEBOOK_MAX_RETRIES` | Maximum retry attempts | `3` | `1-10` |

### Performance Configuration

| Variable | Description | Default | Range |
|----------|-------------|---------|-------|
| `VITE_FACEBOOK_CACHE_TIMEOUT` | Cache timeout in milliseconds | `300000` | `60000-3600000` |

### Debug Configuration

| Variable | Description | Default | Values |
|----------|-------------|---------|--------|
| `VITE_DEBUG_FACEBOOK` | Enable debug logging | `false` | `true`, `false` |
| `VITE_FACEBOOK_LOG_LEVEL` | Logging level | `warn` | `error`, `warn`, `info`, `debug` |
| `VITE_FACEBOOK_API_LOGGING` | Enable API request/response logging | `false` | `true`, `false` |

## Configuration Examples

### Development Environment (.env.local)

```env
# Required
VITE_FACEBOOK_APP_ID=123456789012345

# Optional - API Configuration
VITE_FACEBOOK_API_VERSION=v19.0
VITE_FACEBOOK_REDIRECT_URI=http://localhost:8080/auth/facebook/callback
VITE_FACEBOOK_SCOPES=ads_read,ads_management

# Feature Flags
VITE_ENABLE_FACEBOOK_INTEGRATION=true
VITE_FACEBOOK_AUTO_SYNC=true
VITE_FACEBOOK_BATCH_REQUESTS=true
VITE_FACEBOOK_RATE_LIMITING=true
VITE_FACEBOOK_DATA_CACHING=true
VITE_FACEBOOK_ERROR_RECOVERY=true
VITE_FACEBOOK_VIRTUAL_SCROLLING=true
VITE_FACEBOOK_PERFORMANCE_MONITORING=true

# Sync Configuration
VITE_FACEBOOK_SYNC_INTERVAL=30
VITE_FACEBOOK_BATCH_SIZE=25
VITE_FACEBOOK_MAX_RETRIES=5

# Performance Configuration
VITE_FACEBOOK_CACHE_TIMEOUT=600000

# Debug Configuration
VITE_DEBUG_FACEBOOK=true
VITE_FACEBOOK_LOG_LEVEL=debug
VITE_FACEBOOK_API_LOGGING=true
```

### Production Environment

```env
# Required
VITE_FACEBOOK_APP_ID=123456789012345

# API Configuration
VITE_FACEBOOK_API_VERSION=v19.0
VITE_FACEBOOK_REDIRECT_URI=https://yourdomain.com/auth/facebook/callback
VITE_FACEBOOK_SCOPES=ads_read,ads_management

# Feature Flags (production optimized)
VITE_ENABLE_FACEBOOK_INTEGRATION=true
VITE_FACEBOOK_AUTO_SYNC=true
VITE_FACEBOOK_BATCH_REQUESTS=true
VITE_FACEBOOK_RATE_LIMITING=true
VITE_FACEBOOK_DATA_CACHING=true
VITE_FACEBOOK_ERROR_RECOVERY=true
VITE_FACEBOOK_VIRTUAL_SCROLLING=true
VITE_FACEBOOK_PERFORMANCE_MONITORING=false

# Sync Configuration (conservative for production)
VITE_FACEBOOK_SYNC_INTERVAL=60
VITE_FACEBOOK_BATCH_SIZE=50
VITE_FACEBOOK_MAX_RETRIES=3

# Performance Configuration
VITE_FACEBOOK_CACHE_TIMEOUT=300000

# Debug Configuration (disabled for production)
VITE_DEBUG_FACEBOOK=false
VITE_FACEBOOK_LOG_LEVEL=error
VITE_FACEBOOK_API_LOGGING=false
```

### Minimal Configuration

```env
# Only required variable - all others use defaults
VITE_FACEBOOK_APP_ID=123456789012345
```

## Configuration Validation

The application automatically validates configuration on startup and provides detailed feedback about any issues.

### Validation Levels

1. **Errors**: Critical issues that prevent functionality
   - Missing required variables
   - Invalid formats or values
   - Unsupported API versions

2. **Warnings**: Non-critical issues that may affect performance
   - Suboptimal settings
   - Debug mode in production
   - Unusual configuration values

### Testing Configuration

Use the built-in configuration test utility:

```javascript
// In browser console (development only)
testFacebookConfig()
```

This will perform a comprehensive check of:
- ✅ Basic configuration validity
- ✅ Runtime configuration validation
- ✅ Feature flag status
- ✅ Environment detection
- ✅ Health check results
- ✅ Initialization success

### Health Check

The configuration system includes a health check that monitors:

- **Basic Configuration**: Required settings are present and valid
- **Facebook Integration**: Feature flag status
- **API Version**: Compatibility with supported versions
- **Environment**: Current runtime environment

Health check results:
- 🟢 **Healthy**: All checks pass
- 🟡 **Warning**: Some non-critical issues detected
- 🔴 **Error**: Critical issues that prevent functionality

## Feature Flag Usage

Feature flags allow you to enable/disable specific functionality:

```typescript
import { isFeatureEnabled } from '@/config/facebook';

// Check if a feature is enabled
if (isFeatureEnabled('ENABLE_AUTO_SYNC')) {
  // Auto-sync functionality
}

// Get all enabled features
const enabledFeatures = getEnabledFeatures();

// Get all disabled features
const disabledFeatures = getDisabledFeatures();
```

## Runtime Configuration Access

Access configuration at runtime:

```typescript
import { getRuntimeConfig } from '@/config/facebook';

const config = getRuntimeConfig();

// Access feature flags
console.log(config.features.ENABLE_AUTO_SYNC);

// Access sync settings
console.log(config.sync.interval);

// Access performance settings
console.log(config.performance.enableCaching);

// Access debug settings
console.log(config.debug.enabled);
```

## Configuration Best Practices

### Development
- Enable debug mode for detailed logging
- Use shorter sync intervals for faster testing
- Enable performance monitoring
- Use smaller batch sizes to avoid rate limits

### Production
- Disable debug mode for performance
- Use conservative sync intervals
- Disable performance monitoring unless needed
- Use maximum batch sizes for efficiency
- Enable all error recovery features

### Security
- Never commit `.env.local` files
- Use environment-specific configuration
- Validate all configuration values
- Monitor for configuration drift

## Troubleshooting

### Configuration Not Loading
1. Check that `.env.local` exists and is properly formatted
2. Verify variable names match exactly (case-sensitive)
3. Restart the development server after changes
4. Check browser console for validation errors

### Feature Not Working
1. Verify the feature flag is enabled
2. Check configuration validation results
3. Run the configuration test utility
4. Review health check status

### Performance Issues
1. Check sync interval settings
2. Verify caching is enabled
3. Monitor batch size configuration
4. Review rate limiting settings

### Debug Information
Enable debug mode to see detailed information:
- Configuration loading process
- Feature flag evaluation
- Runtime validation results
- API request/response details

## Migration Guide

### From Previous Versions
If upgrading from a previous version:

1. **Add new environment variables** with default values
2. **Update existing variables** to match new naming conventions
3. **Test configuration** using the validation utility
4. **Review feature flags** and enable/disable as needed

### Configuration Changes
When making configuration changes:

1. **Update environment files** for all environments
2. **Test changes** in development first
3. **Validate configuration** before deployment
4. **Monitor health checks** after deployment

## Support

For configuration-related issues:
- Run the configuration test utility
- Check the health check results
- Review validation errors and warnings
- Consult the troubleshooting section above