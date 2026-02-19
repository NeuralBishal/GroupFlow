import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Container, Form, Button, Card, Alert, Row, Col, InputGroup } from 'react-bootstrap';
import { ShieldLock, Key, Fingerprint, Smartphone, Mail } from 'react-bootstrap-icons';

function AdminRegister() {
  const [step, setStep] = useState(1); // 1: security code, 2: registration
  const [securityCode, setSecurityCode] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    adminCode: '',
    securityQuestion: '',
    securityAnswer: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const navigate = useNavigate();

  const securityQuestions = [
    "What was your first pet's name?",
    "What is your mother's maiden name?",
    "What was your first school?",
    "What city were you born in?",
    "What is your favorite book?"
  ];

  const verifySecurityCode = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/admin/verify-initial-code/', {
        code: securityCode
      });
      if (response.data.valid) {
        setStep(2);
        toast.success('Security code verified!');
      } else {
        setError('Invalid security code');
      }
    } catch (error) {
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const generateBackupCodes = () => {
    const codes = [];
    for (let i = 0; i < 5; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must be at least 12 chars with uppercase, lowercase, number, and special character');
      setLoading(false);
      return;
    }

    try {
      const backupCodes = generateBackupCodes();
      
      const response = await axios.post('/admin/register/', {
        ...formData,
        backupCodes,
        twoFactorEnabled
      });

      if (response.data.success) {
        // Show backup codes to admin
        alert(`SAVE THESE BACKUP CODES:\n\n${backupCodes.join('\n')}\n\nStore them safely!`);
        
        toast.success('Admin account created! Please setup 2FA');
        
        // Redirect to 2FA setup
        navigate('/admin/setup-2fa', { 
          state: { 
            secret: response.data.totpSecret,
            backupCodes 
          } 
        });
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <Card style={{ width: '400px' }} className="p-4 shadow-lg border-0">
          <Card.Body className="text-center">
            <ShieldLock size={60} className="text-danger mb-3" />
            <h3 className="mb-4">Admin Registration</h3>
            <p className="text-muted mb-4">Enter the security code provided by your organization</p>
            
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form onSubmit={(e) => { e.preventDefault(); verifySecurityCode(); }}>
              <Form.Group className="mb-4">
                <InputGroup>
                  <InputGroup.Text><Key /></InputGroup.Text>
                  <Form.Control
                    type="password"
                    value={securityCode}
                    onChange={(e) => setSecurityCode(e.target.value)}
                    placeholder="Enter security code"
                    required
                  />
                </InputGroup>
              </Form.Group>
              
              <Button 
                variant="danger" 
                type="submit" 
                className="w-100 mb-3"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </Button>
              
              <p className="text-muted small">
                Contact system administrator if you don't have a code
              </p>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '500px' }} className="p-4 shadow-lg border-0">
        <Card.Body>
          <h3 className="text-center mb-4">Create Admin Account</h3>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <InputGroup>
                    <InputGroup.Text><ShieldLock /></InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      placeholder="Admin username"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <InputGroup>
                    <InputGroup.Text><Mail /></InputGroup.Text>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="admin@example.com"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Phone Number</Form.Label>
              <InputGroup>
                <InputGroup.Text><Smartphone /></InputGroup.Text>
                <Form.Control
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="+1234567890"
                />
              </InputGroup>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Strong password"
                  />
                  <Form.Text className="text-muted">
                    Min 12 chars with uppercase, number & special char
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Security Question</Form.Label>
              <Form.Select
                name="securityQuestion"
                value={formData.securityQuestion}
                onChange={handleChange}
                required
              >
                <option value="">Select a question</option>
                {securityQuestions.map((q, i) => (
                  <option key={i} value={q}>{q}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Answer</Form.Label>
              <Form.Control
                type="text"
                name="securityAnswer"
                value={formData.securityAnswer}
                onChange={handleChange}
                required
                placeholder="Your answer"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Check
                type="switch"
                label="Enable Two-Factor Authentication (Recommended)"
                checked={twoFactorEnabled}
                onChange={(e) => setTwoFactorEnabled(e.target.checked)}
              />
            </Form.Group>

            <Button 
              variant="danger" 
              type="submit" 
              className="w-100"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Admin Account'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default AdminRegister;