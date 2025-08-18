import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VirtualizedFacebookCampaignTable from '../VirtualizedFacebookCampaignTable';
import { FacebookCampaign } from '@/types/facebook';

// Mock the virtual scrolling hook
vi.mock('@/hooks/useVirtualScrolling', () => ({
  default: () => ({
    containerRef: { current: null },
    startIndex: 0,
    endIndex: 10,
    visibleItems: [],
    scrollToIndex: vi.fn(),
    handleScroll: vi.fn(),
  }),
}));

// Mock the Facebook data transformer
vi.mock('@/lib/facebook-data-transformer', () => ({
  getFacebookDataTransformer: () => ({
    transformCampaignForDisplay: vi.fn((campaign) => ({
      ...campaign,
      displayName: campaign.name,
      formattedSpend: `$${campaign.insights?.spend || 0}`,
      formattedCPM: `$${campaign.insights?.cpm || 0}`,
      formattedCTR: `${campaign.insights?.ctr || 0}%`,
    })),
  }),
}));

describe('VirtualizedFacebookCampaignTable', () => {
  const mockCampaigns: FacebookCampaign[] = [
    {
      id: '123',
      name: 'Test Campaign 1',
      status: 'ACTIVE',
      objective: 'CONVERSIONS',
      created_time: '2024-01-01T00:00:00Z',
      updated_time: '2024-01-02T00:00:00Z',
      account_id: 'act_123',
      insights: {
        impressions: 1000,
        clicks: 50,
        spend: 25.5,
        reach: 800,
        frequency: 1.25,
        cpm: 25.5,
        cpc: 0.51,
        ctr: 5,
        date_start: '2024-01-01',
        date_stop: '2024-01-31',
      },
    },
    {
      id: '456',
      name: 'Test Campaign 2',
      status: 'PAUSED',
      objective: 'TRAFFIC',
      created_time: '2024-01-03T00:00:00Z',
      updated_time: '2024-01-04T00:00:00Z',
      account_id: 'act_456',
      insights: {
        impressions: 2000,
        clicks: 100,
        spend: 50.0,
        reach: 1600,
        frequency: 1.25,
        cpm: 25.0,
        cpc: 0.50,
        ctr: 5,
        date_start: '2024-01-01',
        date_stop: '2024-01-31',
      },
    },
  ];

  const defaultProps = {
    campaigns: mockCampaigns,
    onCampaignSelect: vi.fn(),
    onSort: vi.fn(),
    sortBy: 'name' as const,
    sortDirection: 'asc' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders table headers', () => {
      render(<VirtualizedFacebookCampaignTable {...defaultProps} />);

      expect(screen.getByText('Campaign Name')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Objective')).toBeInTheDocument();
      expect(screen.getByText('Impressions')).toBeInTheDocument();
      expect(screen.getByText('Clicks')).toBeInTheDocument();
      expect(screen.getByText('Spend')).toBeInTheDocument();
      expect(screen.getByText('CPM')).toBeInTheDocument();
      expect(screen.getByText('CPC')).toBeInTheDocument();
      expect(screen.getByText('CTR')).toBeInTheDocument();
    });

    it('renders campaign data', () => {
      const mockUseVirtualScrolling = vi.fn(() => ({
        containerRef: { current: null },
        startIndex: 0,
        endIndex: 2,
        visibleItems: mockCampaigns,
        scrollToIndex: vi.fn(),
        handleScroll: vi.fn(),
      }));

      vi.mocked(require('@/hooks/useVirtualScrolling').default)
        .mockImplementation(mockUseVirtualScrolling);

      render(<VirtualizedFacebookCampaignTable {...defaultProps} />);

      expect(screen.getByText('Test Campaign 1')).toBeInTheDocument();
      expect(screen.getByText('Test Campaign 2')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
    });

    it('displays empty state when no campaigns', () => {
      render(<VirtualizedFacebookCampaignTable {...defaultProps} campaigns={[]} />);

      expect(screen.getByText('No campaigns found')).toBeInTheDocument();
    });
  });

  describe('Virtual Scrolling', () => {
    it('uses virtual scrolling for large datasets', () => {
      const largeCampaignList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockCampaigns[0],
        id: `campaign_${i}`,
        name: `Campaign ${i}`,
      }));

      const mockUseVirtualScrolling = vi.fn(() => ({
        containerRef: { current: null },
        startIndex: 0,
        endIndex: 10,
        visibleItems: largeCampaignList.slice(0, 10),
        scrollToIndex: vi.fn(),
        handleScroll: vi.fn(),
      }));

      vi.mocked(require('@/hooks/useVirtualScrolling').default)
        .mockImplementation(mockUseVirtualScrolling);

      render(<VirtualizedFacebookCampaignTable {...defaultProps} campaigns={largeCampaignList} />);

      // Should only render visible items
      expect(screen.getByText('Campaign 0')).toBeInTheDocument();
      expect(screen.queryByText('Campaign 50')).not.toBeInTheDocument();
    });

    it('handles scroll events', () => {
      const mockHandleScroll = vi.fn();
      const mockUseVirtualScrolling = vi.fn(() => ({
        containerRef: { current: null },
        startIndex: 0,
        endIndex: 2,
        visibleItems: mockCampaigns,
        scrollToIndex: vi.fn(),
        handleScroll: mockHandleScroll,
      }));

      vi.mocked(require('@/hooks/useVirtualScrolling').default)
        .mockImplementation(mockUseVirtualScrolling);

      render(<VirtualizedFacebookCampaignTable {...defaultProps} />);

      const tableContainer = screen.getByRole('table').parentElement;
      fireEvent.scroll(tableContainer!, { target: { scrollTop: 100 } });

      expect(mockHandleScroll).toHaveBeenCalled();
    });
  });

  describe('Sorting', () => {
    it('handles column header clicks for sorting', () => {
      render(<VirtualizedFacebookCampaignTable {...defaultProps} />);

      const nameHeader = screen.getByText('Campaign Name');
      fireEvent.click(nameHeader);

      expect(defaultProps.onSort).toHaveBeenCalledWith('name');
    });

    it('displays sort indicators', () => {
      render(<VirtualizedFacebookCampaignTable {...defaultProps} />);

      const nameHeader = screen.getByText('Campaign Name');
      expect(nameHeader.closest('th')).toHaveClass('sorted-asc');
    });

    it('handles different sort directions', () => {
      render(
        <VirtualizedFacebookCampaignTable 
          {...defaultProps} 
          sortBy="spend" 
          sortDirection="desc" 
        />
      );

      const spendHeader = screen.getByText('Spend');
      expect(spendHeader.closest('th')).toHaveClass('sorted-desc');
    });
  });

  describe('Campaign Selection', () => {
    it('handles campaign row clicks', () => {
      const mockUseVirtualScrolling = vi.fn(() => ({
        containerRef: { current: null },
        startIndex: 0,
        endIndex: 2,
        visibleItems: mockCampaigns,
        scrollToIndex: vi.fn(),
        handleScroll: vi.fn(),
      }));

      vi.mocked(require('@/hooks/useVirtualScrolling').default)
        .mockImplementation(mockUseVirtualScrolling);

      render(<VirtualizedFacebookCampaignTable {...defaultProps} />);

      const campaignRow = screen.getByText('Test Campaign 1').closest('tr');
      fireEvent.click(campaignRow!);

      expect(defaultProps.onCampaignSelect).toHaveBeenCalledWith(mockCampaigns[0]);
    });

    it('highlights selected campaigns', () => {
      render(
        <VirtualizedFacebookCampaignTable 
          {...defaultProps} 
          selectedCampaignIds={['123']} 
        />
      );

      const campaignRow = screen.getByText('Test Campaign 1').closest('tr');
      expect(campaignRow).toHaveClass('selected');
    });
  });

  describe('Data Formatting', () => {
    it('formats currency values correctly', () => {
      const mockUseVirtualScrolling = vi.fn(() => ({
        containerRef: { current: null },
        startIndex: 0,
        endIndex: 2,
        visibleItems: mockCampaigns,
        scrollToIndex: vi.fn(),
        handleScroll: vi.fn(),
      }));

      vi.mocked(require('@/hooks/useVirtualScrolling').default)
        .mockImplementation(mockUseVirtualScrolling);

      render(<VirtualizedFacebookCampaignTable {...defaultProps} />);

      expect(screen.getByText('$25.5')).toBeInTheDocument(); // Spend
      expect(screen.getByText('$0.51')).toBeInTheDocument(); // CPC
    });

    it('formats percentage values correctly', () => {
      const mockUseVirtualScrolling = vi.fn(() => ({
        containerRef: { current: null },
        startIndex: 0,
        endIndex: 2,
        visibleItems: mockCampaigns,
        scrollToIndex: vi.fn(),
        handleScroll: vi.fn(),
      }));

      vi.mocked(require('@/hooks/useVirtualScrolling').default)
        .mockImplementation(mockUseVirtualScrolling);

      render(<VirtualizedFacebookCampaignTable {...defaultProps} />);

      expect(screen.getByText('5%')).toBeInTheDocument(); // CTR
    });

    it('handles missing insights data gracefully', () => {
      const campaignWithoutInsights: FacebookCampaign = {
        id: '789',
        name: 'Campaign Without Insights',
        status: 'ACTIVE',
        objective: 'CONVERSIONS',
        created_time: '2024-01-01T00:00:00Z',
        updated_time: '2024-01-02T00:00:00Z',
        account_id: 'act_789',
      };

      const mockUseVirtualScrolling = vi.fn(() => ({
        containerRef: { current: null },
        startIndex: 0,
        endIndex: 1,
        visibleItems: [campaignWithoutInsights],
        scrollToIndex: vi.fn(),
        handleScroll: vi.fn(),
      }));

      vi.mocked(require('@/hooks/useVirtualScrolling').default)
        .mockImplementation(mockUseVirtualScrolling);

      render(
        <VirtualizedFacebookCampaignTable 
          {...defaultProps} 
          campaigns={[campaignWithoutInsights]} 
        />
      );

      expect(screen.getByText('Campaign Without Insights')).toBeInTheDocument();
      expect(screen.getByText('$0')).toBeInTheDocument(); // Default spend
    });
  });

  describe('Performance', () => {
    it('renders efficiently with large datasets', () => {
      const largeCampaignList = Array.from({ length: 10000 }, (_, i) => ({
        ...mockCampaigns[0],
        id: `campaign_${i}`,
        name: `Campaign ${i}`,
      }));

      const mockUseVirtualScrolling = vi.fn(() => ({
        containerRef: { current: null },
        startIndex: 0,
        endIndex: 20,
        visibleItems: largeCampaignList.slice(0, 20),
        scrollToIndex: vi.fn(),
        handleScroll: vi.fn(),
      }));

      vi.mocked(require('@/hooks/useVirtualScrolling').default)
        .mockImplementation(mockUseVirtualScrolling);

      const startTime = performance.now();
      render(<VirtualizedFacebookCampaignTable {...defaultProps} campaigns={largeCampaignList} />);
      const endTime = performance.now();

      // Should render quickly even with large dataset
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('memoizes campaign transformations', () => {
      const mockTransformCampaignForDisplay = vi.fn((campaign) => ({
        ...campaign,
        displayName: campaign.name,
      }));

      vi.mocked(require('@/lib/facebook-data-transformer').getFacebookDataTransformer)
        .mockReturnValue({
          transformCampaignForDisplay: mockTransformCampaignForDisplay,
        });

      const { rerender } = render(<VirtualizedFacebookCampaignTable {...defaultProps} />);

      // Re-render with same data
      rerender(<VirtualizedFacebookCampaignTable {...defaultProps} />);

      // Transformation should be memoized and not called again
      expect(mockTransformCampaignForDisplay).toHaveBeenCalledTimes(mockCampaigns.length);
    });
  });

  describe('Accessibility', () => {
    it('has proper table structure', () => {
      render(<VirtualizedFacebookCampaignTable {...defaultProps} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(9);
    });

    it('supports keyboard navigation', () => {
      const mockUseVirtualScrolling = vi.fn(() => ({
        containerRef: { current: null },
        startIndex: 0,
        endIndex: 2,
        visibleItems: mockCampaigns,
        scrollToIndex: vi.fn(),
        handleScroll: vi.fn(),
      }));

      vi.mocked(require('@/hooks/useVirtualScrolling').default)
        .mockImplementation(mockUseVirtualScrolling);

      render(<VirtualizedFacebookCampaignTable {...defaultProps} />);

      const firstRow = screen.getByText('Test Campaign 1').closest('tr');
      firstRow?.focus();
      expect(document.activeElement).toBe(firstRow);
    });

    it('has proper ARIA labels', () => {
      render(<VirtualizedFacebookCampaignTable {...defaultProps} />);

      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Facebook Campaigns');
    });

    it('announces sort changes to screen readers', () => {
      render(<VirtualizedFacebookCampaignTable {...defaultProps} />);

      const nameHeader = screen.getByText('Campaign Name');
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    });
  });

  describe('Error Handling', () => {
    it('handles transformation errors gracefully', () => {
      const mockTransformCampaignForDisplay = vi.fn(() => {
        throw new Error('Transformation failed');
      });

      vi.mocked(require('@/lib/facebook-data-transformer').getFacebookDataTransformer)
        .mockReturnValue({
          transformCampaignForDisplay: mockTransformCampaignForDisplay,
        });

      render(<VirtualizedFacebookCampaignTable {...defaultProps} />);

      // Should still render campaign names even if transformation fails
      expect(screen.getByText('Test Campaign 1')).toBeInTheDocument();
    });

    it('handles missing campaign data', () => {
      const incompleteCampaign = {
        id: '999',
        name: 'Incomplete Campaign',
        // Missing required fields
      } as FacebookCampaign;

      const mockUseVirtualScrolling = vi.fn(() => ({
        containerRef: { current: null },
        startIndex: 0,
        endIndex: 1,
        visibleItems: [incompleteCampaign],
        scrollToIndex: vi.fn(),
        handleScroll: vi.fn(),
      }));

      vi.mocked(require('@/hooks/useVirtualScrolling').default)
        .mockImplementation(mockUseVirtualScrolling);

      render(
        <VirtualizedFacebookCampaignTable 
          {...defaultProps} 
          campaigns={[incompleteCampaign]} 
        />
      );

      expect(screen.getByText('Incomplete Campaign')).toBeInTheDocument();
    });
  });
});