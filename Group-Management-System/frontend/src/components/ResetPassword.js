import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';

function ResetPassword() {
  const { userId, token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(true);

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    try {
      const response = await axios.get(`/verify-reset-token/${userId}/${token}/`);
      setValidToken(response.data.valid);
    } catch (error) {
      setValidToken(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/reset-password/', {
        user_id: userId,
        token: token,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      if (response.data.success) {
        setSuccess(true);
        toast.success('Password reset successful!');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to reset password');
      toast.error('Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (!validToken) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Card style={{ width: '400px' }} className="p-4">
          <Card.Body>
            <Alert variant="danger">
              Invalid or expired reset link. Please request a new one.
            </Alert>
            <div className="text-center">
              <Link to="/forgot-password">Request new link</Link>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (success) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Card style={{ width: '400px' }} className="p-4">
          <Card.Body>
            <Alert variant="success">
              Password reset successful! Redirecting to login...
            </Alert>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '400px' }} className="p-4">
        <Card.Body>
          <h2 className="text-center mb-4">Reset Password</h2>
          
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

            <Form.Group className="mb-3">
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
              variant="primary" 
              type="submit" 
              className="w-100"
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ResetPassword;