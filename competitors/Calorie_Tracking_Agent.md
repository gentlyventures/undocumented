# Competitor Profile: Calorie Tracking Agent

## 1. Project Information
- **Testing Access**: [Telegram Bot @CalorieBuddyAI_Bot](https://t.me/CalorieBuddyAI_Bot)
- **Demo Video**: [YouTube](https://youtu.be/JnZeqM1kRMw)
- **Code Repository**: [Google Drive ZIP](https://drive.google.com/file/d/1WulnFEYSEBTqHrMhpsl1pfUPI_Uy1vmG/view?usp=drive_link)
- **Architecture Diagram**: [Google Drive Link](https://drive.google.com/file/d/1GNcX8Ox_PkrOcUMC_xsthhrAl-LmeMfk/view?usp=sharing)

---

## 2. Problem Statement
- Most calorie trackers are high-friction, requiring manual database searches, portion input, switching screens, and separate entry for workouts.
- Context switching between apps leads to inconsistent tracking behavior.

---

## 3. Technical Architecture & Google Cloud Integration
- **Platform**: Conversational bot built on the Telegram API.
- **Features**:
  - Conversational interface for meal and fitness entries.
  - Multi-modal support: handles food photos (identifies items & portions) and workout summary images.
  - Speech-to-text: voice note transcription processed similarly to text food logs.
  - Dynamic user profiling: onboarding guides macro/calorie target calculation.
  - Visual summaries: generates image cards showing daily, weekly, and monthly nutrition progress.
  - Trend generation: produces weight journey charts from historical weigh-ins.
- **Safety Boundaries**: Action confirmations required for logs/deletions, preventing accidental state changes.
- **Admin Operations**: Sends onboarding alerts and user feedback text to an admin Telegram channel.

---

## 4. Business Case & ROI
- Reduces meal-logging friction.
- Eliminates manual app-hopping and calorie calculations.
- Promotes engagement through visual image status reports.
