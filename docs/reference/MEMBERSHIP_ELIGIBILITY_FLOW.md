# Membership Eligibility Decision Flow

Streamlined sequential eligibility questionnaire to determine which ONE membership level an applicant qualifies for. Every applicant is assigned exactly one category: Full, Associate, Affiliate, Diplomatic, Community, or Temporary (subset of Full).

**Design Principle:** Each yes/no question filters the applicant to their assigned level. Applicants see only their eligible category on the application page.

---

## ASCII Flowchart (Sequential Questions)

```
START: MEMBERSHIP ELIGIBILITY SCREENING
│
├─ QUESTION 1: Are you a U.S. Direct-Hire employee of the
│  United States Government? (This includes Department of State
│  and other USG departments and agencies)
│
├─ YES → Continue to Question 1b
│ │
│ └─ QUESTION 1b: Are you in Botswana on temporary duty or
│    as an official visitor?
│    │
│    ├─ YES → TEMPORARY MEMBERSHIP ✓
│    │        (Only for those who qualify for Full)
│    │
│    └─ NO → FULL MEMBERSHIP ✓
│
│
└─ NO → Continue to Question 2
│
│
├─ QUESTION 2: Are you a direct employee of the U.S. Embassy
│  in Gaborone (whether State, CDC, etc.) BUT were recruited
│  from OUTSIDE of Botswana?
│
│  OR
│
│  Are you a U.S. citizen employed by a USG-funded contractor
│  OR implementing USG-funded programs?
│
├─ YES → ASSOCIATE MEMBERSHIP ✓
│
│
└─ NO → Continue to Question 3
│
│
├─ QUESTION 3: Are you a direct employee of the U.S. Embassy
│  in Gaborone (whether State, CDC, etc.) and were recruited
│  IN Botswana?
│
├─ YES → AFFILIATE MEMBERSHIP ✓
│
│
└─ NO → Continue to Question 4
│
│
├─ QUESTION 4: Are you a registered diplomat of another
│  diplomatic or international-organization mission in Botswana?
│
├─ YES → DIPLOMATIC MEMBERSHIP ✓
│
│
└─ NO → COMMUNITY MEMBERSHIP ✓


═══════════════════════════════════════════════════════════
FINAL STEP: Household Type (for all levels)
═══════════════════════════════════════════════════════════

After determining membership category, ask:

QUESTION: Is this an individual or family membership?

├─ Individual → Assign {category}_indiv
└─ Family → Assign {category}_family

(Note: Temporary membership is individual only)

═══════════════════════════════════════════════════════════
OUTCOME: One assigned membership level
═══════════════════════════════════════════════════════════

Examples:
- USG Direct-Hire on permanent assignment → full_indiv or full_family
- USG Direct-Hire on temporary duty → temporary
- Embassy employee recruited from Nairobi → associate_indiv or associate_family
- US citizen contractor for USAID → associate_indiv or associate_family
- Embassy employee hired locally in Botswana → affiliate_indiv or affiliate_family
- Diplomat from French Embassy → diplomatic_indiv or diplomatic_family
- Local Botswana national, no government affiliation → community_indiv or community_family
```

---

## Decision Questions (Detailed)

### Question 1: USG Direct-Hire Status
**Question:** Are you a U.S. Direct-Hire employee of the United States Government? This includes Department of State and other USG departments and agencies.

**Clarification Notes:**
- Includes direct federal employees of any USG agency (State Department, USAID, USIA, DOD, etc.)
- Does NOT include contractors, implementers of USG programs, or locally hired embassy staff
- Direct-hire means you are a permanent or long-term USG employee (not temporary or visiting)

**Outcome if YES → Continue to Question 1b (Temporary duty status)**

**Outcome if NO → Continue to Question 2**

---

### Question 1b: Temporary Duty Status (USG Direct-Hires Only)
**Question:** Are you in Botswana on temporary duty or as an official visitor?

