import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Container, Form, Button, Card, Alert, InputGroup } from 'react-bootstrap';
import { Smartphone, Key, ShieldLock } from 'react-bootstrap-icons';

function PhoneResetPassword() {
  const [step, setStep] = useState(1); // 1: phone, 2: otp, 3: new password
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  const sendOTP = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/auth/send-otp/', { phone });
      if (response.data.success) {
        setStep(2);
        toast.success('OTP sent to your phone!');
        
        // Start countdown for resend (60 seconds)
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/auth/verify-otp/', { phone, otp });
      if (response.data.valid) {
        setStep(3);
        toast.success('OTP verified!');
      }
    } catch (error) {
      setError('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Password strength check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError('Password must be at least 12 chars with uppercase, lowercase, number, and special character');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/auth/reset-password-phone/', {
        phone,
        otp,
        newPassword
      });

      if (response.data.success) {
        toast.success('Password reset successful!');
        navigate('/login');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '400px' }} className="p-4 shadow-lg border-0">
        <Card.Body>
          <div className="text-center mb-4">
            <ShieldLock size={50} className="text-primary mb-3" />
            <h3>Reset Password</h3>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          {step === 1 && (
            <Form>
              <Form.Group className="mb-4">
                <Form.Label>Phone Number</Form.Label>
                <InputGroup>
                  <InputGroup.Text><Smartphone /></InputGroup.Text>
                  <Form.Control
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1234567890"
                    required
                  />
                </InputGroup>
                <Form.Text className="text-muted">
                  Enter your registered phone number
                </Form.Text>
              </Form.Group>

              <Button 
                variant="primary" 
                onClick={sendOTP} 
                className="w-100"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </Form>
          )}

          {step === 2 && (
            <Form>
              <Form.Group className="mb-4">
                <Form.Label>Enter OTP</Form.Label>
                <InputGroup>
                  <InputGroup.Text><Key /></InputGroup.Text>
                  <Form.Control
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </InputGroup>
                <Form.Text className="text-muted">
                  {countdown > 0 ? (
                    `Resend OTP in ${countdown}s`
                  ) : (
                    <Button variant="link" onClick={sendOTP} className="p-0">
                      Resend OTP
                    </Button>
                  )}
                </Form.Text>
              </Form.Group>

              <Button 
                variant="primary" 
                onClick={verifyOTP} 
                className="w-100"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </Form>
          )}

          {step === 3 && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>New Password</Form.Label>
                <Form.Control
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <Button 
                variant="primary" 
                onClick={resetPassword} 
                className="w-100"
                disabled={loading}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </Form>
          )}

          <div className="text-center mt-3">
            <Link to="/login">Back to Login</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default PhoneResetPassword;