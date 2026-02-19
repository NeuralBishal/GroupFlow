import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Container, Form, Button, Card, Alert, InputGroup, Tabs, Tab } from 'react-bootstrap';
import { ShieldLock, Key, Fingerprint, Eye, EyeSlash, Biometric } from 'react-bootstrap-icons';
import { startAuthentication } from '@simplewebauthn/browser';

function SuperAdminLogin({ setUser }) {
  const [activeTab, setActiveTab] = useState('password'); // 'password' or 'biometric'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [registeredDevices, setRegisteredDevices] = useState([]);
  const navigate = useNavigate();

  // Check if WebAuthn is supported
  useEffect(() => {
    if (window.PublicKeyCredential) {
      setBiometricSupported(true);
      checkRegisteredBiometrics();
    }
  }, []);

  const checkRegisteredBiometrics = async () => {
    try {
      const response = await axios.get('/super-admin/list-biometrics/');
      setRegisteredDevices(response.data.devices || []);
    } catch (error) {
      console.error('Error checking biometrics:', error);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/super-admin/login/', {
        username,
        password
      });

      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success('Super Admin login successful!');
        navigate('/super-admin/dashboard');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Invalid super admin credentials');
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Start WebAuthn authentication
      const response = await axios.post('/super-admin/biometric-login/', {
        username: username || undefined // Optional if you want to select from registered devices
      });

      if (response.data.success) {
        // Use the browser's WebAuthn API to authenticate
        const authResp = await startAuthentication(response.data.options);
        
        // Verify the authentication
        const verifyResponse = await axios.post('/super-admin/verify-biometric-login/', {
          credential: authResp,
          user_id: response.data.user_id
        });

        if (verifyResponse.data.success) {
          setUser(verifyResponse.data.user);
          localStorage.setItem('user', JSON.stringify(verifyResponse.data.user));
          toast.success('✅ Biometric login successful!');
          navigate('/super-admin/dashboard');
        }
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      setError('Biometric login failed. Please use password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterBiometric = async () => {
    if (!username) {
      setError('Please enter username to register biometric');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First login with password to verify identity
      const loginResponse = await axios.post('/super-admin/login/', {
        username,
        password
      });

      if (loginResponse.data.success) {
        // Now register biometric
        const registerResponse = await axios.post('/super-admin/register-biometric/');
        
        if (registerResponse.data.success) {
          // Use browser's WebAuthn API to create credential
          const { startRegistration } = await import('@simplewebauthn/browser');
          const attResp = await startRegistration(registerResponse.data.options);
          
          // Verify registration
          const verifyResponse = await axios.post('/super-admin/verify-biometric/', {
            ...attResp,
            device_name: navigator.userAgent
          });

          if (verifyResponse.data.success) {
            toast.success('✅ Biometric registered successfully!');
            checkRegisteredBiometrics();
          }
        }
      }
    } catch (error) {
      setError('Biometric registration failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '500px' }} className="p-4 shadow-lg border-0">
        <Card.Body>
          <div className="text-center mb-4">
            <ShieldLock size={60} className="text-warning mb-3" />
            <h2 className="text-warning">Super Admin</h2>
            <p className="text-muted">Highest Level Access Portal</p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
            fill
          >
            <Tab eventKey="password" title="Password Login">
              <Form onSubmit={handlePasswordSubmit} className="mt-3">
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <InputGroup>
                    <InputGroup.Text><Key /></InputGroup.Text>
                    <Form.Control
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="Enter super admin username"
                      autoFocus
                    />
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <InputGroup>
                    <InputGroup.Text><Fingerprint /></InputGroup.Text>
                    <Form.Control
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                    />
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeSlash /> : <Eye />}
                    </Button>
                  </InputGroup>
                </Form.Group>

                <Button 
                  variant="warning" 
                  type="submit" 
                  className="w-100 mb-3"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? 'Authenticating...' : 'Access Super Admin Panel'}
                </Button>
              </Form>
            </Tab>

            <Tab eventKey="biometric" title="Biometric Login">
              <div className="text-center mt-3">
                {biometricSupported ? (
                  <>
                    {registeredDevices.length > 0 ? (
                      <>
                        <Fingerprint size={80} className="text-warning mb-3" />
                        <h5>Login with Biometric</h5>
                        <p className="text-muted small">
                          Use your fingerprint or face ID
                        </p>
                        
                        <Form.Group className="mb-3">
                          <Form.Label>Select Device (Optional)</Form.Label>
                          <Form.Select 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)}
                          >
                            <option value="">Any registered device</option>
                            {registeredDevices.map(device => (
                              <option key={device.id} value={device.username}>
                                {device.name} - {device.device_name}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>

                        <Button 
                          variant="warning" 
                          onClick={handleBiometricLogin}
                          disabled={loading}
                          className="w-100 mb-3"
                          size="lg"
                        >
                          <Fingerprint className="me-2" />
                          {loading ? 'Scanning...' : 'Scan Fingerprint / Face ID'}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Fingerprint size={80} className="text-secondary mb-3" />
                        <h5>No Biometrics Registered</h5>
                        <p className="text-muted small">
                          Register your fingerprint or face ID for quick access
                        </p>

                        <Form.Group className="mb-3">
                          <Form.Label>Username</Form.Label>
                          <Form.Control
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Password</Form.Label>
                          <Form.Control
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                          />
                        </Form.Group>

                        <Button 
                          variant="outline-warning" 
                          onClick={handleRegisterBiometric}
                          disabled={loading || !username || !password}
                          className="w-100"
                        >
                          <Fingerprint className="me-2" />
                          Register Biometric
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  <Alert variant="warning">
                    <h6>❌ Biometric Not Supported</h6>
                    <p className="small mb-0">
                      Your device or browser doesn't support WebAuthn biometric authentication.
                      Please use password login.
                    </p>
                  </Alert>
                )}

                <hr className="my-4" />
                
                <div className="text-center">
                  <Link to="/" className="text-decoration-none">
                    ← Back to Home
                  </Link>
                </div>
              </div>
            </Tab>
          </Tabs>

          {/* Paper Key Recovery Link */}
          <div className="text-center mt-3">
            <small className="text-muted">
              Lost access? <Link to="/super-admin/paper-recovery">Use Paper Key Recovery</Link>
            </small>
          </div>

          <hr className="my-4" />
          
          <div className="text-center">
            <small className="text-muted">
              This area is restricted to Super Administrators only
            </small>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default SuperAdminLogin;