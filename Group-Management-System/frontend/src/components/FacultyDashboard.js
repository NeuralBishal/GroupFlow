import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card, Button, Table, Alert } from 'react-bootstrap';

function FacultyDashboard({ user }) {
  const [assignedGroups, setAssignedGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssignedGroups();
  }, []);

  const fetchAssignedGroups = async () => {
    try {
      const response = await axios.get(`/faculty-dashboard/${user.id}/`);
      setAssignedGroups(response.data);
    } catch (error) {
      setError('Failed to fetch assigned groups');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return (
    <Container className="mt-5">
      <h2>Welcome, {user.username}!</h2>
      <p className="text-muted">Faculty Dashboard</p>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="mt-4">
        <Col md={12}>
          <Card>
            <Card.Header>
              <h4>Your Assigned Groups</h4>
            </Card.Header>
            <Card.Body>
              {assignedGroups.length === 0 ? (
                <Alert variant="info">No groups assigned to you yet.</Alert>
              ) : (
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Group ID</th>
                      <th>Domain</th>
                      <th>Topic</th>
                      <th>Selected Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedGroups.map((selection) => (
                      <tr key={selection.id}>
                        <td>{selection.group_details.group_id}</td>
                        <td>{selection.domain_details?.name || 'N/A'}</td>
                        <td>{selection.topic_details?.name || 'N/A'}</td>
                        <td>{new Date(selection.selected_at).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${selection.is_approved ? 'bg-success' : 'bg-warning'}`}>
                            {selection.is_approved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Button variant="secondary" className="mt-3" onClick={() => navigate('/')}>
        Logout
      </Button>
    </Container>
  );
}

export default FacultyDashboard;