**Clarification Notes:**
- Temporary duty (TDY) = short-term assignment, typically 6 months or less
- Official visitor = official USG visitor on authorized mission
- Permanent assignment = you are assigned to the Botswana mission as your duty station

**Outcomes:**
- YES (on temporary duty/official visitor) → **TEMPORARY MEMBERSHIP** (6-month maximum)
- NO (permanent assignment) → **FULL MEMBERSHIP**

---

### Question 2: USG-Affiliated Employment (Non-Direct-Hire)
**Question:** Are you a direct employee of the U.S. Embassy in Gaborone (whether State, CDC, etc.) but were recruited from OUTSIDE of Botswana? OR Are you a U.S. citizen employed by a USG-funded contractor OR implementing USG-funded programs?

**Clarification Notes:**
- Embassy staff recruited from outside = TCN or US citizen hired from abroad for embassy position (not local hire)
- USG-funded contractor = private company with active USG contracts
- USG-funded programs = NGOs, think tanks, universities, implementing programs with US government grants
- This question applies to non-direct-hire employees with USG ties

**Outcome if YES → ASSOCIATE MEMBERSHIP**

**Outcome if NO → Continue to Question 3**

---

### Question 3: Embassy Local Hire Status
**Question:** Are you a direct employee of the U.S. Embassy in Gaborone (whether State, CDC, etc.) and were recruited IN Botswana?

**Clarification Notes:**
- Includes both HCN (host country nationals) and TCN hired locally in Botswana
- Embassy staff = Foreign Service Nationals (FSN), locally hired contractors, or other local-hire positions
- Does NOT include those recruited from outside (they answered YES to Q2)

**Outcome if YES → AFFILIATE MEMBERSHIP**

**Outcome if NO → Continue to Question 4**

---

### Question 4: Diplomatic Status
**Question:** Are you a registered diplomat of another diplomatic or international-organization mission in Botswana?

**Clarification Notes:**
- Registered diplomat = holds diplomatic passport and is accredited to a diplomatic mission (embassy, consulate)
- International organizations = UN agencies, African Union, SADC, World Bank, etc. based in Botswana
- Must have official diplomatic or international organization status in Botswana

**Outcome if YES → DIPLOMATIC MEMBERSHIP**

**Outcome if NO → COMMUNITY MEMBERSHIP**

---

## Household Type Determination

**After determining membership category**, ask:

**Question:** Will this be an individual or family membership?

**Individual:** Just you
**Family:** You + spouse/partner and/or dependent children

**Note:** This determines whether to assign:
- `{category}_indiv` (individual level)
- `{category}_family` (family level)

---

## Decision Matrix (Summary)

| Question Path | Answer Sequence | Assigned Level | Household Type |
|---------------|-----------------|-----------------|-----------------|
| Q1 → Q1b | YES, YES | **Temporary** | Individual only (6mo max) |
| Q1 → Q1b | YES, NO | **Full** | full_indiv or full_family |
| Q1 → Q2 → ... | NO, YES | **Associate** | associate_indiv or associate_family |
| Q1 → Q2 → Q3 | NO, NO, YES | **Affiliate** | affiliate_indiv or affiliate_family |
| Q1 → Q2 → Q3 → Q4 | NO, NO, NO, YES | **Diplomatic** | diplomatic_indiv or diplomatic_family |
| Q1 → Q2 → Q3 → Q4 | NO, NO, NO, NO | **Community** | community_indiv or community_family |

---

## Application Function Pseudocode

