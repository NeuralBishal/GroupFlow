import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { QRCodeSVG } from 'qrcode.react';

function Setup2FA() {
  const location = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  
  const { secret, backupCodes: initialBackupCodes } = location.state || {};

  useEffect(() => {
    setBackupCodes(initialBackupCodes || []);
  }, [initialBackupCodes]);

  const verifyOTP = async () => {
    try {
      const response = await axios.post('/admin/verify-2fa/', {
        otp,
        secret
      });
      
      if (response.data.valid) {
        setSuccess(true);
        toast.success('2FA enabled successfully!');
      } else {
        setError('Invalid OTP code');
      }
    } catch (error) {
      setError('Verification failed');
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="p-4 shadow">
            <Card.Body>
              <h3 className="text-center mb-4">Setup Two-Factor Authentication</h3>
              
              {!success ? (
                <>
                  <div className="text-center mb-4">
                    <h5>Scan this QR code with Google Authenticator</h5>
                    <QRCodeSVG value={`otpauth://totp/GroupFlow:admin?secret=${secret}&issuer=GroupFlow`} size={200} />
                  </div>
                  
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Enter OTP from Authenticator</Form.Label>
                      <Form.Control
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="000000"
                        maxLength={6}
                      />
                    </Form.Group>
                    
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    <Button variant="primary" onClick={verifyOTP} className="w-100">
                      Verify & Enable 2FA
                    </Button>
                  </Form>
                </>
              ) : (
                <>
                  <Alert variant="success">
                    <h5>✅ 2FA Enabled Successfully!</h5>
                  </Alert>
                  
                  <Alert variant="warning">
                    <h5>⚠️ Save These Backup Codes</h5>
                    <p>Store these codes safely. They can be used to access your account if you lose your phone.</p>
                    <div className="bg-dark text-light p-3 rounded">
                      {backupCodes.map((code, i) => (
                        <div key={i} className="mb-1 font-monospace">{code}</div>
                      ))}
                    </div>
                  </Alert>
                  
                  <Button variant="success" onClick={() => navigate('/admin/dashboard')} className="w-100">
                    Go to Dashboard
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Setup2FA;