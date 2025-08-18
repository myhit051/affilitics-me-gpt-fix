# Requirements Document

## Introduction

This feature enhances the existing Ad Planning functionality to support multiple goal selection with individual target inputs. Users will be able to select multiple advertising goals simultaneously (Revenue, Orders, Clicks) and set specific targets for each selected goal. The system will calculate and display results for all selected goals, providing comprehensive ad planning insights.

## Requirements

### Requirement 1

**User Story:** As a marketing manager, I want to select multiple advertising goals simultaneously, so that I can plan campaigns with multiple objectives.

#### Acceptance Criteria

1. WHEN the user accesses the Ad Planning section THEN the system SHALL display checkboxes for each available goal type (Revenue, Orders, Clicks)
2. WHEN the user selects multiple goal checkboxes THEN the system SHALL allow multiple goals to be active simultaneously
3. IF a goal checkbox is unchecked THEN the system SHALL remove that goal from the planning calculation
4. WHEN at least one goal is selected THEN the system SHALL enable the planning calculation functionality

### Requirement 2

**User Story:** As a marketing manager, I want to set individual target values for each selected goal, so that I can customize my campaign objectives.

#### Acceptance Criteria

1. WHEN a goal checkbox is checked THEN the system SHALL display an input field for that specific goal's target value
2. WHEN a goal checkbox is unchecked THEN the system SHALL hide the input field for that goal
3. WHEN the user enters a target value THEN the system SHALL validate that the input is a positive number
4. IF an invalid target value is entered THEN the system SHALL display an error message and prevent calculation
5. WHEN all selected goals have valid target values THEN the system SHALL enable the "Calculate" button

### Requirement 3

**User Story:** As a marketing manager, I want to include "Clicks" as a goal option based on Facebook Ads Link Click data, so that I can plan campaigns focused on traffic generation.

#### Acceptance Criteria

1. WHEN the system displays goal options THEN it SHALL include "จำนวนคลิก" (Clicks) as a selectable goal
2. WHEN "Clicks" goal is selected THEN the system SHALL use Facebook Ads "Link Click" data for calculations
3. WHEN calculating click-based recommendations THEN the system SHALL analyze historical Link Click performance from Facebook data
4. IF Facebook data is not available THEN the system SHALL display an appropriate message for click-based calculations

### Requirement 4

**User Story:** As a marketing manager, I want to see planning results for all my selected goals, so that I can make informed decisions about my multi-objective campaigns.

#### Acceptance Criteria

1. WHEN the user clicks "Calculate" with multiple goals selected THEN the system SHALL display results for each selected goal
2. WHEN displaying results THEN the system SHALL show separate sections for each goal type (Revenue, Orders, Clicks)
3. WHEN showing Sub ID recommendations THEN the system SHALL display recommendations relevant to each selected goal
4. WHEN calculating budget allocation THEN the system SHALL consider all selected goals in the recommendation logic
5. IF calculation fails for any goal THEN the system SHALL display specific error messages for each failed goal while showing successful results for others

### Requirement 5

**User Story:** As a marketing manager, I want the system to maintain my goal selections and target values during my session, so that I can easily modify and recalculate without re-entering all information.

#### Acceptance Criteria

1. WHEN the user selects goals and enters target values THEN the system SHALL preserve these selections during the session
2. WHEN the user modifies a target value THEN the system SHALL update only that specific goal's calculation
3. WHEN the user adds or removes a goal selection THEN the system SHALL maintain other goal selections and their target values
4. WHEN the user navigates away and returns to Ad Planning THEN the system SHALL clear all previous selections and start fresh

### Requirement 6

**User Story:** As a marketing manager, I want clear visual distinction between different goal types in the results, so that I can easily interpret multi-goal planning outcomes.

#### Acceptance Criteria

1. WHEN displaying results for multiple goals THEN the system SHALL use distinct visual styling for each goal type
2. WHEN showing Revenue goals THEN the system SHALL use green color theming
3. WHEN showing Order goals THEN the system SHALL use blue color theming  
4. WHEN showing Click goals THEN the system SHALL use orange color theming
5. WHEN displaying Sub ID recommendations THEN the system SHALL group recommendations by goal type with clear headers

### Requirement 7

