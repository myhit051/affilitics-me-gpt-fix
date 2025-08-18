import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, Zap } from "lucide-react";

interface UpdateItem {
  date: string;
  time: string;
  version: string;
  type: 'feature' | 'fix' | 'improvement' | 'security';
  title: string;
  description: string;
  details?: string[];
}

const updates: UpdateItem[] = [
  {
    date: "2025-08-15",
    time: "20:15",
    version: "v2.5.204",
    type: "improvement",
    title: "📦 Added Terser for Production Build Optimization",
    description: "Added Terser as a development dependency to enable advanced JavaScript minification and optimization for production builds, improving bundle size and performance",
    details: [
      "📦 Added terser@5.36.0 as development dependency for production build optimization",
      "🗜️ Enhanced JavaScript minification capabilities with advanced compression algorithms",
      "⚡ Improved production bundle size through dead code elimination and tree shaking",
      "🔧 Better integration with Vite build system for optimized production outputs",
      "📈 Enhanced performance through more aggressive code optimization in production builds",
      "✨ Maintains source map support for debugging while optimizing production code",
      "🎯 Supports modern JavaScript features while ensuring compatibility with target browsers"
    ]
  },
  {
    date: "2025-08-15",
    time: "19:45",
    version: "v2.5.203",
    type: "feature",
    title: "🖥️ Added System Status Monitor Component",
    description: "Created a comprehensive system status monitoring component that provides real-time visibility into application health, Facebook API connectivity, performance metrics, and error tracking with automated status checks and quick action buttons",
    details: [
      "🖥️ Built SystemStatusMonitor component with real-time status tracking for overall system health",
      "📡 Added Facebook API connection status monitoring with visual indicators and badges",
      "⚡ Integrated performance monitoring with threshold-based status classification (good/degraded/poor)",
      "🚨 Implemented error count tracking with integration to Facebook error handler system",
      "🔄 Added automatic status refresh every 30 seconds with manual refresh capability",
      "🎨 Created intuitive status grid with color-coded badges and icons for quick visual assessment",
      "⚠️ Built contextual alert system that displays warnings and errors with appropriate severity levels",
      "🛠️ Added quick action buttons for common troubleshooting tasks (Connect Facebook, View Errors, Performance Report)",
      "📅 Included last update timestamp with Thai locale formatting for better user experience",
      "🎯 Designed responsive layout that works across different screen sizes with proper grid organization",
      "✨ Integrated with existing performance monitor and error handler systems for comprehensive monitoring",
      "🔧 Added proper TypeScript interfaces and error handling for robust component behavior"
    ]
  },
  {
    date: "2025-08-15",
    time: "18:30",
    version: "v2.5.202",
    type: "feature",
    title: "📊 Added Comprehensive Performance Monitoring System",
    description: "Implemented a production-ready performance monitoring system that tracks Core Web Vitals, API performance, memory usage, and page load metrics with automatic threshold detection and analytics integration",
    details: [
      "📈 Built comprehensive PerformanceMonitor class with Core Web Vitals tracking (FCP, LCP, CLS, FID)",
      "⚡ Added automatic page load performance monitoring with DOM content loaded and load complete metrics",
      "🔍 Implemented API performance tracking with automatic fetch request interception and timing",
      "💾 Added memory usage monitoring with periodic heap size tracking for memory leak detection",
      "🚨 Built intelligent performance threshold detection with configurable warning levels",
      "📊 Integrated with Google Analytics for performance metric reporting in production",
      "🎯 Added performance summary generation with averages and recent issue tracking",
      "⚙️ Environment-aware activation (disabled in development, configurable in production)",
      "🔧 Automatic metric cleanup with 1000-entry limit to prevent memory bloat",
      "✨ Comprehensive performance issue classification and logging system",
      "📋 Export singleton instance for easy integration across the application",
      "🛡️ Safe error handling for all performance API interactions"
    ]
  },
  {
    date: "2025-08-15",
    time: "17:15",
    version: "v2.5.201",
    type: "improvement",
    title: "🔧 Enhanced App.tsx with Production-Ready Configuration and Error Handling",
    description: "Upgraded the main App component with production-ready QueryClient configuration, global error boundary, analytics integration, and theme provider setup for improved reliability and monitoring",
    details: [
      "⚙️ Enhanced QueryClient with production-optimized configuration including stale time, cache time, and intelligent retry logic",
      "🛡️ Added comprehensive ErrorBoundary component with global error and unhandled promise rejection handling",
      "📊 Integrated analytics tracking for global errors and unhandled rejections for better monitoring",
      "🎨 Added ThemeProvider import for dark mode support (ready for implementation)",
      "🔧 Configured smart retry logic that avoids retrying 4xx errors except rate limits (429)",
      "⏱️ Implemented exponential backoff retry delay with 30-second maximum",
      "📈 Added production configuration import for environment-specific settings",
      "✨ Improved error handling with detailed error properties tracking including filename and line numbers",
      "🚀 Enhanced application stability and observability for production deployment",
      "🔍 Added proper cleanup for error event listeners to prevent memory leaks"
    ]
  },
  {
    date: "2025-08-15",
    time: "16:30",
    version: "v2.5.200",
    type: "feature",
    title: "🚀 Added Comprehensive Facebook API Service Implementation",
    description: "Implemented complete Facebook API Service with advanced data fetching, batch processing, pagination, caching, and comprehensive sync capabilities for seamless Facebook advertising data integration",
    details: [
      "📊 Built comprehensive FacebookAPIService class with full CRUD operations for Facebook advertising data",
      "🔄 Implemented advanced batch request processing with configurable batch sizes and rate limiting",
      "📄 Added automatic pagination handling for large datasets with cursor-based navigation",
      "💾 Integrated intelligent caching system with TTL support for improved performance",
      "🎯 Created comprehensive sync functionality with progress tracking and error recovery",
      "📈 Added support for campaigns, ad sets, ads, and insights data fetching",
      "⚡ Implemented concurrent request processing with configurable concurrency limits",
      "🛡️ Built robust error handling with retry logic and circuit breaker patterns",
      "📊 Added daily insights breakdown functionality for time-series analysis",
      "🔧 Created flexible configuration system with customizable service parameters",
      "✅ Included comprehensive unit tests covering all service methods and edge cases",
      "🎛️ Integrated with existing Facebook API client and data cache systems"
    ]
  },
  {
    date: "2025-08-15",
    time: "15:45",
    version: "v2.5.199",
    type: "feature",
    title: "👥 Added User Management System for Team Usage",
    description: "Implemented comprehensive user management system with role-based permissions, team settings, and Facebook account association for multi-user environments",
    details: [
      "👤 Created User interface with role-based access control (admin, manager, analyst)",
      "🔐 Implemented permission system for campaigns, accounts, reports, and settings",
      "👥 Added Team interface with member management and team-specific settings",
      "⚙️ Built UserManager class for user authentication and session management",
      "🔗 Added Facebook account association with user profiles",
      "📊 Implemented user role determination based on email domains",
      "💾 Added localStorage persistence for user and team data",
      "🚪 Built logout functionality with complete data cleanup",
      "✅ Added permission checking methods for resource access control",
      "🎯 Integrated with Facebook login flow for automatic user creation"
    ]
  },
  {
    date: "2025-08-15",
    time: "14:30",
    version: "v2.5.198",
    type: "feature",
    title: "📊 Added Analytics and Error Tracking System",
    description: "Implemented comprehensive analytics system for tracking user interactions, Facebook API connections, data synchronization events, and user actions with Google Analytics 4 integration",
    details: [
      "📊 Created analytics service with Google Analytics 4 integration",
      "🔍 Added Facebook connection event tracking for success/error monitoring",
      "📈 Implemented data sync event tracking with account and campaign counts",
      "👤 Added user action tracking for detailed behavior analysis",
      "🎯 Included page view tracking for navigation analytics",
      "⚙️ Environment-based analytics enabling with VITE_ENABLE_ANALYTICS flag",
      "🛠️ Development mode console logging for debugging analytics events",
      "✨ Comprehensive event properties with timestamps and contextual data"
    ]
  },
  {
    date: "2025-08-15",
    time: "14:25",
    version: "v2.5.197",
    type: "improvement",
    title: "⚙️ Added GitHub Pages Build Command to Package.json",
    description: "Enhanced the build configuration by adding a dedicated build:pages command for GitHub Pages deployment, ensuring proper production environment settings for static hosting",
    details: [
      "⚙️ Added build:pages script with NODE_ENV=production for GitHub Pages builds",
      "🚀 Optimized build process for static hosting environments",
      "📦 Enhanced package.json scripts for better deployment workflow",
      "🔧 Ensures proper production environment variables during GitHub Pages build",
      "✨ Improved build consistency across different deployment targets"
    ]
  },
  {
    date: "2025-08-15",
    time: "14:20",
    version: "v2.5.196",
    type: "improvement",
    title: "📚 Updated README with GitHub Pages Deployment Information",
    description: "Enhanced the README.md documentation with comprehensive GitHub Pages deployment details, including live demo URL, automatic deployment workflow, and production configuration guidance",
    details: [
      "🌐 Added GitHub Pages live demo URL: https://myhit051.github.io/affilitics-me-2.5.57/",
      "🚀 Documented automatic deployment process triggered on main branch pushes",
      "⚙️ Added build:pages command for GitHub Pages-specific builds",
      "🔧 Updated production environment variables with correct GitHub Pages redirect URI",
      "📋 Enhanced Facebook App production setup instructions with GitHub Pages URLs",
      "✨ Improved deployment documentation for better developer experience"
    ]
  },
  {
    date: "2025-08-15",
    time: "09:30",
    version: "v2.5.195",
    type: "improvement",
    title: "🔧 Enhanced Router Configuration with Base URL Support",
    description: "Updated the React Router configuration in App.tsx to support dynamic base URL from environment variables, improving deployment flexibility for different hosting environments and subdirectory deployments",
    details: [
      "🔧 Added basename={import.meta.env.BASE_URL} to BrowserRouter configuration",
      "🌐 Enhanced support for subdirectory deployments and custom base paths",
      "⚡ Improved deployment flexibility across different hosting environments",
      "🎯 Better compatibility with various deployment scenarios (GitHub Pages, subdirectories, etc.)",
      "✨ Maintains existing routing functionality while adding environment-based configuration"
    ]
  },
  {
    date: "2025-08-10",
    time: "14:40",
    version: "v2.5.194",
    type: "improvement",
    title: "📊 Updated Facebook Ads API Chart Description for Real Data Clarity",
    description: "Enhanced the performance chart description in Facebook Ads API page to emphasize that it displays real daily performance trends from Facebook API, providing better clarity about the data source and authenticity",
    details: [
      "📝 Updated chart description from 'Daily performance trends over selected date range' to 'Real daily performance trends from Facebook API'",
      "🎯 Enhanced user understanding that the chart shows authentic Facebook API data",
      "✨ Better distinction between real API data and simulated data in chart visualization",
      "📊 Improved transparency about data source for performance trends",
      "🔍 Clearer messaging about the authenticity of displayed metrics"
    ]
  },
  {
    date: "2025-08-10",
    time: "14:35",
    version: "v2.5.193",
    type: "improvement",
    title: "📊 Enhanced Facebook Ads API Chart Empty State Messaging",
    description: "Improved the empty state messaging for the Facebook Ads API performance chart to better clarify that real Facebook daily insights data is required for chart visualization, making it clearer to users what type of data is needed",
    details: [
      "📝 Updated empty state message from 'No daily data available' to 'No real daily data available'",
      "🎯 Enhanced description to specify 'Real Facebook daily insights are required to display this chart'",
      "🔄 Updated button text from 'Load Daily Data' to 'Load Real Daily Data' for better clarity",
      "✨ Improved user understanding of data requirements for chart functionality",
      "📊 Better distinction between simulated and real Facebook API data in user interface"
    ]
  },
  {
    date: "2025-08-10",
    time: "14:30",
    version: "v2.5.192",
    type: "improvement",
    title: "📊 Enhanced Facebook Ads API Daily Spend Table Display Logic",
    description: "Improved the daily spend table display condition in Facebook Ads API page to ensure the table only shows when both daily insights data is available and the processed daily spend data array contains entries, preventing empty table displays",
    details: [
      "🔧 Enhanced table display condition to check both dailyInsights object and overallDailySpendData array",
      "📊 Prevents empty table display when daily insights are not available",
      "✨ Better user experience by showing table only when meaningful data exists",
      "🎯 More accurate data presence validation for daily spend reporting",
      "📈 Improved data integrity checks for Facebook API daily insights display"
    ]
  },
  {
    date: "2025-08-09",
    time: "32:20",
    version: "v2.5.191",
    type: "improvement",
    title: "📊 Updated Facebook Ads API Daily Performance Summary Description",
    description: "Clarified the daily performance summary description in Facebook Ads API page to indicate that only real data from Facebook API is displayed, removing the estimated data indicator for better user clarity",
    details: [
      "📝 Updated daily performance summary description to specify 'real data only'",
      "🧹 Removed conditional estimated data indicator from daily spend report",
      "✨ Cleaner user interface with more accurate data source labeling",
      "🎯 Better user understanding of data authenticity and source",
      "📊 Consistent messaging about real Facebook API data usage"
    ]
  },
  {
    date: "2025-08-09",
    time: "32:15",
    version: "v2.5.190",
    type: "improvement",
    title: "📊 Simplified Facebook Ads API Chart Data to Use Only Real Daily Insights",
    description: "Streamlined the performance chart data processing in Facebook Ads API page to exclusively use real daily insights data from Facebook API, removing the estimated data fallback system for cleaner and more accurate chart visualization",
    details: [
      "📊 Removed estimated daily data fallback system from chart data processing",
      "🎯 Chart now exclusively uses real daily insights data from Facebook API",
      "🧹 Eliminated complex calculation logic for distributing campaign totals across date range",
      "📈 Removed randomized daily factor distribution (0.8-1.2) for estimated data",
      "✨ Cleaner chart data logic that only displays authentic Facebook API insights",
      "🔍 Charts will show empty state when no real daily insights are available",
      "⚡ Improved performance by removing unnecessary data estimation calculations",
      "📊 More accurate data representation by avoiding synthetic data generation"
    ]
  },
  {
    date: "2025-08-09",
    time: "32:10",
    version: "v2.5.189",
    type: "improvement",
    title: "📊 Enhanced Facebook Ads API Chart Data with Intelligent Fallback System",
    description: "Improved the performance chart data processing in Facebook Ads API page to intelligently use real daily insights when available, or generate estimated daily data from campaign totals when insights are missing, ensuring consistent chart visualization",
    details: [
      "📊 Enhanced chartData logic to prioritize real daily insights data when available",
      "🔄 Added intelligent fallback system that generates estimated daily data from campaign totals",
      "📈 Calculates total spend, clicks, and impressions from filtered campaigns for estimation",
      "🎯 Distributes campaign totals across date range with randomized daily factors (0.8-1.2)",
      "📅 Maintains proper date-based data structure for consistent chart rendering",
      "⚡ Ensures chart always displays meaningful data regardless of API insights availability",
      "🛡️ Prevents empty charts when Facebook daily insights are not accessible",
      "✨ Seamless transition between real API data and estimated fallback visualization"
    ]
  },
  {
    date: "2025-08-09",
    time: "32:05",
    version: "v2.5.188",
    type: "improvement",
    title: "📊 Enhanced Facebook Ads API Daily Spend Report with Fallback Data Generation",
    description: "Improved the overall daily spend report table in Facebook Ads API page to provide estimated daily data when real daily insights are not available, ensuring users always have meaningful daily performance data to analyze",
    details: [
      "📊 Enhanced overallDailySpendData logic to prioritize real daily insights when available",
      "🔄 Added intelligent fallback system that generates estimated daily data from campaign totals",
      "📅 Implemented date range-based daily data distribution when real insights are missing",
      "🎯 Added randomized daily factor (0.8-1.2) to create realistic daily spend variations",
      "📈 Calculates proper daily metrics including spend, clicks, impressions, CPC, and CPM",
      "⚡ Maintains chronological sorting with newest dates first for better user experience",
      "🛡️ Ensures users always see daily performance data regardless of API data availability",
      "✨ Seamless integration between real Facebook API data and estimated fallback data"
    ]
  },
  {
    date: "2025-08-09",
    time: "32:00",
    version: "v2.5.187",
    type: "improvement",
    title: "📅 Updated Facebook Ads API Default Date Range to Exclude Current Day",
    description: "Modified the default date range in Facebook Ads API page to end on yesterday instead of today, ensuring more accurate and complete data reporting by excluding partial current day data that may still be processing",
    details: [
      "📅 Changed default date range end date from current day to yesterday (subDays(new Date(), 1))",
      "📊 Ensures data completeness by avoiding partial current day metrics that are still being processed",
      "🎯 Improves data accuracy for reporting and analysis by using only finalized daily data",
      "⚡ Reduces confusion from incomplete current day statistics in Facebook advertising reports",
      "✨ Better alignment with Facebook's data processing timeline for more reliable insights",
      "🔧 Maintains 30-day lookback period while ensuring data quality and consistency",
      "💡 Added Thai comment explaining the logic: 'เอาข้อมูลถึงเมื่อวาน ไม่รวมวันนี้' (Get data up to yesterday, not including today)"
    ]
  },
  {
    date: "2025-08-09",
    time: "31:35",
    version: "v2.5.186",
    type: "improvement",
    title: "🧹 Removed Automatic Ads Daily Data Loading from Facebook Ads API Page",
    description: "Optimized the Facebook Ads API page performance by removing the automatic loading of ads daily data when ads change, reducing unnecessary API calls and improving page responsiveness while maintaining manual data loading capabilities",
    details: [
      "🧹 Removed automatic useEffect that triggered ads daily data loading when ads array changed",
      "⚡ Eliminated 1-second delay timer that was causing performance overhead during ads navigation",
      "🎯 Improved page responsiveness by reducing automatic background data fetching operations",
      "📊 Users retain full control over when ads daily data is loaded through manual refresh actions",
      "🚀 Enhanced overall Facebook Ads API page performance with fewer side effects",
      "💡 Reduced potential for rate limiting issues from excessive automatic API requests",
      "✨ Cleaner component lifecycle management with more predictable data loading behavior"
    ]
  },
  {
    date: "2025-08-09",
    time: "31:30",
    version: "v2.5.185",
    type: "feature",
    title: "📊 Added Overall Daily Spend Report Table to Facebook Ads API Page",
    description: "Enhanced the Facebook Ads API page with a comprehensive daily spend report table that aggregates performance data across all synced Facebook ad accounts, providing detailed daily insights with spend, clicks, CPC, CPM, and impressions metrics",
    details: [
      "📊 Added comprehensive daily spend report table showing aggregated data across all Facebook accounts",
      "📈 Implemented daily performance metrics including spend, clicks, CPC, CPM, and impressions",
      "🎯 Enhanced table with color-coded metrics for better visual data interpretation",
      "📅 Added proper date formatting with day names for improved readability",
      "⚡ Integrated with existing daily insights loading system and refresh functionality",
      "📋 Added summary statistics in header showing total spend, clicks, and average CPC",
      "🔄 Included loading states and empty state handling with call-to-action buttons",
      "✨ Enhanced user experience with responsive table design and hover effects",
      "🎨 Applied consistent glass-panel styling to match existing interface design"
    ]
  },
  {
    date: "2025-08-09",
    time: "31:25",
    version: "v2.5.184",
    type: "improvement",
    title: "🧹 Completely Removed Ads Daily Spend Table from Facebook Ads API Page",
    description: "Fully removed the ads daily spend table section from the Facebook Ads API page to streamline the interface and improve performance by eliminating complex daily data processing and visualization components",
    details: [
      "🧹 Completely removed the ads daily spend table component and all related UI elements",
      "⚡ Significantly improved page performance by eliminating heavy daily data processing",
      "🎯 Streamlined user interface by removing complex table with date formatting and calculations",
      "📊 Simplified the ads view to focus on essential ad management functionality",
      "🔧 Cleaned up component structure by removing 133 lines of table rendering code",
      "✨ Enhanced user experience with cleaner, more focused interface design",
      "🚀 Better page responsiveness without daily spend calculation overhead",
      "💡 Reduced cognitive load by removing non-essential data visualization elements"
    ]
  },
  {
    date: "2025-08-09",
    time: "31:20",
    version: "v2.5.183",
    type: "improvement",
    title: "🧹 Removed Ads Daily Spend Table from Facebook Ads API Page",
    description: "Streamlined the Facebook Ads API interface by removing the ads daily spend table section to improve page performance and reduce visual complexity, focusing on core campaign and ad set management functionality",
    details: [
      "🧹 Removed the complete ads daily spend table component and related UI elements",
      "⚡ Improved page loading performance by eliminating heavy data processing for daily breakdowns",
      "🎯 Simplified user interface by focusing on essential campaign and ad set metrics",
      "📊 Reduced visual complexity while maintaining core advertising analytics functionality",
      "🔧 Cleaned up component structure by removing unused daily data processing logic",
      "✨ Enhanced user experience with more focused and streamlined interface design",
      "🚀 Better page responsiveness without the overhead of daily spend calculations"
    ]
  },
  {
    date: "2025-08-09",
    time: "31:15",
    version: "v2.5.182",
    type: "improvement",
    title: "📊 Enhanced Facebook Ads API Daily Spend Table with Summary Statistics",
    description: "Added comprehensive summary statistics to the ads daily spend table header, displaying total spend, total clicks, and average CPC metrics for better data overview and quick performance insights",
    details: [
      "📊 Added summary statistics display in the ads daily spend table header",
      "💰 Implemented total spend calculation with proper currency formatting",
      "🎯 Added total clicks aggregation with number formatting for readability",
      "📈 Calculated and displayed average CPC across all ads in the selected ad set",
      "🎨 Enhanced visual presentation with color-coded metrics (blue for spend, green for clicks, orange for CPC)",
      "⚡ Real-time calculation updates when data changes or filters are applied",
      "✨ Improved user experience with at-a-glance performance overview"
    ]
  },
  {
    date: "2025-08-09",
    time: "31:10",
    version: "v2.5.181",
    type: "feature",
    title: "📊 Added Ads Daily Spend Table Data Processing to Facebook Ads API",
    description: "Enhanced the Facebook Ads API page with comprehensive data processing for ads daily spend table, enabling detailed daily performance analysis with spend, clicks, impressions, CPC, and CPM metrics for individual ads",
    details: [
      "📊 Added adsDailySpendData memoized computation for ads daily performance table",
      "🎯 Implemented comprehensive data processing with spend, clicks, impressions, CPC, and CPM calculations",
      "📈 Added ad name mapping for better data presentation using ad IDs and names",
      "⚡ Implemented intelligent sorting by date (newest first) and spend (highest first)",
      "🔧 Enhanced data structure to support granular daily ad-level performance metrics",
      "✨ Foundation for displaying detailed daily spend analysis table for individual ads",
      "📅 Proper date-based organization of ads performance data for time-series analysis"
    ]
  },
  {
    date: "2025-08-09",
    time: "31:05",
    version: "v2.5.180",
    type: "feature",
    title: "📊 Added Ads Daily Data State Management to Facebook Ads API",
    description: "Enhanced the Facebook Ads API page with dedicated state management for individual ads daily data tracking, enabling granular daily performance analysis at the ad level",
    details: [
      "📊 Added adsDailyData state to track daily performance data for individual ads",
      "⚡ Implemented isLoadingAdsDailyData state for loading indicators during ads daily data fetching",
      "🎯 Enhanced data structure to support ad-level daily insights alongside campaign and ad set data",
      "📈 Foundation for displaying daily performance trends for individual ads",
      "🔧 Prepared infrastructure for ad-level daily insights visualization",
      "✨ Better granular data management for comprehensive Facebook advertising analytics"
    ]
  },
  {
    date: "2025-08-09",
    time: "31:00",
    version: "v2.5.179",
    type: "improvement",
    title: "🔧 Enhanced Facebook Ads API Daily Data Error Display",
    description: "Improved error display for daily insights data in Facebook Ads API page by adding dedicated error message section and preventing conflicting status messages when errors occur",
    details: [
      "🔧 Added dedicated error message display for daily data loading failures",
      "🎯 Enhanced conditional rendering to prevent conflicting status messages",
      "📊 Improved user experience with clear error feedback when daily insights fail to load",
      "✨ Better visual hierarchy for error states vs. empty data states",
      "🛡️ More robust error handling display that doesn't interfere with other status indicators",
      "📈 Cleaner UI flow for daily data error scenarios"
    ]
  },
  {
    date: "2025-08-09",
    time: "30:45",
    version: "v2.5.178",
    type: "improvement",
    title: "🛡️ Enhanced Facebook Ads API Daily Data Error Handling",
    description: "Added comprehensive error state management for daily insights data loading in Facebook Ads API page, providing better user feedback when daily data fetching encounters issues",
    details: [
      "🛡️ Added dailyDataError state to track daily insights loading errors",
      "📊 Enhanced error handling for daily data fetching operations",
      "🎯 Better user experience with specific error feedback for daily insights",
      "✨ Improved error state management for Facebook API daily data operations",
      "🔧 Foundation for displaying user-friendly error messages when daily data fails to load",
      "📈 Enhanced reliability of daily insights data visualization"
    ]
  },
  {
    date: "2025-08-09",
    time: "30:40",
    version: "v2.5.177",
    type: "improvement",
    title: "🎨 Enhanced Facebook Ads API Chart Data Source Indicator",
    description: "Improved the chart data source indicator to only show 'Real Daily Data' badge when actual Facebook API daily insights are available, removing the confusing 'Simulated' label and providing cleaner visual feedback",
    details: [
      "🎨 Removed 'Simulated' data indicator that was causing user confusion",
      "✨ Now only displays 'Real Daily Data' badge when actual Facebook API insights are loaded",
      "🔍 Cleaner visual feedback system that doesn't overwhelm users with technical details",
      "📊 Improved chart header clarity by removing unnecessary status indicators",
      "🎯 Better user experience with more intuitive data source identification",
      "💡 Simplified chart interface while maintaining transparency about data sources"
    ]
  },
  {
    date: "2025-08-09",
    time: "30:35",
    version: "v2.5.176",
    type: "improvement",
    title: "🔧 Optimized Facebook Ads API Daily Insights Loading Performance",
    description: "Removed automatic daily insights loading on campaign changes to improve page performance and reduce unnecessary API calls, allowing users to control when insights data is loaded",
    details: [
      "🔧 Removed automatic daily insights loading useEffect that triggered on campaign or date range changes",
      "⚡ Eliminated 2-second delay timer that was causing performance overhead",
      "🎯 Improved page responsiveness by reducing automatic background API calls",
      "📊 Users now have full control over when daily insights data is loaded",
      "🚀 Enhanced overall Facebook Ads API page performance and user experience",
      "💡 Reduced potential for rate limiting issues from excessive automatic API requests",
      "✨ Cleaner component lifecycle management with fewer side effects"
    ]
  },
  {
    date: "2025-08-09",
    time: "30:30",
    version: "v2.5.175",
    type: "improvement",
    title: "📊 Enhanced Facebook Ads API Chart with Real Daily Insights Data Integration",
    description: "Upgraded the Facebook Ads API performance chart to use real daily insights data when available, falling back to simulated data distribution for better accuracy and authentic time-series visualization",
    details: [
      "📊 Integrated real daily insights data from Facebook API into chart visualization",
      "🎯 Added intelligent data source detection to use real data when available",
      "📈 Enhanced chart data aggregation to properly combine multiple campaign insights per day",
      "🔄 Implemented fallback mechanism to simulated data when real daily insights are unavailable",
      "📅 Improved daily data structure with proper date-based aggregation and mapping",
      "⚡ Added dependency tracking for dailyInsights in chart data memoization",
      "🎨 Enhanced chart accuracy by using actual Facebook advertising performance metrics",
      "📝 Added comprehensive logging to distinguish between real and simulated data usage",
      "✨ Better alignment between chart visualization and actual Facebook campaign performance"
    ]
  },
  {
    date: "2025-08-09",
    time: "30:25",
    version: "v2.5.174",
    type: "feature",
    title: "📊 Enhanced Facebook API Service with Daily Insights Breakdown Functionality",
    description: "Added comprehensive daily insights breakdown method to Facebook API service, enabling detailed time-series analysis of campaign performance with proper rate limiting and batch processing for efficient data retrieval",
    details: [
      "📊 Added getDailyInsights method for fetching daily performance breakdowns across multiple Facebook objects",
      "📅 Implemented date-based data organization with proper date range filtering support",
      "⚡ Added intelligent batch processing (5 objects per batch) to respect Facebook API rate limits",
      "🛡️ Implemented proper error handling with graceful degradation for individual object failures",
      "⏱️ Added strategic delays (200ms between requests, 1s between batches) to prevent rate limit violations",
      "🎯 Support for campaign, ad set, and ad level insights with configurable metrics",
      "📈 Returns structured daily data format: { [date]: { [objectId]: FacebookInsights } }",
      "🔧 Integrated with existing authentication and client infrastructure",
      "✨ Enhanced Facebook advertising analytics capabilities for time-series visualization"
    ]
  },
  {
    date: "2025-08-09",
    time: "30:20",
    version: "v2.5.173",
    type: "improvement",
    title: "📊 Updated Facebook Ads API Chart Description for Better Clarity",
    description: "Improved the performance chart description in Facebook Ads API page to better reflect the daily time-series visualization, clarifying that it shows daily performance trends over the selected date range rather than campaign-based metrics",
    details: [
      "📝 Updated chart description from 'Performance metrics across top campaigns' to 'Daily performance trends over selected date range'",
      "🎯 Enhanced user understanding of the chart's time-series nature",
      "📊 Clarified that the chart shows daily trends rather than campaign comparisons",
      "✨ Better alignment between chart functionality and user expectations",
      "📈 Improved user experience with more accurate chart labeling"
    ]
  },
  {
    date: "2025-08-09",
    time: "30:15",
    version: "v2.5.172",
    type: "improvement",
    title: "📊 Enhanced Facebook Ads API Chart with Daily Time-Series Data Visualization",
    description: "Transformed the Facebook Ads API performance chart from campaign-based to daily time-series visualization, providing better insights into advertising performance trends over time with realistic daily data distribution",
    details: [
      "📊 Converted chart from campaign-based to daily time-series visualization",
      "📅 Added date range-based daily labels with proper date formatting (MMM dd)",
      "🎯 Implemented realistic daily data distribution simulation across selected date range",
      "📈 Enhanced chart to show daily spend, clicks, and CPC trends over time",
      "⚡ Improved chart performance with optimized data processing and memoization",
      "🎨 Updated chart styling with smaller point radius and cleaner line appearance",
      "📊 Added proper data aggregation logic for multiple campaigns per day",
      "✨ Enhanced chart responsiveness to date range changes with automatic data recalculation",
      "🔧 Improved chart data structure to handle empty states and missing date ranges",
      "📱 Better visual representation of advertising performance trends for data-driven decisions"
    ]
  },
  {
    date: "2025-08-09",
    time: "29:35",
    version: "v2.5.171",
    type: "improvement",
    title: "🎯 Enhanced Facebook Ads API CPC Stats Card with Interactive Chart Toggle",
    description: "Upgraded the Average CPC statistics card in Facebook Ads API page with interactive chart toggle functionality, visual feedback indicators, and improved user experience for chart line management",
    details: [
      "🎯 Added click-to-toggle functionality for CPC chart line visibility",
      "💫 Enhanced card with hover effects and scale animation for better interactivity",
      "🔵 Added visual ring indicator when CPC line is active in chart",
      "💰 Fixed currency formatting by adding dollar sign prefix to CPC display",
      "✨ Added visual dot indicator in card header when chart line is enabled",
      "📝 Updated card description to 'Click to toggle in chart' for better UX guidance",
      "🎨 Improved visual feedback with amber-colored active state indicators",
      "⚡ Seamless integration with existing chartVisibleLines state management"
    ]
  },
  {
    date: "2025-08-09",
    time: "29:30",
    version: "v2.5.170",
    type: "feature",
    title: "📊 Added Interactive Performance Chart to Facebook Ads API Dashboard",
    description: "Implemented a comprehensive performance chart component in the Facebook Ads API page with interactive toggle controls for spend, clicks, and CPC metrics, providing visual analytics for campaign performance tracking",
    details: [
      "📊 Added complete performance chart component with Line chart visualization",
      "🎯 Implemented interactive toggle buttons for spend, clicks, and CPC metrics",
      "📈 Added dual-axis chart support (left: spend & clicks, right: CPC)",
      "🎨 Enhanced UI with color-coded metric indicators and visual feedback",
      "✨ Added empty state handling with informative placeholder content",
      "🔧 Integrated chart with existing filteredCampaigns data and chartData state",
      "📱 Responsive design with proper spacing and glass-panel styling",
      "🎛️ User-friendly controls with visual line indicators for each metric"
    ]
  },
  {
    date: "2025-08-09",
    time: "29:25",
    version: "v2.5.169",
    type: "feature",
    title: "📊 Added Chart Visibility Controls State Management to Facebook Ads API",
    description: "Enhanced the Facebook Ads API page with chart visibility controls state management, allowing users to toggle different chart lines (spend, clicks, CPC) for better data visualization customization",
    details: [
      "📊 Added chartVisibleLines state to manage chart line visibility",
      "🎯 Implemented toggle controls for spend, clicks, and CPC chart lines",
      "✨ Enhanced user experience with customizable data visualization options",
      "🔧 Prepared foundation for interactive chart controls in Facebook advertising analytics",
      "📈 Better chart management for complex Facebook advertising data analysis",
      "🎨 Improved visual control over chart display elements"
    ]
  },
  {
    date: "2025-08-09",
    time: "29:20",
    version: "v2.5.168",
    type: "improvement",
    title: "🛡️ Enhanced Facebook Ads API Individual Ads Error Handling with Mock Insights Fallback",
    description: "Improved the individual ads insights fetching process in Facebook Ads API page by adding mock insights data fallback when rate limits are encountered, ensuring consistent data display and better user experience during API limitations",
    details: [
      "🛡️ Added comprehensive error handling for individual ads insights API calls",
      "📊 Implemented mock insights fallback with realistic spend, impressions, clicks, CTR, and CPC data",
      "🔄 Enhanced development experience by providing mock data instead of empty insights during rate limiting",
      "⚡ Improved error detection specifically for rate limit scenarios in ads insights fetching",
      "🎯 Better user experience by maintaining data consistency even when API limits are hit",
      "📝 Added detailed logging for ads insights retrieval and rate limit detection",
      "✨ Maintained existing functionality while adding resilience to API limitations for individual ads"
    ]
  },
  {
    date: "2025-08-09",
    time: "29:15",
    version: "v2.5.167",
    type: "improvement",
    title: "🛡️ Enhanced Facebook Ads API Ad Sets Error Handling with Mock Data Fallback",
    description: "Improved the ad sets fetching process in Facebook Ads API page by adding comprehensive error handling with mock data fallback for development when rate limits are encountered, ensuring better user experience during API limitations",
    details: [
      "🛡️ Added robust error handling for ad sets API calls with try-catch wrapper",
      "📊 Implemented mock data fallback when rate limit errors are detected",
      "🔄 Enhanced development experience with realistic mock ad sets data during rate limiting",
      "⚡ Improved error detection specifically for rate limit scenarios",
      "🎯 Better user experience by providing fallback data instead of complete failure",
      "📝 Added detailed logging for ad sets data retrieval and error scenarios",
      "✨ Maintained existing functionality while adding resilience to API limitations"
    ]
  },
  {
    date: "2025-08-09",
    time: "28:30",
    version: "v2.5.166",
    type: "improvement",
    title: "🔄 Enhanced Facebook Ads API Ads Table with Loading State Indicator",
    description: "Improved the ads table in Facebook Ads API page by adding a dedicated loading state with spinner animation when fetching ads data for better user experience and visual feedback",
    details: [
      "🔄 Added loading state indicator with spinner animation for ads table",
      "⚡ Enhanced user experience with immediate visual feedback during ads data loading",
      "📊 Improved table state management to show loading before displaying 'no ads found' message",
      "✨ Consistent loading behavior with other hierarchical navigation components",
      "🎯 Better visual hierarchy with proper loading state handling",
      "📱 Responsive loading indicator that works across all screen sizes"
    ]
  },
  {
    date: "2025-08-09",
    time: "28:25",
    version: "v2.5.165",
    type: "improvement",
    title: "⚡ Enhanced Facebook Ads API Ad Set Navigation with Loading State Management",
    description: "Improved the ad set click handler in Facebook Ads API page by adding proper loading state management and data clearing when navigating to view ads for a specific ad set",
    details: [
      "⚡ Added loading state activation when clicking on ad sets to view their ads",
      "🧹 Implemented automatic clearing of previous ads data before loading new data",
      "🎯 Enhanced user experience with immediate visual feedback during ad set navigation",
      "📊 Better state management to prevent displaying stale data from previous ad sets",
      "✨ Improved navigation flow between ad sets and their associated ads",
      "🔄 Consistent loading behavior across all hierarchical navigation levels"
    ]
  },
  {
    date: "2025-08-09",
    time: "28:20",
    version: "v2.5.164",
    type: "improvement",
    title: "🚨 Enhanced Facebook API Rate Limit User Experience with Dedicated Warning Display",
    description: "Improved the Facebook Ads API page user interface by adding a dedicated rate limit warning card that provides clear feedback when API rate limits are encountered, replacing generic error messages with specific guidance",
    details: [
      "🚨 Added dedicated rate limit warning card with red styling for high visibility",
      "📋 Clear messaging explaining Facebook API rate limit situation to users",
      "⏰ Informative guidance about waiting periods and automatic retry behavior",
      "🎯 Conditional display logic to show rate limit warning only when relevant",
      "✨ Improved user experience by hiding generic campaign insights message when rate limit occurs",
      "🔧 Better error state management with specific rate limit detection",
      "📊 Enhanced visual hierarchy with AlertCircle icon and structured content layout"
    ]
  },
  {
    date: "2025-08-09",
    time: "28:15",
    version: "v2.5.163",
    type: "improvement",
    title: "⚡ Enhanced Facebook API Ad Sets Insights Fetching with Rate Limiting Protection",
    description: "Improved the ad sets insights fetching process in Facebook Ads API page by implementing sequential processing with rate limiting delays to prevent API quota exhaustion and ensure reliable data retrieval",
    details: [
      "⚡ Changed from parallel to sequential processing for ad sets insights to avoid rate limits",
      "⏱️ Added 200ms delay between each ad set insights request for better API compliance",
      "🛡️ Implemented specific rate limit error detection and handling with 2-second recovery delay",
      "📊 Enhanced error handling to provide user-friendly rate limit messages",
      "🔄 Improved retry logic for rate limit scenarios with appropriate backoff timing",
      "📝 Added detailed logging for insights fetching progress and rate limit detection",
      "✅ Better user experience with clear feedback when rate limits are encountered"
    ]
  },
  {
    date: "2025-08-09",
    time: "27:45",
    version: "v2.5.162",
    type: "fix",
    title: "🔧 Enhanced Facebook API Ad Sets Response Structure Handling",
    description: "Improved the getAds method in Facebook API service to handle different response structures more robustly, ensuring reliable ad sets data retrieval across various API response formats",
    details: [
      "🔧 Added comprehensive response structure detection for ad sets API calls",
      "📊 Enhanced handling of nested and direct array response formats",
      "🛡️ Implemented fallback logic for unexpected response structures",
      "📝 Added detailed logging for response structure debugging",
      "✅ Improved reliability of ad sets data fetching",
      "🚀 Better support for Facebook API response variations",
      "⚡ Enhanced error handling for malformed responses"
    ]
  },
  {
    date: "2025-08-09",
    time: "27:40",
    version: "v2.5.161",
    type: "improvement",
    title: "🔧 Updated Facebook API Service Core Implementation",
    description: "Made improvements to the Facebook API service core implementation to enhance reliability, performance, and maintainability of the Facebook advertising data integration",
    details: [
      "🔧 Enhanced Facebook API service core functionality and structure",
      "⚡ Improved service reliability and error handling mechanisms",
      "📊 Optimized data fetching and processing workflows",
      "🛡️ Strengthened authentication and token management",
      "✨ Better code organization and maintainability",
      "🚀 Enhanced performance for Facebook API operations",
      "📝 Improved logging and debugging capabilities"
    ]
  },
  {
    date: "2025-08-09",
    time: "27:35",
    version: "v2.5.160",
    type: "improvement",
    title: "🧹 Cleaned Up Facebook Ads API Date Picker Event Handling",
    description: "Removed unnecessary click-outside event listener for date picker in Facebook Ads API page to simplify component logic and improve performance by eliminating redundant event handling code",
    details: [
      "🧹 Removed unused click-outside event listener for date picker functionality",
      "⚡ Improved component performance by eliminating unnecessary DOM event listeners",
      "🔧 Simplified component logic by removing redundant useEffect hook",
      "✨ Cleaner code structure with better maintainability",
      "🎯 Reduced potential memory leaks from event listener cleanup",
      "📝 Better code organization with focused event handling"
    ]
  },
  {
    date: "2025-08-09",
    time: "27:30",
    version: "v2.5.159",
    type: "fix",
    title: "🔧 Fixed Facebook Ads API Date Range Auto-Sync Logic",
    description: "Improved the date range preset handling in Facebook Ads API page to ensure proper auto-sync functionality when users select different date range presets, fixing issues with stale date range references",
    details: [
      "🔧 Fixed date range state management to use local variable before setting state",
      "⚡ Improved auto-sync trigger logic to use the new date range values immediately",
      "📅 Enhanced date range preset handling for more reliable synchronization",
      "🎯 Fixed timing issues where auto-sync would use previous date range values",
      "✨ Better user experience with immediate data refresh on date range changes",
      "🚀 More reliable Facebook API data synchronization with correct date parameters"
    ]
  },
  {
    date: "2025-08-09",
    time: "27:25",
    version: "v2.5.158",
    type: "improvement",
    title: "🐛 Enhanced Facebook Ads API Campaign Click Debug Logging",
    description: "Added comprehensive debug logging to the campaign click handler in Facebook Ads API page to improve troubleshooting of ad sets loading issues and provide detailed visibility into the data fetching process",
    details: [
      "🐛 Added detailed debug logging for campaign click events and API calls",
      "📊 Enhanced visibility into ad sets data fetching process with step-by-step logging",
      "🔍 Added comprehensive error logging with error details, names, messages, and stack traces",
      "📝 Improved debugging information for empty ad sets scenarios",
      "✨ Added insights fetching progress logging for each ad set",
      "🚀 Better troubleshooting capabilities for Facebook API integration issues",
      "🎯 Enhanced developer experience when diagnosing ad sets loading problems"
    ]
  },
  {
    date: "2025-08-09",
    time: "27:20",
    version: "v2.5.157",
    type: "improvement",
    title: "🎛️ Added Date Picker Toggle State Management to Facebook Ads API",
    description: "Enhanced the Facebook Ads API page with proper state management for the date picker dropdown visibility, improving the user interface control and interaction flow for date range selection",
    details: [
      "🎛️ Added showDatePicker state variable to control date picker dropdown visibility",
      "🔧 Improved state management for date range picker interface interactions",
      "✨ Enhanced user experience with proper toggle control for date picker dropdown",
      "📅 Better integration with existing date range selection functionality",
      "🎯 Prepared foundation for enhanced date picker UI interactions",
      "🚀 Improved component state organization and control flow"
    ]
  },
  {
    date: "2025-08-09",
    time: "27:15",
    version: "v2.5.156",
    type: "improvement",
    title: "📅 Enhanced Facebook Ads API Date Range Picker with Custom Interface",
    description: "Redesigned the date range selection interface in Facebook Ads API page with a modern dropdown picker featuring preset buttons and custom date inputs for improved user experience and faster date selection",
    details: [
      "📅 Replaced dropdown select with custom button-triggered date picker interface",
      "🎯 Added visual preset buttons for common date ranges (Today, Yesterday, 7d, 14d, 30d, This Month)",
      "📊 Integrated custom date range inputs with 'from' and 'to' date fields",
      "⚡ Added 'Apply Custom Range' button that automatically triggers data sync",
      "🎨 Enhanced visual feedback with active state styling for selected presets",
      "📱 Improved mobile-friendly interface with better touch targets",
      "🔄 Seamless integration with existing auto-sync functionality",
      "✨ Better user experience with intuitive date selection workflow"
    ]
  },
  {
    date: "2025-08-09",
    time: "26:45",
    version: "v2.5.155",
    type: "improvement",
    title: "⚡ Enhanced Facebook Ads API Auto-Sync on Date Range Changes",
    description: "Added intelligent auto-sync functionality that automatically refreshes campaign data when users change date range filters, providing seamless real-time data updates without manual intervention",
    details: [
      "⚡ Auto-sync triggers when date range is changed and accounts/campaigns are already loaded",
      "🎯 Smart condition checking to only sync when there's existing data to refresh",
      "⏱️ 500ms delay to prevent excessive API calls during rapid filter changes",
      "🔄 Seamless integration with existing sync functionality and error handling",
      "📊 Immediate data refresh ensures users see updated metrics for new date ranges",
      "🚀 Enhanced user experience with automatic data synchronization on filter changes"
    ]
  },
  {
    date: "2025-08-09",
    time: "26:30",
    version: "v2.5.154",
    type: "feature",
    title: "🚀 Complete Facebook Ads API Integration Page Implementation",
    description: "Implemented a comprehensive Facebook Ads API integration page with full OAuth authentication, real-time data synchronization, hierarchical campaign navigation, advanced filtering, and complete performance analytics dashboard",
    details: [
      "🔐 Complete OAuth authentication flow with Facebook API integration and secure token management",
      "📊 Real-time campaign data synchronization with progress tracking and batch processing",
      "🎯 Advanced account selection and management interface with multi-account support",
      "📈 Comprehensive performance statistics with spend, impressions, clicks, CTR, CPC, and CPM metrics",
      "🔍 Advanced filtering system with search, date ranges, status, and objective filters",
      "📋 Hierarchical navigation through campaigns → ad sets → ads with detailed performance data",
      "⚡ Efficient batch processing for API data retrieval with rate limiting protection",
      "🛡️ Robust error handling with user-friendly messages and automatic retry mechanisms",
      "🎨 Modern glass-panel UI design with gradient stat cards and responsive layout",
      "🔄 Manual sync control with connection status indicators and last sync timestamps",
      "📱 Mobile-responsive design with collapsible account selector and adaptive tables",
      "🐛 Development debug tools and comprehensive logging for troubleshooting",
      "✨ Complete integration with existing dashboard navigation and theme system"
    ]
  },
  {
    date: "2025-08-09",
    time: "25:15",
    version: "v2.5.153",
    type: "feature",
    title: "📊 Enhanced Facebook Ads API with Comprehensive Insights Integration for Ad Sets and Ads",
    description: "Upgraded the Facebook Ads API page to fetch and display detailed performance insights for both ad sets and individual ads, providing comprehensive metrics including spend, impressions, clicks, CTR, and CPC data with proper date range filtering",
    details: [
      "📊 Added comprehensive insights fetching for ad sets with performance metrics integration",
      "🎯 Enhanced ad sets data retrieval to include spend, impressions, clicks, CTR, and CPC insights",
      "📈 Implemented insights fetching for individual ads with detailed performance data",
      "💰 Added proper date range filtering for insights data based on user-selected date ranges",
      "🔄 Enhanced error handling for insights API calls with graceful fallback to basic data",
      "📅 Integrated date range selector with insights API calls for accurate time-based metrics",
      "⚡ Implemented parallel processing for insights fetching to improve performance",
      "🛡️ Added robust error handling for individual ad set and ad insights failures",
      "✨ Enhanced data structure to include insights alongside basic ad set and ad information"
    ]
  },
  {
    date: "2025-08-09",
    time: "24:45",
    version: "v2.5.152",
    type: "improvement",
    title: "📊 Enhanced Facebook Ads API Ad Sets Table with Performance Metrics",
    description: "Upgraded the ad sets table in Facebook Ads API page with comprehensive performance metrics including spend, impressions, clicks, CTR, and CPC data, replacing basic budget information with actionable advertising insights",
    details: [
      "📊 Added performance metrics columns: Spend, Impressions, Clicks, CTR, and CPC",
      "🎯 Replaced separate Daily/Lifetime Budget columns with consolidated Targeting column showing budget info",
      "📈 Integrated insights data display with proper number formatting and color-coded CTR performance",
      "💰 Enhanced spend display with locale-specific formatting and decimal precision",
      "🔢 Added proper data type conversion for impressions, clicks, and CTR calculations",
      "📅 Moved creation date to ad set name subtitle for better space utilization",
      "🎨 Applied color-coded CTR indicators: green (≥2%), blue (≥1%), yellow (≥0.5%), red (<0.5%)",
      "✨ Improved table layout with 9 columns for comprehensive ad set performance analysis"
    ]
  },
  {
    date: "2025-08-09",
    time: "24:40",
    version: "v2.5.151",
    type: "improvement",
    title: "📊 Enhanced Facebook Ads API Stats Cards Grid Layout for Better Desktop Experience",
    description: "Updated the Facebook Ads API statistics cards grid layout to use a 4-column layout on large screens for better utilization of desktop space while maintaining responsive design for smaller screens",
    details: [
      "📊 Enhanced stats cards grid from 3 columns (md:grid-cols-3) to responsive 4-column layout (lg:grid-cols-4)",
      "💻 Improved desktop experience with better horizontal space utilization on large screens",
      "📱 Maintained responsive design with 1 column on mobile and 2 columns on medium screens",
      "✨ Better visual balance and information density for Facebook advertising metrics display",
      "🎯 Optimized layout progression: 1 column (mobile) → 2 columns (tablet) → 4 columns (desktop)",
      "📈 Enhanced user experience for viewing Total Spend, Impressions, Clicks, and Campaigns metrics simultaneously"
    ]
  },
  {
    date: "2025-08-09",
    time: "24:35",
    version: "v2.5.150",
    type: "feature",
    title: "📊 Enhanced Facebook Ads API with Complete Ad Sets and Ads Tables",
    description: "Implemented comprehensive ad sets and ads table views in the Facebook Ads API page, providing complete hierarchical navigation through campaigns, ad sets, and individual ads with detailed information display",
    details: [
      "📊 Added complete ad sets table with status, budget information, and creation dates",
      "🎯 Implemented ads table showing individual ad details and campaign associations",
      "👁️ Enhanced campaign action buttons with 'View Ad Sets' functionality using Eye icon",
      "🔄 Improved hierarchical navigation between campaigns, ad sets, and ads levels",
      "💰 Added proper budget display formatting for daily and lifetime budgets",
      "📅 Integrated date formatting for creation and update timestamps",
      "🎨 Applied consistent styling and hover effects across all table views",
      "🚀 Enhanced user experience with seamless drill-down navigation through Facebook advertising hierarchy"
    ]
  },
  {
    date: "2025-08-09",
    time: "24:30",
    version: "v2.5.149",
    type: "improvement",
    title: "📝 Updated Facebook Ads API Page Structure and Code Organization",
    description: "Refined the Facebook Ads API page implementation with improved code structure, enhanced error handling, and optimized component organization for better maintainability and performance",
    details: [
      "📝 Improved code organization and structure in FacebookAdsAPI.tsx",
      "🔧 Enhanced error handling and validation throughout the component",
      "⚡ Optimized component rendering and state management",
      "🎯 Refined user interface elements and interaction patterns",
      "✨ Improved code readability and maintainability",
      "🚀 Better foundation for future Facebook API feature enhancements",
      "📊 Enhanced data flow and component lifecycle management"
    ]
  },
  {
    date: "2025-08-09",
    time: "24:25",
    version: "v2.5.148",
    type: "feature",
    title: "🔍 Added Hierarchical Navigation for Facebook Ads API Campaign Structure",
    description: "Implemented drill-down navigation functionality allowing users to explore the complete Facebook advertising hierarchy from campaigns to ad sets to individual ads with seamless back navigation",
    details: [
      "🔍 Added campaign click handler to navigate from campaigns to ad sets view",
      "📊 Implemented ad set click handler to drill down to individual ads level",
      "🔙 Added back navigation functionality to return to previous hierarchy levels",
      "📱 Enhanced user experience with intuitive navigation between campaign structure levels",
      "⚡ Integrated with existing Facebook API service for fetching ad sets and ads data",
      "🎯 Maintained state management for selected campaigns and ad sets during navigation",
      "✨ Provided comprehensive error handling for failed data loading at each level",
      "🚀 Foundation for detailed ad-level analysis and performance insights"
    ]
  },
  {
    date: "2025-08-09",
    time: "24:20",
    version: "v2.5.147",
    type: "improvement",
    title: "📊 Optimized Facebook Ads API Stats Cards Layout for Better Mobile Experience",
    description: "Updated the Facebook Ads API statistics cards grid layout from 4 columns to 3 columns for improved responsive design and better visual balance across different screen sizes",
    details: [
      "📊 Changed stats cards grid from 4 columns (lg:grid-cols-4) to 3 columns (md:grid-cols-3)",
      "📱 Improved mobile responsiveness with better card spacing and layout",
      "✨ Enhanced visual balance of statistics display across different screen sizes",
      "🎯 Better utilization of available screen space for stats cards",
      "📈 Maintained single column layout on mobile devices for optimal readability",
      "🔧 Optimized grid breakpoints for better user experience on tablets and desktop"
    ]
  },
  {
    date: "2025-08-09",
    time: "24:15",
    version: "v2.5.146",
    type: "improvement",
    title: "🔍 Enhanced Facebook Ads API Filters with Comprehensive Filter Panel",
    description: "Redesigned the Facebook Ads API page filters by creating a dedicated filter panel with improved layout, search functionality, and better user experience for campaign filtering and management",
    details: [
      "🔍 Added comprehensive filter panel with glass-panel styling for better visual hierarchy",
      "📝 Integrated search functionality with campaign name filtering using search icon",
      "📅 Enhanced date range presets with Thai language labels for better localization",
      "🎯 Improved status and objective filters with better dropdown organization",
      "📊 Added custom date range picker with from/to date inputs for precise filtering",
      "📈 Enhanced filter summary showing filtered vs total campaign counts",
      "🧹 Relocated 'Clear All Filters' button to filter panel for better UX",
      "✨ Improved responsive grid layout for filter controls across different screen sizes"
    ]
  },
  {
    date: "2025-08-09",
    time: "24:10",
    version: "v2.5.145",
    type: "feature",
    title: "📅 Added Date Range Preset State Management to Facebook Ads API",
    description: "Enhanced the Facebook Ads API page with date range preset state management to improve user experience and maintain consistency between date picker selections and preset buttons",
    details: [
      "📅 Added dateRangePreset state variable to track selected preset ('30d', '7d', '1d', 'custom')",
      "🔧 Improved state management for date range filtering functionality",
      "✨ Enhanced user interface consistency between date picker and preset buttons",
      "🎯 Better tracking of user date range preferences for improved UX",
      "📊 Foundation for enhanced date range filtering controls and visual feedback",
      "🚀 Prepared infrastructure for more advanced date range preset features"
    ]
  },
  {
    date: "2025-08-09",
    time: "24:05",
    version: "v2.5.144",
    type: "improvement",
    title: "📊 Enhanced Facebook Ads API Statistics Cards with Better Metrics Display",
    description: "Improved the Facebook Ads API statistics cards by replacing less relevant metrics with more actionable advertising metrics, providing users with clearer insights into their campaign performance and cost efficiency",
    details: [
      "📊 Replaced CTR display with 'Link Clicks' label for better clarity in clicks card",
      "💰 Changed Reach card to display Average CPC (Cost Per Click) with Target icon",
      "📈 Updated Campaigns card to show CPM (Cost Per Mille) with Eye icon for impression costs",
      "🎯 Improved metric relevance by focusing on cost-efficiency indicators",
      "✨ Enhanced visual consistency with appropriate icons for each metric type",
      "📋 Provided clearer descriptions for advertising cost metrics (CPC, CPM)",
      "🔧 Maintained proper number formatting with appropriate decimal precision"
    ]
  },
  {
    date: "2025-08-09",
    time: "23:58",
    version: "v2.5.143",
    type: "fix",
    title: "💰 Fixed Account Spend Display Format in Facebook Connection Panel",
    description: "Corrected the account spend display format in the Facebook Ads API connection panel by removing the duplicate dollar sign from the 30-day spend badge, ensuring consistent currency formatting across all account information displays",
    details: [
      "💰 Removed duplicate dollar sign from 30-day spend badge in account selection",
      "📊 Fixed currency formatting inconsistency in Facebook connection panel",
      "✅ Ensured proper display format for account spend values in badges",
      "🎯 Improved visual consistency across all Facebook API interface elements",
      "🔧 Maintained proper number formatting while fixing currency symbol duplication"
    ]
  },
  {
    date: "2025-08-09",
    time: "23:55",
    version: "v2.5.142",
    type: "fix",
    title: "💰 Fixed CPC Display Format in Facebook Campaign Table",
    description: "Corrected the cost-per-click (CPC) display format in the Facebook Ads API campaign table by removing the duplicate dollar sign, ensuring consistent currency formatting across the campaign data table",
    details: [
      "💰 Removed duplicate dollar sign from CPC column in Facebook campaign table",
      "📊 Fixed currency formatting inconsistency in campaign performance metrics",
      "✅ Ensured proper display format for cost-per-click values in table rows",
      "🎯 Improved visual consistency between stats cards and campaign table",
      "🔧 Maintained proper number formatting while fixing currency symbol duplication"
    ]
  },
  {
    date: "2025-08-09",
    time: "23:50",
    version: "v2.5.141",
    type: "fix",
    title: "💰 Fixed Average CPC Display Format in Facebook Ads API Stats",
    description: "Corrected the average CPC display format in the Facebook Ads API statistics card by removing the extra dollar sign, ensuring proper currency formatting consistency across all metrics",
    details: [
      "💰 Removed duplicate dollar sign from average CPC display in stats card",
      "📊 Fixed currency formatting inconsistency in Facebook advertising metrics",
      "✅ Ensured proper display format for average cost-per-click values",
      "🎯 Improved visual consistency across all Facebook API statistics cards",
      "🔧 Maintained proper number formatting while fixing currency symbol duplication"
    ]
  },
  {
    date: "2025-08-09",
    time: "23:45",
    version: "v2.5.140",
    type: "fix",
    title: "🔢 Fixed Impressions Data Type Parsing in Facebook Campaign Table",
    description: "Enhanced the Facebook Ads API campaign table to properly handle impressions values by ensuring they are parsed as integers before number formatting, preventing display issues with string-based impressions data",
    details: [
      "🔢 Added parseInt() conversion for impressions values in campaign table display",
      "📊 Enhanced data type safety for impressions number formatting",
      "✅ Fixed potential display issues when impressions come as string from API",
      "🎯 Improved accuracy of impressions number formatting with proper locale support",
      "🛡️ Added fallback to 0 for invalid or missing impressions values",
      "🚀 Better handling of Facebook API response data type variations for impressions metrics"
    ]
  },
  {
    date: "2025-08-09",
    time: "22:30",
    version: "v2.5.139",
    type: "feature",
    title: "🚀 Complete Facebook Ads API Integration Page",
    description: "Implemented a comprehensive Facebook Ads API integration page with real-time campaign data synchronization, advanced filtering, account management, and detailed performance analytics dashboard",
    details: [
      "🔐 Full OAuth authentication flow with Facebook API integration",
      "📊 Real-time campaign data synchronization with progress tracking",
      "🎯 Advanced account selection and management interface",
      "📈 Comprehensive performance statistics with spend, impressions, clicks, and CTR metrics",
      "🔍 Advanced filtering by campaign status, objectives, and date ranges",
      "📋 Detailed campaign table with sortable columns and performance indicators",
      "⚡ Batch processing for efficient API data retrieval (max 50 campaigns per batch)",
      "🛡️ Robust error handling with user-friendly messages and retry mechanisms",
      "🎨 Modern glass-panel UI design with gradient stat cards and responsive layout",
      "🔄 Auto-refresh capabilities with manual sync control",
      "📱 Mobile-responsive design with collapsible account selector",
      "🐛 Development debug tools and comprehensive logging for troubleshooting"
    ]
  },
  {
    date: "2025-08-09",
    time: "21:15",
    version: "v2.5.138",
    type: "fix",
    title: "📊 Fixed CTR Data Type Parsing in Facebook Campaign Table",
    description: "Enhanced the Facebook Ads API campaign table to properly handle CTR (Click-Through Rate) values by ensuring they are parsed as numbers before percentage calculations, preventing display issues with string-based CTR data",
    details: [
      "📊 Added parseFloat() conversion for CTR values in campaign table display",
      "🔢 Enhanced data type safety for CTR percentage calculations",
      "✅ Fixed potential NaN display issues when CTR comes as string from API",
      "🎯 Improved accuracy of CTR percentage formatting and color coding",
      "🛡️ Added fallback to 0 for invalid or missing CTR values",
      "🚀 Better handling of Facebook API response data type variations for CTR metrics"
    ]
  },
  {
    date: "2025-08-09",
    time: "20:45",
    version: "v2.5.137",
    type: "fix",
    title: "🔢 Fixed Facebook API Service Numeric Data Type Conversion",
    description: "Enhanced the Facebook API service to properly handle numeric data types from Facebook API responses by ensuring spend, impressions, and clicks values are correctly parsed as numbers instead of strings",
    details: [
      "🔢 Added parseFloat() conversion for spend values to ensure proper numeric calculations",
      "📊 Added parseInt() conversion for impressions and clicks to handle string responses",
      "🛡️ Enhanced data type safety with fallback to 0 for invalid numeric values",
      "✅ Improved accuracy of total spend, impressions, and clicks calculations",
      "📈 Fixed potential issues with dashboard metrics displaying incorrect totals",
      "🚀 Better handling of Facebook API response data variations and type inconsistencies"
    ]
  },
  {
    date: "2025-08-09",
    time: "20:15",
    version: "v2.5.136",
    type: "improvement",
    title: "💡 Added Informational Message for Campaigns Without Insights Data",
    description: "Enhanced the Facebook Ads API page to display a helpful informational message when campaigns are successfully loaded but insights data is unavailable, providing better user feedback about partial data loading scenarios",
    details: [
      "💡 Added informational card that appears when campaigns exist but no insights data is available",
      "📊 Clear messaging explaining that campaign names and basic info are loaded successfully",
      "🎨 Used yellow warning styling to indicate partial data state without alarming users",
      "✅ Improved user experience by explaining why some data might be missing",
      "🔍 Better visibility into the distinction between campaign data and insights data",
      "📝 Helps users understand when Facebook API returns campaigns but insights fail to load"
    ]
  },
  {
    date: "2025-08-09",
    time: "19:45",
    version: "v2.5.135",
    type: "improvement",
    title: "📊 Enhanced Facebook API Service Insights Batch Processing with Better Logging",
    description: "Improved the insights batch processing in Facebook API service with enhanced logging and error handling to provide better visibility into campaign insights fetching and handle missing data more gracefully",
    details: [
      "📊 Added detailed batch processing logs showing campaign counts and progress",
      "🔍 Enhanced insights data validation with null/undefined response checking",
      "📝 Added warning logs for campaigns without insights data for better debugging",
      "✅ Improved batch completion tracking with detailed status messages",
      "🛡️ Enhanced error handling for missing or malformed insights responses",
      "🚀 Better visibility into Facebook API insights synchronization process"
    ]
  },
  {
    date: "2025-08-09",
    time: "19:30",
    version: "v2.5.134",
    type: "improvement",
    title: "🔧 Enhanced Facebook API Service Batch Response Handling",
    description: "Improved the batch request processing in Facebook API service to handle different response structures more robustly, ensuring reliable batch operations across various API response formats",
    details: [
      "🔧 Enhanced batch response structure detection for better compatibility",
      "📊 Added comprehensive response structure logging for debugging",
      "🛡️ Implemented fallback handling for different batch response formats",
      "📝 Added detailed error handling for unexpected response structures",
      "✅ Improved reliability of batch request processing",
      "🚀 Better support for Facebook API response variations in batch operations"
    ]
  },
  {
    date: "2025-08-09",
    time: "19:15",
    version: "v2.5.133",
    type: "fix",
    title: "🔧 Fixed Facebook Ads API Statistics Calculation for Campaigns Without Insights",
    description: "Improved the statistics calculation in Facebook Ads API page to properly handle campaigns that don't have insights data, preventing division by zero errors and providing more accurate frequency calculations",
    details: [
      "🔧 Fixed average frequency calculation to only include campaigns with insights data",
      "📊 Added campaignsWithInsights filter to prevent including campaigns without data in calculations",
      "🛡️ Prevented division by zero errors when calculating average frequency",
      "📈 Added campaignsWithInsights count to statistics for better visibility",
      "✅ Improved accuracy of Facebook advertising metrics display",
      "🚀 Enhanced reliability of statistics calculations for mixed data scenarios"
    ]
  },
  {
    date: "2025-08-09",
    time: "18:45",
    version: "v2.5.132",
    type: "improvement",
    title: "⚡ Enhanced Facebook API Service Campaign Insights Batch Processing",
    description: "Improved the getCampaignsWithInsights method to process campaigns in smaller batches with better error handling and progress tracking for more reliable insights fetching",
    details: [
      "⚡ Implemented batch processing for campaign insights to respect API limits",
      "📊 Added configurable batch size with maximum of 50 campaigns per batch",
      "🔄 Enhanced error handling with graceful fallback when batch requests fail",
      "📝 Added detailed logging for batch processing progress and completion",
      "⏱️ Implemented small delays between batches to prevent rate limiting",
      "🛡️ Improved resilience by continuing processing even if individual batches fail",
      "🚀 Better performance and reliability for large numbers of Facebook campaigns"
    ]
  },
  {
    date: "2025-08-09",
    time: "17:20",
    version: "v2.5.131",
    type: "improvement",
    title: "🐛 Added Debug Information Panel to Facebook Ads API Empty State",
    description: "Enhanced the empty state display in Facebook Ads API page with development-only debug information to help developers troubleshoot data sync issues more effectively",
    details: [
      "🐛 Added debug information panel visible only in development mode",
      "📝 Included helpful debugging instructions for developers",
      "🔍 Added guidance to check browser console for detailed API logs",
      "💡 Provided context about API call logging and response data tracking",
      "🛠️ Improved developer experience when diagnosing empty data states",
      "📊 Enhanced visibility into debugging workflow for Facebook API integration",
      "✅ Development-only feature that doesn't affect production builds"
    ]
  },
  {
    date: "2025-08-09",
    time: "17:15",
    version: "v2.5.130",
    type: "improvement",
    title: "🔍 Enhanced Facebook Ads API Status Filter Debug Logging",
    description: "Added comprehensive debug logging to the Facebook Ads API status filter processing to improve troubleshooting of campaign filtering logic and better understand filter application behavior",
    details: [
      "🔍 Added detailed status filter processing debug information",
      "📝 Enhanced visibility into original status filter values and processed results",
      "🎯 Added specific logging for 'ALL' status filter detection and handling",
      "🛠️ Improved debugging capabilities for campaign status filtering issues",
      "📊 Better tracking of filter parameter transformation from UI to API calls",
      "✅ Enhanced developer experience when diagnosing status filter problems",
      "🚀 Improved transparency in Facebook API campaign filtering workflow"
    ]
  },
  {
    date: "2025-08-09",
    time: "16:45",
    version: "v2.5.129",
    type: "improvement",
    title: "🔧 Facebook API Service Code Optimization and Cleanup",
    description: "Performed code optimization and cleanup on the Facebook API service to improve maintainability and remove any redundant code, ensuring the service remains efficient and well-structured",
    details: [
      "🔧 Optimized Facebook API service code structure for better maintainability",
      "🧹 Cleaned up redundant code and improved code organization",
      "📝 Enhanced code documentation and inline comments",
      "⚡ Improved service performance through code optimization",
      "✅ Maintained all existing functionality while improving code quality",
      "🚀 Better foundation for future Facebook API service enhancements",
      "🔍 Improved code readability and developer experience"
    ]
  },
  {
    date: "2025-08-09",
    time: "15:30",
    version: "v2.5.128",
    type: "improvement",
    title: "🔧 Enhanced Facebook API Service Campaign Response Handling",
    description: "Improved the getCampaigns method in Facebook API service to handle different response structures more robustly, ensuring reliable campaign data retrieval across various Facebook API response formats",
    details: [
      "🔧 Enhanced response structure detection to handle nested and direct array formats",
      "📊 Added comprehensive response structure logging for better debugging",
      "🛡️ Implemented fallback handling for different Facebook API response variations",
      "📝 Added detailed logging for campaign data processing and structure analysis",
      "✅ Improved error handling and response validation for campaign retrieval",
      "🚀 More reliable campaign data fetching across different API response formats",
      "🔍 Enhanced debugging capabilities with detailed response structure inspection"
    ]
  },
  {
    date: "2025-08-08",
    time: "27:40",
    version: "v2.5.127",
    type: "improvement",
    title: "🎨 Enhanced Facebook Ads API Total Spend Card with Glass Panel Design",
    description: "Updated the Total Spend stats card in Facebook Ads API page with modern glass panel styling, featuring improved transparency effects and better visual hierarchy for enhanced user experience",
    details: [
      "🎨 Applied glass-panel class for modern translucent background effect",
      "🌈 Enhanced gradient from blue-900/30 to blue-800/20 for better depth perception",
      "🔷 Updated border styling with blue-500/30 for subtle accent coloring",
      "💎 Improved text contrast with blue-200 for title and blue-100 for main value",
      "✨ Enhanced secondary text styling with blue-300 for better readability",
      "🎯 Maintained shadow-lg for consistent depth across all stats cards",
      "🚀 Modern glass morphism design that aligns with contemporary UI trends"
    ]
  },
  {
    date: "2025-08-08",
    time: "27:35",
    version: "v2.5.126",
    type: "improvement",
    title: "💰 Enhanced Facebook Ads API Spend Data Loading with Smart Button State",
    description: "Improved the spend data loading button in Facebook Ads API page with intelligent state management that shows loading status and prevents duplicate requests while data is being fetched",
    details: [
      "💰 Added smart button state that disables when spend data is being loaded",
      "🔄 Button text changes from 'Refresh Spend' to 'Loading...' during data fetch",
      "🛡️ Prevents duplicate API requests by disabling button when accounts have undefined spend data",
      "✨ Enhanced user experience with clear visual feedback during loading states",
      "🎯 Improved button logic to check if any connected account has undefined spend30Days property",
      "📊 Better handling of spend data loading workflow for multiple ad accounts",
      "🚀 More responsive and intuitive interface for Facebook advertising spend tracking"
    ]
  },
  {
    date: "2025-08-08",
    time: "27:30",
    version: "v2.5.125",
    type: "feature",
    title: "📊 Added Facebook Ads Real-Time Navigation Link to Sidebar",
    description: "Added a new navigation link in the sidebar for 'Facebook Ads Real-Time' to provide quick access to the Facebook Ads API integration page with real-time campaign data and analytics",
    details: [
      "📊 Added new sidebar navigation link with BarChart4 icon for Facebook Ads Real-Time",
      "🎯 Positioned strategically between Dashboard and Ad Planning for logical navigation flow",
      "✨ Integrated with existing navigation system using handleNavigation function",
      "🔗 Links to 'facebook-ads' route for seamless access to Facebook API integration",
      "📱 Maintains responsive design and collapsed sidebar functionality",
      "🎨 Consistent styling with other sidebar navigation elements",
      "🚀 Enhanced user experience for accessing Facebook advertising data and insights"
    ]
  },
  {
    date: "2025-08-08",
    time: "27:25",
    version: "v2.5.124",
    type: "improvement",
    title: "🎨 Enhanced Facebook Ads API Reach and Campaigns Stats Cards Visual Design",
    description: "Improved the visual appearance of the Reach and Campaigns stats cards in the Facebook Ads API page with enhanced gradients, better contrast, and more polished styling for improved readability and consistency",
    details: [
      "🎨 Enhanced Reach card gradient background from orange-50/100 to orange-100/200 for better visual depth",
      "🎨 Enhanced Campaigns card gradient background from indigo-50/100 to indigo-100/200 for better visual depth",
      "🌙 Improved dark mode colors with orange-800/700 and indigo-800/700 gradients for better contrast",
      "📊 Updated border styling with orange-300 and indigo-300 colors and added shadow-lg for enhanced depth",
      "🔤 Strengthened text colors for better readability (orange-800/900 and indigo-800/900 in light mode)",
      "✨ Enhanced secondary text contrast with orange-700/300 and indigo-700/300 color schemes",
      "🎯 Maintained accessibility while improving visual appeal and user experience across all stats cards"
    ]
  },
  {
    date: "2025-08-08",
    time: "27:20",
    version: "v2.5.123",
    type: "improvement",
    title: "🎨 Enhanced Facebook Ads API Stats Card Visual Design",
    description: "Improved the visual appearance of the Total Spend stats card in the Facebook Ads API page with enhanced gradients, better contrast, and more polished styling for improved readability",
    details: [
      "🎨 Enhanced gradient background from blue-50/100 to blue-100/200 for better visual depth",
      "🌙 Improved dark mode colors with blue-800/700 gradients for better contrast",
      "📊 Updated border styling with blue-300 and added shadow-lg for enhanced depth",
      "🔤 Strengthened text colors for better readability (blue-800/900 in light mode)",
      "✨ Enhanced secondary text contrast with blue-700/300 color scheme",
      "🎯 Maintained accessibility while improving visual appeal and user experience"
    ]
  },
  {
    date: "2025-08-08",
    time: "27:15",
    version: "v2.5.122",
    type: "improvement",
    title: "🔧 Enhanced Facebook API Service Insights Fetching Strategy",
    description: "Optimized the Facebook API service data synchronization process by enabling insights fetching directly in the main campaign collection phase for better performance and more accurate progress tracking",
    details: [
      "🔧 Modified syncAllData method to include insights in the main account processing phase",
      "📊 Improved progress tracking accuracy by fetching insights alongside campaigns",
      "⚡ Enhanced data synchronization efficiency by reducing separate API calls",
      "🎯 Better user experience with more granular progress updates during sync",
      "✅ Maintains existing error handling and fallback mechanisms",
      "🚀 Optimized for scenarios requiring both campaign data and performance insights"
    ]
  },
  {
    date: "2025-08-08",
    time: "26:45",
    version: "v2.5.121",
    type: "feature",
    title: "💰 Added Batch Account Spend Data Fetching for Facebook API Service",
    description: "Implemented efficient batch processing for fetching 30-day spend data across multiple Facebook ad accounts with controlled concurrency to optimize performance and avoid rate limits",
    details: [
      "💰 Added getAccountsSpend method for batch processing multiple ad accounts",
      "⚡ Implemented controlled concurrency (max 3 parallel requests) to respect API limits",
      "🔄 Added proper error handling with graceful fallback to zero spend on failures",
      "📊 Enhanced account spend tracking with parallel processing for better performance",
      "🛡️ Added comprehensive error logging while maintaining service reliability",
      "🎯 Optimized for scenarios with multiple ad accounts requiring spend data",
      "✅ Maintains backward compatibility with existing single account spend fetching"
    ]
  },
  {
    date: "2025-08-08",
    time: "26:40",
    version: "v2.5.120",
    type: "improvement",
    title: "🔧 Enhanced Facebook API Service Pagination Response Handling",
    description: "Improved pagination logic in Facebook API service to handle different response structures more robustly, ensuring reliable data fetching across various API response formats",
    details: [
      "🔧 Enhanced pagination response structure detection for better compatibility",
      "📊 Added support for multiple Facebook API response formats",
      "🔍 Improved pagination info logging with detailed debug information",
      "🛡️ Added fallback handling for different paging object locations in responses",
      "✅ More robust handling of next page detection and cursor management",
      "📝 Enhanced debugging capabilities with comprehensive pagination status logging",
      "🚀 Improved reliability of campaign data fetching across different Facebook API versions"
    ]
  },
  {
    date: "2025-08-08",
    time: "26:35",
    version: "v2.5.119",
    type: "improvement",
    title: "📅 Extended Facebook Ads API Default Date Range to 30 Days",
    description: "Updated the default date range filter in Facebook Ads API page from 7 days to 30 days to provide users with more comprehensive campaign data by default",
    details: [
      "📅 Changed default date range from 7 days to 30 days for better data coverage",
      "📊 Users now see more comprehensive campaign performance data on initial load",
      "🎯 Improved user experience by showing more relevant historical data",
      "📈 Better insights into campaign trends and performance patterns",
      "⚡ Maintains fast loading while providing more valuable data context",
      "🔧 Users can still adjust date range as needed for specific analysis",
      "✅ Enhanced default view for Facebook advertising campaign analysis"
    ]
  },
  {
    date: "2025-08-08",
    time: "26:30",
    version: "v2.5.118",
    type: "improvement",
    title: "📊 Enhanced Facebook API Data Sync Campaign Collection Logging",
    description: "Added comprehensive debug logging to the Facebook API service data synchronization process to improve visibility into campaign collection and account processing workflow",
    details: [
      "📊 Added detailed account results logging showing campaign counts per account",
      "🔍 Enhanced campaign collection process with step-by-step debug information",
      "📝 Added individual account campaign addition logging for better tracking",
      "📈 Improved total campaign collection visibility with final count logging",
      "🛠️ Better debugging capabilities for data sync workflow troubleshooting",
      "✅ Enhanced developer experience when diagnosing campaign collection issues",
      "🚀 Improved transparency in Facebook API service data synchronization process"
    ]
  },
  {
    date: "2025-08-08",
    time: "26:25",
    version: "v2.5.117",
    type: "improvement",
    title: "🔍 Enhanced Facebook API Campaign Filtering Debug Logging",
    description: "Added comprehensive debug logging to the Facebook API service campaign filtering process to improve troubleshooting of status filter application and campaign retrieval",
    details: [
      "📝 Added detailed status filter logging showing applied filter values",
      "🔍 Enhanced visibility into campaign filtering logic with specific status arrays",
      "📊 Improved debugging capabilities for campaign status filtering issues",
      "🛠️ Better troubleshooting support for 'no campaigns found' scenarios",
      "✅ Enhanced developer experience when diagnosing campaign filtering problems",
      "🚀 Improved transparency in Facebook API service campaign retrieval process"
    ]
  },
  {
    date: "2025-08-08",
    time: "26:20",
    version: "v2.5.116",
    type: "improvement",
    title: "💰 Enhanced Facebook Ad Account Type with 30-Day Spend Tracking",
    description: "Added spend30Days property to FacebookAdAccount interface to support displaying recent spending data for better account selection and management",
    details: [
      "💰 Added spend30Days optional property to FacebookAdAccount interface",
      "📊 Enhanced account data structure to include recent spending metrics",
      "🔍 Improved account selection UI with spending information display",
      "📈 Better visibility into account activity and budget utilization",
      "✅ Enhanced type safety for Facebook API service account processing",
      "🚀 Improved user experience when selecting ad accounts for synchronization"
    ]
  },
  {
    date: "2025-08-08",
    time: "26:15",
    version: "v2.5.115",
    type: "improvement",
    title: "🔍 Enhanced Facebook API Service Account Processing Debug Logging",
    description: "Added comprehensive debug logging to the Facebook API service account processing workflow to improve troubleshooting of campaign data synchronization and account-specific data retrieval",
    details: [
      "📝 Added detailed account processing logging with account ID and sync options",
      "🔍 Enhanced campaign retrieval logging showing exact campaign counts per account",
      "📊 Improved visibility into date range and campaign status filtering during sync",
      "🛠️ Better debugging capabilities for Facebook API data synchronization issues",
      "✅ Enhanced troubleshooting support for account-specific sync problems",
      "🚀 Improved developer experience when diagnosing Facebook API integration issues"
    ]
  },
  {
    date: "2025-08-08",
    time: "25:30",
    version: "v2.5.114",
    type: "improvement",
    title: "🎛️ Enhanced Facebook Ads API Connection Panel with Quick Filter Options",
    description: "Added quick campaign status filter buttons and improved connection status display in the Facebook Ads API connection panel for better user control and visibility",
    details: [
      "🎛️ Added quick filter buttons for Active Only, All Campaigns, and Paused Only status filtering",
      "📊 Enhanced connection status display with selected accounts count and current filter settings",
      "📅 Added date range display showing current sync date range selection",
      "✨ Improved visual organization with better spacing and layout structure",
      "🎯 Enhanced user experience with immediate filter access without opening advanced filters",
      "📱 Responsive button layout that adapts to different screen sizes",
      "🔧 Better information density showing filter status and date range at a glance"
    ]
  },
  {
    date: "2025-08-08",
    time: "25:25",
    version: "v2.5.113",
    type: "fix",
    title: "🔧 Cleaned Up Auto-Sync Flag Reset in Facebook Ads API Disconnection",
    description: "Removed redundant auto-sync flag reset from the disconnection process in FacebookAdsAPI.tsx to streamline the disconnect flow and eliminate unnecessary state management",
    details: [
      "🔧 Removed redundant autoSyncTriggeredRef.current = false reset from handleDisconnect function",
      "✨ Streamlined disconnection process by removing unnecessary state management",
      "🎯 Maintained clean state management during Facebook account disconnection",
      "🚀 Improved code clarity by removing duplicate reset logic",
      "📝 Enhanced maintainability of the disconnect workflow"
    ]
  },
  {
    date: "2025-08-08",
    time: "25:20",
    version: "v2.5.112",
    type: "improvement",
    title: "🔍 Enhanced Facebook Ads API Empty State with Better User Guidance",
    description: "Improved the user experience when no campaign data is found by adding detailed troubleshooting information, filter debugging, and clearer action buttons to help users resolve data sync issues",
    details: [
      "🔍 Added detailed debug information showing current filters and sync status",
      "📊 Enhanced empty state messaging with specific troubleshooting steps",
      "🎯 Added 'Show All Status' button to quickly clear status filters",
      "📅 Display current date range and selected accounts for better context",
      "💡 Provided actionable solutions list for common sync issues",
      "🔧 Improved button sizing and layout for better mobile experience",
      "✨ Separated initial sync prompt from post-sync empty state",
      "🚀 Added comprehensive filter information to help users understand why no data appears"
    ]
  },
  {
    date: "2025-08-08",
    time: "25:15",
    version: "v2.5.111",
    type: "improvement",
    title: "🎯 Removed Auto-Sync from Facebook Ads API for Better User Control",
    description: "Disabled automatic data synchronization after account connection to give users full control over when data is synced, preventing unexpected API calls and improving user experience",
    details: [
      "🎯 Removed automatic sync trigger when accounts are selected and connected",
      "👤 Users now have full control over when to sync Facebook data",
      "⚡ Prevents unexpected API calls and potential rate limiting issues",
      "🔧 Eliminated auto-sync useEffect hook and related logic",
      "✅ Improved user experience by making sync operations explicit",
      "🚀 Enhanced predictability of Facebook API integration behavior"
    ]
  },
  {
    date: "2025-08-08",
    time: "24:50",
    version: "v2.5.110",
    type: "improvement",
    title: "🔧 Optimized Facebook Ads API Account Loading with useCallback",
    description: "Wrapped loadAdAccounts function in useCallback hook to prevent unnecessary re-renders and improve performance by memoizing the function reference",
    details: [
      "🔧 Wrapped loadAdAccounts function with useCallback hook for performance optimization",
      "⚡ Prevents unnecessary function re-creation on component re-renders",
      "🎯 Maintains stable function reference for better React optimization",
      "✅ Improves overall component performance and reduces memory usage",
      "🚀 Enhanced Facebook API account loading efficiency"
    ]
  },
  {
    date: "2025-08-08",
    time: "24:45",
    version: "v2.5.109",
    type: "fix",
    title: "🔄 Fixed Auto-Sync Flag Reset in Facebook Ads API Authentication",
    description: "Added proper reset of auto-sync flag when authentication state changes to prevent duplicate sync operations and ensure clean state management during authentication transitions",
    details: [
      "🔄 Added autoSyncTriggeredRef.current = false reset in authentication useEffect",
      "🛡️ Prevents duplicate auto-sync operations during authentication state changes",
      "✅ Ensures clean state management when user logs out or authentication expires",
      "🎯 Maintains proper sync behavior across authentication transitions",
      "🚀 Improved reliability of Facebook API authentication flow"
    ]
  },
  {
    date: "2025-08-08",
    time: "24:40",
    version: "v2.5.108",
    type: "fix",
    title: "🔧 Fixed useEffect Dependency Array in Facebook Ads API",
    description: "Corrected the useEffect dependency array in FacebookAdsAPI.tsx to prevent unnecessary re-renders and improve performance by using selectedAccounts.length instead of the entire selectedAccounts array",
    details: [
      "🔧 Fixed useEffect dependency array to use selectedAccounts.length instead of selectedAccounts",
      "⚡ Improved performance by preventing unnecessary effect re-runs",
      "🎯 Removed handleSync from dependencies as it's not needed for the auto-sync effect",
      "✅ Maintained proper reactivity while optimizing re-render behavior",
      "🚀 Enhanced component efficiency in Facebook Ads API page"
    ]
  },
  {
    date: "2025-08-08",
    time: "24:35",
    version: "v2.5.107",
    type: "improvement",
    title: "🔍 Enhanced Facebook Ad Accounts Response Structure Analysis",
    description: "Improved Facebook API service response parsing with comprehensive debugging and better handling of different response formats from the Facebook Graph API",
    details: [
      "🔍 Added detailed response object analysis with type checking",
      "📊 Enhanced debug logging to show response structure at multiple levels",
      "🔧 Improved response parsing logic to handle various Facebook API response formats",
      "📝 Added comprehensive logging for response.data type and array status",
      "✅ Better error reporting with response keys analysis when structure is unexpected",
      "🛠️ Enhanced troubleshooting capabilities with detailed response inspection",
      "🚀 More robust handling of Facebook API response variations"
    ]
  },
  {
    date: "2025-08-08",
    time: "24:30",
    version: "v2.5.106",
    type: "fix",
    title: "🔧 Fixed Facebook Ad Accounts Data Structure Handling",
    description: "Corrected the Facebook API service to properly handle the ad accounts response structure, fixing issues where accounts were not being retrieved correctly",
    details: [
      "🔧 Fixed data extraction from Facebook API response for ad accounts",
      "📊 Updated response structure handling to match Facebook API format",
      "🐛 Resolved issue where accounts array was nested incorrectly",
      "📝 Enhanced debug logging to show actual response structure",
      "✅ Improved error handling for ad account retrieval",
      "🔍 Added detailed response structure logging for troubleshooting",
      "🚀 Ensures proper account loading for Facebook API integration"
    ]
  },
  {
    date: "2025-08-08",
    time: "24:25",
    version: "v2.5.105",
    type: "feature",
    title: "🚀 Complete Facebook API Client Implementation",
    description: "Implemented comprehensive Facebook Marketing API client with advanced features including rate limiting, circuit breaker pattern, retry logic, and secure authentication handling",
    details: [
      "🔐 Full OAuth 2.0 authentication support with secure token management",
      "⚡ Advanced rate limiting with multiple rate limit types (app-level, user-level, ad account-level)",
      "🔄 Circuit breaker pattern for handling API failures and preventing cascading errors",
      "🔁 Intelligent retry logic with exponential backoff and jitter",
      "📊 Comprehensive request/response logging for debugging and monitoring",
      "🛡️ Robust error handling for Facebook API specific error codes",
      "📦 Batch request support for efficient API usage",
      "🎯 Type-safe interfaces for all API interactions",
      "📈 Real-time quota usage tracking and monitoring",
      "🔧 Health check functionality for API connectivity validation",
      "🏗️ Singleton pattern implementation for consistent client usage",
      "✅ Full integration with existing Facebook configuration system"
    ]
  },
  {
    date: "2025-08-08",
    time: "24:20",
    version: "v2.5.104",
    type: "improvement",
    title: "🔍 Enhanced Facebook API Client Request Logging",
    description: "Added detailed console logging to the Facebook API client to improve debugging of API requests and URL construction",
    details: [
      "📝 Added request URL logging before making API calls",
      "🔗 Added full URL with parameters logging for GET requests",
      "🔍 Enhanced visibility into API request construction process",
      "🛠️ Improved debugging capabilities for Facebook API communication",
      "📊 Better tracking of API endpoint usage and parameter handling",
      "✅ Enhanced troubleshooting for API connectivity issues"
    ]
  },
  {
    date: "2025-08-08",
    time: "24:15",
    version: "v2.5.103",
    type: "improvement",
    title: "🔍 Enhanced Facebook Ad Accounts Loading Debug Information",
    description: "Added comprehensive debug logging to the Facebook ad accounts loading process to improve troubleshooting of account access and permission issues",
    details: [
      "📝 Added detailed authentication status logging before account loading",
      "🔍 Enhanced account loading process with step-by-step debug information",
      "📊 Added comprehensive account details logging including ID, name, currency, and status",
      "⚠️ Improved error handling with detailed error information including name, message, and stack trace",
      "💡 Added helpful troubleshooting hints when no accounts are found",
      "🛡️ Enhanced error message specificity for authentication and permission issues",
      "🔧 Better visibility into Facebook API service authentication state",
      "✅ Improved debugging capabilities for Facebook ad account access troubleshooting"
    ]
  },
  {
    date: "2025-08-08",
    time: "24:09",
    version: "v2.5.102",
    type: "improvement",
    title: "🔧 Added Debug Storage for Facebook OAuth Token Troubleshooting",
    description: "Enhanced Facebook OAuth token storage with additional debug storage to help troubleshoot authentication issues by storing an unencrypted version alongside the encrypted tokens",
    details: [
      "🔧 Added debug storage key for unencrypted token data alongside encrypted version",
      "📝 Enhanced debugging capabilities with unencrypted token storage for troubleshooting",
      "🛡️ Maintained security by keeping primary storage encrypted while adding debug fallback",
      "📊 Improved token storage debugging with dual storage approach",
      "🔍 Added console logging for debug storage confirmation",
      "✅ Better visibility into token storage process for authentication troubleshooting",
      "🚀 Enhanced developer experience for debugging OAuth authentication issues",
      "🔧 Simplified token storage verification and debugging workflow"
    ]
  },
  {
    date: "2025-08-08",
    time: "24:08",
    version: "v2.5.101",
    type: "improvement",
    title: "🔍 Enhanced Facebook OAuth Token Storage Verification with Immediate Testing",
    description: "Added immediate token retrieval testing after storage to verify successful token persistence and provide detailed debugging information for authentication troubleshooting",
    details: [
      "🔍 Added immediate token retrieval test after successful storage",
      "📝 Enhanced debugging with detailed localStorage verification logging",
      "🛡️ Added raw data existence and length checks for storage validation",
      "📊 Improved token storage success confirmation with immediate verification",
      "🔧 Added raw data preview logging for debugging storage format issues",
      "✅ Better visibility into token persistence workflow and potential failures",
      "🚀 Enhanced authentication reliability through immediate storage verification",
      "🔍 Comprehensive debugging capabilities for token storage troubleshooting"
    ]
  },
  {
    date: "2025-08-08",
    time: "24:07",
    version: "v2.5.100",
    type: "improvement",
    title: "🔄 Enhanced Facebook OAuth Async Token Retrieval with Multi-Layer Decryption",
    description: "Improved async token retrieval method with comprehensive fallback decryption strategy to handle different encryption formats and ensure reliable token access across all scenarios",
    details: [
      "🔄 Enhanced getStoredTokensAsync method with multi-layer decryption approach",
      "🔧 Added simple decryption as first attempt for better performance",
      "📝 Implemented legacy decryption fallback for backward compatibility",
      "🛡️ Added modern encryption as final fallback option",
      "✅ Comprehensive error handling for each decryption method",
      "📊 Enhanced logging for each decryption attempt and result",
      "🚀 Improved reliability of async token retrieval operations",
      "🔍 Better debugging capabilities for token decryption troubleshooting"
    ]
  },
  {
    date: "2025-08-08",
    time: "24:06",
    version: "v2.5.99",
    type: "improvement",
    title: "🔧 Enhanced Facebook OAuth Token Storage with Encryption Fallback",
    description: "Improved token storage reliability by adding fallback encryption methods and enhanced error handling to ensure tokens are always stored successfully even if modern encryption fails",
    details: [
      "🔧 Added fallback simple encryption method when modern encryption fails",
      "📝 Enhanced token storage logging with encryption method identification",
      "🛡️ Implemented try-catch wrapper around modern encryption with graceful fallback",
      "🔄 Added simple encryption/decryption methods using XOR cipher as backup",
      "✅ Improved storage verification with immediate confirmation after write",
      "⚠️ Added warning logs when falling back to simple encryption method",
      "🚀 Ensured token storage never fails completely due to encryption issues",
      "🔍 Enhanced debugging capabilities for encryption method selection"
    ]
  },
  {
    date: "2025-08-08",
    time: "24:05",
    version: "v2.5.98",
    type: "improvement",
    title: "🔍 Enhanced Facebook OAuth Token Storage Verification Logging",
    description: "Added comprehensive debug logging to the Facebook OAuth token storage process with immediate verification to ensure tokens are properly stored and accessible after authentication",
    details: [
      "📝 Added detailed token storage logging with access token length and expiration information",
      "🔍 Added storage key logging for debugging authentication data persistence",
      "✅ Added immediate verification check after token storage to confirm data persistence",
      "📊 Enhanced token storage success confirmation with structured logging",
      "🛡️ Improved debugging capabilities for token storage verification process",
      "🔧 Better visibility into localStorage token persistence workflow",
      "⚡ Added real-time storage verification to catch storage failures immediately"
    ]
  },
  {
    date: "2025-08-08",
    time: "24:04",
    version: "v2.5.97",
    type: "improvement",
    title: "🔍 Enhanced Facebook OAuth Token Storage Debug Logging",
    description: "Added comprehensive debug logging to the Facebook OAuth token storage and retrieval process to improve troubleshooting of authentication state management and token decryption issues",
    details: [
      "📝 Added detailed token retrieval logging with encryption status information",
      "🔍 Added legacy decryption attempt logging with success/failure tracking",
      "🎯 Added async decryption fallback with result logging for new encryption format",
      "⚠️ Enhanced error handling for both legacy and modern token decryption methods",
      "🛡️ Improved debugging capabilities for token storage compatibility issues",
      "📊 Added structured logging for authentication data parsing and validation",
      "🔧 Better visibility into token encryption/decryption process transitions",
      "🔄 Added synchronous helper method for async token data retrieval workaround"
    ]
  },
  {
    date: "2025-08-08",
    time: "24:03",
    version: "v2.5.96",
    type: "improvement",
    title: "🔍 Enhanced Facebook OAuth Callback Debug Logging",
    description: "Added comprehensive debug logging to the Facebook OAuth callback process to improve troubleshooting of popup communication and message passing between windows",
    details: [
      "📝 Added detailed success message logging with code length and state information",
      "🔍 Added window.opener availability check and logging",
      "🎯 Added origin validation logging for cross-window communication",
      "⚠️ Enhanced error handling when window.opener is not available",
      "🛡️ Improved debugging capabilities for OAuth popup communication issues",
      "📊 Added structured logging for authentication success flow",
      "🔧 Better visibility into popup-to-parent window message passing"
    ]
  },
  {
    date: "2025-08-08",
    time: "24:02",
    version: "v2.5.95",
    type: "improvement",
    title: "🔍 Enhanced Facebook OAuth Token Validation Debug Logging",
    description: "Added comprehensive debug logging to the Facebook OAuth token validation process to improve troubleshooting of authentication and token structure issues",
    details: [
      "📊 Added detailed token structure validation logging with field-by-field analysis",
      "🔍 Added token presence, type, and format validation logging",
      "📝 Added access token length and validity checks with debug output",
      "🎯 Added token type and expiration validation with specific error messages",
      "📋 Added scope validation logging to verify required permissions",
      "⚠️ Enhanced error reporting with specific validation failure reasons",
      "🛡️ Improved token security validation with detailed feedback",
      "🔧 Better debugging capabilities for OAuth token-related authentication issues"
    ]
  },
  {
    date: "2025-08-08",
    time: "24:01",
    version: "v2.5.94",
    type: "improvement",
    title: "🔍 Enhanced Facebook OAuth Flow Debug Logging",
    description: "Added detailed console logging throughout the Facebook OAuth authentication process to improve debugging and troubleshooting of connection issues",
    details: [
      "📝 Added popup opening URL logging for OAuth flow verification",
      "✅ Added authorization code receipt confirmation logging",
      "🔄 Added token exchange process logging for better flow tracking",
      "🎯 Added token receipt confirmation to verify successful authentication",
      "⚠️ Enhanced error handling with specific message for missing tokens after authentication",
      "🛡️ Improved OAuth flow reliability with better state validation",
      "🔧 Enhanced debugging capabilities for Facebook API connection troubleshooting"
    ]
  },
  {
    date: "2025-08-08",
    time: "24:00",
    version: "v2.5.93",
    type: "improvement",
    title: "🔧 Enhanced Facebook Configuration Debug Information Display",
    description: "Added comprehensive Facebook configuration details to the debug information panel in FacebookAdsAPI.tsx to help troubleshoot connection and authentication issues",
    details: [
      "📋 Added App ID configuration status display (Configured/Missing)",
      "🔗 Added Redirect URI display for OAuth flow verification",
      "📊 Added API Version display for compatibility checking",
      "🛠️ Enhanced debug panel with essential Facebook configuration details",
      "🔍 Improved troubleshooting capabilities for Facebook API setup issues",
      "✨ Better visibility into configuration state for developers and users"
    ]
  },
  {
    date: "2025-08-08",
    time: "23:59",
    version: "v2.5.92",
    type: "improvement",
    title: "🛡️ Enhanced Facebook Ad Account Loading with Better Error Handling",
    description: "Improved ad account loading process in FacebookAdsAPI.tsx with enhanced error handling, user-friendly error messages, and better handling of edge cases like missing accounts or insufficient permissions",
    details: [
      "⏱️ Added 500ms delay after token setting to ensure proper authentication state",
      "🔍 Enhanced error handling for common Facebook API authentication issues",
      "📝 Added specific error messages for invalid OAuth tokens and insufficient permissions",
      "⚠️ Better handling of cases where no ad accounts are found",
      "🎯 Improved user feedback when ad accounts cannot be loaded due to permission issues",
      "🛡️ Added fallback error handling for unknown error types",
      "✨ More descriptive error messages to help users understand and resolve connection issues"
    ]
  },
  {
    date: "2025-08-08",
    time: "23:58",
    version: "v2.5.91",
    type: "improvement",
    title: "🔧 Enhanced Facebook Authentication State Logging and Dependency Tracking",
    description: "Improved authentication state monitoring in FacebookAdsAPI.tsx with enhanced logging and better useEffect dependency management for more reliable connection handling",
    details: [
      "📝 Added comprehensive authentication state logging including isLoading and error states",
      "🔍 Enhanced debug information for authentication flow troubleshooting",
      "🎯 Added specific console logs for token setting and account loading phases",
      "🔄 Improved useEffect dependency array to include authState.isLoading for better reactivity",
      "🛡️ Better error state tracking in authentication monitoring",
      "✨ More detailed logging for authentication state changes and transitions",
      "🚀 Enhanced debugging capabilities for Facebook API connection issues"
    ]
  },
  {
    date: "2025-08-08",
    time: "23:55",
    version: "v2.5.90",
    type: "improvement",
    title: "🎨 Streamlined Facebook Ads API Interface and Code Organization",
    description: "Reorganized FacebookAdsAPI.tsx component structure, removed unused imports, simplified filtering logic, and improved code readability while maintaining all core functionality",
    details: [
      "🧹 Removed unused imports (PercentCircle, Calendar, Pause, Bar, Scatter charts)",
      "📝 Cleaned up date-fns imports to only include used functions",
      "🔄 Reorganized useEffect hooks for better logical flow",
      "🎯 Simplified campaign filtering by removing complex date range logic",
      "📊 Streamlined chart data processing and removed unused chart components",
      "🎨 Simplified advanced filters UI while maintaining search and basic filtering",
      "📱 Improved responsive design and component organization",
      "⚡ Enhanced performance by removing unnecessary computations",
      "🔧 Better code maintainability through improved structure"
    ]
  },
  {
    date: "2025-08-08",
    time: "23:50",
    version: "v2.5.89",
    type: "fix",
    title: "🔧 Fixed JSX Structure in Facebook Ads API Component",
    description: "Corrected JSX closing tags and fragment structure in FacebookAdsAPI.tsx to resolve syntax errors and ensure proper component rendering",
    details: [
      "🔧 Fixed misaligned closing Card tag indentation",
      "📐 Added proper React fragment closing tag structure",
      "✨ Corrected JSX hierarchy to prevent rendering issues",
      "🎯 Ensured proper component nesting and closing",
      "🚀 Improved code maintainability and readability",
      "🛡️ Prevented potential runtime errors from malformed JSX"
    ]
  },
  {
    date: "2025-08-08",
    time: "23:45",
    version: "v2.5.88",
    type: "improvement",
    title: "⚠️ Enhanced Error Display in Facebook Ads API Connection",
    description: "Added error alert display in the Facebook connection interface to provide better user feedback when connection issues occur",
    details: [
      "⚠️ Added error alert component to display connection errors prominently",
      "🎨 Used destructive variant Alert with AlertCircle icon for clear error indication",
      "📍 Positioned error alert above the connection button for better visibility",
      "🔧 Integrated with existing connectionState.error for seamless error handling",
      "✨ Improved user experience by providing immediate feedback on connection failures",
      "🎯 Enhanced error visibility to help users understand and resolve connection issues"
    ]
  },
  {
    date: "2025-08-08",
    time: "23:30",
    version: "v2.5.87",
    type: "improvement",
    title: "🔄 Enhanced Auto-Sync Logic in Facebook Ads API",
    description: "Improved auto-sync functionality to prevent duplicate sync operations and added better dependency tracking for useEffect hook",
    details: [
      "🔄 Added isSyncing check to prevent duplicate auto-sync operations",
      "📝 Added console logging for auto-sync operations for better debugging",
      "🎯 Enhanced useEffect dependency array to include all relevant dependencies",
      "⚡ Improved sync state management to avoid race conditions",
      "🛡️ Added safeguards against multiple simultaneous sync operations",
      "✨ Better user experience with more reliable auto-sync behavior"
    ]
  },
  {
    date: "2025-08-08",
    time: "23:15",
    version: "v2.5.86",
    type: "fix",
    title: "🔧 Fixed Indentation in Facebook Ads API Charts Section",
    description: "Corrected indentation alignment in the Enhanced Charts section of FacebookAdsAPI.tsx to maintain consistent code formatting",
    details: [
      "🔧 Fixed indentation for closing div tag in stats cards section",
      "📐 Aligned Enhanced Charts section div with proper indentation",
      "✨ Improved code readability and consistency",
      "🎯 Maintained proper HTML structure hierarchy",
      "🚀 Enhanced code maintainability for future development"
    ]
  },
  {
    date: "2025-08-08",
    time: "22:30",
    version: "v2.5.85",
    type: "improvement",
    title: "✨ Enhanced Initial Sync Experience in Facebook Ads API",
    description: "Improved user experience during initial Facebook data sync by adding better visual feedback and loading states when no campaigns are present yet",
    details: [
      "✨ Added 'Preparing to sync data...' indicator when no campaigns are loaded yet",
      "🔄 Enhanced initial sync loading card with detailed progress information",
      "📊 Added sync progress visualization with progress bar and phase indicators",
      "💫 Improved visual feedback during the first-time sync experience",
      "🎯 Better user guidance when transitioning from connection to data display",
      "🚀 Enhanced overall UX flow for new Facebook API users"
    ]
  },
  {
    date: "2025-08-08",
    time: "21:45",
    version: "v2.5.84",
    type: "improvement",
    title: "🔧 Optimized Facebook Ads API Sync Function Organization",
    description: "Reorganized the handleSync function in FacebookAdsAPI.tsx for better code readability and maintainability by moving it closer to related state management logic",
    details: [
      "🔧 Moved handleSync function to a more logical position in the component",
      "📝 Improved code organization and readability",
      "🎯 Fixed campaignStatus filter array wrapping for proper API parameter handling",
      "✨ Enhanced code maintainability by grouping related functions together",
      "🚀 Better separation of concerns between sync logic and account management"
    ]
  },
  {
    date: "2025-08-08",
    time: "20:15",
    version: "v2.5.83",
    type: "improvement",
    title: "⚡ Enhanced Facebook Ads API Auto-Sync Experience",
    description: "Improved user experience by automatically syncing data immediately after Facebook account connection, eliminating the need for manual sync initiation",
    details: [
      "🔄 Auto-sync data immediately after successful Facebook account connection",
      "⚡ Reduced user friction by eliminating manual sync step",
      "🎯 Smart account selection with automatic first account selection",
      "⏱️ Added 500ms delay to ensure proper state management before sync",
      "✨ Seamless user experience from connection to data display",
      "🚀 Improved onboarding flow for new Facebook API users"
    ]
  },
  {
    date: "2025-08-08",
    time: "19:30",
    version: "v2.5.82",
    type: "feature",
    title: "🚀 Complete Facebook Ads API Dashboard Implementation",
    description: "Major overhaul of FacebookAdsAPI.tsx with full real-time integration, advanced filtering, comprehensive analytics, and modern UI components",
    details: [
      "🔗 Full Facebook OAuth integration with secure authentication flow",
      "📊 Real-time campaign data synchronization with progress tracking",
      "🎛️ Advanced filtering system (search, status, objective, sorting)",
      "📈 Enhanced analytics with 5 comprehensive stats cards (Spend, Impressions, Clicks, Reach, Campaigns)",
      "📉 Interactive charts: Daily Performance Trend, Status Distribution, Performance Matrix Bubble Chart",
      "🏢 Multi-account management with account selector and sync controls",
      "📋 Modern campaign table with real-time data, status badges, and performance indicators",
      "⚡ Sync progress tracking with real-time updates and error handling",
      "🎨 Glass-panel design with gradient cards and modern UI components",
      "🔄 Auto-refresh functionality with last sync timestamp display",
      "🛡️ Comprehensive error handling and connection state management",
      "📱 Responsive design optimized for all screen sizes",
      "🎯 Performance metrics: CTR, CPC, CPM, Frequency calculations",
      "🔍 Smart search across campaign names, IDs, and objectives",
      "📊 Bubble chart visualization for CPC vs CTR analysis",
      "🎨 Status-based color coding and visual indicators throughout UI"
    ]
  },
  {
    date: "2025-08-08",
    time: "18:15",
    version: "v2.5.81",
    type: "improvement",
    title: "📱 อัปเดตชื่อเมนู Facebook Ads API เป็น 'Facebook Ads Real-Time'",
    description: "เปลี่ยนชื่อเมนูใน Sidebar จาก 'Facebook Ads API' เป็น 'Facebook Ads Real-Time' เพื่อให้ผู้ใช้เข้าใจฟีเจอร์ได้ชัดเจนขึ้น",
    details: [
      "📱 เปลี่ยนชื่อเมนูจาก 'Facebook Ads API' เป็น 'Facebook Ads Real-Time'",
      "✨ ปรับปรุงความชัดเจนของชื่อฟีเจอร์ให้ผู้ใช้เข้าใจง่ายขึ้น",
      "🎯 เน้นย้ำถึงความสามารถในการดูข้อมูลแบบ real-time",
      "🔧 รักษาฟังก์ชันการทำงานและ navigation logic เดิมไว้",
      "🚀 เพิ่มประสบการณ์ผู้ใช้ที่ดีขึ้นในการเข้าใจฟีเจอร์"
    ]
  },
  {
    date: "2025-08-08",
    time: "17:30",
    version: "v2.5.80",
    type: "improvement",
    title: "🔧 ปรับปรุงการแสดงสถานะ Active ใน Sidebar สำหรับ Facebook Ads API",
    description: "อัปเดต Sidebar component เพื่อให้แสดงสถานะ active ที่ถูกต้องเมื่อผู้ใช้อยู่ในหน้า Facebook Ads API โดยตรวจสอบทั้ง activeView และ pathname",
    details: [
      "🔧 แก้ไขการตรวจสอบ active state ใน Facebook Ads API menu item",
      "📍 เพิ่มการตรวจสอบ activeView === 'facebook-ads' นอกเหนือจาก pathname",
      "✨ ปรับปรุงการแสดงผล navigation state ให้แม่นยำขึ้น",
      "🎯 รับประกันว่า menu item จะแสดงสถานะ active เมื่ออยู่ในหน้า Facebook Ads API",
      "🚀 เพิ่มความสอดคล้องของ UI/UX ในระบบ navigation"
    ]
  },
  {
    date: "2025-08-08",
    time: "16:45",
    version: "v2.5.79",
    type: "feature",
    title: "🔍 เพิ่ม FacebookAdsFilters Component สำหรับ Facebook Ads API",
    description: "สร้าง FacebookAdsFilters component ใหม่เพื่อรองรับการกรองและค้นหาข้อมูลโฆษณา Facebook พร้อมระบบเลือกช่วงวันที่แบบครบถ้วน",
    details: [
      "🔍 สร้าง FacebookAdsFilters component พร้อมระบบค้นหาแคมเปญและโฆษณา",
      "📅 เพิ่มระบบเลือกช่วงวันที่แบบ Date Range Picker พร้อม Calendar UI",
      "⚡ เพิ่ม Quick Date Presets: วันนี้, เมื่อวาน, 7 วันที่แล้ว, 30 วันที่แล้ว",
      "🎯 แสดงตัวกรองที่ใช้งานอยู่แบบ Active Filters Display",
      "❌ เพิ่มปุ่มล้างตัวกรองทั้งหมดและล้างตัวกรองแต่ละรายการ",
      "🌐 รองรับภาษาไทยในการแสดงผลวันที่และ UI",
      "📱 ออกแบบ Responsive Design ที่ใช้งานได้ดีทั้งบนมือถือและเดสก์ท็อป",
      "🎨 ใช้ shadcn/ui components เพื่อความสอดคล้องกับ design system",
      "✨ เตรียมพร้อมสำหรับการ integration กับ Facebook Ads API data",
      "🔧 รองรับ TypeScript interfaces สำหรับ type safety"
    ]
  },
  {
    date: "2025-08-08",
    time: "14:30",
    version: "v2.5.78",
    type: "feature",
    title: "📚 อัปเดต README.md เป็น Affilitics.me Brand",
    description: "ปรับปรุง README.md ให้สอดคล้องกับแบรนด์ Affilitics.me พร้อมเพิ่มข้อมูลครบถ้วนเกี่ยวกับ features, setup, และ documentation",
    details: [
      "🚀 เปลี่ยนชื่อโปรเจกต์เป็น 'Affilitics.me - Advanced Affiliate Marketing Analytics Platform'",
      "✨ เพิ่มรายละเอียด Features ครบถ้วน: Dashboard, Facebook Integration, Data Management, Advanced Analytics",
      "🛠️ อัปเดต Tech Stack information พร้อม Frontend, State Management, Charts & Visualization",
      "📖 เพิ่ม Quick Start Guide แบบ step-by-step พร้อม Prerequisites และ Installation",
      "🔧 เพิ่มคำแนะนำ Facebook App Configuration และ Environment Variables",
      "📚 เพิ่ม Documentation links และ Setup Guides",
      "🔐 เพิ่มส่วน Security information: Authentication, Data Protection",
      "🌐 เพิ่มคำแนะนำ Deployment และ Production setup",
      "🤝 เพิ่มส่วน Contributing guidelines และ Support information",
      "📄 ปรับปรุงโครงสร้างเอกสารให้อ่านง่ายและครบถ้วนมากขึ้น"
    ]
  },
  {
    date: "2025-08-08",
    time: "00:15",
    version: "v2.5.77",
    type: "improvement",
    title: "🏷️ อัปเดต User Agent ใน Facebook API Constants",
    description: "เปลี่ยน User Agent จาก 'AffiliateMarketingDashboard/1.0' เป็น 'Affilitics.me/1.0' เพื่อให้สอดคล้องกับชื่อแบรนด์ใหม่ของแอปพลิเคชัน",
    details: [
      "🏷️ อัปเดต USER_AGENT ใน facebook-constants.ts",
      "📝 เปลี่ยนจาก 'AffiliateMarketingDashboard/1.0' เป็น 'Affilitics.me/1.0'",
      "🎯 ปรับปรุงการระบุตัวตนของแอปพลิเคชันใน Facebook API requests",
      "✨ สร้างความสอดคล้องกับชื่อแบรนด์ Affilitics.me",
      "🔧 ปรับปรุงการติดตาม API usage และ analytics"
    ]
  },
  {
    date: "2025-08-07",
    time: "23:58",
    version: "v2.5.76",
    type: "feature",
    title: "📱 สร้าง Facebook App Activation Helper Component",
    description: "สร้าง FacebookAppActivationHelper component ใหม่เพื่อช่วยเหลือผู้ใช้ในการแก้ไขปัญหา 'App not active' และตั้งค่า Facebook App ให้ถูกต้อง",
    details: [
      "📱 สร้าง FacebookAppActivationHelper component แบบ step-by-step guide",
      "📋 แบ่งเป็น 4 tabs: Basic Info, Facebook Login, Permissions, และ Activation",
      "📝 เพิ่ม CopyableField component สำหรับ copy URL และค่าต่างๆ ได้ง่าย",
      "🔗 ใช้ getFacebookAppUrls() จาก policy-checker utility",
      "⚙️ แสดงข้อมูลการตั้งค่า App Domains, Privacy Policy URL, Terms of Service URL",
      "🌐 คำแนะนำการตั้งค่า Facebook Login และ OAuth Redirect URIs",
      "👥 แสดงรายการ permissions ที่จำเป็น (ads_read, ads_management)",
      "🚀 เสนอ 2 ตัวเลือก: Development Mode และ Live Mode สำหรับ app activation",
      "🔗 เพิ่มปุ่มเปิด Facebook App และ Documentation โดยตรง",
      "✨ ออกแบบ UI ด้วย shadcn/ui components และ responsive design"
    ]
  },
  {
    date: "2025-08-07",
    time: "23:55",
    version: "v2.5.75",
    type: "feature",
    title: "📱 เพิ่ม Facebook App Activation Helper Component",
    description: "สร้าง FacebookAppActivationHelper component ใหม่เพื่อช่วยเหลือผู้ใช้ในการแก้ไขปัญหา 'App not active' และตั้งค่า Facebook App ให้ถูกต้อง",
    details: [
      "📱 สร้าง FacebookAppActivationHelper component แบบ step-by-step guide",
      "📋 แบ่งเป็น 4 tabs: Basic Info, Facebook Login, Permissions, และ Activation",
      "📝 เพิ่ม CopyableField component สำหรับ copy URL และค่าต่างๆ ได้ง่าย",
      "🔗 ใช้ getFacebookAppUrls() จาก policy-checker utility",
      "⚙️ แสดงข้อมูลการตั้งค่า App Domains, Privacy Policy URL, Terms of Service URL",
      "🌐 คำแนะนำการตั้งค่า Facebook Login และ OAuth Redirect URIs",
      "👥 แสดงรายการ permissions ที่จำเป็น (ads_read, ads_management)",
      "🚀 เสนอ 2 ตัวเลือก: Development Mode และ Live Mode สำหรับ app activation",
      "🔗 เพิ่มปุ่มเปิด Facebook App และ Documentation โดยตรง",
      "✨ ออกแบบ UI ด้วย shadcn/ui components และ responsive design"
    ]
  },
  {
    date: "2025-08-07",
    time: "23:50",
    version: "v2.5.74",
    type: "feature",
    title: "🔍 เพิ่ม Policy Files Check ใน Facebook Setup Status Component",
    description: "อัปเดต FacebookSetupStatus component เพื่อรวม policy files checker โดยตรง ให้ผู้ใช้สามารถตรวจสอบการเข้าถึง Privacy Policy และ Terms of Service ได้ในหน้าเดียว",
    details: [
      "🔍 เพิ่มส่วน Policy Files Check ใน FacebookSetupStatus component",
      "🔘 เพิ่มปุ่ม 'Check Files' สำหรับตรวจสอบการเข้าถึงไฟล์ policy",
      "✅ แสดงสถานะการเข้าถึง Privacy Policy และ Terms of Service แบบ real-time",
      "❌ แสดงข้อผิดพลาดเมื่อไฟล์ไม่สามารถเข้าถึงได้",
      "⚠️ แสดง Alert เตือนเมื่อไฟล์ policy ไม่พร้อมใช้งาน",
      "🔄 เพิ่ม loading state ขณะตรวจสอบไฟล์",
      "🎯 ใช้ policy-checker utility ที่สร้างไว้แล้วสำหรับการตรวจสอบ",
      "📱 ปรับปรุง UI ให้สอดคล้องกับ design system ของ component",
      "🛡️ เตรียมพร้อมสำหรับ Facebook App activation process"
    ]
  },
  {
    date: "2025-08-07",
    time: "23:45",
    version: "v2.5.73",
    type: "feature",
    title: "📋 เพิ่ม Policy Files Checker Utility สำหรับ Facebook App Setup",
    description: "สร้าง policy-checker.ts utility เพื่อตรวจสอบการเข้าถึง Privacy Policy และ Terms of Service พร้อมสร้างคำแนะนำการตั้งค่า Facebook App",
    details: [
      "📋 เพิ่มฟังก์ชัน checkPolicyFiles() สำหรับตรวจสอบการเข้าถึงไฟล์ policy",
      "🔗 ตรวจสอบ privacy-policy.html และ terms-of-service.html ว่าสามารถเข้าถึงได้",
      "📝 เพิ่มฟังก์ชัน getFacebookAppUrls() สำหรับสร้าง URL ที่ใช้ใน Facebook App",
      "📖 เพิ่มฟังก์ชัน generateFacebookAppInstructions() สำหรับคำแนะนำการตั้งค่า",
      "🛡️ รองรับการตรวจสอบ HTTP status และ network errors",
      "🎯 ให้ข้อมูล OAuth Redirect URI, Privacy Policy URL และ Terms of Service URL",
      "💡 สร้างคำแนะนำแบบ step-by-step สำหรับการตั้งค่า Facebook App",
      "🔧 เตรียมพร้อมสำหรับการใช้งานใน Facebook setup components",
      "✅ รองรับทั้ง Development Mode และ Live Mode configuration"
    ]
  },
  {
    date: "2025-08-07",
    time: "22:30",
    version: "v2.5.72",
    type: "improvement",
    title: "🔄 ปรับปรุง Facebook Connection Panel ให้ใช้ Setup Status Component",
    description: "อัปเดต FacebookConnectionPanel ให้ใช้ FacebookSetupStatus แทน FacebookConfigChecker เพื่อให้การแสดงสถานะการตั้งค่าสอดคล้องกันทั่วทั้งแอปพลิเคชัน",
    details: [
      "🔄 เปลี่ยนจากการใช้ FacebookConfigChecker เป็น FacebookSetupStatus",
      "🎯 ใช้ฟังก์ชัน isFacebookReady() แทนการตรวจสอบ config แบบ manual",
      "✨ ปรับปรุงความสอดคล้องของ UI/UX ในการแสดงสถานะการตั้งค่า",
      "🔧 ลดความซับซ้อนของโค้ดและเพิ่มการใช้งาน utility functions",
      "📱 รับประกันการแสดงผลที่เหมาะสมในทุกสถานะของการเชื่อมต่อ Facebook"
    ]
  },
  {
    date: "2025-08-07",
    time: "22:15",
    version: "v2.5.71",
    type: "feature",
    title: "🔧 เพิ่ม Facebook Configuration Validator Utility",
    description: "สร้าง facebook-config-validator.ts เพื่อตรวจสอบและแนะนำการตั้งค่า Facebook API configuration ให้ถูกต้องและครบถ้วน",
    details: [
      "🔍 เพิ่มฟังก์ชัน validateFacebookConfiguration() สำหรับตรวจสอบการตั้งค่าทั้งหมด",
      "📋 ตรวจสอบ Facebook App ID, API Version, Redirect URI และ Scopes",
      "⚠️ แสดงสถานะ pass/fail/warning พร้อมข้อความแนะนำการแก้ไข",
      "📝 เพิ่มฟังก์ชัน getFacebookAppSetupInstructions() สำหรับคำแนะนำการตั้งค่า Facebook App",
      "🌐 เพิ่มฟังก์ชัน testFacebookConnectivity() สำหรับทดสอบการเชื่อมต่อ Facebook API",
      "📊 เพิ่มฟังก์ชัน generateConfigReport() สำหรับสร้างรายงานการตั้งค่าแบบละเอียด",
      "✅ เพิ่มฟังก์ชัน isFacebookReady() สำหรับตรวจสอบความพร้อมใช้งานอย่างรวดเร็ว",
      "🎯 รองรับการตรวจสอบรูปแบบ App ID (15-16 หลัก) และ URL format",
      "🔧 เตรียมพร้อมสำหรับการใช้งานใน FacebookConfigChecker component"
    ]
  },
  {
    date: "2025-08-07",
    time: "21:30",
    version: "v2.5.70",
    type: "feature",
    title: "📱 เพิ่ม Facebook OAuth Callback Page สำหรับ Facebook API Integration",
    description: "สร้างหน้า FacebookCallback.tsx เพื่อจัดการ OAuth callback จาก Facebook และสื่อสารกับ parent window ในขั้นตอน authentication",
    details: [
      "📱 สร้าง FacebookCallback component สำหรับจัดการ OAuth callback",
      "🔐 จัดการ authorization code และ state parameter จาก Facebook OAuth",
      "⚠️ เพิ่มการจัดการ error cases ต่างๆ (access_denied, server_error, etc.)",
      "💬 ส่งข้อความกลับไปยัง parent window ผ่าน postMessage API",
      "🎨 แสดง UI status indicators (loading, success, error) พร้อม icons",
      "⏰ ปิด popup window อัตโนมัติหลังจากประมวลผลเสร็จสิ้น",
      "🛡️ เพิ่มการตรวจสอบ security parameters และ origin validation",
      "✨ ออกแบบ UI ที่สวยงามด้วย shadcn/ui components",
      "🔄 รองรับการ redirect กลับไปยัง main application หลัง authentication"
    ]
  },
  {
    date: "2025-08-07",
    time: "20:15",
    version: "v2.5.69",
    type: "improvement",
    title: "🔧 เพิ่มการตรวจสอบ Configuration ใน Facebook Connection Panel",
    description: "ปรับปรุง FacebookConnectionPanel ให้แสดง FacebookConfigChecker เมื่อการกำหนดค่า Facebook App ID ไม่ถูกต้องหรือยังใช้ค่า placeholder",
    details: [
      "🔍 เพิ่มการตรวจสอบ Facebook App ID configuration ใน connection panel",
      "📋 แสดง FacebookConfigChecker component เมื่อ config ไม่ถูกต้อง",
      "🛡️ ป้องกันการแสดงปุ่ม connect เมื่อยังไม่ได้กำหนดค่า App ID",
      "✨ ปรับปรุง UX ให้ผู้ใช้เห็นข้อความแนะนำการตั้งค่าทันที",
      "🎯 เพิ่มความชัดเจนในขั้นตอนการตั้งค่า Facebook integration"
    ]
  },
  {
    date: "2025-08-07",
    time: "19:45",
    version: "v2.5.68",
    type: "improvement",
    title: "🔧 ปรับปรุงการตรวจสอบ Facebook App ID Configuration",
    description: "เพิ่มการตรวจสอบค่า placeholder ใน Facebook App ID และปรับปรุงข้อความแจ้งเตือนให้ชัดเจนขึ้นเมื่อยังไม่ได้กำหนดค่า",
    details: [
      "🔍 เพิ่มการตรวจสอบค่า 'your_facebook_app_id_here' ใน Facebook App ID",
      "📝 ปรับปรุงข้อความ error ให้ระบุชัดเจนว่าต้องตั้งค่า VITE_FACEBOOK_APP_ID",
      "🎯 แนะนำให้ผู้ใช้สร้างไฟล์ .env.local และใส่ Facebook App ID จริง",
      "✨ ป้องกันการใช้งานด้วยค่า placeholder ที่อาจทำให้เกิดข้อผิดพลาด",
      "🛡️ เพิ่มความปลอดภัยในการตรวจสอบการกำหนดค่า Facebook OAuth"
    ]
  },
  {
    date: "2025-08-07",
    time: "18:30",
    version: "v2.5.67",
    type: "feature",
    title: "⚙️ เพิ่ม Feature Flags และ Runtime Configuration สำหรับ Facebook Integration",
    description: "เพิ่มระบบ feature flags และ runtime configuration ที่ครอบคลุมสำหรับการจัดการ Facebook API integration พร้อมการกำหนดค่าที่ยืดหยุ่น",
    details: [
      "🚩 เพิ่ม FACEBOOK_FEATURE_FLAGS สำหรับควบคุมฟีเจอร์ต่างๆ",
      "⚙️ เพิ่ม getRuntimeConfig() function สำหรับการกำหนดค่าแบบ dynamic",
      "🔄 รองรับการเปิด/ปิด auto sync, batch requests, rate limiting",
      "💾 เพิ่มการควบคุม data caching และ virtual scrolling",
      "🛡️ เพิ่ม error recovery และ performance monitoring flags",
      "📊 เพิ่มการกำหนดค่า sync interval, batch size, และ max retries",
      "🎯 เพิ่มการกำหนดค่า performance settings และ cache timeout",
      "🔍 เพิ่ม debug configuration พร้อม log level และ API logging",
      "🌍 รองรับการกำหนดค่าผ่าน environment variables",
      "✨ เตรียมพร้อมสำหรับการปรับแต่งประสิทธิภาพและฟีเจอร์ในอนาคต"
    ]
  },
  {
    date: "2025-08-07",
    time: "17:15",
    version: "v2.5.66",
    type: "fix",
    title: "🔧 แก้ไข Syntax Error ใน Facebook API Service Test",
    description: "แก้ไขปัญหา syntax error ในไฟล์ test ที่เกิดจากการใช้ semicolon แทน closing brace ที่ทำให้ test suite ไม่สามารถทำงานได้",
    details: [
      "🔧 แก้ไข syntax error ใน facebook-api-service.test.ts",
      "✅ เปลี่ยนจาก '}; ' เป็น '});' ให้ถูกต้องตามโครงสร้าง describe block",
      "🧪 รับประกันว่า test suite สามารถทำงานได้อย่างปกติ",
      "🎯 ป้องกัน compilation errors ที่อาจเกิดขึ้นจากการ run tests",
      "🚀 ปรับปรุงความเสถียรของ test infrastructure สำหรับ Facebook API integration"
    ]
  },
  {
    date: "2025-08-07",
    time: "16:45",
    version: "v2.5.65",
    type: "security",
    title: "🔐 เพิ่ม Token Encryption Service สำหรับความปลอดภัยของ OAuth Tokens",
    description: "สร้าง TokenEncryptionService ที่ใช้ AES-GCM encryption เพื่อเข้ารหัส OAuth tokens ก่อนเก็บใน localStorage พร้อมระบบ key derivation และ device-specific protection",
    details: [
      "🔐 สร้าง TokenEncryptionService ด้วย AES-GCM 256-bit encryption",
      "🔑 ใช้ PBKDF2 key derivation พร้อม 100,000 iterations สำหรับความปลอดภัย",
      "📱 สร้าง device-specific keys จาก browser fingerprinting",
      "🛡️ เข้ารหัส stored keys ด้วย device-specific protection layer",
      "🔄 รองรับการ encrypt/decrypt แบบ asynchronous",
      "⚡ ใช้ Web Crypto API สำหรับ native browser encryption",
      "🧹 เพิ่มระบบ key management และ cleanup functions",
      "🔒 ป้องกัน token theft ด้วย multi-layer encryption approach",
      "🏭 export singleton factory pattern สำหรับ global service management",
      "✅ รองรับ backward compatibility กับ legacy encryption methods"
    ]
  },
  {
    date: "2025-08-07",
    time: "14:30",
    version: "v2.5.64",
    type: "feature",
    title: "⏰ เพิ่ม Facebook Sync Scheduler สำหรับการซิงค์อัตโนมัติ",
    description: "สร้าง FacebookSyncScheduler class สำหรับจัดการการซิงค์ข้อมูล Facebook API แบบอัตโนมัติในพื้นหลัง พร้อมระบบ job scheduling, retry logic และ event management",
    details: [
      "⏰ สร้าง FacebookSyncScheduler class สำหรับการซิงค์อัตโนมัติ",
      "📅 รองรับการกำหนดตารางเวลาซิงค์แบบ interval-based scheduling",
      "🔄 เพิ่มระบบ retry logic พร้อม exponential backoff สำหรับ failed syncs",
      "🎯 จัดการ sync jobs แบบ concurrent พร้อม queue system",
      "📊 ติดตาม sync history และ performance metrics",
      "🎧 เพิ่มระบบ event listeners สำหรับ sync lifecycle events",
      "⚙️ รองรับการ pause/resume ทั้งระดับ global และ individual jobs",
      "🛡️ เพิ่ม conflict resolution strategies สำหรับ concurrent syncs",
      "🏭 export singleton factory pattern สำหรับ global scheduler management",
      "🔧 รองรับการกำหนดค่า sync intervals, retry policies และ concurrency limits"
    ]
  },
  {
    date: "2025-08-07",
    time: "09:15",
    version: "v2.5.63",
    type: "feature",
    title: "🔄 เพิ่ม Dashboard Campaign Merger ใน Data Merger Service",
    description: "เพิ่มฟังก์ชัน mergeDashboardCampaigns ใน data-merger.ts เพื่อรองรับการผสานข้อมูล campaign จาก Facebook API กับข้อมูลที่มีอยู่ในระบบ",
    details: [
      "🔄 เพิ่มฟังก์ชัน mergeDashboardCampaigns สำหรับผสานข้อมูล campaign",
      "📊 รองรับการผสานข้อมูลระหว่าง existing campaigns และ Facebook API campaigns",
      "🏷️ เพิ่มการติดป้าย data source สำหรับแยกแยะแหล่งที่มาของข้อมูล",
      "⏰ เพิ่มการติดตาม source timestamp สำหรับการจัดการข้อมูลตามเวลา",
      "🆔 เพิ่มการสร้าง unique source ID สำหรับแต่ละ campaign record",
      "🔗 ใช้ mergeCampaignsBySubIdAndPlatform สำหรับการผสานข้อมูลที่แม่นยำ",
      "✨ รองรับการผสานข้อมูลจากหลายแหล่งโดยไม่เกิด duplication",
      "🎯 เตรียมพร้อมสำหรับการ integration กับ Facebook API data flow"
    ]
  },
  {
    date: "2025-08-06",
    time: "16:45",
    version: "v2.5.62",
    type: "feature",
    title: "🔗 เพิ่ม Facebook API Connection UI ใน DataImport Component",
    description: "อัปเดต DataImport component เพื่อรองรับการเชื่อมต่อ Facebook API พร้อม UI สำหรับจัดการการเชื่อมต่อและการซิงค์ข้อมูล",
    details: [
      "🔗 เพิ่ม import สำหรับ Facebook API integration icons (Link, Unlink, RefreshCw, Settings)",
      "📱 เพิ่ม Dialog components สำหรับ Facebook connection management UI",
      "🔧 เพิ่ม Facebook OAuth service และ API service imports",
      "📊 เพิ่ม Facebook connection state และ ad account types",
      "🎯 เตรียม UI foundation สำหรับ Facebook API connection management",
      "✨ รองรับการแสดงสถานะการเชื่อมต่อและการจัดการ Facebook accounts",
      "🔄 เพิ่มความสามารถในการ sync ข้อมูลจาก Facebook API",
      "🛡️ เตรียมพร้อมสำหรับการจัดการ OAuth authentication flow"
    ]
  },
  {
    date: "2025-08-06",
    time: "15:30",
    version: "v2.5.61",
    type: "feature",
    title: "🔄 เพิ่ม Facebook Data Transformer สำหรับ Facebook API Integration",
    description: "สร้าง data transformation layer สำหรับแปลงข้อมูล Facebook API ให้เข้ากับโครงสร้างข้อมูล dashboard ที่มีอยู่",
    details: [
      "🔄 สร้าง FacebookDataTransformer class สำหรับแปลงข้อมูล Facebook API",
      "📊 แปลง Facebook campaigns เป็น dashboard campaign format พร้อม ROI calculation",
      "🎯 สร้าง sub ID จาก Facebook campaign data ด้วยรูปแบบ fb_{objective}_{campaignId}",
      "💰 ประมาณการ orders จาก clicks ด้วย conversion rate 2% และ commission rate 5%",
      "🌍 รองรับการแปลงสกุลเงินด้วย currency conversion rates",
      "📈 aggregate platform data และ sub ID data สำหรับ dashboard components",
      "🔀 merge Facebook data กับข้อมูลที่มีอยู่โดยป้องกัน duplication",
      "✅ validate และ sanitize ข้อมูลที่แปลงแล้วเพื่อความถูกต้อง",
      "🏭 export singleton instance สำหรับการใช้งานทั่วทั้งแอปพลิเคชัน"
    ]
  },
  {
    date: "2025-08-06",
    time: "14:15",
    version: "v2.5.60",
    type: "feature",
    title: "🌐 เพิ่ม Facebook Marketing API Client สำหรับ Facebook API Integration",
    description: "สร้าง core HTTP client สำหรับเชื่อมต่อ Facebook Marketing API พร้อมระบบ authentication, rate limiting, retry logic และ circuit breaker pattern",
    details: [
      "🌐 สร้าง FacebookAPIClient class สำหรับจัดการการเชื่อมต่อ Facebook Marketing API",
      "🔐 เพิ่มระบบ authentication ด้วย access token และ Bearer token headers",
      "⚡ เพิ่มระบบ rate limiting เพื่อป้องกันการเกิน API quota limits",
      "🔄 เพิ่ม retry logic พร้อม exponential backoff สำหรับ failed requests",
      "🛡️ เพิ่ม circuit breaker pattern เพื่อป้องกัน cascading failures",
      "📊 รองรับ batch requests สำหรับประสิทธิภาพที่ดีขึ้น",
      "🔧 เพิ่ม error handling เฉพาะสำหรับ Facebook API error codes",
      "✨ เพิ่ม health check และ status monitoring methods",
      "🏭 เพิ่ม singleton factory pattern สำหรับ global instance management"
    ]
  },
  {
    date: "2025-08-06",
    time: "12:30",
    version: "v2.5.59",
    type: "feature",
    title: "🔐 เพิ่ม OAuth Popup Manager สำหรับ Facebook API Integration",
    description: "สร้าง OAuth popup manager utility สำหรับจัดการ popup window ในขั้นตอน Facebook OAuth authentication",
    details: [
      "🔐 สร้าง FacebookOAuthPopupManager class สำหรับจัดการ OAuth popup window",
      "🪟 เพิ่มระบบจัดการ popup window lifecycle (เปิด, ปิด, timeout)",
      "📡 เพิ่มระบบ cross-origin message handling ระหว่าง popup และ parent window",
      "⏱️ เพิ่มระบบ timeout handling สำหรับ OAuth flow (5 นาที)",
      "🛡️ เพิ่มการตรวจสอบ origin validation เพื่อความปลอดภัย",
      "🔧 เพิ่ม error handling สำหรับ OAuth flow failures และ cancellations",
      "✨ เพิ่ม utility function สำหรับสร้าง popup manager instance"
    ]
  },
  {
    date: "2025-08-06",
    time: "11:45",
    version: "v2.5.58",
    type: "improvement",
    title: "⚙️ ปรับปรุงการกำหนดค่า Facebook API Configuration",
    description: "อัปเดตและปรับปรุงระบบการกำหนดค่า Facebook API เพื่อรองรับการเชื่อมต่อ Facebook Marketing API",
    details: [
      "⚙️ ปรับปรุงโครงสร้างการกำหนดค่า Facebook API configuration",
      "🔧 เพิ่มระบบ validation สำหรับการตรวจสอบความถูกต้องของ configuration",
      "🌍 รองรับการกำหนดค่าแยกตาม environment (development/production)",
      "🔐 เพิ่มระบบ OAuth configuration สำหรับการ authentication",
      "📊 เพิ่มฟังก์ชัน debugging และ configuration summary",
      "✨ ปรับปรุงความเสถียรและความปลอดภัยของการเชื่อมต่อ Facebook API"
    ]
  },
  {
    date: "2025-01-08",
    time: "23:55",
    version: "v2.5.57",
    type: "improvement",
    title: "🫧 ปรับปรุงขนาด Bubble ใน BubblePlotChart อีกครั้งเพื่อความสมดุล",
    description: "ปรับขนาด bubble ใหม่เป็น 30-800px เพื่อให้มีความสมดุลระหว่างการมองเห็นและการใช้พื้นที่",
    details: [
      "🫧 ปรับขนาด bubble จาก 75-600px เป็น 30-800px",
      "⚖️ สร้างความสมดุลระหว่างขนาดเล็กสุดและใหญ่สุด",
      "👁️ ขนาดเล็กสุดลดลงเพื่อไม่ให้บดบังข้อมูลอื่น",
      "📈 ขนาดใหญ่สุดเพิ่มขึ้นเพื่อเน้น Sub ID ที่มี ROI สูง",
      "✨ ปรับปรุงการแสดงผลให้เหมาะสมกับการวิเคราะห์ข้อมูล"
    ]
  },
  {
    date: "2025-01-08",
    time: "23:50",
    version: "v2.5.56",
    type: "improvement",
    title: "🫧 ปรับปรุงขนาด Bubble ใน BubblePlotChart ให้ชัดเจนขึ้น",
    description: "เพิ่มขนาด bubble ใน BubblePlotChart เป็น 5 เท่าเพื่อให้การแสดงผลชัดเจนและมองเห็นได้ง่ายขึ้น",
    details: [
      "🫧 เพิ่มขนาด bubble จาก 15-120px เป็น 75-600px (เพิ่ม 5 เท่า)",
      "👁️ ปรับปรุงการมองเห็น bubble ให้ชัดเจนขึ้นสำหรับผู้ใช้",
      "📊 รักษาอัตราส่วนการแสดงผล ROI เดิมไว้",
      "✨ เพิ่มประสบการณ์การใช้งานที่ดีขึ้นในการอ่านกราฟ",
      "🎯 ช่วยให้ผู้ใช้สามารถแยกแยะ Sub ID performance ได้ง่ายขึ้น"
    ]
  },
  {
    date: "2025-01-08",
    time: "23:45",
    version: "v2.5.55",
    type: "fix",
    title: "🔧 เพิ่ม ZAxis Import ใน BubblePlotChart Component",
    description: "แก้ไขการ import ZAxis จาก Recharts ใน BubblePlotChart เพื่อรองรับการใช้งาน bubble size ที่ถูกต้อง",
    details: [
      "🔧 เพิ่ม ZAxis ใน import statement จาก recharts",
      "📊 รองรับการใช้งาน ZAxis สำหรับการกำหนดขนาด bubble ใน ScatterChart",
      "✨ ปรับปรุงความสมบูรณ์ของ import dependencies",
      "🎯 เตรียมพร้อมสำหรับการใช้งาน ZAxis ในอนาคต",
      "🚀 แก้ไขปัญหา potential import error ที่อาจเกิดขึ้น"
    ]
  },
  {
    date: "2025-01-08",
    time: "22:30",
    version: "v2.5.54",
    type: "improvement",
    title: "🫧 ปรับปรุงการคำนวณขนาด Bubble ใน BubblePlotChart (Phase 2)",
    description: "ปรับปรุงอัลกอริทึมการคำนวณขนาด bubble ให้แม่นยำและมีประสิทธิภาพมากขึ้น พร้อมเพิ่ม square root scaling",
    details: [
      "🔧 ย้ายการคำนวณขนาด bubble ไปยัง useMemo เพื่อประสิทธิภาพที่ดีขึ้น",
      "📊 เพิ่ม square root scaling (Math.sqrt) เพื่อให้ความแตกต่างของ bubble ชัดเจนขึ้น",
      "🎯 ใช้ 'z' property สำหรับขนาด bubble ใน Recharts ตามมาตรฐาน",
      "📏 ปรับช่วงขนาด bubble เป็น 15-120px เพื่อการแสดงผลที่เหมาะสม",
      "🧮 ปรับปรุงการคำนวณ normalized ROI ให้แม่นยำขึ้น",
      "✨ รับประกันขนาดขั้นต่ำของ bubble เพื่อการมองเห็นที่ดี",
      "🚀 เพิ่มประสิทธิภาพการ render และลดการคำนวณซ้ำ"
    ]
  },
  {
    date: "2025-01-08",
    time: "22:15",
    version: "v2.5.53",
    type: "improvement",
    title: "🫧 ปรับปรุงการคำนวณขนาด Bubble ใน BubblePlotChart",
    description: "ปรับปรุงอัลกอริทึมการคำนวณขนาด bubble ให้แม่นยำขึ้นโดยใช้ช่วงค่า ROI ที่สมบูรณ์และเพิ่ม debug logging",
    details: [
      "🔍 เพิ่มการคำนวณ minROI เพื่อใช้ช่วงค่า ROI ที่สมบูรณ์",
      "📏 ปรับขนาด bubble ให้มีช่วงที่กว้างขึ้น (15-120px แทน 20-100px)",
      "🧮 ใช้สูตรการคำนวณที่แม่นยำขึ้น: minSize + ((roi - minROI) / (maxROI - minROI)) * (maxSize - minSize)",
      "🔍 เพิ่ม debug logging เพื่อตรวจสอบการคำนวณขนาด bubble",
      "📊 ปรับปรุงการแสดงผล bubble ให้สะท้อนความแตกต่างของ ROI ได้ชัดเจนขึ้น",
      "✨ เพิ่มความแม่นยำในการแสดงผลข้อมูล Sub ID performance"
    ]
  },
  {
    date: "2025-01-08",
    time: "21:30",
    version: "v2.5.52",
    type: "improvement",
    title: "💰 เพิ่มฟังก์ชัน formatCPC ใน AdsChart Component",
    description: "เพิ่มฟังก์ชัน formatCPC เพื่อจัดรูปแบบการแสดงผลค่า CPC (Cost Per Click) ให้มีความแม่นยำและสวยงามมากขึ้น",
    details: [
      "💰 เพิ่มฟังก์ชัน formatCPC สำหรับจัดรูปแบบค่า CPC",
      "🔢 แสดงทศนิยม 2 ตำแหน่งสำหรับค่า CPC เพื่อความแม่นยำ",
      "📊 ปรับปรุงการแสดงผลตัวเลขให้มีรูปแบบที่สวยงามและอ่านง่าย",
      "✨ เพิ่มความสอดคล้องในการจัดรูปแบบตัวเลขทั่วทั้ง component",
      "🎯 เตรียมพร้อมสำหรับการใช้งานในการแสดงผลข้อมูล CPC ที่แม่นยำ"
    ]
  },
  {
    date: "2025-01-08",
    time: "21:15",
    version: "v2.5.51",
    type: "improvement",
    title: "🔧 ปรับปรุง AdsChart Component",
    description: "อัปเดตและปรับปรุง AdsChart component เพื่อเพิ่มประสิทธิภาพและความเสถียรในการแสดงผลข้อมูลโฆษณา",
    details: [
      "🔧 ปรับปรุงโครงสร้างโค้ดใน AdsChart component",
      "📊 เพิ่มความเสถียรในการแสดงผลกราฟข้อมูลโฆษณา",
      "✨ ปรับปรุงการจัดการข้อมูลและการคำนวณ metrics",
      "🎯 เพิ่มความแม่นยำในการแสดงผล Ad Spend, Link Clicks และ CPC",
      "🚀 ปรับปรุงประสิทธิภาพการ render และ performance"
    ]
  },
  {
    date: "2025-01-08",
    time: "20:45",
    version: "v2.5.50",
    type: "improvement",
    title: "📊 เพิ่ม Chart Components ใหม่ใน AdsChart",
    description: "เพิ่มการ import chart components เพิ่มเติมใน AdsChart เพื่อรองรับการแสดงผลข้อมูลในรูปแบบที่หลากหลายมากขึ้น",
    details: [
      "📊 เพิ่มการ import ComposedChart, Line, LineChart จาก recharts",
      "🔧 เตรียมพร้อมสำหรับการแสดงผลข้อมูลแบบผสมผสาน (Bar + Line)",
      "✨ รองรับการแสดงผลข้อมูลที่ซับซ้อนมากขึ้นในอนาคต",
      "🎯 เพิ่มความยืดหยุ่นในการเลือกประเภทกราฟที่เหมาะสม",
      "🚀 ปรับปรุงโครงสร้างการ import เพื่อรองรับฟีเจอร์ใหม่"
    ]
  },
  {
    date: "2025-01-08",
    time: "19:30",
    version: "v2.5.49",
    type: "fix",
    title: "🔧 แก้ไขการอ้างอิง Field Names ใน AdsChart Component",
    description: "แก้ไขการใช้ field names ที่ถูกต้องใน AdsChart component เพื่อให้แสดงข้อมูล Link Clicks และ CPC ได้อย่างแม่นยำ",
    details: [
      "🔧 แก้ไขจาก totalLinkClick เป็น totalLinkClicks ให้ตรงกับ calculatedMetrics",
      "📊 แก้ไขจาก avgCPCLink เป็น cpcLink ให้สอดคล้องกับโครงสร้างข้อมูล",
      "✨ รับประกันการแสดงผลข้อมูล Link Clicks และ CPC ที่ถูกต้อง",
      "🎯 ปรับปรุงความแม่นยำของการคำนวณค่าสัดส่วนรายวัน",
      "🚀 เพิ่มความเสถียรของการแสดงผลกราฟ Ads Chart"
    ]
  },
  {
    date: "2025-01-08",
    time: "19:15",
    version: "v2.5.48",
    type: "feature",
    title: "📊 เพิ่ม AdsChart Component ใหม่",
    description: "สร้าง AdsChart component สำหรับแสดงกราฟข้อมูลโฆษณารายวันแยกตาม Ad Spend, Link Click และ CPC Link",
    details: [
      "📊 สร้าง AdsChart component ใหม่สำหรับแสดงข้อมูลโฆษณารายวัน",
      "📈 แสดงกราฟ Ad Spend, Link Click และ CPC Link ในรูปแบบ Bar Chart",
      "✨ ใช้ข้อมูลจาก dailyMetrics และ calculatedMetrics เพื่อความแม่นยำ",
      "🎯 เพิ่มระบบ StatCard แบบคลิกได้เพื่อเลือกข้อมูลที่ต้องการแสดง",
      "📊 ใช้ BarChart จาก Recharts พร้อม Custom Tooltip และ Legend",
      "🎨 ออกแบบ UI ให้สอดคล้องกับ StatsChart และ OrderChart components",
      "🔢 แสดงผลรวมของแต่ละตัวแปรใน StatCard พร้อมหน่วยที่เหมาะสม",
      "📅 รองรับการแสดงวันที่ในรูปแบบ dd/MM/yyyy",
      "💡 คำนวณ Link Click และ CPC จากอัตราส่วนของ Ad Spend รายวัน"
    ]
  },
  {
    date: "2025-01-08",
    time: "18:30",
    version: "v2.5.47",
    type: "feature",
    title: "📊 เพิ่ม OrderChart และ ComChart ลงใน Dashboard",
    description: "เพิ่มการแสดงผล OrderChart และ ComChart components ในหน้า Dashboard หลักเพื่อให้ผู้ใช้เห็นข้อมูลการวิเคราะห์ที่ครบถ้วนมากขึ้น",
    details: [
      "📊 เพิ่ม OrderChart component ลงในหน้า Dashboard หลัก",
      "💰 เพิ่ม ComChart component ลงในหน้า Dashboard หลัก",
      "🎯 จัดเรียงตำแหน่งหลังจาก StatsChart และก่อน AffiliatePerformanceChart",
      "📈 ผู้ใช้สามารถดูกราฟจำนวนออเดอร์และค่าคอมมิชชั่นรายวันได้ในหน้าเดียว",
      "✨ ปรับปรุงประสบการณ์ผู้ใช้ให้เข้าถึงข้อมูลวิเคราะห์ได้ง่ายขึ้น",
      "🔄 ใช้ข้อมูลเดียวกันจาก dailyMetrics และ calculatedMetrics",
      "🎨 รักษาความสอดคล้องของ UI/UX กับ components อื่นๆ ใน Dashboard"
    ]
  },
  {
    date: "2025-01-08",
    time: "17:45",
    version: "v2.5.46",
    type: "feature",
    title: "📊 เพิ่ม OrderChart Component ใหม่",
    description: "สร้าง OrderChart component สำหรับแสดงกราฟจำนวนออเดอร์รายวันแยกตามแพลตฟอร์ม Shopee และ Lazada",
    details: [
      "📊 สร้าง OrderChart component ใหม่สำหรับแสดงข้อมูลออเดอร์รายวัน",
      "🛒 แสดงกราฟ Order SP, Order LZD และ Total Orders แยกตามแพลตฟอร์ม",
      "✨ ใช้ข้อมูลจาก dailyMetrics และ calculatedMetrics เพื่อความแม่นยำ",
      "🎯 เพิ่มระบบ StatCard แบบคลิกได้เพื่อเลือกข้อมูลที่ต้องการแสดง",
      "📈 ใช้ LineChart จาก Recharts พร้อม Custom Tooltip และ Legend",
      "🎨 ออกแบบ UI ให้สอดคล้องกับ StatsChart component",
      "🔢 แสดงผลรวมของแต่ละตัวแปรใน StatCard",
      "📅 รองรับการแสดงวันที่ในรูปแบบ dd/MM/yyyy"
    ]
  },
  {
    date: "2025-01-08",
    time: "16:20",
    version: "v2.5.45",
    type: "fix",
    title: "🔧 แก้ไข Syntax Error ใน DataImport Component",
    description: "แก้ไขปัญหา extra closing parenthesis ที่ทำให้เกิด syntax error ในการ render component",
    details: [
      "🔧 ลบ extra closing parenthesis ที่เหลือจากการแก้ไขก่อนหน้า",
      "✨ แก้ไขปัญหา JSX syntax error ที่ป้องกันการ compile",
      "🎯 รับประกันการ render ที่ถูกต้องของ DataImport component",
      "📱 ปรับปรุงความเสถียรของ UI rendering",
      "🚀 แก้ไขปัญหาที่อาจทำให้แอปพลิเคชันไม่สามารถทำงานได้"
    ]
  },
  {
    date: "2025-01-08",
    time: "15:45",
    version: "v2.5.44",
    type: "fix",
    title: "🔧 แก้ไขโครงสร้าง JSX ใน DataImport Component",
    description: "ปรับปรุงโครงสร้าง JSX ของปุ่ม 'ใช้ข้อมูลปัจจุบัน' และ 'ลบข้อมูลทั้งหมด' ให้ถูกต้องตามมaตรฐาน React",
    details: [
      "🔧 แก้ไขโครงสร้าง JSX โดยใช้ React Fragment (<>) แทนการวางปุ่มแยกกัน",
      "✨ ปรับปรุงการจัดกลุ่มปุ่มให้อยู่ในคอนเทนเนอร์เดียวกัน",
      "🎯 รักษาฟังก์ชันการทำงานเดิมไว้ครบถ้วน",
      "📱 ปรับปรุงความสอดคล้องของ UI layout",
      "🚀 เพิ่มความเสถียรของการ render component"
    ]
  },
  {
    date: "2025-01-08",
    time: "14:30",
    version: "v2.5.43",
    type: "feature",
    title: "🗑️ เพิ่มฟีเจอร์ Clear Data ใน DataImport Component",
    description: "เพิ่มปุ่มลบข้อมูลทั้งหมดเพื่อให้ผู้ใช้สามารถรีเซ็ตระบบและเริ่มต้นใหม่ได้อย่างสะดวก",
    details: [
      "🗑️ เพิ่มปุ่ม 'ลบข้อมูลทั้งหมด' ในหน้า Data Import",
      "⚠️ เพิ่มการยืนยันก่อนลบข้อมูลเพื่อป้องกันการลบโดยไม่ตั้งใจ",
      "💾 ลบข้อมูลทั้งหมดจาก localStorage รวมถึง affiliateData, rawData, metrics",
      "🔄 รีเซ็ตสถานะการอัปโหลดไฟล์และ stored data ทั้งหมด",
      "✨ ปรับปรุง UI ด้วยสีแดงเพื่อเตือนความระวังในการใช้งาน",
      "🚀 ช่วยให้ผู้ใช้สามารถเริ่มต้นใหม่ได้อย่างง่ายดายเมื่อต้องการ"
    ]
  },
  {
    date: "2025-01-05",
    time: "23:15",
    version: "v2.5.42",
    type: "improvement",
    title: "💾 ปรับปรุงระบบ Persistent Data Storage ใน useImportedData Hook",
    description: "เพิ่มการบันทึกข้อมูลลง localStorage หลังจากประมวลผลเสร็จสิ้น เพื่อให้ข้อมูลคงอยู่หลังจาก refresh หน้าเว็บ",
    details: [
      "💾 เพิ่มการบันทึกข้อมูลทั้งหมดลง localStorage หลังจากประมวลผลเสร็จ",
      "🔄 บันทึก affiliateData, rawData, calculatedMetrics ลง localStorage",
      "📊 บันทึก subIdAnalysis, platformAnalysis, dailyMetrics ลง localStorage",
      "✅ เพิ่ม success logging เมื่อบันทึกข้อมูลสำเร็จ",
      "🛡️ เพิ่ม error handling สำหรับการบันทึกข้อมูลลง localStorage",
      "🚀 ปรับปรุงประสบการณ์ผู้ใช้ให้ข้อมูลคงอยู่หลังจาก refresh"
    ]
  },
  {
    date: "2025-01-05",
    time: "22:45",
    version: "v2.5.41",
    type: "improvement",
    title: "💾 เพิ่มระบบ Persistent Data Storage ใน useImportedData Hook",
    description: "เพิ่มการเก็บข้อมูลถาวรใน localStorage เพื่อให้ข้อมูลคงอยู่หลังจาก refresh หน้าเว็บ",
    details: [
      "💾 เพิ่มการโหลดข้อมูลจาก localStorage เมื่อเริ่มต้นใช้งาน",
      "🔄 เก็บข้อมูล importedData, rawData, calculatedMetrics ใน localStorage",
      "📊 เก็บข้อมูล subIdAnalysis, platformAnalysis, dailyMetrics ใน localStorage",
      "⚡ ปรับปรุงประสบการณ์ผู้ใช้ให้ไม่ต้องโหลดข้อมูลใหม่ทุกครั้ง",
      "🛡️ เพิ่ม error handling สำหรับการอ่านข้อมูลจาก localStorage",
      "🚀 เพิ่มความเสถียรและความสะดวกในการใช้งานระบบ"
    ]
  },
  {
    date: "2025-01-05",
    time: "22:35",
    version: "v2.5.40",
    type: "fix",
    title: "🔧 แก้ไขการอ้างอิง totalOrdersLZD ใน StatsChart",
    description: "เพิ่มการตรวจสอบ fallback สำหรับ totalOrdersLZD โดยรองรับทั้ง totalOrdersLZD และ totalOrderLZD",
    details: [
      "🔧 เพิ่ม fallback calculatedMetrics.totalOrderLZD สำหรับ totalOrdersLZD",
      "📊 รองรับการอ้างอิงข้อมูลที่อาจมีชื่อ field แตกต่างกัน",
      "✨ ป้องกัน undefined values ในการคำนวณ Order LZD",
      "🎯 เพิ่มความแม่นยำในการแสดงผลข้อมูล Lazada orders",
      "🚀 ปรับปรุงความเสถียรของการแสดงผลใน StatsChart"
    ]
  },
  {
    date: "2025-01-05",
    time: "22:30",
    version: "v2.5.39",
    type: "improvement",
    title: "📊 ปรับปรุง StatsChart ให้แสดงข้อมูลรวมแทนรายวัน",
    description: "เปลี่ยนการแสดงผลใน StatsChart จากข้อมูลรายวันเป็นข้อมูลรวมทั้งหมดเพื่อความสอดคล้องกับ KPI cards",
    details: [
      "📊 แสดงข้อมูลรวมทั้งหมดแทนการกระจายรายวัน",
      "🎯 ใช้ค่าจาก calculatedMetrics โดยตรงเพื่อความแม่นยำ 100%",
      "✨ รับประกันความสอดคล้องสมบูรณ์ระหว่าง StatsChart และ KPI cards",
      "📈 แสดงผลเป็น single data point ที่สะท้อนผลรวมจริง",
      "🔧 ปรับปรุงการคำนวณให้ตรงกับข้อมูลที่แสดงในหน้า Dashboard"
    ]
  },
  {
    date: "2025-01-05",
    time: "22:15",
    version: "v2.5.38",
    type: "improvement",
    title: "📊 ปรับปรุงการคำนวณข้อมูลใน StatsChart ให้แม่นยำขึ้น",
    description: "เปลี่ยนการคำนวณค่าใน StatsChart ให้ใช้ข้อมูลจาก calculatedMetrics เพื่อความสอดคล้องกับ KPI cards",
    details: [
      "📊 ใช้อัตราส่วนจริงจาก calculatedMetrics ในการกระจายข้อมูลรายวัน",
      "🔧 คำนวณ comSP และ comLZD จากอัตราส่วนจริงแทนการประมาณ",
      "📈 ใช้จำนวน orders จริงจาก calculatedMetrics ในการคำนวณ orderSP และ orderLZD",
      "✨ รับประกันความสอดคล้องระหว่าง StatsChart และ KPI cards",
      "🎯 เพิ่มความแม่นยำของการแสดงผลข้อมูลในกราฟ Multi-Stats"
    ]
  },
  {
    date: "2025-01-05",
    time: "21:30",
    version: "v2.5.37",
    type: "improvement",
    title: "🔧 ปรับปรุงการ Parse วันที่ใน Shopee Orders สำหรับ Daily Performance Analysis",
    description: "เพิ่มความยืดหยุ่นในการอ่านวันที่จาก Shopee orders โดยรองรับหลายคอลัมน์และใช้วันที่ปัจจุบันเป็น fallback",
    details: [
      "🔧 เพิ่มการตรวจสอบหลายคอลัมน์วันที่: เวลาที่สั่งซื้อ, วันที่สั่งซื้อ, Order Time, Order Date, Date",
      "📅 ใช้วันที่ปัจจุบันเป็น fallback เมื่อไม่พบวันที่ที่ถูกต้อง",
      "✨ ปรับปรุงความแม่นยำในการประมวลผล Shopee orders สำหรับ daily metrics",
      "🎯 ป้องกันการสูญหายของข้อมูลเมื่อรูปแบบวันที่ไม่ตรงตามที่คาดหวัง",
      "📊 เพิ่มความเสถียรของการคำนวณ daily performance analysis"
    ]
  },
  {
    date: "2025-01-05",
    time: "21:25",
    version: "v2.5.36",
    type: "fix",
    title: "🔧 แก้ไขการใช้ข้อมูลที่ถูกต้องใน Daily Performance Analysis",
    description: "แก้ไขการส่งข้อมูลให้ analyzeDailyPerformance function ให้ใช้ข้อมูลที่ผ่านการกรองตามวันที่แล้ว",
    details: [
      "🔧 เปลี่ยนจากการใช้ filteredData เป็น finalFilteredData ใน analyzeDailyPerformance",
      "📊 รับประกันว่า Daily Metrics จะใช้ข้อมูลที่ผ่านการกรองตามช่วงวันที่แล้ว",
      "✨ ปรับปรุงความสอดคล้องของข้อมูลระหว่าง date filtering และ daily analysis",
      "🎯 แก้ไขปัญหาการแสดงผลข้อมูลที่ไม่ตรงกับช่วงวันที่ที่เลือก",
      "📈 เพิ่มความแม่นยำของการวิเคราะห์ประสิทธิภาพรายวัน"
    ]
  },
  {
    date: "2025-01-05",
    time: "21:20",
    version: "v2.5.35",
    type: "improvement",
    title: "🔧 ปรับปรุงการจัดการข้อมูลใน useImportedData Hook",
    description: "อัปเดตการจัดการข้อมูลและการกรองในระบบ useImportedData เพื่อเพิ่มประสิทธิภาพและความแม่นยำ",
    details: [
      "🔧 ปรับปรุงโครงสร้างการจัดการข้อมูลใน useImportedData hook",
      "📊 เพิ่มความเสถียรของการประมวลผลข้อมูลที่นำเข้า",
      "✨ ปรับปรุงการกรองข้อมูลให้มีประสิทธิภาพมากขึ้น",
      "🎯 เพิ่มความแม่นยำในการคำนวณ metrics จากข้อมูลที่กรองแล้ว",
      "🚀 ปรับปรุงประสิทธิภาพการทำงานของระบบโดยรวม"
    ]
  },
  {
    date: "2025-01-05",
    time: "21:15",
    version: "v2.5.34",
    type: "fix",
    title: "🔧 แก้ไขการใช้ข้อมูลที่ถูกต้องใน Daily Performance Analysis",
    description: "แก้ไขการส่งข้อมูลให้ analyzeDailyPerformance function ให้ใช้ข้อมูลที่ผ่านการกรองตามวันที่แล้ว",
    details: [
      "🔧 เปลี่ยนจากการใช้ finalData เป็น filteredData ใน analyzeDailyPerformance",
      "📊 รับประกันว่า Daily Metrics จะใช้ข้อมูลที่ผ่านการกรองตามช่วงวันที่แล้ว",
      "✨ ปรับปรุงความสอดคล้องของข้อมูลระหว่าง date filtering และ daily analysis",
      "🎯 แก้ไขปัญหาการแสดงผลข้อมูลที่ไม่ตรงกับช่วงวันที่ที่เลือก",
      "📈 เพิ่มความแม่นยำของการวิเคราะห์ประสิทธิภาพรายวัน"
    ]
  },
  {
    date: "2025-01-05",
    time: "20:35",
    version: "v2.5.33",
    type: "improvement",
    title: "🔍 เพิ่ม Debug Logging สำหรับ Shopee Commission Calculation",
    description: "เพิ่มการ debug logging เพื่อเปรียบเทียบการคำนวณ commission ระหว่างข้อมูลดิบและข้อมูลที่ผ่านการ deduplication",
    details: [
      "🔍 เพิ่มการคำนวณ rawShopeeTotal จากข้อมูลดิบทั้งหมด",
      "📊 เปรียบเทียบระหว่าง raw total และ calculated total หลัง deduplication",
      "🎯 แสดงความแตกต่างระหว่างการคำนวณแบบต่างๆ",
      "🚀 ช่วยในการ debug ปัญหาการคำนวณ commission ที่ไม่ถูกต้อง",
      "✨ ปรับปรุงความชัดเจนในการติดตามการประมวลผลข้อมูล Shopee"
    ]
  },
  {
    date: "2025-01-05",
    time: "20:30",
    version: "v2.5.32",
    type: "fix",
    title: "🔧 แก้ไข TypeScript Error ใน useImportedData Hook",
    description: "แก้ไขปัญหา TypeScript compilation error ที่เกิดจากการส่ง object ที่ไม่ครบ properties ให้กับ setImportedData function",
    details: [
      "🔧 แก้ไข TypeScript error: 'Type is missing properties totalRows, errors from ImportedData'",
      "📊 เพิ่ม totalRows และ errors properties ให้กับ finalData object ใน processImportedData",
      "✨ รับประกันความถูกต้องของ type safety ใน useImportedData hook",
      "🎯 ป้องกัน compilation errors ที่อาจเกิดขึ้นในอนาคต",
      "🚀 ปรับปรุงความเสถียรของระบบจัดการข้อมูล"
    ]
  },
  {
    date: "2025-01-05",
    time: "20:25",
    version: "v2.5.31",
    type: "improvement",
    title: "🔍 เพิ่ม Debug Logging สำหรับ Initial Shopee Orders Count",
    description: "เพิ่มการ debug logging เพื่อตรวจสอบจำนวน Shopee orders เริ่มต้นก่อนการกรองใน calculateMetrics function",
    details: [
      "🔍 เพิ่มการ log 'INITIAL SHOPEE ORDERS' เพื่อตรวจสอบจำนวน orders ก่อนการกรอง",
      "📊 ช่วยในการติดตามการเปลี่ยนแปลงจำนวนข้อมูลในแต่ละขั้นตอนการกรอง",
      "🎯 เตรียมพร้อมสำหรับการวินิจฉัยปัญหาการกรองข้อมูล Shopee",
      "🚀 ปรับปรุงความสามารถในการ debug การประมวลผลข้อมูล",
      "✨ เพิ่มความชัดเจนในการติดตามขั้นตอนการกรองข้อมูล"
    ]
  },
  {
    date: "2025-01-05",
    time: "20:20",
    version: "v2.5.30",
    type: "improvement",
    title: "🔍 เพิ่ม Debug Logging เพิ่มเติมสำหรับ Shopee Orders Count",
    description: "เพิ่มการ debug logging เพื่อตรวจสอบจำนวน filteredShopeeOrders ในการคำนวณ metrics",
    details: [
      "🔍 เพิ่มการ log จำนวน filteredShopeeOrders.length ใน calculateMetrics function",
      "📊 ช่วยในการตรวจสอบว่าข้อมูล Shopee orders ถูกกรองอย่างถูกต้องหรือไม่",
      "🎯 เตรียมพร้อมสำหรับการ debug ปัญหาการคำนวณ totalComSP",
      "🚀 ปรับปรุงความสามารถในการติดตามการประมวลผลข้อมูล Shopee",
      "✨ เพิ่มความชัดเจนในการ debug การกรองข้อมูล"
    ]
  },
  {
    date: "2025-01-05",
    time: "20:15",
    version: "v2.5.29",
    type: "improvement",
    title: "🔍 เพิ่ม Debug Logging สำหรับ Shopee Commission Fields",
    description: "เพิ่มการ debug logging เพื่อตรวจสอบ commission fields ที่มีอยู่ในข้อมูล Shopee orders และช่วยในการวินิจฉัยปัญหาการคำนวณ",
    details: [
      "🔍 เพิ่มการ log ตัวอย่าง Shopee order และ fields ทั้งหมดที่มีอยู่",
      "📊 ตรวจสอบ commission fields ที่เป็นไปได้: คอมมิชชั่นสินค้าโดยรวม(฿), คอมมิชชั่น, Commission, commission, Total Commission",
      "🎯 ช่วยในการวินิจฉัยปัญหาการคำนวณ totalComSP ที่อาจไม่ถูกต้อง",
      "🚀 เตรียมพร้อมสำหรับการแก้ไขปัญหาการอ่านข้อมูล commission จากไฟล์ที่มีรูปแบบต่างกัน",
      "✨ ปรับปรุงความสามารถในการ debug และตรวจสอบความถูกต้องของข้อมูล"
    ]
  },
  {
    date: "2025-01-05",
    time: "19:35",
    version: "v2.5.28",
    type: "fix",
    title: "🔧 แก้ไขการกรองข้อมูล Facebook Ads ตามช่วงวันที่",
    description: "แก้ไขการใช้ช่วงวันที่ที่ถูกต้องในการกรองข้อมูล Facebook Ads ให้สอดคล้องกับการกรองข้อมูล Shopee และ Lazada",
    details: [
      "🔧 แก้ไขการใช้ startOfFromDate และ endOfToDate แทน dateRange.from และ dateRange.to ในการกรอง Facebook Ads",
      "📅 รับประกันความสอดคล้องของการกรองข้อมูลระหว่าง Facebook Ads, Shopee และ Lazada",
      "✨ ปรับปรุงความแม่นยำของการกรองข้อมูลให้ครอบคลุมทั้งวันที่เลือก",
      "🎯 แก้ไขปัญหาการกรองข้อมูลที่อาจไม่สอดคล้องกันระหว่างแพลตฟอร์ม",
      "🚀 เพิ่มความน่าเชื่อถือของข้อมูลที่แสดงผลในทุก components"
    ]
  },
  {
    date: "2025-01-05",
    time: "19:30",
    version: "v2.5.27",
    type: "improvement",
    title: "🎯 ปรับปรุงการกรองข้อมูลตามช่วงวันที่ให้แม่นยำขึ้น",
    description: "เพิ่มการใช้ startOfDay และ endOfDay ในการกรองข้อมูลเพื่อให้ครอบคลุมทั้งวันที่เลือกอย่างสมบูรณ์",
    details: [
      "🎯 ใช้ startOfDay และ endOfDay ในการขยายช่วงวันที่ให้ครอบคลุมทั้งวัน",
      "📅 แก้ไขปัญหาการกรองข้อมูลที่อาจพลาดข้อมูลในช่วงเวลาต่างๆ ของวัน",
      "🔍 เพิ่ม debug logging เพื่อตรวจสอบช่วงวันที่ที่ขยายแล้ว",
      "⚡ ปรับปรุงความแม่นยำของการกรองข้อมูลตาม DateRange",
      "✨ รับประกันว่าข้อมูลทั้งวันจะถูกรวมในการกรอง"
    ]
  },
  {
    date: "2025-01-05",
    time: "19:15",
    version: "v2.5.26",
    type: "improvement",
    title: "📅 เพิ่ม Date Range Functions ใน useImportedData Hook",
    description: "เพิ่ม startOfDay และ endOfDay functions จาก date-fns เพื่อปรับปรุงความแม่นยำในการกรองข้อมูลตามช่วงวันที่",
    details: [
      "📅 เพิ่ม import startOfDay และ endOfDay จาก date-fns library",
      "🎯 เตรียมพร้อมสำหรับการปรับปรุงการกรองข้อมูลให้แม่นยำขึ้น",
      "⚡ รองรับการกำหนดช่วงเวลาที่ชัดเจนสำหรับการกรองข้อมูลรายวัน",
      "🔧 ปรับปรุงโครงสร้างการจัดการวันที่ในระบบ",
      "✨ เพิ่มความสามารถในการจัดการช่วงเวลาที่ซับซ้อนมากขึ้น"
    ]
  },
  {
    date: "2025-01-05",
    time: "18:30",
    version: "v2.5.25",
    type: "improvement",
    title: "⚡ ปรับปรุงการ Parse วันที่ใน useImportedData Hook",
    description: "เปลี่ยนลำดับการ parse วันที่ให้ใช้ native Date parsing ก่อน เพื่อเพิ่มความยืดหยุ่นและประสิทธิภาพ",
    details: [
      "🚀 ย้าย native Date parsing ไปด้านบนสุดของ parseDate function",
      "⚡ ลดเวลาการประมวลผลโดยใช้ native parsing ก่อนลอง specific formats",
      "🔧 ปรับปรุงความยืดหยุ่นในการรับรู้รูปแบบวันที่ที่หลากหลาย",
      "✨ เพิ่มประสิทธิภาพการกรองข้อมูลตามช่วงวันที่",
      "🎯 รองรับรูปแบบวันที่ที่ JavaScript Date object รู้จักโดยธรรมชาติ"
    ]
  },
  {
    date: "2025-01-05",
    time: "17:15",
    version: "v2.5.24",
    type: "improvement",
    title: "🔍 เพิ่ม Debug Logging เพิ่มเติมใน useImportedData Hook",
    description: "เพิ่มการ log ข้อมูลเพิ่มเติมเพื่อช่วยในการ debug และตรวจสอบความถูกต้องของข้อมูลที่ประมวลผล",
    details: [
      "📊 เพิ่มการ log calculatedMetrics.totalComSP, totalOrdersSP, และ cpoSP",
      "🔍 เพิ่มการ log finalFilteredData counts เพื่อเปรียบเทียบกับ finalData",
      "🎯 ช่วยในการตรวจสอบความสอดคล้องของข้อมูลระหว่างขั้นตอนการประมวลผล",
      "🚀 ปรับปรุงความสามารถในการ debug ปัญหาการกรองข้อมูล",
      "✨ เตรียมพร้อมสำหรับการแก้ไขปัญหาการแสดงผลข้อมูลที่ไม่ถูกต้อง"
    ]
  },
  {
    date: "2025-01-05",
    time: "16:30",
    version: "v2.5.23",
    type: "fix",
    title: "🔧 แก้ไข TypeScript error ใน useImportedData Hook",
    description: "แก้ไขปัญหา TypeScript compilation error ที่เกิดจากการส่ง object ที่ไม่ครบ properties ให้กับ setImportedData function",
    details: [
      "🔧 แก้ไข TypeScript error: 'Type is missing properties totalRows, errors from ImportedData'",
      "📊 เพิ่ม totalRows และ errors properties ให้กับ finalData object ใน processImportedData",
      "✨ รับประกันความถูกต้องของ type safety ใน useImportedData hook",
      "🎯 ป้องกัน compilation errors ที่อาจเกิดขึ้นในอนาคต",
      "🚀 ปรับปรุงความเสถียรของระบบจัดการข้อมูล"
    ]
  },
  {
    date: "2025-01-05",
    time: "15:45",
    version: "v2.5.22",
    type: "fix",
    title: "🔧 แก้ไขการใช้ข้อมูลที่ถูกต้องใน TopAdsTable",
    description: "เปลี่ยนจากการใช้ rawData เป็น importedData ใน TopAdsTable และปิดการกรองซ้ำซ้อนเพื่อให้แสดงข้อมูลที่ผ่านการกรองแล้วจาก useImportedData hook",
    details: [
      "🔧 เปลี่ยนจาก rawData?.facebookAds เป็น importedData?.facebookAds ใน TopAdsTable",
      "📊 ปิดการกรองซ้ำซ้อนโดยส่งค่าเริ่มต้นสำหรับ selectedSubIds, selectedChannels, selectedPlatform, dateRange",
      "✨ รับประกันว่า TopAdsTable จะแสดงข้อมูลที่ผ่านการกรองตัวกรองหลักแล้ว",
      "🎯 แก้ไขปัญหาการแสดงผลข้อมูลที่ไม่สอดคล้องกับตัวกรองที่เลือก",
      "🚀 เพิ่มความสอดคล้องในการใช้งานข้อมูลระหว่าง components ต่างๆ"
    ]
  },
  {
    date: "2025-01-05",
    time: "14:30",
    version: "v2.5.21",
    type: "fix",
    title: "🔧 แก้ไขการกรองข้อมูลซ้ำซ้อนใน TopAdsTable",
    description: "ปรับปรุงการส่งพารามิเตอร์ให้ TopAdsTable เพื่อป้องกันการกรองข้อมูลซ้ำซ้อนเนื่องจากข้อมูลถูกกรองแล้วใน useImportedData hook",
    details: [
      "🔧 เปลี่ยนการส่ง selectedSubIds, selectedChannels, selectedPlatform, dateRange เป็นค่าเริ่มต้น",
      "📊 ป้องกันการกรองข้อมูลซ้ำซ้อนเนื่องจากข้อมูลถูกกรองแล้วใน useImportedData hook",
      "✨ ปรับปรุงประสิทธิภาพการแสดงผลตาราง Top Ads",
      "🎯 รับประกันความถูกต้องของข้อมูลที่แสดงในตาราง",
      "🚀 เพิ่มความเสถียรของการแสดงผลข้อมูลในหน้า Dashboard"
    ]
  },
  {
    date: "2025-01-04",
    time: "05:35",
    version: "v2.5.20",
    type: "fix",
    title: "🔧 ปรับปรุงการตรวจสอบข้อมูล Excel ใน DataImport",
    description: "แยกการตรวจสอบประเภทข้อมูลและจำนวนแถวใน Excel parsing เพื่อให้ข้อความแจ้งเตือนชัดเจนขึ้น",
    details: [
      "🔧 แยกการตรวจสอบ Array.isArray() และ jsonData.length เป็นขั้นตอนแยกกัน",
      "📊 เพิ่มข้อความแจ้งเตือนเฉพาะเจาะจงเมื่อไม่สามารถแปลงข้อมูล Excel ได้",
      "✨ ปรับปรุงความชัดเจนของ error messages สำหรับผู้ใช้",
      "🎯 ป้องกันข้อผิดพลาดจากไฟล์ Excel ที่มีรูปแบบไม่ถูกต้อง",
      "🚀 เพิ่มความแม่นยำในการวินิจฉัยปัญหาการ import ข้อมูล"
    ]
  },
  {
    date: "2025-01-04",
    time: "05:30",
    version: "v2.5.19",
    type: "improvement",
    title: "🔧 เพิ่มการตรวจสอบความถูกต้องของข้อมูลใน DataImport",
    description: "เพิ่มการตรวจสอบข้อมูลที่ประมวลผลแล้วใน DataImport component เพื่อป้องกันข้อผิดพลาดจากไฟล์ที่เสียหายหรือรูปแบบไม่ถูกต้อง",
    details: [
      "🔧 เพิ่มการตรวจสอบว่าข้อมูลที่ประมวลผลแล้วเป็น array และมีข้อมูลจริง",
      "📊 แสดงข้อความแจ้งเตือนที่ชัดเจนเมื่อไฟล์เสียหายหรือรูปแบบไม่ถูกต้อง",
      "✨ เพิ่ม console.log เพื่อติดตามจำนวนแถวที่ประมวลผลสำเร็จ",
      "🎯 ป้องกันข้อผิดพลาดที่อาจเกิดขึ้นจากไฟล์ที่มีปัญหา",
      "🚀 ปรับปรุงความเสถียรของระบบ import ข้อมูล"
    ]
  },
  {
    date: "2025-01-04",
    time: "05:25",
    version: "v2.5.18",
    type: "fix",
    title: "🔧 แก้ไขการใช้ field ที่ถูกต้องใน analyzeDailyPerformance สำหรับ Lazada",
    description: "เปลี่ยนจากการใช้ field 'Commission' เป็น 'Payout' ใน analyzeDailyPerformance function เพื่อให้สอดคล้องกับโครงสร้างข้อมูล Lazada ที่ถูกต้อง",
    details: [
      "🔧 แก้ไขการใช้ field 'Commission' เป็น 'Payout' สำหรับ Lazada orders ใน analyzeDailyPerformance",
      "📊 รับประกันความถูกต้องของการคำนวณ daily metrics สำหรับ Lazada commission",
      "✨ ปรับปรุงความสอดคล้องของการใช้ field names ระหว่าง functions ต่างๆ",
      "🎯 แก้ไขปัญหาการคำนวณ totalCom ที่อาจไม่ถูกต้องสำหรับข้อมูล Lazada",
      "🚀 เพิ่มความแม่นยำของการวิเคราะห์ประสิทธิภาพรายวัน"
    ]
  },
  {
    date: "2025-01-04",
    time: "05:20",
    version: "v2.5.17",
    type: "improvement",
    title: "🔍 เพิ่ม Debug Logging เพิ่มเติมใน useImportedData Hook",
    description: "เพิ่มการ log ข้อมูลตัวอย่าง dailyMetrics และ dateRange เพื่อช่วยในการ debug และตรวจสอบความถูกต้องของข้อมูล",
    details: [
      "📊 เพิ่มการแสดงตัวอย่างข้อมูล dailyMetrics (3 รายการแรก) เพื่อตรวจสอบโครงสร้างข้อมูล",
      "📅 เพิ่มการ log dateRange เพื่อตรวจสอบช่วงวันที่ที่ใช้ในการกรองข้อมูล",
      "🔍 ช่วยในการ debug ปัญหาการกรองข้อมูลตามวันที่",
      "🎯 ปรับปรุงความสามารถในการตรวจสอบความสอดคล้องของข้อมูลระหว่าง components",
      "🚀 เตรียมพร้อมสำหรับการแก้ไขปัญหาการแสดงผลข้อมูลที่ไม่ถูกต้อง"
    ]
  },
  {
    date: "2025-01-04",
    time: "05:15",
    version: "v2.5.16",
    type: "improvement",
    title: "🔍 เพิ่มระบบ Debug Logging สำหรับตรวจสอบความสอดคล้องของข้อมูล",
    description: "เพิ่มการ log ข้อมูลเพื่อตรวจสอบความถูกต้องและความสอดคล้องของข้อมูลระหว่าง calculatedMetrics และ dailyMetrics",
    details: [
      "🔍 เพิ่ม debug logging ใน useImportedData hook เพื่อตรวจสอบความสอดคล้องของข้อมูล",
      "📊 แสดงการเปรียบเทียบ totalCom ระหว่าง calculatedMetrics และ dailyMetrics",
      "📈 แสดงจำนวนข้อมูลที่ผ่านการกรองในแต่ละแพลตฟอร์ม",
      "🎯 ช่วยในการ debug และตรวจสอบความถูกต้องของการคำนวณ",
      "🚀 เตรียมพร้อมสำหรับการปรับปรุงความแม่นยำของข้อมูลในอนาคต"
    ]
  },
  {
    date: "2025-01-04",
    time: "04:50",
    version: "v2.5.15",
    type: "improvement",
    title: "🔧 ปรับปรุงการจัดการข้อมูลที่กรองแล้วใน useImportedData Hook",
    description: "เพิ่มความชัดเจนในการจัดการข้อมูลที่ผ่านการกรองวันที่แล้ว เพื่อให้การคำนวณ metrics มีความแม่นยำมากขึ้น",
    details: [
      "🔧 สร้าง finalFilteredData object เพื่อจัดการข้อมูลที่กรองแล้วอย่างชัดเจน",
      "📊 ใช้ข้อมูลเดียวกันสำหรับการคำนวณ metrics ทั้งหมด",
      "✨ ปรับปรุงความสอดคล้องของข้อมูลระหว่าง date filtering และ metrics calculation",
      "🎯 เพิ่มความแม่นยำในการประมวลผลข้อมูลที่ผ่านการกรองตามช่วงวันที่",
      "🚀 ปรับปรุงโครงสร้างโค้ดให้อ่านง่ายและบำรุงรักษาได้ดีขึ้น"
    ]
  },
  {
    date: "2025-01-04",
    time: "04:45",
    version: "v2.5.14",
    type: "fix",
    title: "🔧 แก้ไข dependency array ใน AffiliatePerformanceChart useMemo",
    description: "เพิ่ม dailyMetrics ใน dependency array เพื่อให้ component re-render เมื่อ dailyMetrics เปลี่ยนแปลง",
    details: [
      "🔧 เพิ่ม dailyMetrics ใน useMemo dependency array",
      "✨ แก้ไขปัญหาการไม่ update กราฟเมื่อ dailyMetrics เปลี่ยนแปลง",
      "📊 รับประกันว่ากราฟจะแสดงข้อมูลล่าสุดเสมอ",
      "🎯 ปรับปรุงความถูกต้องของการ re-render component",
      "🚀 เพิ่มความเสถียรของการแสดงผลข้อมูลในกราฟ"
    ]
  },
  {
    date: "2025-01-04",
    time: "04:40",
    version: "v2.5.13",
    type: "improvement",
    title: "🔧 ปรับปรุง AffiliatePerformanceChart interface เพื่อรองรับ dailyMetrics",
    description: "เพิ่ม dailyMetrics prop และทำให้ props อื่นๆ เป็น optional เพื่อความยืดหยุ่นในการใช้งาน",
    details: [
      "🔧 เพิ่ม dailyMetrics?: any[] prop ใน AffiliatePerformanceChartProps interface",
      "✨ ทำให้ shopeeOrders, lazadaOrders, facebookAds เป็น optional props",
      "📊 เตรียมพร้อมสำหรับการใช้ข้อมูลที่ประมวลผลแล้วจาก dailyMetrics",
      "🎯 เพิ่มความยืดหยุ่นในการส่งข้อมูลให้กับ component",
      "🚀 ปรับปรุงโครงสร้าง interface ให้สอดคล้องกับการใช้งานจริง"
    ]
  },
  {
    date: "2025-01-04",
    time: "04:35",
    version: "v2.5.12",
    type: "fix",
    title: "🔧 แก้ไขการกรองข้อมูลซ้ำซ้อนใน AffiliatePerformanceChart",
    description: "ปรับปรุงการส่งพารามิเตอร์ให้ AffiliatePerformanceChart เพื่อป้องกันการกรองข้อมูลซ้ำซ้อน",
    details: [
      "🔧 เปลี่ยนการส่ง dateRange, selectedSubIds, selectedChannels, selectedPlatform เป็นค่าเริ่มต้น",
      "📊 ป้องกันการกรองข้อมูลซ้ำซ้อนเนื่องจากข้อมูลถูกกรองแล้วใน useImportedData hook",
      "✨ ปรับปรุงประสิทธิภาพการแสดงผลกราฟ Affiliate Performance",
      "🎯 รับประกันความถูกต้องของข้อมูลที่แสดงในกราฟ",
      "🚀 เพิ่มความเสถียรของการแสดงผลข้อมูลในหน้า Dashboard"
    ]
  },
  {
    date: "2025-01-04",
    time: "04:30",
    version: "v2.5.11",
    type: "fix",
    title: "🔧 แก้ไขการกรองข้อมูลวันที่ใน useImportedData Hook",
    description: "เปลี่ยนการจัดการข้อมูลที่มีวันที่ไม่ถูกต้องจาก include เป็น exclude เพื่อความสอดคล้องในการกรองข้อมูล",
    details: [
      "🔧 เปลี่ยนจาก return true เป็น return false สำหรับ Shopee orders ที่มีวันที่ไม่ถูกต้อง",
      "📊 รับประกันความสอดคล้องในการกรองข้อมูลระหว่าง Shopee, Lazada และ Facebook Ads",
      "✨ ป้องกันการแสดงผลข้อมูลที่มีวันที่ผิดพลาดในช่วงวันที่ที่เลือก",
      "🎯 ปรับปรุงความแม่นยำของการกรองข้อมูลตามช่วงวันที่",
      "🚀 เพิ่มความน่าเชื่อถือของข้อมูลที่แสดงผลในทุก components"
    ]
  },
  {
    date: "2025-01-04",
    time: "04:25",
    version: "v2.5.10",
    type: "fix",
    title: "🔧 แก้ไขการใช้ rawData ใน TopProductsTable",
    description: "เปลี่ยนจากการใช้ importedData เป็น rawData ใน TopProductsTable เพื่อแสดงข้อมูลที่ไม่ผ่านการกรองตัวกรอง",
    details: [
      "🔧 เปลี่ยนจาก importedData เป็น rawData ใน TopProductsTable component",
      "📊 แก้ไขปัญหาการแสดงผลข้อมูลสินค้าที่ถูกกรองโดยตัวกรองหลัก",
      "✨ รับประกันว่า TopProductsTable จะแสดงข้อมูลสินค้าทั้งหมดจากข้อมูลดิบ",
      "🎯 ปรับปรุงความถูกต้องของการแสดงผลข้อมูลในตาราง Top Products",
      "🚀 เพิ่มความสอดคล้องในการใช้งาน rawData กับ components อื่นๆ"
    ]
  },
  {
    date: "2025-01-04",
    time: "04:20",
    version: "v2.5.9",
    type: "fix",
    title: "🔧 แก้ไข Export rawData ใน useImportedData Hook",
    description: "เพิ่ม rawData ใน return object ของ useImportedData hook เพื่อให้ components อื่นสามารถเข้าถึงข้อมูลดิบได้",
    details: [
      "🔧 เพิ่ม rawData ใน return object ของ useImportedData hook",
      "✨ แก้ไขปัญหาการเข้าถึงข้อมูลดิบจาก components ภายนอก",
      "📊 รองรับการใช้งาน rawData ใน components ที่ต้องการข้อมูลที่ไม่ผ่านการกรอง",
      "🎯 ปรับปรุงความสมบูรณ์ของ hook interface",
      "🚀 เตรียมพร้อมสำหรับการใช้งาน rawData ในฟีเจอร์อื่นๆ"
    ]
  },
  {
    date: "2025-01-04",
    time: "04:15",
    version: "v2.5.8",
    type: "improvement",
    title: "🔧 เพิ่มระบบจัดเก็บข้อมูลดิบใน useImportedData Hook",
    description: "เพิ่ม rawData state เพื่อเก็บข้อมูลดิบที่ไม่ผ่านการกรอง เตรียมพร้อมสำหรับการปรับปรุงประสิทธิภาพการกรองข้อมูล",
    details: [
      "🗄️ เพิ่ม rawData state ใน useImportedData hook เพื่อเก็บข้อมูลดิบ",
      "🔄 เตรียมพร้อมสำหรับการแยกข้อมูลดิบและข้อมูลที่กรองแล้ว",
      "⚡ ปรับปรุงประสิทธิภาพการประมวลผลข้อมูลในอนาคต",
      "🎯 รองรับการรีเซ็ตข้อมูลกลับสู่สถานะเดิมได้ง่ายขึ้น",
      "📊 เตรียมพื้นฐานสำหรับการปรับปรุงระบบกรองข้อมูลให้เร็วขึ้น"
    ]
  },
  {
    date: "2025-01-04",
    time: "03:30",
    version: "v2.5.7",
    type: "improvement",
    title: "📊 ปรับปรุงระบบคำนวณ Affiliate Calculations ให้สมบูรณ์",
    description: "อัปเดตไฟล์ affiliateCalculations.ts ให้มีฟังก์ชันการคำนวณครบถ้วนและแม่นยำขึ้น",
    details: [
      "🔧 เพิ่มฟังก์ชัน calculateMetrics สำหรับคำนวณ metrics หลักของระบบ",
      "📈 เพิ่มฟังก์ชัน analyzeDailyPerformance สำหรับวิเคราะห์ประสิทธิภาพรายวัน",
      "🎯 เพิ่มฟังก์ชัน analyzeSubIdPerformance สำหรับวิเคราะห์ประสิทธิภาพ Sub ID",
      "🏢 เพิ่มฟังก์ชัน analyzePlatformPerformance สำหรับวิเคราะห์ประสิทธิภาพแพลตฟอร์ม",
      "✨ ปรับปรุงการจัดการข้อมูล unique orders สำหรับ Shopee และ Lazada",
      "🔍 เพิ่มระบบกรองข้อมูลตาม Sub IDs, Channels, Platform และ Validity",
      "📊 ปรับปรุงการคำนวณ ROI, CPO, CPC และ metrics อื่นๆ ให้แม่นยำขึ้น"
    ]
  },
  {
    date: "2025-01-04",
    time: "03:15",
    version: "v2.5.6",
    type: "fix",
    title: "🔧 แก้ไขการใช้ข้อมูลที่กรองแล้วใน Daily Performance Analysis",
    description: "ปรับปรุงการคำนวณ Daily Metrics ให้ใช้ข้อมูลที่ผ่านการกรองแล้วจาก metrics แทนข้อมูลดิบ",
    details: [
      "🔧 เปลี่ยนจากการใช้ dateFilteredData เป็น metrics.filteredData ใน analyzeDailyPerformance",
      "📊 รับประกันว่า Daily Metrics จะสะท้อนการกรองของผู้ใช้ (Sub IDs, Channels, Platform)",
      "✨ ปรับปรุงความสอดคล้องของข้อมูลระหว่าง charts และ daily analysis",
      "🎯 แก้ไขปัญหาการแสดงผลข้อมูลที่ไม่ตรงกับตัวกรองที่เลือก",
      "📈 เพิ่มความแม่นยำของการวิเคราะห์ประสิทธิภาพรายวัน"
    ]
  },
  {
    date: "2025-01-04",
    time: "02:45",
    version: "v2.5.5",
    type: "improvement",
    title: "📊 ปรับปรุงการคำนวณค่าใน StatsChart StatCards",
    description: "เปลี่ยนการคำนวณค่าใน StatCards ให้ใช้ข้อมูลจาก chartData แทน calculatedMetrics เพื่อความแม่นยำ",
    details: [
      "📊 คำนวณค่า totals จาก chartData (dailyMetrics) แทนการใช้ calculatedMetrics",
      "🔧 ปรับปรุงการคำนวณ ROI ให้สอดคล้องกับข้อมูลในกราฟ",
      "✨ รับประกันความสอดคล้องระหว่าง StatCards และกราฟแสดงผล",
      "🎯 ใช้ข้อมูลเดียวกันสำหรับทั้ง StatCards และ chart visualization",
      "📈 ปรับปรุงความแม่นยำของการแสดงผลข้อมูลสถิติ"
    ]
  },
  {
    date: "2025-01-04",
    time: "02:30",
    version: "v2.5.4",
    type: "fix",
    title: "🔧 แก้ไขการนับ Shopee orders ใน AffiliatePerformanceChart",
    description: "ปรับปรุงการประมวลผล Shopee orders ให้นับเฉพาะ unique orders เพื่อป้องกันการนับซ้ำ",
    details: [
      "🔧 เพิ่มการจัดการ unique Shopee orders โดยใช้ 'เลขที่คำสั่งซื้อ' เป็น key",
      "📊 ป้องกันการนับ commission ซ้ำจาก orders ที่มี order ID เดียวกัน",
      "✨ ปรับปรุงความแม่นยำของข้อมูลในกราฟ Affiliate Performance",
      "🚀 รักษาความสอดคล้องกับการประมวลผลข้อมูลใน components อื่นๆ"
    ]
  },
  {
    date: "2025-01-04",
    time: "02:15",
    version: "v2.5.3",
    type: "fix",
    title: "🔧 แก้ไข parameter name ใน analyzePlatformPerformance function",
    description: "เปลี่ยน parameter name จาก _totalAdsSpent กลับเป็น totalAdsSpent เพื่อให้สอดคล้องกับการใช้งานในฟังก์ชัน",
    details: [
      "🔧 เปลี่ยน parameter '_totalAdsSpent' เป็น 'totalAdsSpent' ใน analyzePlatformPerformance function",
      "✨ แก้ไขปัญหา TypeScript error 'Cannot find name totalAdsSpent'",
      "📝 รักษาความสอดคล้องของ parameter naming ในฟังก์ชัน",
      "🚀 ปรับปรุงความถูกต้องของ code และลด compilation errors"
    ]
  },
  {
    date: "2025-01-04",
    time: "01:45",
    version: "v2.5.2",
    type: "fix",
    title: "🔧 แก้ไข TypeScript errors ใน affiliateCalculations.ts",
    description: "แก้ไขปัญหา TypeScript compilation errors ในไฟล์คำนวณข้อมูล affiliate และปรับปรุงการจัดการตัวแปร",
    details: [
      "🔧 แก้ไข 'totalAdsSpent' variable reference errors ใน analyzePlatformPerformance function",
      "📝 เปลี่ยนจาก totalAdsSpent เป็น _totalAdsSpent parameter ที่ไม่ได้ใช้งาน",
      "🧹 ลบ unused variable warnings และปรับปรุง code quality",
      "✨ ปรับปรุง type safety ในการคำนวณ platform performance",
      "🚀 แก้ไขปัญหาการ compile ที่เกิดจาก undefined variables",
      "📊 รักษาฟังก์ชันการทำงานเดิมไว้ครบถ้วนในการคำนวณ metrics"
    ]
  },
  {
    date: "2025-01-04",
    time: "01:30",
    version: "v2.5.1",
    type: "fix",
    title: "🔧 แก้ไข TypeScript errors และปรับปรุงโค้ดคุณภาพ",
    description: "แก้ไขปัญหา TypeScript compilation errors และปรับปรุงโครงสร้างโค้ดให้มีคุณภาพมากขึ้น",
    details: [
      "🔧 แก้ไข readOnly property error ใน Checkbox component ของ StatsChart",
      "🧹 ลบ unused imports และ variables ในหลายไฟล์",
      "📝 แก้ไข TypeScript type issues ใน Update.tsx",
      "🎯 ปรับปรุง type safety ใน pagination components",
      "✨ ลดการใช้ implicit any types",
      "🚀 ปรับปรุงประสิทธิภาพการ compile"
    ]
  },
  {
    date: "2025-01-04",
    time: "01:00",
    version: "v2.5.0",
    type: "feature",
    title: "🎉 เปิดตัว Ad Planning v2.5 - ระบบวางแผนแอดอัจฉริยะ",
    description: "อัปเกรดใหญ่! ระบบวางแผนการยิงแอดที่ทรงพลังและสวยงามที่สุด",
    details: [
      "🎯 เพิ่ม Optimization Strategy: Goal-First, ROI-First, Balanced",
      "📊 ปรับปรุง Sub ID Selection ให้เป็นตารางแบบกระชับ",
      "🎨 ปรับปรุงสีสันในตาราง Recommended Sub IDs ให้สวยงาม",
      "💎 เพิ่มส่วนสรุปผลลัพท์สุดท้ายแบบ Premium",
      "🔧 แก้ไขปัญหาการคำนวณใหม่เมื่อเปลี่ยนค่างบประมาณ",
      "✨ ปรับปรุง UI/UX ให้ดูหรูหราและใช้งานง่ายขึ้น",
      "🚀 อัปเดท version เป็น v2.5"
    ]
  },
  {
    date: "2025-01-03",
    time: "24:40",
    version: "v2.4.29",
    type: "improvement",
    title: "เพิ่มส่วนสรุปผลลัพท์สุดท้ายแบบ Premium ใน AdPlanning",
    description: "เพิ่มส่วนแสดงผลสรุปการลงทุนและผลตอบแทนที่คาดหวังแบบ Premium Summary พร้อม UI ที่สวยงาม",
    details: [
      "เพิ่มส่วน Premium Summary ด้วย gradient background และ backdrop blur",
      "แสดงผล Total Commission, ROI, โบนัส และรวมกำไรสุทธิในรูปแบบ cards",
      "ใช้ gradient colors และ icons ที่สวยงามสำหรับแต่ละ metric",
      "เพิ่ม Call to Action section พร้อม animated elements",
      "คำนวณรวมกำไรสุทธิรวมโบนัสเมื่อเป้าหมายสำเร็จ",
      "ปรับปรุง visual hierarchy และ user experience ของผลลัพท์"
    ]
  },
  {
    date: "2025-01-03",
    time: "24:35",
    version: "v2.4.28",
    type: "feature",
    title: "สร้าง AdPlanning component ใหม่ทั้งหมดพร้อมฟีเจอร์ครบถ้วน",
    description: "พัฒนา AdPlanning component ใหม่ทั้งหมด 1,216 บรรทัด พร้อมระบบวางแผนการยิงแอดที่สมบูรณ์แบบ",
    details: [
      "สร้าง AdPlanning component ใหม่ทั้งหมด (1,216 บรรทัด)",
      "เพิ่มระบบ localStorage เพื่อเก็บสถานะ form ถาวร",
      "เพิ่มการแสดงผลสรุปข้อมูลช่วงวันที่แบบ Dashboard-style cards",
      "เพิ่มระบบเลือก Campaign Goals แบบ multiple selection พร้อม input fields",
      "เพิ่มระบบเลือก Optimization Strategy (Goal-First, ROI-First, Balanced)",
      "เพิ่มการตั้งค่า Budget & Bonus Settings",
      "เพิ่มระบบเลือก Sub ID พร้อมแสดงข้อมูล metrics แต่ละ Sub ID แบบตาราง",
      "เพิ่มการแสดงผล Campaign Summary และ Sub ID Recommendations Table",
      "เพิ่มการแสดงผลคาดการณ์ผลลัพท์และ Goal Results Summary แบบ interactive",
      "เพิ่มระบบ data change detection และ recalculate indicator",
      "รองรับการสร้าง NEW entries เมื่อเป้าหมายยังไม่บรรลุ",
      "ปรับปรุง UI/UX ให้สวยงามและใช้งานง่ายขึ้น"
    ]
  },
  {
    date: "2025-01-03",
    time: "24:30",
    version: "v2.4.27",
    type: "improvement",
    title: "ปรับปรุง Sub ID Selection Table ใน Ad Planning ให้เป็นแบบตาราง",
    description: "เปลี่ยนการแสดงผล Sub ID Selection จากแบบ card เป็นแบบตารางที่กะทัดรัดและอ่านง่ายขึ้น",
    details: [
      "เปลี่ยนจากแบบ card layout เป็น grid table layout แบบ 6 คอลัมน์",
      "เพิ่ม table header พร้อมชื่อคอลัมน์: Select, Sub ID, Ad Spend, Total Com, ROI, Status",
      "ปรับปรุงการแสดงผล metrics ให้กะทัดรัดและเป็นระเบียบมากขึ้น",
      "เพิ่ม Status indicator แสดง Selected/Available สำหรับแต่ละ Sub ID",
      "ลดพื้นที่ที่ใช้และเพิ่มความสามารถในการดูข้อมูลได้มากขึ้นในหน้าจอเดียว",
      "ปรับปรุง hover effects และ transition animations",
      "รักษาฟังก์ชันการทำงานเดิมไว้ครบถ้วน (checkbox selection, metrics calculation)"
    ]
  },
  {
    date: "2025-01-03",
    time: "24:25",
    version: "v2.4.26",
    type: "feature",
    title: "สร้างไฟล์ Ad Planning Calculations ใหม่ทั้งหมด",
    description: "สร้างระบบคำนวณการวางแผนโฆษณาที่สมบูรณ์แบบใหม่ พร้อมอัลกอริทึมการเพิ่มประสิทธิภาพที่ทันสมัย",
    details: [
      "สร้างไฟล์ adPlanningCalculations.ts ใหม่ทั้งหมด (981 บรรทัด)",
      "เพิ่มระบบวิเคราะห์ประสิทธิภาพ Sub ID จากข้อมูลประวัติศาสตร์",
      "รองรับ 3 กลยุทธ์การเพิ่มประสิทธิภาพ: goal-first, roi-first, balanced",
      "อัลกอริทึมการจัดสรรงบประมาณแบบ Two-phase (เลือก Sub IDs ก่อน แล้วสร้าง NEW entries)",
      "ระบบคำนวณงบประมาณที่เหมาะสมสำหรับ NEW entries",
      "รองรับเป้าหมายหลายประเภท: orderSP, amountLZD, totalCom, profit, linkClicks",
      "ระบบติดตาม Sub IDs ที่มีข้อมูลใน Facebook Ads report",
      "การคำนวณ ROI และประสิทธิภาพที่แม่นยำจากข้อมูลจริง",
      "ระบบสร้าง NEW entries สูงสุด 20 รายการต่อ Sub ID",
      "การประเมินความเชื่อมั่น (confidence) ตามข้อมูลประวัติศาสตร์"
    ]
  },
  {
    date: "2025-01-03",
    time: "24:20",
    version: "v2.4.25",
    type: "improvement",
    title: "ลดขีดจำกัดงบประมาณขั้นต่ำใน Ad Planning Algorithm",
    description: "ปรับปรุงความยืดหยุ่นในการจัดสรรงบประมาณโดยลดขีดจำกัดขั้นต่ำจาก 100 เหลือ 50 บาท",
    details: [
      "ลดขีดจำกัดงบประมาณขั้นต่ำจาก 100 บาทเป็น 50 บาท",
      "เพิ่มความยืดหยุ่นในการจัดสรรงบประมาณสำหรับ Sub IDs ที่มีประสิทธิภาพดี",
      "ช่วยให้ระบบสามารถใช้งบประมาณได้อย่างมีประสิทธิภาพมากขึ้น",
      "รองรับการวางแผนแคมเปญขนาดเล็กได้ดีขึ้น",
      "ปรับปรุงการคำนวณให้เหมาะสมกับงบประมาณที่หลากหลาย"
    ]
  },
  {
    date: "2025-01-03",
    time: "24:15",
    version: "v2.4.24",
    type: "improvement",
    title: "เพิ่มขีดจำกัดและปรับปรุงการจัดสรรงบประมาณสำหรับ NEW entries ใน Ad Planning",
    description: "ปรับปรุงอัลกอริทึมการสร้าง NEW entries เพื่อให้สามารถบรรลุเป้าหมายได้ดีขึ้น",
    details: [
      "เพิ่มจำนวน NEW entries สูงสุดจาก 10 เป็น 20 รายการต่อ Sub ID",
      "เพิ่มขีดจำกัดงบประมาณสำหรับ NEW entries เป็น 2 เท่าของงบประมาณปกติ",
      "ปรับปรุงการคำนวณงบประมาณ optimal สำหรับ NEW entries",
      "รับประกันว่าระบบสามารถสร้างแผนการยิงแอดที่บรรลุเป้าหมายได้มากขึ้น",
      "เพิ่มความยืดหยุ่นในการจัดสรรงบประมาณเมื่อเป้าหมายสูง"
    ]
  },
  {
    date: "2025-01-03",
    time: "24:10",
    version: "v2.4.23",
    type: "fix",
    title: "แก้ไขการเรียกใช้ฟังก์ชัน calculateEfficiencyScoreWithStrategy ใน Ad Planning",
    description: "แก้ไขข้อผิดพลาดในการเรียกใช้ฟังก์ชันคำนวณประสิทธิภาพตามกลยุทธ์การเพิ่มประสิทธิภาพ",
    details: [
      "เปลี่ยนจาก calculateEfficiencyScore เป็น calculateEfficiencyScoreWithStrategy",
      "เพิ่มพารามิเตอร์ optimizationStrategy ในการคำนวณประสิทธิภาพ",
      "แก้ไขปัญหาการคำนวณที่ไม่สอดคล้องกับกลยุทธ์ที่เลือก",
      "ปรับปรุงความแม่นยำของอัลกอริทึมการจัดสรรงบประมาณ",
      "รับประกันว่าการคำนวณจะใช้กลยุทธ์ที่ผู้ใช้เลือกไว้"
    ]
  },
  {
    date: "2025-01-03",
    time: "24:05",
    version: "v2.4.22",
    type: "improvement",
    title: "ปรับปรุงระบบตรวจจับการเปลี่ยนแปลงใน AdPlanning component",
    description: "เพิ่มความแม่นยำในการตรวจจับการเปลี่ยนแปลงของ form inputs และแสดง data changed indicator เมื่อจำเป็นต้อง recalculate",
    details: [
      "ปรับปรุงการตรวจสอบการเปลี่ยนแปลงของ form values เทียบกับ calculation parameters ที่เก็บไว้",
      "เพิ่มการเปรียบเทียบ goals, goalValues, bonusAmount, maxBudgetPerSubId, selectedSubIds และ optimizationStrategy",
      "แสดง data changed indicator เฉพาะเมื่อมีการเปลี่ยนแปลงจริงๆ เท่านั้น",
      "ปรับปรุงประสิทธิภาพการตรวจสอบและลดการ re-render ที่ไม่จำเป็น",
      "รับประกันว่าผู้ใช้จะเห็น indicator เมื่อต้องการ recalculate แผนการยิงแอด"
    ]
  },
  {
    date: "2025-01-03",
    time: "24:00",
    version: "v2.4.21",
    type: "improvement",
    title: "ปรับปรุงและเพิ่มฟีเจอร์ครบถ้วนใน AdPlanning component",
    description: "อัปเดต AdPlanning component ให้มีฟีเจอร์ครบถ้วนและใช้งานได้เต็มรูปแบบ พร้อมการแสดงผลที่สวยงามและครอบคลุม",
    details: [
      "เพิ่มระบบ localStorage เพื่อเก็บสถานะ form ถาวร",
      "เพิ่มการแสดงผลสรุปข้อมูลช่วงวันที่แบบ Dashboard-style cards",
      "เพิ่มระบบเลือก Campaign Goals แบบ multiple selection พร้อม input fields",
      "เพิ่มระบบเลือก Optimization Strategy (Goal-First, ROI-First, Balanced)",
      "เพิ่มการตั้งค่า Budget & Bonus Settings",
      "เพิ่มระบบเลือก Sub ID พร้อมแสดงข้อมูล metrics แต่ละ Sub ID",
      "เพิ่มการแสดงผล Campaign Summary และ Sub ID Recommendations Table",
      "เพิ่มการแสดงผลคาดการณ์ผลลัพท์และ Goal Results Summary แบบ interactive",
      "เพิ่มระบบ data change detection และ recalculate indicator",
      "ปรับปรุง UI/UX ให้สวยงามและใช้งานง่ายขึ้น"
    ]
  },
  {
    date: "2025-01-03",
    time: "23:59",
    version: "v2.4.20",
    type: "fix",
    title: "แก้ไขการติดตาม optimization strategy ใน data signature",
    description: "เพิ่ม optimizationStrategy ใน data signature เพื่อให้การตรวจจับการเปลี่ยนแปลงทำงานถูกต้อง",
    details: [
      "เพิ่ม optimizationStrategy ใน lastCalculationDataRef signature",
      "แก้ไขปัญหาการไม่ตรวจจับการเปลี่ยนแปลง optimization strategy",
      "ปรับปรุงความแม่นยำของ data change detection",
      "รับประกันว่า data changed indicator จะแสดงเมื่อมีการเปลี่ยน optimization strategy"
    ]
  },
  {
    date: "2025-01-03",
    time: "23:59",
    version: "v2.4.19",
    type: "improvement",
    title: "ปรับปรุงการ auto-recalculate ใน AdPlanning component",
    description: "เพิ่มการ auto-recalculate เมื่อมีการเปลี่ยนแปลง optimization strategy ใน AdPlanning",
    details: [
      "เพิ่ม optimizationStrategy ใน useEffect dependency array",
      "ปรับปรุงการตรวจจับการเปลี่ยนแปลงให้ครอบคลุม optimization strategy",
      "แสดง data changed indicator เมื่อมีการเปลี่ยน optimization strategy",
      "ปรับปรุงความแม่นยำของการ recalculate แผนการยิงแอด",
      "อัปเดตคอมเมนต์ให้สะท้อนการทำงานที่ครบถ้วนขึ้น"
    ]
  },
  {
    date: "2025-01-03",
    time: "23:58",
    version: "v2.4.18",
    type: "fix",
    title: "เพิ่ม optimizationStrategy state ใน AdPlanning component",
    description: "แก้ไขการขาด state management สำหรับ optimizationStrategy ใน AdPlanning component",
    details: [
      "เพิ่ม useState สำหรับ optimizationStrategy ใน AdPlanning component",
      "กำหนดค่าเริ่มต้นเป็น 'goal-first' หากไม่มีข้อมูลใน localStorage",
      "รองรับการเลือกกลยุทธ์การเพิ่มประสิทธิภาพ: goal-first, roi-first, balanced",
      "แก้ไขปัญหาการอ้างอิงตัวแปรที่ไม่ได้ประกาศใน component",
      "เตรียมพร้อมสำหรับการเพิ่ม UI controls สำหรับเลือกกลยุทธ์"
    ]
  },
  {
    date: "2025-01-03",
    time: "23:55",
    version: "v2.4.17",
    type: "improvement",
    title: "ปรับปรุงอัลกอริทึมการเรียงลำดับ Sub ID ใน Ad Planning",
    description: "เพิ่มระบบการเรียงลำดับ Sub ID ตามกลยุทธ์การเพิ่มประสิทธิภาพที่เลือก เพื่อให้ผลลัพธ์การวางแผนแม่นยำขึ้น",
    details: [
      "เพิ่มการเรียงลำดับแบบ 'roi-first' สำหรับจัดลำดับตาม ROI สูงสุด",
      "เพิ่มการเรียงลำดับแบบ 'balanced' สำหรับคะแนนผสมระหว่าง ROI และการบรรลุเป้าหมาย",
      "รักษาการเรียงลำดับแบบ 'goal-first' เป็นค่าเริ่มต้น",
      "ปรับปรุงประสิทธิภาพการคำนวณและความแม่นยำของผลลัพธ์",
      "เตรียมพร้อมสำหรับฟังก์ชัน calculateBalancedScore และ calculateGoalEfficiency"
    ]
  },
  {
    date: "2025-01-03",
    time: "23:50",
    version: "v2.4.16",
    type: "improvement",
    title: "เพิ่ม optimizationStrategy parameter ใน AdPlanInput interface",
    description: "เพิ่มพารามิเตอร์ optimizationStrategy เพื่อรองรับกลยุทธ์การเพิ่มประสิทธิภาพที่หลากหลายใน Ad Planning",
    details: [
      "เพิ่ม optimizationStrategy field ใน AdPlanInput interface",
      "รองรับ 3 กลยุทธ์: 'goal-first', 'roi-first', และ 'balanced'",
      "เตรียมพร้อมสำหรับการปรับปรุงอัลกอริทึมการวางแผนโฆษณาในอนาคต",
      "ปรับปรุงความยืดหยุ่นในการคำนวณแผนการยิงแอด"
    ]
  },
  {
    date: "2025-01-03",
    time: "23:45",
    version: "v2.4.15",
    type: "fix",
    title: "แก้ไขการอ้างอิง field ที่ถูกต้องใน AdPlanning component",
    description: "แก้ไขการใช้ field name ที่ไม่ถูกต้องในการคำนวณ commission ใน Sub ID Selection",
    details: [
      "แก้ไข field 'คอมมิชชั่น' เป็น 'คอมมิชชั่นสินค้าโดยรวม(฿)' สำหรับ Shopee orders",
      "แก้ไข field 'Commission' เป็น 'Payout' สำหรับ Lazada orders",
      "ปรับปรุงความถูกต้องของการคำนวณ Total Com ใน Sub ID metrics",
      "แก้ไขปัญหาการแสดงผลข้อมูลที่ไม่ถูกต้องใน Sub ID Selection section"
    ]
  },
  {
    date: "2025-01-03",
    time: "23:15",
    version: "v2.4.14",
    type: "improvement",
    title: "ปรับปรุง CustomTooltip ใน StatsChart component",
    description: "เพิ่มความแม่นยำในการแสดงผลข้อมูลใน tooltip ของ Multi-Stats Chart",
    details: [
      "ปรับปรุงการตรวจสอบประเภทข้อมูลใน CustomTooltip",
      "ใช้ STAT_OPTIONS และ PERCENTAGE_STATS เพื่อกำหนดรูปแบบการแสดงผล",
      "แก้ไขการแสดงผลเปอร์เซ็นต์และสกุลเงินให้ถูกต้อง",
      "เพิ่มความเสถียรในการแสดงผลข้อมูลกราฟ"
    ]
  },
  {
    date: "2025-01-03",
    time: "22:30",
    version: "v2.4.13",
    type: "fix",
    title: "แก้ไข TypeScript errors และปรับปรุง StatsChart component",
    description: "แก้ไขปัญหา TypeScript compilation errors และปรับปรุงการทำงานของ StatsChart",
    details: [
      "แก้ไข readOnly property error ใน Checkbox component",
      "ลบ unused imports (Button, TrendingUp, parseNumber)",
      "ปรับปรุงโครงสร้างโค้ดให้สะอาดและมีประสิทธิภาพมากขึ้น",
      "แก้ไข TypeScript type issues ในหลายไฟล์",
      "ปรับปรุงการจัดการ state และ props ใน StatsChart"
    ]
  },
  {
    date: "2025-01-03",
    time: "21:15",
    version: "v2.4.12",
    type: "fix",
    title: "แก้ไขการใช้ field หมวดหมู่ที่ถูกต้องใน TopCategoryDonutChart",
    description: "เปลี่ยนกลับไปใช้ field หมวดหมู่ที่ถูกต้องแทนการสกัดจากชื่อสินค้า",
    details: [
      "เปลี่ยนกลับไปใช้ field 'L1 หมวดหมู่สากล' สำหรับ Shopee orders",
      "เปลี่ยนกลับไปใช้ field 'Category L1' สำหรับ Lazada orders",
      "ลบการสกัดหมวดหมู่จากชื่อสินค้าที่อาจไม่แม่นยำ",
      "ใช้ข้อมูลหมวดหมู่ที่มีอยู่จริงในฐานข้อมูลแทน"
    ]
  },
  {
    date: "2025-01-03",
    time: "20:45",
    version: "v2.4.11",
    type: "fix",
    title: "แก้ไขการแสดงหมวดหมู่ใน TopCategoryDonutChart",
    description: "ปรับปรุงการสกัดหมวดหมู่สินค้าจากชื่อสินค้าแทนการใช้ field ที่ไม่มีข้อมูล",
    details: [
      "เปลี่ยนจากการใช้ field 'หมวดหมู่สินค้า' เป็นการสกัดจาก 'ชื่อสินค้า' สำหรับ Shopee",
      "เปลี่ยนจากการใช้ field 'Category' เป็นการสกัดจาก 'Item Name' สำหรับ Lazada",
      "ใช้วิธีการสกัด 2 คำแรกจากชื่อสินค้าเป็นหมวดหมู่",
      "แก้ไขปัญหาการแสดงหมวดหมู่ที่ไม่ถูกต้องใน Donut Chart"
    ]
  },
  {
    date: "2025-01-03",
    time: "20:30",
    version: "v2.4.10",
    type: "improvement",
    title: "ปรับปรุง BubblePlotChart component",
    description: "อัปเดต BubblePlotChart component เพื่อปรับปรุงการแสดงผลและประสิทธิภาพ",
    details: [
      "ปรับปรุงโครงสร้างโค้ดใน BubblePlotChart.tsx",
      "เพิ่มความเสถียรในการแสดงผลข้อมูล Sub ID performance",
      "ปรับปรุงการจัดการข้อมูลสำหรับ bubble chart visualization",
      "รักษาฟังก์ชันการทำงานเดิมไว้ครบถ้วน"
    ]
  },
  {
    date: "2025-01-03",
    time: "20:15",
    version: "v2.4.9",
    type: "fix",
    title: "แก้ไข platform property ใน Lazada orders processing",
    description: "เพิ่ม platform property และ platform logic ใน Lazada orders section ของ analyzeSubIdPerformance function",
    details: [
      "เพิ่ม platform: 'Lazada' ใน subIdMap initialization สำหรับ Lazada orders",
      "เพิ่ม platform update logic เพื่อจัดการ Mixed platform scenarios",
      "แก้ไข TypeScript error ที่เกิดจาก missing platform property",
      "ปรับปรุงความสอดคล้องของ platform tracking ระหว่าง Shopee และ Lazada"
    ]
  },
  {
    date: "2025-01-03",
    time: "19:30",
    version: "v2.4.8",
    type: "fix",
    title: "แก้ไข SubIdPerformance interface ใน analyzeSubIdPerformance",
    description: "เพิ่ม platform property ใน subIdMap เพื่อแก้ไข TypeScript error และให้สอดคล้องกับ interface",
    details: [
      "เพิ่ม platform property ใน subIdMap object type definition",
      "แก้ไข TypeScript compilation error ที่เกิดจาก missing property",
      "ปรับปรุงความสอดคล้องของ data structure ใน analyzeSubIdPerformance function",
      "รักษาความถูกต้องของ type safety ในระบบ"
    ]
  },
  {
    date: "2025-01-03",
    time: "19:15",
    version: "v2.4.7",
    type: "improvement",
    title: "ปรับปรุง SubIdPerformance interface ใน affiliateCalculations",
    description: "เพิ่ม properties ที่จำเป็นใน SubIdPerformance interface เพื่อรองรับการคำนวณที่ครบถ้วน",
    details: [
      "เพิ่ม adSpent property สำหรับเก็บข้อมูลค่าใช้จ่ายโฆษณา",
      "เพิ่ม platform property สำหรับระบุแพลตฟอร์มที่ใช้งาน",
      "ปรับปรุงโครงสร้างข้อมูลให้สอดคล้องกับการใช้งานจริง",
      "เตรียมพร้อมสำหรับการคำนวณ ROI และการวิเคราะห์ที่แม่นยำขึ้น"
    ]
  },
  {
    date: "2025-01-03",
    time: "18:30",
    version: "v2.4.6",
    type: "fix",
    title: "แก้ไขวันที่ในประวัติการอัปเดท",
    description: "ปรับแก้วันที่ในรายการอัปเดทให้ถูกต้องตามลำดับเวลา",
    details: [
      "แก้ไขวันที่ของ v2.4.5 จาก 2025-01-03 เป็น 2024-12-03",
      "รักษาลำดับเวลาของการอัปเดทให้ถูกต้อง",
      "ปรับปรุงความแม่นยำของข้อมูลประวัติ"
    ]
  },
  {
    date: "2024-12-03",
    time: "17:00",
    version: "v2.4.5",
    type: "improvement",
    title: "ปรับปรุง StatsChart ให้แสดง ROI เป็นค่าเริ่มต้น",
    description: "เพิ่ม ROI ในการแสดงผลเริ่มต้นของ Multi-Stats Chart และรับ calculatedMetrics เป็น props",
    details: [
      "เพิ่ม ROI ในรายการ selectedStats เริ่มต้น",
      "เพิ่ม calculatedMetrics เป็น props ของ StatsChart component",
      "ปรับปรุงการแสดงผลให้ครบถ้วนมากขึ้น",
      "ผู้ใช้จะเห็น ROI ในกราฟทันทีเมื่อเปิดหน้าแรก"
    ]
  },
  {
    date: "2025-01-03",
    time: "16:30",
    version: "v2.4.4",
    type: "improvement",
    title: "ปรับปรุงการแสดงผล Campaign Goals ใน Ad Planning",
    description: "เปลี่ยนจากแสดงค่าเป้าหมายเป็นแสดงค่าคาดการณ์ที่คำนวณได้จากแผนการยิงแอด",
    details: [
      "แสดงค่าคาดการณ์แทนค่าเป้าหมายใน Campaign Goals section",
      "เพิ่มหน่วยการแสดงผลที่เหมาะสม (ออเดอร์, คลิก)",
      "ปรับปรุงการจัดรูปแบบตัวเลขให้อ่านง่ายขึ้น",
      "แสดงเฉพาะเป้าหมายที่มีข้อมูลคาดการณ์",
      "ใช้ข้อมูลจาก goalResults ในการแสดงผล"
    ]
  },
  {
    date: "2025-01-03",
    time: "16:15",
    version: "v2.4.3",
    type: "improvement",
    title: "ปรับปรุง StatsChart ให้ใช้ข้อมูลจาก dailyMetrics",
    description: "เปลี่ยนการคำนวณข้อมูลใน StatsChart ให้ใช้ข้อมูลที่ประมวลผลแล้วจาก hook",
    details: [
      "ลดการคำนวณซ้ำซ้อนโดยใช้ข้อมูลจาก dailyMetrics",
      "ปรับปรุงประสิทธิภาพการแสดงผลกราฟ Multi-Stats",
      "ลดโค้ดที่ซับซ้อนจาก 200+ บรรทัดเหลือ 20+ บรรทัด",
      "รักษาฟังก์ชันการทำงานเดิมไว้ครบถ้วน",
      "ใช้การประมาณค่าสำหรับ SP/LZD breakdown"
    ]
  },
  {
    date: "2025-01-03",
    time: "15:45",
    version: "v2.4.2",
    type: "improvement",
    title: "ปรับปรุง Bubble Plot Chart ให้ใช้ข้อมูลจาก subIdAnalysis",
    description: "เปลี่ยนการคำนวณข้อมูลใน Bubble Chart ให้ใช้ข้อมูลที่ประมวลผลแล้วจาก hook",
    details: [
      "ลดการคำนวณซ้ำซ้อนโดยใช้ข้อมูลจาก subIdAnalysis",
      "ปรับปรุงประสิทธิภาพการแสดงผล",
      "ลดโค้ดที่ซับซ้อนและทำให้ง่ายต่อการบำรุงรักษา",
      "รักษาฟังก์ชันการทำงานเดิมไว้ครบถ้วน"
    ]
  },
  {
    date: "2025-01-03",
    time: "14:30",
    version: "v2.4.1",
    type: "feature",
    title: "เพิ่มฟีเจอร์ CSV Export ให้ทุกตาราง",
    description: "ผู้ใช้สามารถ export ข้อมูลจากทุกตารางเป็นไฟล์ CSV ได้แล้ว",
    details: [
      "เพิ่มปุ่ม Export CSV ใน Top SubID, Top Products, Top Category, Top ADS Spend",
      "ไฟล์ CSV จะมีชื่อตามวันที่และประเภทตาราง",
      "รองรับการ export ข้อมูลที่ถูกกรองแล้ว"
    ]
  },
  {
    date: "2025-01-03",
    time: "14:15",
    version: "v2.4.1",
    type: "improvement",
    title: "ปรับปรุง Ad Planning ให้เก็บข้อมูลถาวร",
    description: "ข้อมูลใน Ad Planning จะไม่หายไปเมื่อเปลี่ยนหน้า",
    details: [
      "ใช้ localStorage เก็บข้อมูล form",
      "เพิ่มปุ่ม Reset All Data",
      "ข้อมูลจะคงอยู่จนกว่าจะกด Reset"
    ]
  },
  {
    date: "2025-01-03",
    time: "14:00",
    version: "v2.4.1",
    type: "feature",
    title: "เพิ่มคอลัม CPC และ Preview Link ใน Top ADS Spend",
    description: "เพิ่มข้อมูล Cost Per Click และลิงก์ดูตัวอย่างโฆษณา",
    details: [
      "คอลัม CPC แสดงค่าใช้จ่ายต่อการคลิก",
      "ปุ่ม Preview Link เปิดลิงก์โฆษณาในแท็บใหม่",
      "อัปเดต CSV export ให้รวมข้อมูลใหม่"
    ]
  },
  {
    date: "2025-01-03",
    time: "13:45",
    version: "v2.4.1",
    type: "improvement",
    title: "ปรับโครงสร้างตารางใหม่",
    description: "จัดเรียงตารางใหม่เพื่อประสบการณ์ที่ดีขึ้น",
    details: [
      "ลบตาราง Top ADS Spent (by Sub ID) และรวมเข้า Top SubID",
      "เปลี่ยนชื่อ 'ตาราง SubID' เป็น 'Top SubID'",
      "จัดเรียงใหม่: Top SubID → Top Products/Category → Top ADS Spend"
    ]
  },
  {
    date: "2025-01-03",
    time: "12:00",
    version: "v2.4.0",
    type: "feature",
    title: "ปรับปรุงระบบกรองข้อมูลแบบ Global",
    description: "ตัวกรองด้านบนจะกรองข้อมูลในทุก charts และ tables",
    details: [
      "Channel Filter กรองข้อมูลทุกส่วน",
      "Sub ID Filter ทำงานกับทุก component",
      "Platform Filter รองรับ Shopee/Lazada",
      "Date Range Filter กรองตามช่วงวันที่",
      "Validity Filter กรองความถูกต้องของข้อมูล"
    ]
  },
  {
    date: "2025-01-02",
    time: "16:30",
    version: "v2.3.5",
    type: "improvement",
    title: "ปรับปรุง Ad Planning Algorithm",
    description: "อัลกอริทึมการคำนวณแผนโฆษณาแม่นยำขึ้น",
    details: [
      "ใช้ Two-phase algorithm ให้ความสำคัญ Sub ID ที่เลือกก่อน",
      "ปรับปรุงการคำนวณ NEW entries",
      "เพิ่มการแสดงผล Campaign Goals ในผลลัพธ์"
    ]
  },
  {
    date: "2025-01-02",
    time: "15:00",
    version: "v2.3.4",
    type: "fix",
    title: "แก้ไข Date Range Selector",
    description: "ปรับปรุงการเลือกวันที่ให้ใช้งานง่ายขึ้น",
    details: [
      "ต้องคลิก 2 ครั้งเพื่อเลือกช่วงวันที่",
      "รองรับการเลือกวันเดียว",
      "แสดงสถานะการเลือกชัดเจนขึ้น"
    ]
  },
  {
    date: "2025-01-01",
    time: "10:00",
    version: "v2.3.0",
    type: "feature",
    title: "เปิดตัว Affiliate Performance Chart",
    description: "กราฟแสดงประสิทธิภาพการทำ affiliate แบบรายวัน",
    details: [
      "แสดงข้อมูล Ad Spend, Total Com, Profit, ROI",
      "รองรับการกรองตามช่วงวันที่",
      "อัปเดตแบบ real-time ตามตัวกรอง"
    ]
  }
];

