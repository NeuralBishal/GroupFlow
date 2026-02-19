import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Modal, Form, Alert, Badge, Row, Col, InputGroup } from 'react-bootstrap';  // Added InputGroup here
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  People, PersonPlus, ShieldLock, Trash, 
  Key, Eye, EyeSlash, CheckCircle, XCircle 
} from 'react-bootstrap-icons';

function SuperAdminAdmins({ user }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    email: '',
    password: '',
    name: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await axios.get('/super-admin/admins/');
      setAdmins(response.data);
    } catch (error) {
      toast.error('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/super-admin/create-admin/', newAdmin);
      if (response.data.success) {
        toast.success(`✅ Admin ${newAdmin.username} created!`);
        setShowCreateModal(false);
        setNewAdmin({ username: '', email: '', password: '', name: '' });
        fetchAdmins();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Creation failed');
    }
  };

  const toggleAdminStatus = async (adminId, currentStatus) => {
    try {
      const response = await axios.post(`/super-admin/toggle-admin/${adminId}/`, {
        active: !currentStatus
      });
      if (response.data.success) {
        toast.success(`Admin ${currentStatus ? 'disabled' : 'enabled'}`);
        fetchAdmins();
      }
    } catch (error) {
      toast.error('Failed to toggle status');
    }
  };

  const resetAdminPassword = async () => {
    try {
      const response = await axios.post(`/super-admin/reset-admin-password/${selectedAdmin.id}/`);
      if (response.data.success) {
        toast.info(`Temporary password: ${response.data.temp_password}`);
        setShowResetModal(false);
      }
    } catch (error) {
      toast.error('Password reset failed');
    }
  };

  const deleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure? This cannot be undone!')) return;
    
    try {
      await axios.delete(`/super-admin/delete-admin/${adminId}/`);
      toast.warning('Admin deleted');
      fetchAdmins();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  return (
    <Container className="mt-5">
      <Card>
        <Card.Header className="bg-warning">
          <Row>
            <Col>
              <h3><People className="me-2" /> Manage Administrators</h3>
            </Col>
            <Col className="text-end">
              <Button variant="dark" onClick={() => setShowCreateModal(true)}>
                <PersonPlus className="me-2" /> Create New Admin
              </Button>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin.id}>
                    <td>{admin.username}</td>
                    <td>{admin.name}</td>
                    <td>{admin.email}</td>
                    <td>{new Date(admin.created_at).toLocaleDateString()}</td>
                    <td>
                      <Badge bg={admin.is_active ? 'success' : 'danger'}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <Button 
                        variant={admin.is_active ? 'warning' : 'success'}
                        size="sm"
                        className="me-2"
                        onClick={() => toggleAdminStatus(admin.id, admin.is_active)}
                      >
                        {admin.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button 
                        variant="info" 
                        size="sm"
                        className="me-2"
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setShowResetModal(true);
                        }}
                      >
                        <Key /> Reset Password
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => deleteAdmin(admin.id)}
                      >
                        <Trash /> Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Create Admin Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Admin</Modal.Title>
        </Modal.Header>
        <Form onSubmit={createAdmin}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={newAdmin.username}
                onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  required
                />
                <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeSlash /> : <Eye />}
                </Button>
              </InputGroup>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="warning" type="submit">
              Create Admin
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal show={showResetModal} onHide={() => setShowResetModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reset Admin Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            Are you sure you want to reset password for <strong>{selectedAdmin?.username}</strong>?
            A temporary password will be generated.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResetModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={resetAdminPassword}>
            Reset Password
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default SuperAdminAdmins;