**User Story:** As a marketing manager, I want the system to automatically generate additional "NEW for xxx" Sub ID entries when maximum budget per Sub ID is reached but targets haven't been met, so that I can achieve my campaign goals without manual intervention.

#### Acceptance Criteria

1. WHEN a Sub ID reaches its maximum budget ceiling (งบยิงแอดสูงสุด ต่อ Sub ID) THEN the system SHALL mark it as eligible for additional "NEW for xxx" entries
2. WHEN the current Sub ID recommendations cannot achieve the target goals THEN the system SHALL automatically generate "NEW for xxx" entries using the performance data from the original Sub ID
3. WHEN generating "NEW for xxx" entries THEN the system SHALL continue creating them iteratively until either:
   - All target goals are achieved (within 90% threshold), OR
   - The total budget allocation becomes unreasonably high (10x the original target budget), OR
   - A maximum of 20 additional "NEW for xxx" entries per original Sub ID is reached
4. WHEN creating "NEW for xxx" entries THEN the system SHALL use the exact same performance ratios as the original Sub ID for accurate projections
5. WHEN displaying "NEW for xxx" entries THEN the system SHALL clearly indicate them with yellow text color and show which original Sub ID they are based on
6. WHEN calculating final results THEN the system SHALL include all "NEW for xxx" entries in the total budget and expected outcomes

### Requirement 8

**User Story:** As a marketing manager, I want the system to allocate only the budget needed to achieve my goals without exceeding them unnecessarily, so that I can optimize my ad spend efficiently.

#### Acceptance Criteria

1. WHEN calculating Sub ID budgets THEN the system SHALL allocate only the minimum budget required to achieve the selected goals
2. WHEN goals are achieved THEN the system SHALL stop allocating additional budget to prevent overspending
3. WHEN a Sub ID reaches its maximum budget ceiling (งบยิงแอดสูงสุด ต่อ Sub ID) THEN the system SHALL create "NEW for xxx" entries only if needed to achieve remaining goals
4. WHEN no maximum limit is set (value = 0) THEN the system SHALL calculate optimal budgets without per-Sub ID constraints
5. WHEN displaying budget recommendations THEN the system SHALL show precise budget amounts that achieve goals without significant overshoot
6. WHEN the UI displays the maximum budget field THEN it SHALL include helper text explaining that this is a ceiling limit for budget optimization

### Requirement 9

**User Story:** As a marketing manager, I want the system to use an optimization algorithm that minimizes budget while maximizing ROI to achieve my goals, so that I get the most efficient ad spend allocation.

#### Acceptance Criteria

1. WHEN calculating budget allocation THEN the system SHALL use an optimization algorithm that prioritizes Sub IDs with the highest efficiency scores
2. WHEN calculating efficiency scores THEN the system SHALL consider both contribution to remaining goals and historical ROI performance
3. WHEN allocating budget THEN the system SHALL incrementally add budget to the most efficient Sub IDs until goals are achieved
4. WHEN a Sub ID reaches its maximum budget ceiling THEN the system SHALL create "NEW for xxx" entries only if they remain efficient for achieving remaining goals
5. WHEN multiple goals are selected THEN the system SHALL weight efficiency based on how much each goal still needs to be achieved
6. WHEN goals are achieved THEN the system SHALL stop allocating additional budget to prevent overspending

### Requirement 10

**User Story:** As a marketing manager, I want the goal results to accurately reflect the sum of all Sub ID recommendations, so that I can see exactly how my targets will be met.

#### Acceptance Criteria

1. WHEN displaying goal results THEN the system SHALL show the actual sum of expected values from all Sub ID recommendations
2. WHEN the "Order SP" goal is selected THEN the expected value SHALL equal the sum of all Sub IDs' expectedOrderSP values
3. WHEN the "Amount LZD" goal is selected THEN the expected value SHALL equal the sum of all Sub IDs' expectedAmountLZD values
4. WHEN the "Total Com" goal is selected THEN the expected value SHALL equal the sum of all Sub IDs' expectedTotalCom values
5. WHEN the "Profit" goal is selected THEN the expected value SHALL equal the sum of all Sub IDs' expectedProfit values
6. WHEN the "Link Clicks" goal is selected THEN the expected value SHALL equal the sum of all Sub IDs' expectedLinkClicks values
7. WHEN goals are achieved THEN the system SHALL mark them as achievable with a 95% threshold for accuracy