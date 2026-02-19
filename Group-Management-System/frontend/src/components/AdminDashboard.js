import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Container, Row, Col, Card, Button, Table, 
  Modal, Form, Alert, Badge, Tabs, Tab 
} from 'react-bootstrap';
import { 
  PersonPlus, Grid3x3, People, Gear, Person,
  Trash, PencilSquare, Plus, ShieldLock, XCircle, PersonBadge
} from 'react-bootstrap-icons';

function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('domains');
  const [admins, setAdmins] = useState([]);
  const [domains, setDomains] = useState([]);
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [showCreateDomainModal, setShowCreateDomainModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    password: '',
    email: '',
    name: ''
  });
  
  const [newDomain, setNewDomain] = useState({
    name: '',
    description: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchAdmins();
    fetchDomains();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await axios.get('/admin/list/');
      setAdmins(response.data);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await axios.get('/domains/');
      setDomains(response.data);
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };

  const createAdmin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('/admin/create-admin/', newAdmin);
      
      if (response.data.success) {
        toast.success(`✅ Admin ${newAdmin.username} created!`);
        setShowCreateAdminModal(false);
        setNewAdmin({ username: '', password: '', email: '', name: '' });
        fetchAdmins();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Creation failed');
    } finally {
      setLoading(false);
    }
  };

  const createDomain = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('/admin/create-domain/', newDomain);
      
      if (response.data) {
        toast.success(`✅ Domain ${newDomain.name} created!`);
        setShowCreateDomainModal(false);
        setNewDomain({ name: '', description: '' });
        fetchDomains();
      }
    } catch (error) {
      toast.error('Failed to create domain');
    } finally {
      setLoading(false);
    }
  };

  const deleteDomain = async (domainId) => {
    try {
      await axios.delete(`/admin/delete-domain/${domainId}/`);
      toast.warning('Domain deleted');
      setShowDeleteConfirm(false);
      fetchDomains();
    } catch (error) {
      toast.error('Failed to delete domain');
    }
  };

  const deleteTopic = async (topicId) => {
    try {
      await axios.delete(`/admin/delete-topic/${topicId}/`);
      toast.warning('Topic deleted');
      fetchDomains();
    } catch (error) {
      toast.error('Failed to delete topic');
    }
  };

  return (
    <Container className="mt-5" fluid>
      {/* Header */}
      <Card className="bg-primary text-white mb-4">
        <Card.Body>
          <Row>
            <Col>
              <h2><ShieldLock className="me-2" /> Admin Dashboard</h2>
              <p>Welcome, {user.username}. You have administrative privileges.</p>
            </Col>
            <Col className="text-end">
              <Button 
                variant="light" 
                onClick={() => setShowCreateAdminModal(true)}
                className="me-2"
              >
                <PersonPlus className="me-2" /> Create Admin
              </Button>
              <Button 
                variant="info" 
                onClick={() => navigate('/admin/all-groups')}
                className="me-2"
              >
                <Grid3x3 className="me-2" /> View Groups
              </Button>
              <Button 
                variant="warning" 
                onClick={() => navigate('/admin/all-students')}
                className="me-2"
              >
                <People className="me-2" /> View Students
              </Button>

              <Button 
                variant="info" 
                onClick={() => navigate('/admin/faculty-overview')}
                className="me-2"
              >
                <PersonBadge className="me-2" /> Faculty Overview
            </Button>
              <Button 
                variant="success" 
                onClick={() => navigate('/admin/faculty-import')}
              >
                <PersonBadge className="me-2" /> Import Faculty
              </Button>
              <Button 
                variant="info" 
                onClick={() => navigate('/admin/profile')}
                className="me-2"
              >
                <Person className="me-2" /> Profile
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="domains" title="Domains & Topics">
          <Row className="mb-3">
            <Col className="text-end">
              <Button 
                variant="success" 
                onClick={() => setShowCreateDomainModal(true)}
              >
                <Plus /> Create New Domain
              </Button>
            </Col>
          </Row>
          
          {domains.map(domain => (
            <Card key={domain.id} className="mb-3">
              <Card.Header>
                <Row>
                  <Col>
                    <h5>{domain.name}</h5>
                  </Col>
                  <Col className="text-end">
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => {
                        setSelectedItem(domain);
                        setShowDeleteConfirm(true);
                      }}
                    >
                      <Trash /> Delete Domain
                    </Button>
                  </Col>
                </Row>
              </Card.Header>
              <Card.Body>
                <p>{domain.description}</p>
                <h6>Topics:</h6>
                {domain.topics?.map(topic => (
                  <div key={topic.id} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                    <div>
                      <strong>{topic.name}</strong>
                      <br />
                      <small className="text-muted">{topic.description}</small>
                    </div>
                    <div>
                      <Badge bg="info" className="me-2">
                        {topic.max_groups - topic.current_groups} slots left
                      </Badge>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => deleteTopic(topic.id)}
                      >
                        <Trash />
                      </Button>
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          ))}
        </Tab>

        <Tab eventKey="admins" title="Manage Admins">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Name</th>
                <th>Created</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => (
                <tr key={admin.id}>
                  <td>{admin.username}</td>
                  <td>{admin.email}</td>
                  <td>{admin.name}</td>
                  <td>{new Date(admin.date_joined).toLocaleDateString()}</td>
                  <td>
                    <Badge bg={admin.is_active ? 'success' : 'danger'}>
                      {admin.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td>
                    <Button variant="warning" size="sm" className="me-2">
                      <PencilSquare /> Edit
                    </Button>
                    <Button variant="danger" size="sm">
                      <XCircle /> Disable
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Tab>
      </Tabs>

      {/* Create Admin Modal */}
      <Modal show={showCreateAdminModal} onHide={() => setShowCreateAdminModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Admin</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={createAdmin}>
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
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={newAdmin.username}
                onChange={(e) => setNewAdmin({...newAdmin, username: e.target.value})}
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
              <Form.Control
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                required
              />
            </Form.Group>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Admin'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Create Domain Modal */}
      <Modal show={showCreateDomainModal} onHide={() => setShowCreateDomainModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Domain</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={createDomain}>
            <Form.Group className="mb-3">
              <Form.Label>Domain Name</Form.Label>
              <Form.Control
                type="text"
                value={newDomain.name}
                onChange={(e) => setNewDomain({...newDomain, name: e.target.value})}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newDomain.description}
                onChange={(e) => setNewDomain({...newDomain, description: e.target.value})}
              />
            </Form.Group>
            <Button type="submit" variant="success" disabled={loading}>
              {loading ? 'Creating...' : 'Create Domain'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning">
            Are you sure you want to delete <strong>{selectedItem?.name}</strong>?
            This action cannot be undone.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={() => deleteDomain(selectedItem?.id)}
          >
            Delete Permanently
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default AdminDashboard;