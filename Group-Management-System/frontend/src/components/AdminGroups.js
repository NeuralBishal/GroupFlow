import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Form, Row, Col, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { 
  People, Grid3x3, Calendar, CheckCircle, 
  XCircle, Clock, Search, Filter 
} from 'react-bootstrap-icons';
import './AdminGroups.css'; // We'll create this for hover effects

function AdminGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('all');
  const [filterDomain, setFilterDomain] = useState('all');
  const [faculties, setFaculties] = useState([]);
  const [domains, setDomains] = useState([]);

  useEffect(() => {
    fetchGroups();
    fetchFaculties();
    fetchDomains();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get('/admin/all-groups/');
      if (response.data.success) {
        setGroups(response.data.groups);
      }
    } catch (error) {
      setError('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculties = async () => {
    try {
      const response = await axios.get('/admin/faculties/');
      setFaculties(response.data);
    } catch (error) {
      console.error('Error fetching faculties:', error);
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

  const filteredGroups = groups.filter(group => {
    const matchesSearch = 
      group.group_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.leader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.members.some(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFaculty = filterFaculty === 'all' || group.selection?.faculty === filterFaculty;
    const matchesDomain = filterDomain === 'all' || group.selection?.domain === filterDomain;
    
    return matchesSearch && matchesFaculty && matchesDomain;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Loading groups...</span>
      </Container>
    );
  }

  return (
    <Container className="mt-5" fluid>
      <Card className="dashboard-card">
        <Card.Header className="bg-primary text-white">
          <h4><People className="me-2 icon-hover" /> All Groups Overview</h4>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Row className="mb-4">
            <Col md={4}>
              <div className="search-box">
                <Search className="search-icon" />
                <Form.Control
                  type="text"
                  placeholder="Search by group ID, leader name, member name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={filterFaculty} 
                onChange={(e) => setFilterFaculty(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Faculties</option>
                {faculties.map(f => (
                  <option key={f.id} value={f.name}>{f.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={filterDomain} 
                onChange={(e) => setFilterDomain(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Domains</option>
                {domains.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <div className="stats-badge">
                <strong>Total: {filteredGroups.length}</strong>
              </div>
            </Col>
          </Row>

          <div className="groups-container">
            {filteredGroups.length === 0 ? (
              <Alert variant="info">No groups found matching your criteria.</Alert>
            ) : (
              filteredGroups.map((group, idx) => (
                <Card key={idx} className="mb-3 group-card">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong className="group-id">Group ID: {group.group_id}</strong>
                      <Badge bg={group.is_complete ? 'success' : 'warning'} className="ms-2">
                        {group.is_complete ? 'Completed' : 'Active'}
                      </Badge>
                      <Badge bg="info" className="ms-2">
                        {group.size} Members
                      </Badge>
                    </div>
                    <small className="text-muted">
                      <Calendar className="me-1" /> {formatDate(group.created_at)}
                    </small>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={4}>
                        <h6><People className="me-2" /> Group Leader</h6>
                        <div className="leader-info p-2 rounded">
                          <strong>{group.leader.name}</strong>
                          <br />
                          <small>Roll: {group.leader.roll_number}</small>
                        </div>
                      </Col>
                      <Col md={4}>
                        <h6><Grid3x3 className="me-2" /> Members</h6>
                        <div className="members-list">
                          {group.members.map((member, i) => (
                            <div key={i} className="member-item p-1">
                              {member.name} ({member.roll_number})
                              {member.roll_number === group.leader.roll_number && ' (Leader)'}
                            </div>
                          ))}
                        </div>
                      </Col>
                      <Col md={4}>
                        <h6>Selected Topic</h6>
                        {group.selection ? (
                          <div className="selection-info p-2 rounded bg-light">
                            <div><strong>Faculty:</strong> {group.selection.faculty}</div>
                            <div><strong>Domain:</strong> {group.selection.domain}</div>
                            <div><strong>Topic:</strong> {group.selection.topic}</div>
                            <div className="mt-2">
                              <small className="text-muted">
                                <Clock className="me-1" /> 
                                {formatDate(group.selection.submitted_at)}
                              </small>
                              <Badge bg={group.selection.is_approved ? 'success' : 'warning'} className="ms-2">
                                {group.selection.is_approved ? 'Approved' : 'Pending'}
                              </Badge>
                            </div>
                          </div>
                        ) : (
                          <Alert variant="light" className="text-center">
                            No selection yet
                          </Alert>
                        )}
                      </Col>
                    </Row>
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

export default AdminGroups;