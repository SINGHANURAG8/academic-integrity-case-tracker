# FindIt — AI-Powered Visual Lost & Found System

**Track:** Campus Life & Student Experience  
**Hackathon:** CODE FLUX, Lovely Professional University — Sept 11–13, 2026  
**Status:** 100% Operational Hackathon MVP Prototype  
**Live Local URL:** [http://localhost:8080](http://localhost:8080)

---

## 1. Executive Summary & Core Insight

Lovely Professional University houses over 30,000 students across a sprawling, high-density campus. Conventional text-based groups (WhatsApp, Telegram, physical noticeboards) fail because:
- People describe items subjectively and inconsistently.
- Manual searches take hours or days.
- Over 70% of lost items are visually distinctive (ID cards, AirPods cases, chargers, bottles, keys).

**FindIt closes this loop in seconds.** A student simply snaps or uploads a photo. The system extracts a normalized high-dimensional visual feature embedding, runs cosine similarity search over stored opposite-type campus items, and surfaces matches with confidence percentages and visual reasons before you even submit.

---

## 2. Key Features Implemented

| PRD Requirement | Feature Implemented | Implementation Detail |
|---|---|---|
| **Report Flow** | Lost & Found wizard with photo upload / drag-drop & preset sample picker | Dynamic image handling (base64 & local files), LPU campus location dropdowns, and room/spot tags. |
| **Instant Pre-Scan** | Real-time match alert before submitting | Scans database on photo selection and displays instant match notifications. |
| **Visual Matching Engine** | 192-dimensional multi-modal visual embeddings | Evaluates spatial block intensity, HSV color histograms, edge & contour moments, combined with category and campus zone bonuses. |
| **Side-by-Side Review UI** | Split-screen comparative review modal | Side-by-side comparison with confidence meter (e.g. 99%), visual feature breakdown, and confirmation triggers. |
| **Secure Contact Reveal** | One-click WhatsApp chat & verified claim tokens | Generates official `FINDIT-LPU-...` claim tokens, auto-fills WhatsApp messages, and provides campus safe-drop recommendations. |
| **Browse & Filter Fallback** | Multi-factor campus catalog | Real-time filtering by status (Lost / Found / Reunited), campus location (Library, UniMall, Blocks 34/36/38, Hostels), and categories. |
| **Campus Loss Heatmap (Stretch Goal)** | Spatial campus intelligence & loss density map | Interactive campus map highlighting high-density loss zones (Library, UniMall, CS Lab) and statistical ranking. |
| **Security Desk Admin Portal (Stretch Goal)** | Custody log & unclaimed items table | Enables campus security officers to manage physical custody and export custody logs to `.CSV`. |
| **Judge Demo Showcase Bar** | 1-click live pitch presets | Instant scenario triggers on stage (Lost ID Card, AirPods, Dell Charger, Milton Bottle) with zero network dependency. |

---

## 3. Quick Start & Demo Instructions

### Starting the Application
```bash
# Server runs on port 8080 by default:
python server.py 8080
```
Open your browser at: **`http://localhost:8080`**

### Live Pitch Walkthrough for Judges (Under 2 Minutes)
1. Open `http://localhost:8080`.
2. Notice the top **"⚡ Judge Demo Presets"** banner.
3. Click **"Demo #1: Lost LPU Student ID Card"**:
   - The system automatically simulates a student posting a lost ID card on stage.
   - Within milliseconds, FindIt displays a **99% Match Confidence** popup matching the ID card found earlier at the Central Library turnstiles.
   - The side-by-side comparison highlights the matching photo features, category, and campus zone.
4. Click **"✅ 'This is It!' - Confirm Match"**:
   - Generates official Claim Token `FINDIT-LPU-...`.
   - Reveals the finder's contact details, one-click WhatsApp chat button, and the safe campus handoff point (Library Reception).
5. Switch to the **"Campus Heatmap"** tab to demonstrate spatial analytics and loss density across LPU buildings.
6. Switch to the **"Security Desk"** tab to demonstrate the administrative custody registry and CSV export for campus officers.

---

## 4. Architecture & Technical Stack

```
prd/
├── matcher.py             # 192-dimensional visual feature extractor & cosine similarity engine
├── db.py                  # SQLite storage layer with indexing and vector similarity ranking
├── seed_data.py           # Synthetic visual asset generator & demo database seeder
├── server.py              # Multi-threaded HTTP server & REST API
├── test_matcher.py        # Automated test suite for visual similarity matching
├── test_e2e.py            # Complete end-to-end integration test suite
├── static/
│   ├── index.html         # Responsive, modern web interface (HTML5)
│   ├── styles.css         # Custom design system tailored to LPU (Plus Jakarta Sans)
│   ├── app.js             # Client-side reactivity, match reviewer, drag-and-drop
│   ├── uploads/           # Uploaded item photos and seeded campus assets
│   └── demo_presets/      # Judge demo scenario presets & metadata
```

---

## 5. Automated Verification Results

All unit and integration tests passed:
- `test_matcher.py`: 4/4 demo scenarios scored **>95% confidence** matching their corresponding opposite-type item.
- `test_e2e.py`: **10/10 tests passed** covering REST endpoints, on-the-fly pre-scan matching, item creation, claim token verification, analytics calculations, and static file serving.
