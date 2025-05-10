
// ErrorSimulationHandler.jsx - Styled version with emojis and branded buttons

import React, { useState, useEffect } from 'react';

const styles = {
  container: {
    background: '#FAF8FF',
    borderRadius: '16px',
    padding: '1.5rem',
    marginTop: '2rem',
    fontFamily: 'Poppins, sans-serif',
    boxShadow: '0 0 12px rgba(91, 31, 166, 0.1)',
  },
  heading: {
    color: '#5B1FA6',
    fontSize: '1.2rem',
    marginBottom: '1rem',
  },
  button: {
    background: 'linear-gradient(to right, #8E2DE2, #4A00E0)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '0.6rem 1rem',
    cursor: 'pointer',
    fontWeight: 600,
    marginRight: '1rem',
    marginBottom: '0.5rem',
  },
  messageBox: {
    marginTop: '1.5rem',
    padding: '1rem',
    borderRadius: '12px',
    fontWeight: 500,
    fontSize: '1rem',
  },
};

const ErrorSimulationHandler = () => {
  const [activeError, setActiveError] = useState(null);

  const triggerError = (type) => {
    setActiveError(type);
    setTimeout(() => setActiveError(null), 4000); // auto reset after 4 seconds
  };

  useEffect(() => {
    if (activeError) {
      console.log(`Simulating error: ${activeError}`);
    }
  }, [activeError]);

  const renderMessage = () => {
    switch (activeError) {
      case 'deposit':
        return <div style={{ ...styles.messageBox, backgroundColor: '#FFEBEB', color: '#FF6E6E' }}>❌ Deposit Failed: Insufficient balance or network issue.</div>;
      case 'withdrawal':
        return <div style={{ ...styles.messageBox, backgroundColor: '#FFEFD4', color: '#D17F00' }}>🚫 Withdrawal Rejected: Not approved by Admin or Vote failed.</div>;
      case 'timelock':
        return <div style={{ ...styles.messageBox, backgroundColor: '#E6E9FF', color: '#5B1FA6' }}>⏳ Time Lock Active: Withdrawal will be available soon.</div>;
      case 'recipient':
        return <div style={{ ...styles.messageBox, backgroundColor: '#FFF2E5', color: '#C75A00' }}>⚠️ Invalid Recipient: User not eligible for payout from this Pot.</div>;
      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>🧪 Simulate Common Errors</h3>

      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        <button style={styles.button} onClick={() => triggerError('deposit')}>💸 Deposit Failure</button>
        <button style={styles.button} onClick={() => triggerError('withdrawal')}>🚫 Withdrawal Rejection</button>
        <button style={styles.button} onClick={() => triggerError('timelock')}>⏳ Time Lock Error</button>
        <button style={styles.button} onClick={() => triggerError('recipient')}>⚠️ Invalid Recipient</button>
      </div>

      {renderMessage()}
    </div>
  );
};

export default ErrorSimulationHandler;
