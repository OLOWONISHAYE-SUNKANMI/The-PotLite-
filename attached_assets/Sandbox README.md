
# The Pot – Sandbox MVP

**The Pot** is a social group savings app built for real people with real goals. This MVP (Minimum Viable Product) simulates the full experience of pooling money, voting on withdrawals, and distributing funds—without using real transactions.

This version is a **sandbox demo**, perfect for testing, showcasing, and gathering feedback.

---

## 🪙 Core Features in This MVP

- Create and join shared savings Pots
- Define savings goals and payout types (one-to-many, many-to-one, many-to-selected)
- Choose from 3 withdrawal rules:  
  - **Democratic Vote**  
  - **Admin Approval**  
  - **Timed Release**
- Simulated deposits using dummy coins
- Real-time transaction log
- In-app feedback form for testers
- Admin panel to simulate user roles and errors
- Fully responsive UI with branded color palette

---

## 🛠 Tech Stack

- React (JSX)
- Context API for global state
- LocalStorage for transaction persistence
- React Router for page navigation
- CSS-in-JS + custom brand theme

---

## 📁 Folder Structure

src/
  pages/
    CreatePot.jsx
    PotDashboard.jsx
    FeedbackForm.jsx
  components/
    DepositSim.jsx
    VotingUI.jsx
    TransactionLog.jsx
    TimedRelease.jsx
    AdminPanel.jsx
  context/
    PotContext.js
    DummyUserContext.js
  styles/
    theme.js
  App.js
  AppRoutes.js
db/
  pots.json
  VoteLog.json

---

## 🚀 How to Run This MVP

1. Clone or import the repo into [Replit](https://replit.com/)
2. Install dependencies (`npm install` if needed)
3. Start the dev server (`npm start`)
4. Navigate through the app:
   - `/` → Create a Pot
   - `/dashboard` → View Pot
   - `/transactions` → Log of deposits/withdrawals
   - `/feedback` → Submit feedback
   - `/admin` → Simulate errors/roles

---

## ✅ Ideal For:

- Testing group saving mechanics without real money
- Collecting early-stage feedback
- Demonstrating withdrawal fairness logic to investors
- Pitching the concept at hackathons, classrooms, or VC demo days

---

## ✨ Want to Help?

To contribute, test, or invest in **The Pot**, reach out to the founder:
**[Your Name Here]**  
Email: your@email.com  
Instagram: @yourhandle

---

## License

This MVP is a private prototype. All rights reserved by **The Pot**.
