import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { Key, ShieldLock } from 'react-bootstrap-icons';

function FirstLoginPasswordChange({ user, setUser }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (newPassword === user.username) {
      setError('New password cannot be same as your ID');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/change-password/', {
        new_password: newPassword
      });
      
      if (response.data.success) {
        // Update local user data
        const updatedUser = { ...user, is_first_login: false };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        toast.success('✅ Password changed successfully!');
        
        // Redirect based on role
        if (user.role === 'student') {
          navigate('/student/dashboard');
        } else if (user.role === 'faculty') {
          navigate('/faculty/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '450px' }} className="p-4 shadow">
        <Card.Body>
          <div className="text-center mb-4">
            <ShieldLock size={60} className="text-warning mb-3" />
            <h3>First Login</h3>
            <p className="text-muted">
              Welcome, <strong>{user?.username}</strong>!<br />
              Please change your default password.
            </p>
          </div>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new password"
                minLength={8}
              />
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
                minLength={8}
              />
            </Form.Group>
            
            <Button 
              type="submit" 
              variant="warning" 
              className="w-100"
              disabled={loading}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default FirstLoginPasswordChange;