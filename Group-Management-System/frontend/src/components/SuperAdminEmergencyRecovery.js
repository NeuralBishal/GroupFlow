import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Table, Badge, Modal } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ExclamationTriangle, ShieldLock, Key, Person } from 'react-bootstrap-icons';

function SuperAdminEmergencyRecovery() {
  const [lockedUsers, setLockedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryReason, setRecoveryReason] = useState('');
  const [emergencyCode, setEmergencyCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLockedUsers();
  }, []);

  const fetchLockedUsers = async () => {
    try {
      const response = await axios.get('/super-admin/locked-users/');
      setLockedUsers(response.data);
    } catch (error) {
      console.error('Error fetching locked users:', error);
    }
  };

  const performEmergencyRecovery = async () => {
    if (emergencyCode !== 'SUPER-ADMIN-2026') {
      toast.error('Invalid emergency code');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/super-admin/emergency-recovery/', {
        user_id: selectedUser.id,
        reason: recoveryReason,
        emergency_code: emergencyCode
      });

      if (response.data.success) {
        toast.warning(
          <div>
            <h6>✅ Account Recovered!</h6>
            <p>Temporary Password: <strong>{response.data.temp_password}</strong></p>
          </div>,
          { autoClose: 10000 }
        );
        setShowRecoveryModal(false);
        fetchLockedUsers();
      }
    } catch (error) {
      toast.error('Recovery failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Card className="border-danger">
        <Card.Header className="bg-danger text-white">
          <h4><ExclamationTriangle className="me-2" /> Emergency Recovery Zone</h4>
        </Card.Header>
        <Card.Body>
          <Alert variant="warning">
            <ShieldLock className="me-2" />
            This area is for emergency account recoveries only. All actions are logged.
          </Alert>

          <h5>Locked Accounts Requiring Intervention</h5>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Locked Since</th>
                <th>Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lockedUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td><Badge bg="danger">{user.role}</Badge></td>
                  <td>{new Date(user.locked_at).toLocaleString()}</td>
                  <td>{user.lock_reason || 'Multiple failed attempts'}</td>
                  <td>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowRecoveryModal(true);
                      }}
                    >
                      <Key /> Emergency Recover
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Recovery Modal */}
      <Modal show={showRecoveryModal} onHide={() => setShowRecoveryModal(false)}>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Emergency Account Recovery</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            <strong>Target:</strong> {selectedUser?.username} ({selectedUser?.role})
          </Alert>
          
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Reason for Recovery</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={recoveryReason}
                onChange={(e) => setRecoveryReason(e.target.value)}
                placeholder="Explain why this emergency recovery is necessary..."
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Super Admin Emergency Code</Form.Label>
              <Form.Control
                type="password"
                value={emergencyCode}
                onChange={(e) => setEmergencyCode(e.target.value)}
                placeholder="Enter emergency code"
              />
              <Form.Text>Default code: SUPER-ADMIN-2026</Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRecoveryModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={performEmergencyRecovery}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Perform Emergency Recovery'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default SuperAdminEmergencyRecovery;