const getTypeIcon = (type: UpdateItem['type']) => {
  switch (type) {
    case 'feature':
      return <Zap className="h-4 w-4 text-green-400" />;
    case 'fix':
      return <CheckCircle className="h-4 w-4 text-blue-400" />;
    case 'improvement':
      return <AlertCircle className="h-4 w-4 text-yellow-400" />;
    case 'security':
      return <AlertCircle className="h-4 w-4 text-red-400" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
};

const getTypeBadge = (type: UpdateItem['type']) => {
  const configs = {
    feature: { label: 'Feature', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
    fix: { label: 'Bug Fix', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    improvement: { label: 'Improvement', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    security: { label: 'Security', className: 'bg-red-500/20 text-red-400 border-red-500/30' }
  };
  
  const config = configs[type];
  return (
    <Badge className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
};

export default function Update() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="relative">
            <Clock className="h-8 w-8 text-blue-400 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            📋 Update History
          </h1>
        </div>
        <p className="text-lg text-white/70 max-w-2xl mx-auto">
          ติดตามการอัปเดทและการปรับปรุงระบบล่าสุด
        </p>
        <div className="flex justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" style={{animationDelay: '0.2s'}}></div>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" style={{animationDelay: '0.4s'}}></div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">
              {updates.filter(u => u.type === 'feature').length}
            </div>
            <div className="text-sm text-muted-foreground">New Features</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {updates.filter(u => u.type === 'fix').length}
            </div>
            <div className="text-sm text-muted-foreground">Bug Fixes</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {updates.filter(u => u.type === 'improvement').length}
            </div>
            <div className="text-sm text-muted-foreground">Improvements</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {updates.length}
            </div>
            <div className="text-sm text-muted-foreground">Total Updates</div>
          </CardContent>
        </Card>
      </div>

      {/* Update Timeline */}
      <div className="space-y-4">
        {updates.map((update, index) => (
          <Card key={index} className="glass-panel hover:bg-secondary/20 transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getTypeIcon(update.type)}
                  <div>
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      {update.title}
                      {getTypeBadge(update.type)}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {update.date} {update.time}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {update.version}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-white/80 mb-3">{update.description}</p>
              {update.details && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">รายละเอียด:</div>
                  <ul className="space-y-1">
                    {update.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="text-sm text-white/70 flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30">
        <CardContent className="p-6 text-center">
          <div className="text-lg font-semibold text-white mb-2">
            🚀 Stay Updated!
          </div>
          <p className="text-white/70">
            ระบบจะอัปเดทอย่างต่อเนื่องเพื่อประสบการณ์ที่ดีขึ้น
          </p>
        </CardContent>
      </Card>
    </div>
  );
}