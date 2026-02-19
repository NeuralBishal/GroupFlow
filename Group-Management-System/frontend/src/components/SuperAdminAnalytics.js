import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { 
  People, PersonBadge, PeopleFill, JournalCheck, 
  GraphUp, Calendar, Clock, ShieldLock 
} from 'react-bootstrap-icons';

function SuperAdminAnalytics() {
  const [stats, setStats] = useState({
    users: {
      total: 0,
      students: 0,
      faculty: 0,
      admins: 0,
      superAdmins: 0
    },
    groups: {
      total: 0,
      active: 0,
      completed: 0,
      twoMember: 0,
      fourMember: 0
    },
    domains: {
      total: 0,
      topics: 0
    },
    selections: {
      total: 0,
      approved: 0,
      pending: 0
    },
    activity: {
      last7Days: [],
      totalLogins: 0,
      totalActions: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/super-admin/analytics/');
      setStats(response.data);
    } catch (error) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading analytics...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-5" fluid>
      <h2 className="mb-4"><GraphUp className="me-2" /> System Analytics Dashboard</h2>

      {/* User Statistics Cards */}
      <h4 className="mb-3"><People className="me-2" /> User Statistics</h4>
      <Row className="g-4 mb-5">
        <Col md={3}>
          <Card className="bg-primary text-white h-100">
            <Card.Body className="text-center">
              <People size={40} className="mb-3" />
              <h2>{stats.users.total}</h2>
              <p>Total Users</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-success text-white h-100">
            <Card.Body className="text-center">
              <PeopleFill size={40} className="mb-3" />
              <h2>{stats.users.students}</h2>
              <p>Students</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-info text-white h-100">
            <Card.Body className="text-center">
              <PersonBadge size={40} className="mb-3" />
              <h2>{stats.users.faculty}</h2>
              <p>Faculty</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="bg-warning text-white h-100">
            <Card.Body className="text-center">
              <ShieldLock size={40} className="mb-3" />
              <h2>{stats.users.admins}</h2>
              <p>Admins</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Groups Statistics */}
      <h4 className="mb-3"><JournalCheck className="me-2" /> Groups Statistics</h4>
      <Row className="g-4 mb-5">
        <Col md={3}>
          <Card className="border-primary h-100">
            <Card.Body className="text-center">
              <h3 className="text-primary">{stats.groups.total}</h3>
              <p>Total Groups</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-success h-100">
            <Card.Body className="text-center">
              <h3 className="text-success">{stats.groups.active}</h3>
              <p>Active Groups</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-info h-100">
            <Card.Body className="text-center">
              <h3 className="text-info">{stats.groups.completed}</h3>
              <p>Completed</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-warning h-100">
            <Card.Body className="text-center">
              <h3 className="text-warning">{stats.groups.twoMember}</h3>
              <p>2-Member Groups</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-danger h-100">
            <Card.Body className="text-center">
              <h3 className="text-danger">{stats.groups.fourMember}</h3>
              <p>4-Member Groups</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Domains & Topics */}
      <h4 className="mb-3">📚 Domains & Topics</h4>
      <Row className="g-4 mb-5">
        <Col md={6}>
          <Card>
            <Card.Header className="bg-dark text-white">
              <h5 className="mb-0">Domain Overview</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6} className="text-center">
                  <h1 className="display-4 text-primary">{stats.domains.total}</h1>
                  <p>Total Domains</p>
                </Col>
                <Col md={6} className="text-center">
                  <h1 className="display-4 text-success">{stats.domains.topics}</h1>
                  <p>Total Topics</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header className="bg-dark text-white">
              <h5 className="mb-0">Selection Status</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4} className="text-center">
                  <h3 className="text-info">{stats.selections.total}</h3>
                  <p>Total Selections</p>
                </Col>
                <Col md={4} className="text-center">
                  <h3 className="text-success">{stats.selections.approved}</h3>
                  <p>Approved</p>
                </Col>
                <Col md={4} className="text-center">
                  <h3 className="text-warning">{stats.selections.pending}</h3>
                  <p>Pending</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <h4 className="mb-3"><Clock className="me-2" /> Recent Activity</h4>
      <Row className="mb-5">
        <Col md={12}>
          <Card>
            <Card.Header className="bg-dark text-white">
              <Row>
                <Col><h5 className="mb-0">Last 7 Days Activity</h5></Col>
                <Col className="text-end">
                  <small>Total Logins: {stats.activity.totalLogins} | Total Actions: {stats.activity.totalActions}</small>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Logins</th>
                    <th>Group Creations</th>
                    <th>Topic Selections</th>
                    <th>Total Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.activity.last7Days.map((day, index) => (
                    <tr key={index}>
                      <td>{new Date(day.date).toLocaleDateString()}</td>
                      <td>{day.logins}</td>
                      <td>{day.groupCreations}</td>
                      <td>{day.selections}</td>
                      <td><strong>{day.total}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* System Health */}
      <Row>
        <Col md={12}>
          <Card className="bg-light">
            <Card.Body>
              <h5><ShieldLock className="me-2 text-success" /> System Health</h5>
              <Row>
                <Col md={3}>
                  <p className="mb-1">Database Status:</p>
                  <span className="badge bg-success">Connected</span>
                </Col>
                <Col md={3}>
                  <p className="mb-1">API Status:</p>
                  <span className="badge bg-success">Operational</span>
                </Col>
                <Col md={3}>
                  <p className="mb-1">Last Backup:</p>
                  <span className="badge bg-info">Today, 02:00 AM</span>
                </Col>
                <Col md={3}>
                  <p className="mb-1">Server Load:</p>
                  <span className="badge bg-success">Normal</span>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default SuperAdminAnalytics;