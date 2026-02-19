import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Container, Card, Form, Button, Alert, Tabs, Tab } from 'react-bootstrap';
import { Key, ShieldLock, Person, Bell } from 'react-bootstrap-icons';

function StudentSettings({ user }) {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (passwordData.newPassword === user.username) {
      setError('New password cannot be same as roll number');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post('/change-password/', {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      });
      
      if (response.data.success) {
        setSuccess('✅ Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        toast.success('Password updated!');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Card>
        <Card.Header className="bg-primary text-white">
          <h4><ShieldLock className="me-2" /> Account Settings</h4>
        </Card.Header>
        <Card.Body>
          <Tabs defaultActiveKey="password" className="mb-4">
            <Tab eventKey="password" title="Change Password">
              <Card className="border-0 mt-3">
                <Card.Body>
                  <h5><Key className="me-2" /> Update Your Password</h5>
                  
                  {error && <Alert variant="danger">{error}</Alert>}
                  {success && <Alert variant="success">{success}</Alert>}
                  
                  <Form onSubmit={handlePasswordChange}>
                    <Form.Group className="mb-3">
                      <Form.Label>Current Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        required
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>New Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        required
                        minLength={8}
                      />
                      <Form.Text className="text-muted">
                        Minimum 8 characters, cannot be your roll number
                      </Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                      <Form.Label>Confirm New Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        required
                        minLength={8}
                      />
                    </Form.Group>
                    
                    <Button 
                      variant="warning" 
                      type="submit" 
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            </Tab>
            
            <Tab eventKey="profile" title="Profile Info">
              <Card className="border-0 mt-3">
                <Card.Body>
                  <h5><Person className="me-2" /> Your Information</h5>
                  <p><strong>Username:</strong> {user.username}</p>
                  <p><strong>Roll Number:</strong> {user.roll_number}</p>
                  <p><strong>Account Type:</strong> Student</p>
                  <p><strong>First Login:</strong> {user.is_first_login ? 'Yes' : 'No'}</p>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default StudentSettings;