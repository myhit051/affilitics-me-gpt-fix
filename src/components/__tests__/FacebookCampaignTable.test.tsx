import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FacebookCampaignTable from '../FacebookCampaignTable';
import { FacebookCampaign } from '@/types/facebook';

// Mock the Facebook data transformer
vi.mock('@/lib/facebook-data-transformer', () => ({
  getFacebookDataTransformer: () => ({
    transformCampaignForDisplay: vi.fn((campaign) => ({
      ...campaign,
      displayName: campaign.name,
      formattedSpend: `$${campaign.insights?.spend || 0}`,
      formattedCPM: `$${campaign.insights?.cpm || 0}`,
      formattedCTR: `${campaign.insights?.ctr || 0}%`,
      statusColor: campaign.status === 'ACTIVE' ? 'green' : 'red',
    })),
    formatCurrency: vi.fn((amount) => `$${amount}`),
    formatPercentage: vi.fn((value) => `${value}%`),
  }),
}));

describe('FacebookCampaignTable', () => {
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
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders table with campaign data', () => {
      render(<FacebookCampaignTable {...defaultProps} />);

      expect(screen.getByText('Test Campaign 1')).toBeInTheDocument();
      expect(screen.getByText('Test Campaign 2')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
    });

    it('renders table headers', () => {
      render(<FacebookCampaignTable {...defaultProps} />);

      expect(screen.getByText('Campaign Name')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Objective')).toBeInTheDocument();
      expect(screen.getByText('Impressions')).toBeInTheDocument();
      expect(screen.getByText('Clicks')).toBeInTheDocument();
      expect(screen.getByText('Spend')).toBeInTheDocument();
    });

    it('displays empty state when no campaigns', () => {
      render(<FacebookCampaignTable {...defaultProps} campaigns={[]} />);

      expect(screen.getByText('No Facebook campaigns found')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      render(<FacebookCampaignTable {...defaultProps} loading={true} />);

      expect(screen.getByText('Loading campaigns...')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('formats currency values correctly', () => {
      render(<FacebookCampaignTable {...defaultProps} />);

      expect(screen.getByText('$25.5')).toBeInTheDocument(); // Spend
      expect(screen.getByText('$0.51')).toBeInTheDocument(); // CPC
    });

    it('formats percentage values correctly', () => {
      render(<FacebookCampaignTable {...defaultProps} />);

      expect(screen.getByText('5%')).toBeInTheDocument(); // CTR
    });

    it('displays campaign metrics', () => {
      render(<FacebookCampaignTable {...defaultProps} />);

      expect(screen.getByText('1000')).toBeInTheDocument(); // Impressions
      expect(screen.getByText('50')).toBeInTheDocument(); // Clicks
      expect(screen.getByText('800')).toBeInTheDocument(); // Reach
    });

    it('handles missing insights data', () => {
      const campaignWithoutInsights: FacebookCampaign = {
        id: '789',
        name: 'Campaign Without Insights',
        status: 'ACTIVE',
        objective: 'CONVERSIONS',
        created_time: '2024-01-01T00:00:00Z',
        updated_time: '2024-01-02T00:00:00Z',
        account_id: 'act_789',
      };

      render(
        <FacebookCampaignTable 
          {...defaultProps} 
          campaigns={[campaignWithoutInsights]} 
        />
      );

      expect(screen.getByText('Campaign Without Insights')).toBeInTheDocument();
      expect(screen.getByText('$0')).toBeInTheDocument(); // Default spend
    });
  });

  describe('Sorting', () => {
    it('handles column header clicks', () => {
      render(<FacebookCampaignTable {...defaultProps} />);

      const nameHeader = screen.getByText('Campaign Name');
      fireEvent.click(nameHeader);

      expect(defaultProps.onSort).toHaveBeenCalledWith('name');
    });

    it('displays sort indicators', () => {
      render(<FacebookCampaignTable {...defaultProps} />);

      const nameHeader = screen.getByText('Campaign Name');
      const headerElement = nameHeader.closest('th');
      expect(headerElement).toHaveClass('sortable');
    });

    it('handles different sort columns', () => {
      render(
        <FacebookCampaignTable 
          {...defaultProps} 
          sortBy="spend" 
          sortDirection="desc" 
        />
      );

      const spendHeader = screen.getByText('Spend');
      const headerElement = spendHeader.closest('th');
      expect(headerElement).toHaveClass('sorted-desc');
    });

    it('sorts campaigns by different metrics', () => {
      render(<FacebookCampaignTable {...defaultProps} />);

      const spendHeader = screen.getByText('Spend');
      fireEvent.click(spendHeader);

      expect(defaultProps.onSort).toHaveBeenCalledWith('spend');
    });
  });

  describe('Campaign Selection', () => {
    it('handles campaign row clicks', () => {
      render(<FacebookCampaignTable {...defaultProps} />);

      const campaignRow = screen.getByText('Test Campaign 1').closest('tr');
      fireEvent.click(campaignRow!);

      expect(defaultProps.onCampaignSelect).toHaveBeenCalledWith(mockCampaigns[0]);
    });

    it('highlights selected campaigns', () => {
      render(
        <FacebookCampaignTable 
          {...defaultProps} 
          selectedCampaignIds={['123']} 
        />
      );

      const campaignRow = screen.getByText('Test Campaign 1').closest('tr');
      expect(campaignRow).toHaveClass('selected');
    });

    it('supports multiple campaign selection', () => {
      render(
        <FacebookCampaignTable 
          {...defaultProps} 
          selectedCampaignIds={['123', '456']} 
        />
      );

      const campaign1Row = screen.getByText('Test Campaign 1').closest('tr');
      const campaign2Row = screen.getByText('Test Campaign 2').closest('tr');
      
      expect(campaign1Row).toHaveClass('selected');
      expect(campaign2Row).toHaveClass('selected');
    });
  });

  describe('Status Display', () => {
    it('displays campaign status with appropriate styling', () => {
      render(<FacebookCampaignTable {...defaultProps} />);

      const activeStatus = screen.getByText('ACTIVE');
      const pausedStatus = screen.getByText('PAUSED');

      expect(activeStatus).toHaveClass('status-active');
      expect(pausedStatus).toHaveClass('status-paused');
    });

    it('handles different campaign statuses', () => {
      const campaignsWithDifferentStatuses: FacebookCampaign[] = [
        { ...mockCampaigns[0], status: 'ACTIVE' },
        { ...mockCampaigns[1], status: 'PAUSED' },
        { ...mockCampaigns[0], id: '789', status: 'DELETED' },
        { ...mockCampaigns[1], id: '101', status: 'ARCHIVED' },
      ];

      render(
        <FacebookCampaignTable 
          {...defaultProps} 
          campaigns={campaignsWithDifferentStatuses} 
        />
      );

      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('PAUSED')).toBeInTheDocument();
      expect(screen.getByText('DELETED')).toBeInTheDocument();
      expect(screen.getByText('ARCHIVED')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('applies status filter', () => {
      render(
        <FacebookCampaignTable 
          {...defaultProps} 
          statusFilter="ACTIVE" 
        />
      );

      expect(screen.getByText('Test Campaign 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Campaign 2')).not.toBeInTheDocument();
    });

    it('applies objective filter', () => {
      render(
        <FacebookCampaignTable 
          {...defaultProps} 
          objectiveFilter="CONVERSIONS" 
        />
      );

      expect(screen.getByText('Test Campaign 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Campaign 2')).not.toBeInTheDocument();
    });

    it('applies search filter', () => {
      render(
        <FacebookCampaignTable 
          {...defaultProps} 
          searchQuery="Campaign 1" 
        />
      );

      expect(screen.getByText('Test Campaign 1')).toBeInTheDocument();
      expect(screen.queryByText('Test Campaign 2')).not.toBeInTheDocument();
    });
  });

  describe('Performance Metrics', () => {
    it('calculates and displays performance indicators', () => {
      render(<FacebookCampaignTable {...defaultProps} />);

      // Should display calculated metrics
      expect(screen.getByText('1.25')).toBeInTheDocument(); // Frequency
      expect(screen.getByText('$25.5')).toBeInTheDocument(); // CPM
    });

    it('handles zero values gracefully', () => {
      const campaignWithZeroMetrics: FacebookCampaign = {
        ...mockCampaigns[0],
        insights: {
          impressions: 0,
          clicks: 0,
          spend: 0,
          reach: 0,
          frequency: 0,
          cpm: 0,
          cpc: 0,
          ctr: 0,
          date_start: '2024-01-01',
          date_stop: '2024-01-31',
        },
      };

      render(
        <FacebookCampaignTable 
          {...defaultProps} 
          campaigns={[campaignWithZeroMetrics]} 
        />
      );

      expect(screen.getByText('$0')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('Date Handling', () => {
    it('formats campaign dates correctly', () => {
      render(<FacebookCampaignTable {...defaultProps} />);

      // Should display formatted dates
      expect(screen.getByText(/Jan 1, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 2, 2024/)).toBeInTheDocument();
    });

    it('handles invalid dates gracefully', () => {
      const campaignWithInvalidDate: FacebookCampaign = {
        ...mockCampaigns[0],
        created_time: 'invalid-date',
        updated_time: 'invalid-date',
      };

      render(
        <FacebookCampaignTable 
          {...defaultProps} 
          campaigns={[campaignWithInvalidDate]} 
        />
      );

      expect(screen.getByText('Test Campaign 1')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper table structure', () => {
      render(<FacebookCampaignTable {...defaultProps} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getAllByRole('columnheader')).toHaveLength(9);
      expect(screen.getAllByRole('row')).toHaveLength(3); // Header + 2 data rows
    });

    it('has proper ARIA labels', () => {
      render(<FacebookCampaignTable {...defaultProps} />);

      const table = screen.getByRole('table');
      expect(table).toHaveAttribute('aria-label', 'Facebook Campaigns');
    });

    it('supports keyboard navigation', () => {
      render(<FacebookCampaignTable {...defaultProps} />);

      const firstRow = screen.getByText('Test Campaign 1').closest('tr');
      firstRow?.focus();
      expect(document.activeElement).toBe(firstRow);
    });

    it('announces sort changes to screen readers', () => {
      render(<FacebookCampaignTable {...defaultProps} />);

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
          formatCurrency: vi.fn((amount) => `$${amount}`),
          formatPercentage: vi.fn((value) => `${value}%`),
        });

      render(<FacebookCampaignTable {...defaultProps} />);

      // Should still render basic campaign data
      expect(screen.getByText('Test Campaign 1')).toBeInTheDocument();
    });

    it('handles missing required fields', () => {
      const incompleteCampaign = {
        id: '999',
        name: 'Incomplete Campaign',
        // Missing status, objective, etc.
      } as FacebookCampaign;

      render(
        <FacebookCampaignTable 
          {...defaultProps} 
          campaigns={[incompleteCampaign]} 
        />
      );

      expect(screen.getByText('Incomplete Campaign')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('adapts to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<FacebookCampaignTable {...defaultProps} />);

      const table = screen.getByRole('table');
      expect(table).toHaveClass('mobile-responsive');
    });

    it('shows/hides columns based on screen size', () => {
      render(<FacebookCampaignTable {...defaultProps} />);

      // On desktop, all columns should be visible
      expect(screen.getByText('Frequency')).toBeInTheDocument();
      expect(screen.getByText('Reach')).toBeInTheDocument();
    });
  });
});