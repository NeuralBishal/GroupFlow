import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Container, Card, Form, Button, Alert, Tabs, Tab, InputGroup } from 'react-bootstrap';
import { Envelope, Telephone, Key, ShieldLock, ArrowLeft } from 'react-bootstrap-icons';

function AdminForgotPassword() {
  const [step, setStep] = useState(1); // 1: identifier, 2: otp, 3: new password
  const [method, setMethod] = useState('email');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState(null);
  const [resetToken, setResetToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  const handleRequestReset = async () => {
    if (!identifier) {
      setError('Please enter your email or phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/admin/forgot-password/', {
        identifier,
        method
      });

      if (response.data.success) {
        setUserId(response.data.user_id);
        setStep(2);
        toast.success(`OTP sent to your ${method}`);
        
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/admin/verify-otp/', {
        user_id: userId,
        otp
      });

      if (response.data.success) {
        setResetToken(response.data.token);
        setStep(3);
        toast.success('OTP verified!');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/admin/reset-password/', {
        user_id: userId,
        token: resetToken,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      if (response.data.success) {
        toast.success('✅ Password reset successful!');
        setTimeout(() => navigate('/admin/login'), 2000);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '450px' }} className="p-4 shadow-lg">
        <Card.Body>
          <div className="text-center mb-4">
            <ShieldLock size={50} className="text-primary mb-3" />
            <h3>Admin Password Reset</h3>
            <p className="text-muted">Secure account recovery</p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          {step === 1 && (
            <>
              <Tabs
                activeKey={method}
                onSelect={(k) => setMethod(k)}
                className="mb-4"
                fill
              >
                <Tab eventKey="email" title="Email">
                  <Form.Group className="mb-3 mt-3">
                    <Form.Label>Email Address</Form.Label>
                    <InputGroup>
                      <InputGroup.Text><Envelope /></InputGroup.Text>
                      <Form.Control
                        type="email"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="admin@example.com"
                      />
                    </InputGroup>
                  </Form.Group>
                </Tab>
                
                <Tab eventKey="phone" title="Phone">
                  <Form.Group className="mb-3 mt-3">
                    <Form.Label>Phone Number</Form.Label>
                    <InputGroup>
                      <InputGroup.Text><Telephone /></InputGroup.Text>
                      <Form.Control
                        type="tel"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="+1234567890"
                      />
                    </InputGroup>
                  </Form.Group>
                </Tab>
              </Tabs>

              <Button 
                variant="primary" 
                onClick={handleRequestReset}
                disabled={loading || !identifier}
                className="w-100"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Alert variant="info">
                <small>
                  Enter the 6-digit OTP sent to your {method}<br />
                  <strong>{identifier}</strong>
                </small>
              </Alert>

              <Form.Group className="mb-3">
                <Form.Label>OTP Code</Form.Label>
                <Form.Control
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center"
                  style={{ fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                />
              </Form.Group>

              <Button 
                variant="primary" 
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-100 mb-2"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>

              {countdown > 0 ? (
                <p className="text-center text-muted small">
                  Resend OTP in {countdown}s
                </p>
              ) : (
                <Button 
                  variant="link" 
                  onClick={handleRequestReset}
                  className="w-100"
                >
                  Resend OTP
                </Button>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <Alert variant="success">✅ OTP verified! Set your new password.</Alert>

              <Form.Group className="mb-3">
                <Form.Label>New Password</Form.Label>
                <Form.Control
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                  placeholder="Confirm new password"
                  minLength={8}
                />
              </Form.Group>

              <Button 
                variant="success" 
                onClick={handleResetPassword}
                disabled={loading || !newPassword || !confirmPassword}
                className="w-100"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </>
          )}

          <div className="text-center mt-3">
            <Link to="/admin/login">← Back to Login</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default AdminForgotPassword;