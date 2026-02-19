import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { 
  ShieldLock, People, GraphUp, Gear, Clock, 
  ExclamationTriangle, FileText, Sliders, 
  Fingerprint, Key, DoorClosed, CloudUpload 
} from 'react-bootstrap-icons';

function SuperAdminDashboard({ user }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAdmins: 0,
    totalStudents: 0,
    totalFaculty: 0,
    totalGroups: 0,
    pendingRecoveries: 0,
    totalDomains: 0,
    totalTopics: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/super-admin/dashboard-stats/');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/logout/');
      localStorage.removeItem('user');
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      {/* Header */}
      <Card className="bg-dark text-white mb-4">
        <Card.Body>
          <Row>
            <Col>
              <h2><ShieldLock className="me-2 text-warning" /> Super Admin Dashboard</h2>
              <p>Welcome back, {user?.username}. You have full system override authority.</p>
            </Col>
            <Col className="text-end">
              <Button 
                variant="warning" 
                onClick={() => navigate('/')}
                className="me-2"
              >
                <DoorClosed className="me-2" /> Exit
              </Button>
              <Button 
                variant="outline-light" 
                onClick={handleLogout}
              >
                Logout
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Stats Cards */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="bg-primary text-white">
            <Card.Body className="text-center">
              <h3>{stats.totalAdmins}</h3>
              <p>Total Admins</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-success text-white">
            <Card.Body className="text-center">
              <h3>{stats.totalStudents}</h3>
              <p>Total Students</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-info text-white">
            <Card.Body className="text-center">
              <h3>{stats.totalFaculty}</h3>
              <p>Total Faculty</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-warning text-white">
            <Card.Body className="text-center">
              <h3>{stats.totalGroups}</h3>
              <p>Active Groups</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Manage Admins Card */}
        <Col md={4}>
          <Card className="h-100 border-warning">
            <Card.Body className="text-center">
              <People size={50} className="text-warning mb-3" />
              <Card.Title>Manage All Admins</Card.Title>
              <Card.Text>
                View, create, or disable admin accounts across the entire system.
              </Card.Text>
              <Button 
                variant="warning" 
                onClick={() => navigate('/super-admin/admins')}
                className="w-100"
              >
                <People className="me-2" /> Manage Admins
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Import Students Card - NEW */}
        <Col md={4}>
          <Card className="h-100 border-success">
            <Card.Body className="text-center">
              <CloudUpload size={50} className="text-success mb-3" />
              <Card.Title>Import Students</Card.Title>
              <Card.Text>
                Import students from Google Sheets. Bulk upload student data quickly.
              </Card.Text>
              <Button 
                variant="success" 
                onClick={() => navigate('/super-admin/import-students')}
                className="w-100"
              >
                <CloudUpload className="me-2" /> Import Students
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* System Analytics Card */}
        <Col md={4}>
          <Card className="h-100 border-info">
            <Card.Body className="text-center">
              <GraphUp size={50} className="text-info mb-3" />
              <Card.Title>System Analytics</Card.Title>
              <Card.Text>
                View detailed analytics about system usage, groups, and activities.
              </Card.Text>
              <Button 
                variant="info" 
                onClick={() => navigate('/super-admin/analytics')}
                className="w-100"
              >
                <GraphUp className="me-2" /> View Analytics
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Audit Logs Card */}
        <Col md={4}>
          <Card className="h-100 border-secondary">
            <Card.Body className="text-center">
              <Clock size={50} className="text-secondary mb-3" />
              <Card.Title>Audit Logs</Card.Title>
              <Card.Text>
                Review all admin actions, logins, and system changes.
              </Card.Text>
              <Button 
                variant="secondary" 
                onClick={() => navigate('/super-admin/audit-logs')}
                className="w-100"
              >
                <FileText className="me-2" /> View Logs
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Emergency Recovery Card */}
        <Col md={4}>
          <Card className="border-danger">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <ExclamationTriangle size={30} className="text-danger me-2" />
                <h4 className="mb-0">Emergency Recovery</h4>
              </div>
              <p>Perform emergency account recoveries, freeze accounts, or override system locks.</p>
              <Row>
                <Col>
                  <Button 
                    variant="danger" 
                    onClick={() => navigate('/super-admin/emergency-recovery')}
                    className="w-100"
                  >
                    <ExclamationTriangle className="me-2" /> Tools
                  </Button>
                </Col>
                <Col>
                  <Button 
                    variant="outline-danger" 
                    onClick={() => navigate('/super-admin/paper-keys')}
                    className="w-100"
                  >
                    <Key className="me-2" /> Paper Keys
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* System Configuration Card */}
        <Col md={4}>
          <Card className="border-primary">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <Gear size={30} className="text-primary me-2" />
                <h4 className="mb-0">System Config</h4>
              </div>
              <p>Modify global system settings, security policies, and configuration.</p>
              <Row>
                <Col>
                  <Button 
                    variant="primary" 
                    onClick={() => navigate('/super-admin/settings')}
                    className="w-100"
                  >
                    <Sliders className="me-2" /> Settings
                  </Button>
                </Col>
                <Col>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => navigate('/super-admin/biometric')}
                    className="w-100"
                  >
                    <Fingerprint className="me-2" /> Biometric
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default SuperAdminDashboard;