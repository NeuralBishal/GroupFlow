import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Row, Col, Form, InputGroup, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { 
  PersonBadge, Envelope, Telephone, Grid3x3, 
  People, Search, Filter, CheckCircle, XCircle,
  Clock, Calendar
} from 'react-bootstrap-icons';
import './AdminFacultyOverview.css';

function AdminFacultyOverview() {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [showGroups, setShowGroups] = useState({});

  useEffect(() => {
    fetchFacultyDetails();
  }, []);

  const fetchFacultyDetails = async () => {
    try {
      const response = await axios.get('/admin/faculty-details/');
      if (response.data.success) {
        setFaculties(response.data.faculties);
      }
    } catch (error) {
      setError('Failed to fetch faculty details');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroups = (facultyId) => {
    setShowGroups(prev => ({
      ...prev,
      [facultyId]: !prev[facultyId]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const filteredFaculties = faculties.filter(faculty =>
    faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faculty.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (faculty) => {
    if (!faculty.is_available) {
      return <Badge bg="danger">Full</Badge>;
    }
    if (faculty.available_slots === 0) {
      return <Badge bg="warning">No Slots</Badge>;
    }
    return <Badge bg="success">Available ({faculty.available_slots} slots)</Badge>;
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Loading faculty data...</span>
      </Container>
    );
  }

  return (
    <Container className="mt-5" fluid>
      <Card className="faculty-overview-card">
        <Card.Header className="bg-primary text-white">
          <h4><PersonBadge className="me-2" /> Faculty Overview</h4>
          <p className="mb-0">View all faculties and their assigned groups</p>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Row className="mb-4">
            <Col md={6}>
              <InputGroup className="search-box">
                <InputGroup.Text>
                  <Search />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name, email, or faculty ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6}>
              <div className="stats-badge float-end">
                <strong>Total Faculties: {filteredFaculties.length}</strong>
              </div>
            </Col>
          </Row>

          <div className="faculty-list">
            {filteredFaculties.length === 0 ? (
              <Alert variant="info">No faculties found</Alert>
            ) : (
              filteredFaculties.map(faculty => (
                <Card key={faculty.id} className="mb-3 faculty-item">
                  <Card.Header 
                    className="d-flex justify-content-between align-items-center"
                    onClick={() => toggleGroups(faculty.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div>
                      <h5 className="mb-0">
                        <PersonBadge className="me-2 text-primary" />
                        {faculty.name}
                      </h5>
                      <small className="text-muted">ID: {faculty.username}</small>
                    </div>
                    <div>
                      {getStatusBadge(faculty)}
                      <Badge bg="info" className="ms-2">
                        <Grid3x3 className="me-1" /> {faculty.current_groups}/{faculty.max_groups} Groups
                      </Badge>
                    </div>
                  </Card.Header>
                  
                  <Card.Body>
                    <Row className="mb-3">
                      <Col md={4}>
                        <Envelope className="me-2 text-muted" />
                        <a href={`mailto:${faculty.email}`}>{faculty.email}</a>
                      </Col>
                      <Col md={4}>
                        <Telephone className="me-2 text-muted" />
                        {faculty.phone || 'No phone'}
                      </Col>
                      <Col md={4}>
                        <People className="me-2 text-muted" />
                        Total Groups Assigned: {faculty.current_groups}
                      </Col>
                    </Row>

                    {showGroups[faculty.id] && (
                      <div className="assigned-groups mt-3">
                        <h6>Assigned Groups:</h6>
                        {faculty.assigned_groups.length === 0 ? (
                          <Alert variant="light" className="text-center">
                            No groups assigned yet
                          </Alert>
                        ) : (
                          <Table striped bordered hover size="sm">
                            <thead>
                              <tr>
                                <th>Group ID</th>
                                <th>Domain</th>
                                <th>Topic</th>
                                <th>Submitted</th>
                                <th>Status</th>
                                <th>Members</th>
                              </tr>
                            </thead>
                            <tbody>
                              {faculty.assigned_groups.map((group, idx) => (
                                <tr key={idx}>
                                  <td>
                                    <small>{group.group_id.substring(0, 8)}...</small>
                                  </td>
                                  <td>{group.domain || 'N/A'}</td>
                                  <td>{group.topic || 'N/A'}</td>
                                  <td>
                                    <small>
                                      <Clock className="me-1" />
                                      {formatDate(group.submitted_at)}
                                    </small>
                                  </td>
                                  <td>
                                    {group.is_approved ? (
                                      <Badge bg="success">Approved</Badge>
                                    ) : (
                                      <Badge bg="warning">Pending</Badge>
                                    )}
                                  </td>
                                  <td>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      onClick={() => alert(JSON.stringify(group.members, null, 2))}
                                    >
                                      <People /> View
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        )}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              ))
            )}
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default AdminFacultyOverview;