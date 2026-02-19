import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Container, Card, Form, Button, Alert, ProgressBar, ListGroup, Modal } from 'react-bootstrap';
import { ShieldLock, People, CheckCircle, XCircle, Clock } from 'react-bootstrap-icons';

function CoAdminRecovery() {
  const [step, setStep] = useState(1);
  const [requestId, setRequestId] = useState('');
  const [admins, setAdmins] = useState([]);
  const [selectedAdmins, setSelectedAdmins] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  // Get current user on component mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
    fetchAdmins();
  }, []);

  useEffect(() => {
    if (requestId) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            toast.error('Recovery request expired');
            navigate('/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      fetchApprovals();
      return () => clearInterval(interval);
    }
  }, [requestId]);

  const fetchAdmins = async () => {
    try {
      const response = await axios.get('/admin/list-active/');
      const user = JSON.parse(localStorage.getItem('user'));
      // Filter out current user
      setAdmins(response.data.filter(admin => admin.id !== user?.id));
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const initiateRecovery = async () => {
    try {
      const response = await axios.post('/admin/initiate-recovery/', {
        selected_admins: selectedAdmins
      });
      
      if (response.data.success) {
        setRequestId(response.data.request_id);
        setStep(2);
        toast.success('Recovery request initiated! Notify other admins to approve.');
      }
    } catch (error) {
      toast.error('Failed to initiate recovery');
    }
  };

  const fetchApprovals = async () => {
    try {
      const response = await axios.get(`/admin/recovery-status/${requestId}/`);
      setApprovals(response.data.approvals);
      
      // Check if enough approvals (3 out of 5)
      const approvedCount = response.data.approvals.filter(a => a.approved).length;
      if (approvedCount >= 3) {
        setStep(3);
        setModalMessage('✅ Enough approvals received! You can now reset your account.');
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
    }
  };

  const approveRequest = async (adminId) => {
    try {
      const response = await axios.post(`/admin/approve-recovery/${requestId}/`, {
        admin_id: adminId
      });
      
      if (response.data.success) {
        toast.success('Approval recorded');
        fetchApprovals();
      }
    } catch (error) {
      toast.error('Failed to approve');
    }
  };

  const finalizeRecovery = async () => {
    try {
      const response = await axios.post(`/admin/finalize-recovery/${requestId}/`);
      
      if (response.data.success) {
        toast.success('Account recovered! Set new password now.');
        navigate('/reset-password', { state: { token: response.data.token } });
      }
    } catch (error) {
      toast.error('Recovery failed');
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  // Don't render if no current user
  if (!currentUser) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">Please log in to access recovery</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <Card className="shadow-lg border-0">
        <Card.Header className="bg-danger text-white">
          <h3 className="mb-0"><ShieldLock className="me-2" /> Emergency Admin Recovery</h3>
        </Card.Header>
        <Card.Body>
          {step === 1 && (
            <>
              <Alert variant="warning">
                <h5>⚠️ Important</h5>
                <p>This process requires approval from at least 3 other active admins. 
                   The request will expire in 1 hour.</p>
              </Alert>

              <Form>
                <Form.Group className="mb-4">
                  <Form.Label>Select at least 3 trusted admins to approve your recovery</Form.Label>
                  <ListGroup>
                    {admins.map(admin => (
                      <ListGroup.Item key={admin.id}>
                        <Form.Check
                          type="checkbox"
                          label={`${admin.username} (${admin.email})`}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAdmins([...selectedAdmins, admin.id]);
                            } else {
                              setSelectedAdmins(selectedAdmins.filter(id => id !== admin.id));
                            }
                          }}
                        />
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Form.Group>

                <Button 
                  variant="danger" 
                  onClick={initiateRecovery}
                  disabled={selectedAdmins.length < 3}
                  className="w-100"
                >
                  Initiate Recovery Request
                </Button>
              </Form>
            </>
          )}

          {step === 2 && (
            <>
              <Alert variant="info">
                <h5>⏳ Recovery in Progress</h5>
                <p>Request ID: {requestId}</p>
                <p>Time remaining: {formatTime(timeLeft)}</p>
                <ProgressBar 
                  now={(timeLeft / 3600) * 100} 
                  variant="warning"
                  animated
                />
              </Alert>

              <h5 className="mt-4">Approval Status ({approvals.filter(a => a.approved).length}/3 needed)</h5>
              <ListGroup>
                {approvals.map((approval, index) => (
                  <ListGroup.Item key={index}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{approval.admin_name}</strong>
                        <br />
                        <small className="text-muted">{approval.email}</small>
                      </div>
                      <div>
                        {approval.approved ? (
                          <CheckCircle className="text-success" size={24} />
                        ) : approval.rejected ? (
                          <XCircle className="text-danger" size={24} />
                        ) : (
                          <Clock className="text-warning" size={24} />
                        )}
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>

              {approvals.filter(a => !a.approved && !a.rejected).length > 0 && (
                <Alert variant="warning" className="mt-3">
                  <small>Notify other admins to check their email for approval links</small>
                </Alert>
              )}
            </>
          )}

          {step === 3 && (
            <div className="text-center">
              <CheckCircle size={60} className="text-success mb-3" />
              <h4>Recovery Approved!</h4>
              <p>Your identity has been verified by 3 co-admins.</p>
              <Button variant="success" onClick={finalizeRecovery} className="mt-3">
                Proceed to Account Recovery
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Success Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Recovery Approved!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="success">{modalMessage}</Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowModal(false)}>
            Continue
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default CoAdminRecovery;