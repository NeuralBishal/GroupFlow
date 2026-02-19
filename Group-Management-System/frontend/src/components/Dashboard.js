import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { Gear } from 'react-bootstrap-icons';

function Dashboard({ user }) {
  const navigate = useNavigate();

  const handleCreateGroup = () => {
    navigate('/student/create-group');
  };

  const handleGroupLogin = () => {
    navigate('/student/group-login');
  };

  const handleSettings = () => {
    navigate('/student/settings');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  if (user?.role === 'faculty') {
    return (
      <Container className="mt-5">
        <h2>Faculty Dashboard</h2>
        <Row>
          <Col md={4}>
            <Card>
              <Card.Body>
                <Card.Title>View Assigned Groups</Card.Title>
                <Card.Text>
                  View all groups assigned to you and their selected topics.
                </Card.Text>
                <Button 
                  variant="primary" 
                  onClick={() => navigate(`/faculty-dashboard/${user.id}`)}
                >
                  View Groups
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Button variant="danger" className="mt-3" onClick={handleLogout}>
          Logout
        </Button>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Welcome, {user?.username}!</h2>
        <Button variant="outline-secondary" onClick={handleSettings}>
          <Gear className="me-2" /> Settings
        </Button>
      </div>

      <Row className="mt-4">
        <Col md={6}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Create Group</Card.Title>
              <Card.Text>
                Create a new group with 2 or 4 members. You must be the group leader.
              </Card.Text>
              <Button variant="primary" onClick={handleCreateGroup}>
                Create Group
              </Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Group Login</Card.Title>
              <Card.Text>
                Access your existing group to select faculty, domain, and topic.
              </Card.Text>
              <Button variant="success" onClick={handleGroupLogin}>
                Group Login
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {user?.is_first_login && (
        <Alert variant="warning" className="mt-3">
          <Alert.Heading>⚠️ First Login Detected!</Alert.Heading>
          <p>
            Please go to <strong>Settings</strong> to change your default password.
          </p>
        </Alert>
      )}

      <Button variant="danger" className="mt-3" onClick={handleLogout}>
        Logout
      </Button>
    </Container>
  );
}

export default Dashboard;