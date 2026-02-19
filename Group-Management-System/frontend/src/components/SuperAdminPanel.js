import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Modal, Form, Alert, Badge, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShieldLock, Eye, Clock, CheckCircle, XCircle, FileText } from 'react-bootstrap-icons';

function SuperAdminPanel() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    fetchLockedUsers();
    fetchRecoveryLogs();
  }, []);

  const fetchLockedUsers = async () => {
    try {
      const response = await axios.get('/superadmin/locked-users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching locked users:', error);
    }
  };

  const fetchRecoveryLogs = async () => {
    try {
      const response = await axios.get('/superadmin/recovery-logs/');
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const initiateRecovery = async () => {
    if (!verificationCode || verificationCode !== 'SUPER-ADMIN-2026') {
      toast.error('Invalid verification code');
      return;
    }

    try {
      const response = await axios.post('/superadmin/emergency-recovery/', {
        user_id: selectedUser.id,
        reason: reason,
        verification_code: verificationCode
      });

      if (response.data.success) {
        toast.success('Emergency recovery initiated!');
        setShowModal(false);
        fetchLockedUsers();
        
        // Send notification to all admins
        await axios.post('/superadmin/notify-emergency/', {
          user_id: selectedUser.id,
          action: 'emergency_recovery'
        });
      }
    } catch (error) {
      toast.error('Recovery failed');
    }
  };

  const freezeAccount = async (userId) => {
    try {
      const response = await axios.post('/superadmin/freeze-account/', {
        user_id: userId,
        reason: 'Legal hold - ' + reason
      });

      if (response.data.success) {
        toast.warning('Account frozen!');
        fetchLockedUsers();
      }
    } catch (error) {
      toast.error('Failed to freeze account');
    }
  };

  return (
    <Container className="mt-5" fluid>
      <h2 className="mb-4"><ShieldLock className="text-danger me-2" /> Super Admin Emergency Panel</h2>
      
      <Row>
        <Col md={8}>
          <Card className="shadow mb-4">
            <Card.Header className="bg-danger text-white">
              <h5 className="mb-0">🔐 Locked Accounts Requiring Intervention</h5>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Locked Since</th>
                    <th>Recovery Attempts</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.username}<br/><small>{user.email}</small></td>
                      <td><Badge bg="info">{user.role}</Badge></td>
                      <td>{new Date(user.locked_at).toLocaleString()}</td>
                      <td>{user.recovery_attempts}</td>
                      <td>
                        <Badge bg="danger">Locked</Badge>
                      </td>
                      <td>
                        <Button 
                          variant="warning" 
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowModal(true);
                          }}
                        >
                          <Eye /> Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow mb-4">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0"><Clock className="me-2" /> Recent Recovery Logs</h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {logs.map((log, index) => (
                <div key={index} className="mb-3 p-2 border-bottom">
                  <small className="text-muted">{new Date(log.timestamp).toLocaleString()}</small>
                  <p className="mb-0">
                    <strong>{log.user}</strong> - {log.method}
                  </p>
                  <Badge bg={log.success ? 'success' : 'danger'}>
                    {log.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Emergency Recovery Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>⚠️ Emergency Account Recovery</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <h6>Selected User: {selectedUser?.username} ({selectedUser?.email})</h6>
            <p>This action will be logged and all admins will be notified.</p>
          </Alert>

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Reason for Emergency Recovery</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this emergency recovery is necessary..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Super Admin Verification Code</Form.Label>
              <Form.Control
                type="password"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter super admin code"
              />
              <Form.Text className="text-muted">
                This code is provided during system setup
              </Form.Text>
            </Form.Group>

            <Row>
              <Col>
                <Button variant="danger" onClick={initiateRecovery} className="w-100">
                  <ShieldLock /> Initiate Emergency Recovery
                </Button>
              </Col>
              <Col>
                <Button variant="warning" onClick={() => freezeAccount(selectedUser?.id)} className="w-100">
                  <XCircle /> Freeze Account (Legal Hold)
                </Button>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default SuperAdminPanel;