
// FeatureChecklist.jsx - Main checklist walkthrough for The Pot Sandbox MVP

import React, { useState } from 'react';

const checklistItems = [
  { id: 1, label: 'Create a Pot and Invite Members', key: 'createPot' },
  { id: 2, label: 'Deposit into an Active Pot', key: 'depositPot' },
  { id: 3, label: 'Request a Withdrawal from an Active Pot', key: 'requestWithdraw' },
  { id: 4, label: 'Request a Goal Change in an Active Pot', key: 'goalChange' },
  { id: 5, label: 'Cast Your Vote on a Withdrawal Request', key: 'vote' },
];

const FeatureChecklist = ({ onComplete }) => {
  const [checked, setChecked] = useState({});

  const handleCheck = (key) => {
    const updated = { ...checked, [key]: true };
    setChecked(updated);

    // If all are completed, trigger onComplete
    if (Object.keys(updated).length === checklistItems.length &&
        Object.values(updated).every(v => v === true)) {
      onComplete();
    }
  };

  return (
    <div style={{ padding: '1.5rem', backgroundColor: '#FAF8FF', borderRadius: '12px' }}>
      <h2 style={{ color: '#5B1FA6' }}>📝 Sandbox Testing Checklist</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {checklistItems.map(item => (
          <li key={item.id} style={{ margin: '1rem 0' }}>
            <input
              type="checkbox"
              id={item.key}
              checked={!!checked[item.key]}
              onChange={() => handleCheck(item.key)}
            />
            <label htmlFor={item.key} style={{ marginLeft: '0.5rem' }}>
              {item.label}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FeatureChecklist;
