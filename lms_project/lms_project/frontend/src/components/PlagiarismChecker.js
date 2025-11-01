import React, { useState } from 'react';
import axios from 'axios';
import config from '../config';
import sessionManager from '../sessionManager';
import './PlagiarismChecker.css';

const PlagiarismChecker = ({ assignmentId, onResult, onClose }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  console.log('PlagiarismChecker component rendered with assignmentId:', assignmentId);

  const handleCheckPlagiarism = async () => {
    if (!text.trim()) {
      setError('Please enter text to check');
      return;
    }

    if (text.length < 80) {
      setError('Text must be at least 80 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const storedSession = sessionManager.getStoredSession();
      if (!storedSession) {
        setError('Please log in to check plagiarism');
        return;
      }

      const headers = {
        'Authorization': `Token ${storedSession.token}`,
        'X-CSRFToken': sessionManager.getCSRFToken() || '',
        'Content-Type': 'application/json',
      };

      let response;
      if (assignmentId) {
        // Check assignment plagiarism
        response = await axios.post(
          `${config.API_BASE_URL}/plagiarism/check-assignment/${assignmentId}/`,
          { text },
          { headers, credentials: 'include' }
        );
      } else {
        // Check general plagiarism
        response = await axios.post(
          `${config.API_BASE_URL}/plagiarism/check/`,
          { text, language: 'en' },
          { headers, credentials: 'include' }
        );
      }

      if (response.data.success) {
        setResult(response.data);
        if (onResult) {
          onResult(response.data);
        }
      } else {
        setError(response.data.error || 'Plagiarism check failed');
      }
    } catch (err) {
      console.error('Plagiarism check error:', err);
      setError(err.response?.data?.error || 'Failed to check plagiarism');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score < 20) return '#4CAF50'; // Green
    if (score < 40) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getScoreLabel = (score) => {
    if (score < 20) return 'Low Similarity';
    if (score < 40) return 'Moderate Similarity';
    return 'High Similarity';
  };

  return (
    <div className="plagiarism-checker-overlay">
      <div className="plagiarism-checker-modal">
        <div className="plagiarism-checker-header">
          <h3>
            <i className="fas fa-search"></i>
            Plagiarism Checker
          </h3>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="plagiarism-checker-content">
          {!result ? (
            <>
              <div className="input-section">
                <label htmlFor="plagiarism-text">
                  Enter text to check for plagiarism (minimum 80 characters):
                </label>
                <textarea
                  id="plagiarism-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your text here..."
                  rows={8}
                  className="plagiarism-textarea"
                />
                <div className="character-count">
                  {text.length} characters
                  {text.length < 80 && (
                    <span className="warning">
                      (Minimum 80 characters required)
                    </span>
                  )}
                </div>
              </div>

              {error && (
                <div className="error-message">
                  <i className="fas fa-exclamation-triangle"></i>
                  {error}
                </div>
              )}

              <div className="action-buttons">
                <button
                  className="btn-primary"
                  onClick={handleCheckPlagiarism}
                  disabled={loading || text.length < 80}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Checking...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-search"></i>
                      Check Plagiarism
                    </>
                  )}
                </button>
                <button className="btn-secondary" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="result-section">
              <div className="result-header">
                <h4>
                  <i className="fas fa-chart-line"></i>
                  Plagiarism Check Results
                </h4>
              </div>

              <div className="score-display">
                <div 
                  className="score-circle"
                  style={{ 
                    borderColor: getScoreColor(result.plagiarism_score || result.report?.percent || 0),
                    color: getScoreColor(result.plagiarism_score || result.report?.percent || 0)
                  }}
                >
                  <span className="score-value">
                    {result.plagiarism_score || result.report?.percent || 0}%
                  </span>
                  <span className="score-label">
                    {getScoreLabel(result.plagiarism_score || result.report?.percent || 0)}
                  </span>
                </div>
              </div>

              <div className="result-details">
                <div className="detail-item">
                  <strong>Similarity Score:</strong>
                  <span 
                    className="score-text"
                    style={{ 
                      color: getScoreColor(result.plagiarism_score || result.report?.percent || 0)
                    }}
                  >
                    {result.plagiarism_score || result.report?.percent || 0}%
                  </span>
                </div>
                
                {result.report && (
                  <>
                    <div className="detail-item">
                      <strong>Pages Checked:</strong>
                      <span>{result.report.pages || 1}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Language:</strong>
                      <span>{result.report.language || 'en'}</span>
                    </div>
                  </>
                )}

                {result.message && (
                  <div className="result-message">
                    <i className="fas fa-info-circle"></i>
                    {result.message}
                  </div>
                )}
              </div>

              <div className="result-actions">
                <button 
                  className="btn-primary"
                  onClick={() => {
                    setResult(null);
                    setText('');
                    setError('');
                  }}
                >
                  <i className="fas fa-redo"></i>
                  Check Another Text
                </button>
                <button className="btn-secondary" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlagiarismChecker;