```javascript
function determineEligibilityLevel(applicant) {
  // applicant object contains YES/NO answers to screening questions
  // Returns: { assignedLevel: 'category', householdOptions: ['indiv', 'family'] or ['indiv'] }

  // Q1: USG Direct-Hire?
  if (applicant.isUSGDirectHire === true) {
    // Q1b: Temporary duty or official visitor?
    if (applicant.isTemporaryDutyOrVisitor === true) {
      return {
        assignedLevel: 'temporary',
        householdOptions: ['indiv'],
        requiresProofOf: 'USG employment'
      };
    } else {
      return {
        assignedLevel: 'full',
        householdOptions: ['indiv', 'family'],
        requiresProofOf: 'USG employment'
      };
    }
  }

  // Q2: Embassy staff recruited from outside OR USG contractor/program?
  if (applicant.isEmbassyStaffFromOutside === true ||
      applicant.isUSGContractorOrProgram === true) {
    return {
      assignedLevel: 'associate',
      householdOptions: ['indiv', 'family'],
      requiresProofOf: 'Employment verification',
      requiresSponsor: true,
      sponsorMustBeFull: true
    };
  }

  // Q3: Embassy staff recruited locally in Botswana?
  if (applicant.isEmbassyStaffLocalHire === true) {
    return {
      assignedLevel: 'affiliate',
      householdOptions: ['indiv', 'family'],
      requiresProofOf: 'Embassy employment verification',
      requiresSponsor: true,
      sponsorMustBeFull: true
    };
  }

  // Q4: Registered diplomat?
  if (applicant.isRegisteredDiplomat === true) {
    return {
      assignedLevel: 'diplomatic',
      householdOptions: ['indiv', 'family'],
      requiresSponsor: true,
      sponsorMustBeFull: true
    };
  }

  // Default: Community
  return {
    assignedLevel: 'community',
    householdOptions: ['indiv', 'family'],
    requiresSponsor: true,
    sponsorMustBeFull: true
  };
}
```

---

## Flow Implementation Notes

### Single Assignment
1. Each applicant receives exactly ONE membership category (no choice of levels)
2. On the application page, show applicant their assigned level only (pre-filled, read-only)
3. Household type is the only choice: Individual or Family (except Temporary is individual-only)

### Documentation Requirements
1. **Full Membership:** Proof of USG Direct-Hire employment (not required unless GEA Board requests)
   - Examples: Embassy badge, SF-50 or offer letter, employee directory confirmation

2. **Associate Membership:** Proof of employment (not required unless GEA Board requests)
   - Embassy hire from outside: Employment contract or job letter
   - USG contractor: Contract verification or company letter
   - USG-funded program: Grant agreement or implementing letter

3. **Affiliate Membership:** Proof of embassy employment (not required unless GEA Board requests)
   - Embassy employment verification letter or staff roster
   - Local ID documentation

4. **Diplomatic Membership:** Full-member sponsor required (no documentation)
   - Sponsor must be a paid Full member

5. **Community Membership:** Full-member sponsor required (no documentation)
   - Sponsor must be a paid Full member

6. **Temporary Membership:** Proof of USG Direct-Hire status plus TDY documentation
   - TDY orders, assignment letter, or official visitor documentation

### Sponsor Requirements (UPDATED)
- **Full Membership:** NO sponsor required
- **Associate, Affiliate:** YES - sponsor must be a paid Full member
- **Diplomatic, Community:** YES - sponsor must be a paid Full member
- Sponsors must be active, paid members with voting rights (full_indiv or full_family)

### Currency and Dues Mechanism
- **USD Dues:** Canonical base fees (USD rates are authoritative)
  - Full: $50 indiv / $100 family
  - Associate: $50 indiv / $100 family
  - Affiliate: $50 indiv / $100 family
  - Diplomatic: $75 indiv / $150 family
  - Community: $75 indiv / $150 family
  - Temporary: $20 for period (max 6 months)

- **BWP Dues:** Subject to monthly exchange rate
  - Exchange rate mechanism: [TO BE CONFIGURED IN Config.js]
  - Current rates: [Monthly update mechanism TBD]
  - Applicants paying in BWP use current month's published rate

### Temporary Membership Constraints
- Only available to those who qualify as Full (Q1=YES, Q1b=YES)
- Maximum duration: 6 months
- Can be renewed if applicant remains on TDY/official visitor status
- Individual membership only (no family option)

---

**Last Updated:** February 22, 2026
**Version:** 2.0 - Sequential eligibility questions with single assignment
