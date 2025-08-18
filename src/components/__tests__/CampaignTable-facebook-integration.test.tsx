import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CampaignTable from '../CampaignTable';

// Mock Facebook Ads data
const mockFacebookAds = [
  {
    'Campaign name': 'Test Campaign 1',
    'Ad set name': 'Test Ad Set 1',
    'Ad name': 'Test Ad 1',
    'Amount spent (THB)': '1000',
    'Impressions': '10000',
    'Link clicks': '100',
    'Landing page views': '80',
    'Reach': '8000',
    'Frequency': '1.25',
    'CPM (cost per 1,000 impressions)': '100',
    'CPC (cost per link click)': '10',
    'CTR (link click-through rate)': '1.0',
    'Date': '2024-01-15',
    'Sub ID': 'test_sub_1'
  },
  {
    'Campaign name': 'Test Campaign 2',
    'Ad set name': 'Test Ad Set 2',
    'Ad name': 'Test Ad 2',
    'Amount spent (THB)': '2000',
    'Impressions': '20000',
    'Link clicks': '200',
    'Landing page views': '160',
    'Reach': '16000',
    'Frequency': '1.25',
    'CPM (cost per 1,000 impressions)': '100',
    'CPC (cost per link click)': '10',
    'CTR (link click-through rate)': '1.0',
    'Date': '2024-01-16',
    'Sub ID': 'test_sub_2'
  }
];

// Mock traditional campaigns data
const mockTraditionalCampaigns = [
  {
    id: 1,
    name: 'Shopee Campaign - test_sub_1',
    platform: 'Shopee',
    subId: 'test_sub_1',
    orders: 5,
    commission: 500,
    adSpend: 300,
    roi: 66.7,
    status: 'active',
    startDate: '2024-01-15',
    performance: 'good'
  }
];

describe('CampaignTable Facebook Integration', () => {
  it('should render Facebook campaigns when showPlatform is "all"', () => {
    render(
      <CampaignTable 
        campaigns={mockTraditionalCampaigns}
        facebookAds={mockFacebookAds}
        showPlatform="all"
      />
    );

    // Check if the table header is rendered
    expect(screen.getByText('🚀 Campaign Performance')).toBeInTheDocument();
    
    // Check if Facebook campaigns are displayed
    expect(screen.getByText('Test Campaign 1')).toBeInTheDocument();
    expect(screen.getByText('Test Campaign 2')).toBeInTheDocument();
    
    // Check if traditional campaigns are displayed
    expect(screen.getByText('Shopee Campaign - test_sub_1')).toBeInTheDocument();
    
    // Check if platform icons are displayed
    expect(screen.getAllByText('📘')).toHaveLength(2); // Facebook campaigns
    expect(screen.getByText('🛒')).toBeInTheDocument(); // Shopee campaign
  });

  it('should render only Facebook campaigns when showPlatform is "Facebook"', () => {
    render(
      <CampaignTable 
        campaigns={mockTraditionalCampaigns}
        facebookAds={mockFacebookAds}
        showPlatform="Facebook"
      />
    );

    // Check if Facebook campaigns are displayed
    expect(screen.getByText('Test Campaign 1')).toBeInTheDocument();
    expect(screen.getByText('Test Campaign 2')).toBeInTheDocument();
    
    // Check if traditional campaigns are NOT displayed
    expect(screen.queryByText('Shopee Campaign - test_sub_1')).not.toBeInTheDocument();
  });

  it('should render only traditional campaigns when showPlatform is "Shopee"', () => {
    render(
      <CampaignTable 
        campaigns={mockTraditionalCampaigns}
        facebookAds={mockFacebookAds}
        showPlatform="Shopee"
      />
    );

    // Check if traditional campaigns are displayed
    expect(screen.getByText('Shopee Campaign - test_sub_1')).toBeInTheDocument();
    
    // Check if Facebook campaigns are NOT displayed
    expect(screen.queryByText('Test Campaign 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Campaign 2')).not.toBeInTheDocument();
  });

  it('should calculate Facebook campaign metrics correctly', () => {
    render(
      <CampaignTable 
        campaigns={[]}
        facebookAds={mockFacebookAds}
        showPlatform="Facebook"
      />
    );

    // Check if estimated orders are calculated (2% of clicks)
    // Campaign 1: 100 clicks * 0.02 = 2 orders
    // Campaign 2: 200 clicks * 0.02 = 4 orders
    expect(screen.getByText('2')).toBeInTheDocument(); // Orders for campaign 1
    expect(screen.getByText('4')).toBeInTheDocument(); // Orders for campaign 2

    // Check if estimated commission is calculated (5% of spend)
    // Campaign 1: 1000 * 0.05 = 50
    // Campaign 2: 2000 * 0.05 = 100
    expect(screen.getByText('50')).toBeInTheDocument(); // Commission for campaign 1
    expect(screen.getByText('100')).toBeInTheDocument(); // Commission for campaign 2

    // Check if ad spend is displayed correctly
    expect(screen.getByText('1,000')).toBeInTheDocument(); // Spend for campaign 1
    expect(screen.getByText('2,000')).toBeInTheDocument(); // Spend for campaign 2
  });

  it('should display correct platform identification for Facebook campaigns', () => {
    render(
      <CampaignTable 
        campaigns={[]}
        facebookAds={mockFacebookAds}
        showPlatform="all"
      />
    );

    // Check if Facebook platform is correctly identified
    const facebookTexts = screen.getAllByText('Facebook');
    expect(facebookTexts).toHaveLength(2); // One for each Facebook campaign
    
    // Check if Facebook icons are displayed
    const facebookIcons = screen.getAllByText('📘');
    expect(facebookIcons).toHaveLength(2); // One for each Facebook campaign
  });

  it('should handle empty Facebook ads data gracefully', () => {
    render(
      <CampaignTable 
        campaigns={mockTraditionalCampaigns}
        facebookAds={[]}
        showPlatform="all"
      />
    );

    // Should still render traditional campaigns
    expect(screen.getByText('Shopee Campaign - test_sub_1')).toBeInTheDocument();
    
    // Should not render any Facebook campaigns
    expect(screen.queryByText('Test Campaign 1')).not.toBeInTheDocument();
  });

  it('should handle empty traditional campaigns data gracefully', () => {
    render(
      <CampaignTable 
        campaigns={[]}
        facebookAds={mockFacebookAds}
        showPlatform="all"
      />
    );

    // Should render Facebook campaigns
    expect(screen.getByText('Test Campaign 1')).toBeInTheDocument();
    expect(screen.getByText('Test Campaign 2')).toBeInTheDocument();
    
    // Should not render any traditional campaigns
    expect(screen.queryByText('Shopee Campaign')).not.toBeInTheDocument();
  });
});