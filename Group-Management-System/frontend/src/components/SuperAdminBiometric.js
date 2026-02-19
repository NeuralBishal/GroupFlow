import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Container, Card, Button, Alert, Row, Col } from 'react-bootstrap';
import { Fingerprint, ShieldLock, Key, Printer } from 'react-bootstrap-icons';

function SuperAdminBiometric({ user, setUser }) {
  const [step, setStep] = useState(1); // 1: register, 2: login
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paperKeys, setPaperKeys] = useState([]);
  const navigate = useNavigate();

  const registerBiometric = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Get registration options from server
      const regResponse = await axios.post('/super-admin/register-biometric/');
      
      if (regResponse.data.success) {
        // Start browser biometric registration
        const attResp = await startRegistration(regResponse.data.options);
        
        // Send response to server
        const verifyResponse = await axios.post('/super-admin/verify-biometric/', {
          ...attResp,
          device_name: navigator.userAgent
        });
        
        if (verifyResponse.data.success) {
          toast.success('✅ Biometric registered successfully!');
          setStep(2);
        }
      }
    } catch (error) {
      setError('Biometric registration failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loginWithBiometric = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Start authentication
      const authResponse = await axios.post('/super-admin/biometric-login/', {
        username: user?.username
      });
      
      if (authResponse.data.success) {
        const authResp = await startAuthentication(authResponse.data.options);
        
        const verifyResponse = await axios.post('/super-admin/verify-biometric-login/', {
          credential: authResp,
          user_id: authResponse.data.user_id
        });
        
        if (verifyResponse.data.success) {
          setUser(verifyResponse.data.user);
          localStorage.setItem('user', JSON.stringify(verifyResponse.data.user));
          toast.success('🔓 Biometric login successful!');
          navigate('/super-admin/dashboard');
        }
      }
    } catch (error) {
      setError('Biometric login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generatePaperKeys = async () => {
    setLoading(true);
    
    try {
      const response = await axios.post('/super-admin/generate-paper-keys/');
      
      if (response.data.success) {
        setPaperKeys(response.data.keys);
        toast.success('📄 Paper keys generated! Print and store safely.');
      }
    } catch (error) {
      setError('Failed to generate paper keys');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Card className="shadow-lg border-0">
        <Card.Header className="bg-warning text-dark">
          <h3><ShieldLock className="me-2" /> Super Admin Biometric Setup</h3>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Row className="g-4">
            <Col md={6}>
              <Card className="h-100 border-primary">
                <Card.Body className="text-center">
                  <Fingerprint size={60} className="text-primary mb-3" />
                  <h4>Biometric Authentication</h4>
                  <p className="text-muted">
                    Register your fingerprint or face ID as the ultimate recovery method.
                  </p>
                  <Button 
                    variant="primary" 
                    onClick={registerBiometric}
                    disabled={loading}
                    className="w-100"
                  >
                    {loading ? 'Registering...' : 'Register Biometric'}
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="h-100 border-success">
                <Card.Body className="text-center">
                  <Key size={60} className="text-success mb-3" />
                  <h4>Emergency Paper Keys</h4>
                  <p className="text-muted">
                    Generate 5 physical backup keys. Print and store in a safe.
                  </p>
                  <Button 
                    variant="success" 
                    onClick={generatePaperKeys}
                    disabled={loading}
                    className="w-100"
                  >
                    <Printer className="me-2" /> Generate Paper Keys
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            {paperKeys.length > 0 && (
              <Col md={12}>
                <Alert variant="warning">
                  <h5>⚠️ IMPORTANT: Your Emergency Paper Keys</h5>
                  <p>Print this page and store it in a PHYSICAL SAFE. Each key can be used ONLY ONCE.</p>
                  <div className="bg-dark text-light p-3 rounded">
                    {paperKeys.map((key, index) => (
                      <div key={index} className="mb-2 font-monospace">
                        <strong>{key.hint}:</strong> {key.key}
                      </div>
                    ))}
                  </div>
                </Alert>
              </Col>
            )}

            <Col md={12}>
              <Card className="border-danger">
                <Card.Body>
                  <h5 className="text-danger">🔐 Ultimate Recovery Process</h5>
                  <ol className="mb-0">
                    <li>Register your fingerprint/face ID as primary biometric</li>
                    <li>Generate and print 5 emergency paper keys</li>
                    <li>Store paper keys in a physical safe or bank locker</li>
                    <li>If you forget password, use biometric login</li>
                    <li>If biometric fails, use paper key for emergency recovery</li>
                    <li>Each paper key works only once - regenerate after use</li>
                  </ol>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default SuperAdminBiometric;