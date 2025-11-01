import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import sessionManager from '../sessionManager';
import config from '../config';

const Profile = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    bio: '',
    phone: '',
    address: '',
    date_of_birth: ''
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      // Check if user is logged in
      const storedSession = sessionManager.getStoredSession();
      if (!storedSession) {
        showMessage('Please log in to view your profile', 'error');
        navigate('/login');
        return;
      }

      const response = await fetch(`${config.API_BASE_URL}/profile/`, {
        credentials: 'include',
        headers: {
          'Authorization': `Token ${storedSession.token}`,
          'X-CSRFToken': sessionManager.getCSRFToken() || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        setEditForm({
          first_name: data.user.first_name || '',
          last_name: data.user.last_name || '',
          email: data.user.email || '',
          bio: data.profile.bio || '',
          phone: data.profile.phone || '',
          address: data.profile.address || '',
          date_of_birth: data.profile.date_of_birth ? data.profile.date_of_birth.split('T')[0] : ''
        });
      } else {
        const errorText = await response.text();
        console.error('Profile API error:', response.status, errorText);
        try {
          const errorData = JSON.parse(errorText);
          showMessage(errorData.error || 'Failed to load profile data', 'error');
        } catch {
          showMessage(`Server error: ${response.status}`, 'error');
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      showMessage('Network error. Please check your connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    // Reset form to original data
    if (profileData) {
      setEditForm({
        first_name: profileData.user.first_name || '',
        last_name: profileData.user.last_name || '',
        email: profileData.user.email || '',
        bio: profileData.profile.bio || '',
        phone: profileData.profile.phone || '',
        address: profileData.profile.address || '',
        date_of_birth: profileData.profile.date_of_birth ? profileData.profile.date_of_birth.split('T')[0] : ''
      });
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/profile/update/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${sessionManager.getStoredSession()?.token || ''}`,
          'X-CSRFToken': sessionManager.getCSRFToken() || '',
        },
        credentials: 'include',
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        showMessage('Profile updated successfully!', 'success');
        setEditing(false);
        await fetchProfileData(); // Refresh data
      } else {
        const errorData = await response.json();
        showMessage(errorData.error || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('Network error. Please try again.', 'error');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showMessage('File size must be less than 5MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('profile_picture', file);

    setUploading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/profile/upload-picture/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${sessionManager.getStoredSession()?.token || ''}`,
          'X-CSRFToken': sessionManager.getCSRFToken() || '',
        },
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        showMessage('Profile picture updated successfully!', 'success');
        await fetchProfileData(); // Refresh data
      } else {
        const errorData = await response.json();
        showMessage(errorData.error || 'Failed to upload picture', 'error');
      }
    } catch (error) {
      console.error('Error uploading picture:', error);
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    fetchProfileData();
  };

  const navigateToDashboard = () => {
    const storedSession = sessionManager.getStoredSession();
    if (storedSession) {
      switch (storedSession.role) {
        case 'student':
          navigate('/student-dashboard');
          break;
        case 'lecturer':
          navigate('/lecturer-dashboard');
          break;
        case 'superadmin':
          navigate('/admin-dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    } else {
      navigate('/login');
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'superadmin': return 'role-superadmin';
      case 'lecturer': return 'role-lecturer';
      case 'student': return 'role-student';
      default: return 'role-student';
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="profile-container">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <h2>Failed to load profile</h2>
          <p>Please try refreshing the page or contact support.</p>
          <button onClick={handleRetry} className="retry-btn">
            <i className="fas fa-refresh"></i> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Message Display */}
      {message.text && (
        <div className={`message-alert ${message.type}`}>
          <i className={`fas fa-${message.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Header */}
      <header className="profile-header">
        <div className="header-content">
          <h1>My Profile</h1>
          <p>Manage your account information and preferences</p>
        </div>
        <div className="header-actions">
          <button onClick={navigateToDashboard} className="back-btn">
            <i className="fas fa-arrow-left"></i> Back to Dashboard
          </button>
        </div>
      </header>

      <div className="profile-content">
        {/* Profile Overview Card */}
        <div className="profile-overview">
          <div className="profile-picture-section">
            <div className="profile-picture-container">
              {profileData.profile.profile_picture ? (
                <img 
                  src={profileData.profile.profile_picture} 
                  alt="Profile" 
                  className="profile-picture"
                />
              ) : (
                <div className="profile-picture-placeholder">
                  <i className="fas fa-user"></i>
                </div>
              )}
              <div className="upload-overlay">
                <label htmlFor="profile-picture-upload" className="upload-btn">
                  <i className="fas fa-camera"></i>
                </label>
                <input
                  id="profile-picture-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
              </div>
            </div>
            {uploading && (
              <div className="upload-progress">
                <div className="progress-spinner"></div>
                <span>Uploading...</span>
              </div>
            )}
          </div>

          <div className="profile-info">
            <div className="profile-name">
              <h2>{profileData.user.first_name} {profileData.user.last_name}</h2>
              <span className={`role-badge ${getRoleBadgeColor(profileData.profile.role)}`}>
                {profileData.profile.role.charAt(0).toUpperCase() + profileData.profile.role.slice(1)}
              </span>
            </div>
            <p className="profile-username">@{profileData.user.username}</p>
            <p className="profile-email">{profileData.user.email}</p>
            <p className="member-since">Member since {formatDate(profileData.user.date_joined)}</p>
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <div className="stat-number">{profileData.stats.total_courses}</div>
              <div className="stat-label">Courses</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{profileData.stats.completed_courses}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{profileData.stats.pending_assignments}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{profileData.stats.unread_notifications}</div>
              <div className="stat-label">Notifications</div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="profile-details">
          <div className="details-header">
            <h3>Profile Information</h3>
            {!editing ? (
              <button onClick={handleEdit} className="edit-btn">
                <i className="fas fa-edit"></i> Edit Profile
              </button>
            ) : (
              <div className="edit-actions">
                <button onClick={handleSave} className="save-btn">
                  <i className="fas fa-save"></i> Save Changes
                </button>
                <button onClick={handleCancel} className="cancel-btn">
                  <i className="fas fa-times"></i> Cancel
                </button>
              </div>
            )}
          </div>

          <div className="details-content">
            <div className="form-grid">
              <div className="form-group">
                <label>First Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm({...editForm, first_name: e.target.value})}
                    className="form-input"
                  />
                ) : (
                  <p className="form-value">{profileData.user.first_name || 'Not provided'}</p>
                )}
              </div>

              <div className="form-group">
                <label>Last Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm({...editForm, last_name: e.target.value})}
                    className="form-input"
                  />
                ) : (
                  <p className="form-value">{profileData.user.last_name || 'Not provided'}</p>
                )}
              </div>

              <div className="form-group">
                <label>Email</label>
                {editing ? (
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="form-input"
                  />
                ) : (
                  <p className="form-value">{profileData.user.email}</p>
                )}
              </div>

              <div className="form-group">
                <label>Phone</label>
                {editing ? (
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    className="form-input"
                  />
                ) : (
                  <p className="form-value">{profileData.profile.phone || 'Not provided'}</p>
                )}
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                {editing ? (
                  <input
                    type="date"
                    value={editForm.date_of_birth}
                    onChange={(e) => setEditForm({...editForm, date_of_birth: e.target.value})}
                    className="form-input"
                  />
                ) : (
                  <p className="form-value">{formatDate(profileData.profile.date_of_birth)}</p>
                )}
              </div>

              <div className="form-group full-width">
                <label>Bio</label>
                {editing ? (
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    className="form-textarea"
                    rows="4"
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="form-value">{profileData.profile.bio || 'No bio provided'}</p>
                )}
              </div>

              <div className="form-group full-width">
                <label>Address</label>
                {editing ? (
                  <textarea
                    value={editForm.address}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                    className="form-textarea"
                    rows="3"
                    placeholder="Enter your address..."
                  />
                ) : (
                  <p className="form-value">{profileData.profile.address || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity">
          <h3>Recent Activity</h3>
          <div className="activity-tabs">
            <div className="tab-content">
              <div className="activity-section">
                <h4>Recent Courses</h4>
                <div className="activity-list">
                  {profileData.courses.slice(0, 3).map((course) => (
                    <div key={course.id} className="activity-item">
                      <div className="activity-icon course-icon">
                        <i className="fas fa-book"></i>
                      </div>
                      <div className="activity-content">
                        <h5>{course.title}</h5>
                        <p>{course.description}</p>
                        <span className="activity-meta">
                          Enrolled {formatDate(course.enrolled_at)}
                        </span>
                      </div>
                      <div className="activity-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${course.progress || 0}%` }}
                          ></div>
                        </div>
                        <span>{course.progress || 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="activity-section">
                <h4>Recent Assignments</h4>
                <div className="activity-list">
                  {profileData.assignments.slice(0, 3).map((assignment) => (
                    <div key={assignment.id} className="activity-item">
                      <div className={`activity-icon ${assignment.submission.status === 'submitted' ? 'assignment-submitted' : 'assignment-pending'}`}>
                        <i className={`fas fa-${assignment.submission.status === 'submitted' ? 'check' : 'clock'}`}></i>
                      </div>
                      <div className="activity-content">
                        <h5>{assignment.title}</h5>
                        <p>{assignment.course_title}</p>
                        <span className="activity-meta">
                          Due {formatDate(assignment.due_date)}
                        </span>
                      </div>
                      <div className="assignment-status">
                        {assignment.submission.status === 'submitted' ? (
                          <span className="status-submitted">
                            Grade: {assignment.submission.grade || 'Pending'}
                          </span>
                        ) : (
                          <span className="status-pending">Pending</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;