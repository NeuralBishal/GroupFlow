import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Container, Row, Col, Card, Form, Button, 
  Alert, Tabs, Tab, InputGroup, Spinner 
} from 'react-bootstrap';
import { 
  Person, Envelope, Telephone, ShieldLock, 
  Key, Eye, EyeSlash, ArrowLeft 
} from 'react-bootstrap-icons';
import './AdminProfile.css';

function AdminProfile({ user, setUser }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState({});
  
  // Password change form
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/admin/profile/');
      if (response.data.success) {
        setProfile(response.data.profile);
      }
    } catch (error) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put('/admin/profile/', profile);
      
      if (response.data.success) {
        setSuccess('Profile updated successfully!');
        toast.success('Profile updated');
        
        // Update local user data if needed
        const updatedUser = { ...user, ...profile };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/change-password/', {
        new_password: passwordData.new_password
      });
      
      if (response.data.success) {
        setSuccess('Password changed successfully!');
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
        toast.success('Password updated');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Loading profile...</span>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <Button 
        variant="link" 
        onClick={() => navigate('/admin/dashboard')}
        className="mb-3 text-decoration-none"
      >
        <ArrowLeft /> Back to Dashboard
      </Button>

      <Card className="profile-card">
        <Card.Header className="bg-primary text-white">
          <h4><Person className="me-2" /> Admin Profile</h4>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
          >
            <Tab eventKey="profile" title="Profile Information">
              <Form onSubmit={handleProfileUpdate} className="mt-3">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Username</Form.Label>
                      <InputGroup>
                        <InputGroup.Text><Person /></InputGroup.Text>
                        <Form.Control
                          type="text"
                          value={profile?.username || ''}
                          disabled
                          readOnly
                        />
                      </InputGroup>
                      <Form.Text className="text-muted">
                        Username cannot be changed
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <InputGroup>
                        <InputGroup.Text><Envelope /></InputGroup.Text>
                        <Form.Control
                          type="email"
                          name="email"
                          value={profile?.email || ''}
                          onChange={handleChange}
                          required
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number</Form.Label>
                      <InputGroup>
                        <InputGroup.Text><Telephone /></InputGroup.Text>
                        <Form.Control
                          type="tel"
                          name="phone_number"
                          value={profile?.phone_number || ''}
                          onChange={handleChange}
                          placeholder="+1234567890"
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Role</Form.Label>
                      <Form.Control
                        type="text"
                        value={profile?.role || ''}
                        disabled
                        readOnly
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <h5 className="mt-4 mb-3">Recovery Options</h5>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Recovery Email</Form.Label>
                      <InputGroup>
                        <InputGroup.Text><Envelope /></InputGroup.Text>
                        <Form.Control
                          type="email"
                          name="recovery_email"
                          value={profile?.recovery_email || ''}
                          onChange={handleChange}
                          placeholder="backup@email.com"
                        />
                      </InputGroup>
                      <Form.Text className="text-muted">
                        Used for account recovery
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Recovery Phone</Form.Label>
                      <InputGroup>
                        <InputGroup.Text><Telephone /></InputGroup.Text>
                        <Form.Control
                          type="tel"
                          name="recovery_phone"
                          value={profile?.recovery_phone || ''}
                          onChange={handleChange}
                          placeholder="+1234567890"
                        />
                      </InputGroup>
                      <Form.Text className="text-muted">
                        Used for SMS recovery
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={saving}
                  className="mt-3"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Form>
            </Tab>

            <Tab eventKey="security" title="Security">
              <Row className="mt-3">
                <Col md={6}>
                  <Card>
                    <Card.Header>
                      <h5><Key className="me-2" /> Change Password</h5>
                    </Card.Header>
                    <Card.Body>
                      <Form onSubmit={handlePasswordChange}>
                        <Form.Group className="mb-3">
                          <Form.Label>New Password</Form.Label>
                          <InputGroup>
                            <InputGroup.Text><Key /></InputGroup.Text>
                            <Form.Control
                              type={showPassword.new ? "text" : "password"}
                              value={passwordData.new_password}
                              onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                              required
                              minLength={8}
                            />
                            <Button 
                              variant="outline-secondary"
                              onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                            >
                              {showPassword.new ? <EyeSlash /> : <Eye />}
                            </Button>
                          </InputGroup>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Confirm Password</Form.Label>
                          <InputGroup>
                            <InputGroup.Text><Key /></InputGroup.Text>
                            <Form.Control
                              type={showPassword.confirm ? "text" : "password"}
                              value={passwordData.confirm_password}
                              onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                              required
                              minLength={8}
                            />
                            <Button 
                              variant="outline-secondary"
                              onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                            >
                              {showPassword.confirm ? <EyeSlash /> : <Eye />}
                            </Button>
                          </InputGroup>
                        </Form.Group>

                        <Button type="submit" variant="warning" disabled={saving}>
                          {saving ? 'Changing...' : 'Change Password'}
                        </Button>
                      </Form>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card>
                    <Card.Header>
                      <h5><ShieldLock className="me-2" /> Two-Factor Authentication</h5>
                    </Card.Header>
                    <Card.Body>
                      <p className="text-muted">
                        Two-factor authentication adds an extra layer of security to your account.
                      </p>
                      <Form>
                        <Form.Check
                          type="switch"
                          label="Enable 2FA"
                          checked={profile?.two_factor_enabled}
                          onChange={async (e) => {
                            // Implement 2FA toggle
                            toast.info('2FA setup coming soon');
                          }}
                        />
                      </Form>
                    </Card.Body>
                  </Card>

                  <Card className="mt-3">
                    <Card.Header>
                      <h5>Account Recovery</h5>
                    </Card.Header>
                    <Card.Body>
                      <p className="text-muted">
                        You can recover your account using your recovery email or phone number.
                      </p>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => navigate('/admin/forgot-password')}
                      >
                        Test Recovery Flow
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default AdminProfile;