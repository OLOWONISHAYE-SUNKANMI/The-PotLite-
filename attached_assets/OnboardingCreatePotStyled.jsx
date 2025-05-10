
// OnboardingCreatePot.jsx - Styled version using The Pot branding

import React, { useState } from 'react';

const styles = {
  container: {
    backgroundColor: '#FAF8FF',
    padding: '2rem',
    borderRadius: '16px',
    maxWidth: '600px',
    margin: '2rem auto',
    boxShadow: '0 0 20px rgba(91, 31, 166, 0.15)',
    fontFamily: 'Poppins, sans-serif',
    color: '#3D0F6C',
  },
  title: {
    color: '#5B1FA6',
    fontSize: '1.8rem',
    marginBottom: '1rem',
  },
  label: {
    fontWeight: 600,
    marginTop: '1rem',
    display: 'block',
  },
  input: {
    padding: '0.6rem 1rem',
    marginTop: '0.5rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    width: '100%',
    fontSize: '1rem',
  },
  buttonRow: {
    marginTop: '2rem',
    display: 'flex',
    gap: '1rem',
  },
  button: {
    background: 'linear-gradient(to right, #8E2DE2, #4A00E0)',
    border: 'none',
    padding: '0.7rem 1.5rem',
    color: 'white',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 600,
  },
};

const OnboardingCreatePot = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [potData, setPotData] = useState({
    title: '',
    description: '',
    members: '',
    payoutMethod: '',
    withdrawalMethod: '',
  });

  const handleChange = (field, value) => {
    setPotData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    const savedPot = {
      ...potData,
      members: potData.members.split(',').map(m => m.trim()),
      id: Date.now().toString(),
    };
    const savedPots = JSON.parse(localStorage.getItem('pots')) || [];
    localStorage.setItem('pots', JSON.stringify([...savedPots, savedPot]));
    localStorage.setItem('hasSeenOnboarding', 'true');
    onComplete(savedPot);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🎉 Let’s Create Your First Pot</h2>

      {step === 0 && (
        <>
          <label style={styles.label}>Pot Title</label>
          <input style={styles.input} value={potData.title} onChange={e => handleChange('title', e.target.value)} />
          <label style={styles.label}>Description</label>
          <textarea style={styles.input} rows="3" value={potData.description} onChange={e => handleChange('description', e.target.value)} />
        </>
      )}

      {step === 1 && (
        <>
          <label style={styles.label}>Invite Members (comma-separated)</label>
          <input style={styles.input} value={potData.members} onChange={e => handleChange('members', e.target.value)} />
        </>
      )}

      {step === 2 && (
        <>
          <label style={styles.label}>Payout Method</label>
          <select style={styles.input} value={potData.payoutMethod} onChange={e => handleChange('payoutMethod', e.target.value)}>
            <option value="">Select</option>
            <option value="many-to-one">Many-to-One</option>
            <option value="one-to-many">One-to-Many</option>
            <option value="many-to-selected">Many-to-Selected</option>
          </select>
        </>
      )}

      {step === 3 && (
        <>
          <label style={styles.label}>Withdrawal Method</label>
          <select style={styles.input} value={potData.withdrawalMethod} onChange={e => handleChange('withdrawalMethod', e.target.value)}>
            <option value="">Select</option>
            <option value="vote">Democratic Vote</option>
            <option value="admin">Admin Approval</option>
            <option value="timed">Timed Release</option>
          </select>
        </>
      )}

      <div style={styles.buttonRow}>
        {step > 0 && <button style={styles.button} onClick={() => setStep(step - 1)}>⬅ Back</button>}
        {step < 3 && <button style={styles.button} onClick={() => setStep(step + 1)}>Next ➡</button>}
        {step === 3 && <button style={styles.button} onClick={handleSubmit}>Create Pot ✅</button>}
      </div>
    </div>
  );
};

export default OnboardingCreatePot;
