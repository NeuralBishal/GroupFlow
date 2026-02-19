import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';

function ForgotPassword() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await axios.post('/forgot-password/', {
        username_or_email: usernameOrEmail
      });

      if (response.data.success) {
        setSuccess(true);
        toast.success('Reset link sent! Check your email/console');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send reset link');
      toast.error('Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '400px' }} className="p-4">
        <Card.Body>
          <h2 className="text-center mb-4">Forgot Password?</h2>
          <p className="text-muted text-center mb-4">
            Enter your username or email to receive a reset link
          </p>
          
          {error && <Alert variant="danger">{error}</Alert>}
          {success && (
            <Alert variant="success">
              If an account exists, a reset link has been sent. Check the Django console for the link (development mode).
            </Alert>
          )}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Username or Email</Form.Label>
              <Form.Control
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
                placeholder="Enter your username or email"
              />
            </Form.Group>

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </Form>

          <div className="mt-3 text-center">
            <p>
              <Link to="/login">Back to Login</Link>
            </p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ForgotPassword;