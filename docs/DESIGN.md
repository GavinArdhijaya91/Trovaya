# Trovaya Design Specification

This document summarizes Trovaya's UI/UX design principles and brand identity so that everyone
working on its visual experience can maintain consistency.

## 1. Brand Identity

**Name:** Trovaya, derived from the word "trove," meaning a collection of treasures or valuable
assets.

**Draft tagline:** "Trovaya, a verified funding platform for Indonesian MSMEs and creative works."

**Brand personality:** Trustworthy, clear, and understated. Trovaya is not a platform that promises
"quick profits." It communicates calmly and transparently because the product is built around trust
through verification.

## 2. Official Color Palette: "Modern Nusantara"

This palette reflects Trovaya's philosophy. Teal is the primary identity color and represents trust
and growth. Coral provides a warm accent that reflects local MSMEs and creative work. Warm neutrals
serve as the foundation so the experience does not feel as cold as a conventional financial
application.

### 2.1 Teal: Primary color for trust and growth

| Hex | Internal name | Usage |
| --- | --- | --- |
| `#085041` | Teal 900 | Primary logo color, primary button background, active navigation item |
| `#0F6E56` | Teal 700 | Primary button hover state, links |
| `#1D9E75` | Teal 500 | Positive chart indicators, verified-status icons |
| `#5DCAA5` | Teal 300 | Secondary icons, subtle decorative elements |
| `#9FE1CB` | Teal 200 | Teal badge borders and outlines |
| `#E1F5EE` | Teal 50 | Verified badge background, card and table hover states |

### 2.2 Coral: Warm accent for MSMEs and creative work

| Hex | Internal name | Usage |
| --- | --- | --- |
| `#4A1B0C` | Coral 900 | Text on light coral backgrounds |
| `#D85A30` | Coral 600 | Creative Work category badge |
| `#F0997B` | Coral 400 | Creative-asset chart elements |
| `#F5C4B3` | Coral 200 | Coral badge borders and outlines |
| `#FAECE7` | Coral 50 | Creative-work badge and card backgrounds |

### 2.3 Warm neutrals: Backgrounds and text

| Hex | Internal name | Usage |
| --- | --- | --- |
| `#2C2C2A` | Gray 900 | Primary text |
| `#5F5E5A` | Gray 600 | Secondary text |
| `#888780` | Gray 400 | Placeholders and disabled text |
| `#D3D1C7` | Gray 100 | Default subtle borders |
| `#B4B2A9` | Gray 200 | Stronger borders |
| `#F1EFE8` | Gray 50 | Page background |
| `#FFFFFF` | White | Card background |

### 2.4 Additional functional colors

- `#E24B4A` (muted red): Reserved for negative chart indicators.
- `#EF9F27` (amber): Reserved for badges or labels identifying AI-generated content.

## 3. Color Application Across the UI

| UI element | Color application |
| --- | --- |
| Page background | Gray 50 (`#F1EFE8`) |
| Card background | White (`#FFFFFF`) with Gray 100 (`#D3D1C7`) border |
| Primary button | Teal 900 (`#085041`), Teal 700 (`#0F6E56`) on hover |
| Secondary button | Gray 200 (`#B4B2A9`) border with Gray 900 text |
| Heading and body text | Gray 900 (`#2C2C2A`) |
| Secondary text | Gray 600 (`#5F5E5A`) |
| Form placeholder | Gray 400 (`#888780`) |
| Input and table border | Gray 100, changing to Teal 500 (`#1D9E75`) on focus |
| Link | Teal 700 (`#0F6E56`) |
| Verified badge | Teal 50 background with Teal 900 text |
| Creative Work badge | Coral 50 background with Coral 900 text |
| AI-content badge | Amber accent (`#EF9F27`) |
| Positive or MSME chart movement | Teal 500 (`#1D9E75`) |
| Negative chart movement | Muted red (`#E24B4A`) |
| Creative-asset chart | Coral 400 (`#F0997B`) |
| Active navigation icon | Teal 900 |
| Inactive navigation icon | Gray 400 |

## 4. Padding and Spacing

Padding controls space, not color. Maintain a consistent scale, such as 16px between cards and
16px to 20px of internal card padding.

## 5. General Visual Language

Use familiar patterns from investment and banking applications. Avoid crypto-native aesthetics.
Typography should remain clean and should not use decorative fonts.

## 6. Dashboard Information Hierarchy

The total portfolio value should be the most prominent element, followed by the trend chart. Asset
lists and AI insights should remain easy to find without becoming intrusive.

## 7. AI Disclaimer Consistency

Every AI-generated output must use the same visual badge so users understand that it is educational
content rather than financial, investment, or legal advice.

## 8. Accessible Terminology

Place a "What does this mean?" control next to technical Web3 terminology.

## 9. Mobile First

The core journey must remain concise and usable on small screens.

## 10. Watermarks and Simulated Data Labels

Every mock KYC element must carry a clearly visible `SAMPLE` watermark.

## 11. Core Screens to Design

- Landing and onboarding
- Passwordless OTP login with wallet-safety guidance
- Mock KYC
- Portfolio dashboard
- Marketplace
- Asset details
- Transaction history
- Profile settings
- Educational content

## 12. UI Tone of Voice

Use a warm but professional tone. Avoid language that promises or implies guaranteed profits.
