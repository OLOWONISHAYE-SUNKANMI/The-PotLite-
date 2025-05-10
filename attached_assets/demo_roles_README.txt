
# 🧾 How to Integrate VoterDemo & RecipientDemo into The Pot Sandbox MVP

This guide explains how to use the two demo components:
- VoterDemo.jsx
- RecipientDemo.jsx

These simulate user interactions for non-admin roles in your sandbox environment.

---

## 🛠 Files Included
- `VoterDemo.jsx`: Simulates what it's like to vote on a withdrawal request.
- `RecipientDemo.jsx`: Simulates limited access for a user who receives payouts but cannot approve or vote.

---

## 🔁 Step-by-Step Integration

### 1. Add Files to Components Directory
Place both files inside your `components/` or `pages/` folder depending on your project structure.

### 2. Add Routes to `AppRoutes.js` or `App.js`

```jsx
import VoterDemo from './components/VoterDemo';
import RecipientDemo from './components/RecipientDemo';

<Route path="/voter-demo" element={<VoterDemo />} />
<Route path="/recipient-demo" element={<RecipientDemo />} />
```

---

### 3. Update AdminPanel.jsx

Under the "Simulate Your Role" section of the AdminPanel, add:

```jsx
<button onClick={() => navigate('/voter-demo')}>🗳️ Voter Role</button>
<button onClick={() => navigate('/recipient-demo')}>🎁 Recipient Role</button>
```

Make sure you have access to `useNavigate()` from `react-router-dom`.

---

## 🧪 Optional:
You can mock the roles via context to simulate session states if you'd like these interfaces to evolve from actual Pot or user data later.

These pages are sandbox-only, using hardcoded logic or dummy context.

---

Ready to use and fully compatible with your existing Pot sandbox flow.
