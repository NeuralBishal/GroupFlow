import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Form, Row, Col, Spinner, Alert, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import { 
  People, PersonCheck, PersonX, Search, 
  Filter, Grid3x3, CheckCircle, XCircle 
} from 'react-bootstrap-icons';
import './AdminStudents.css';

function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/admin/all-students/');
      if (response.data.success) {
        setStudents(response.data.students);
      }
    } catch (error) {
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterGroup === 'all') return matchesSearch;
    if (filterGroup === 'ingroup') return matchesSearch && student.group;
    if (filterGroup === 'nogroup') return matchesSearch && !student.group;
    return matchesSearch;
  });

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Loading students...</span>
      </Container>
    );
  }

  return (
    <Container className="mt-5" fluid>
      <Card className="dashboard-card">
        <Card.Header className="bg-success text-white">
          <h4><People className="me-2 icon-hover" /> All Students Overview</h4>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Row className="mb-4">
            <Col md={5}>
              <InputGroup className="search-group">
                <InputGroup.Text className="bg-white">
                  <Search />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name, roll number, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text className="bg-white">
                  <Filter />
                </InputGroup.Text>
                <Form.Select 
                  value={filterGroup} 
                  onChange={(e) => setFilterGroup(e.target.value)}
                >
                  <option value="all">All Students</option>
                  <option value="ingroup">In a Group</option>
                  <option value="nogroup">Not in any Group</option>
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={3}>
              <div className="stats-badge float-end">
                <strong>Total: {filteredStudents.length}</strong>
              </div>
            </Col>
          </Row>

          <div className="students-table-container">
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Roll Number</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Group</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <tr key={student.id} className="student-row">
                    <td>{index + 1}</td>
                    <td>
                      <strong>{student.name}</strong>
                      {!student.is_verified && (
                        <Badge bg="warning" className="ms-2">Unverified</Badge>
                      )}
                    </td>
                    <td>{student.roll_number}</td>
                    <td>{student.email}</td>
                    <td>
                      {student.is_verified ? (
                        <Badge bg="success">
                          <CheckCircle className="me-1" /> Verified
                        </Badge>
                      ) : (
                        <Badge bg="warning">
                          <XCircle className="me-1" /> Pending
                        </Badge>
                      )}
                    </td>
                    <td>
                      {student.group ? (
                        <div>
                          <Badge bg="info" className="group-badge">
                            <Grid3x3 className="me-1" /> 
                            {student.group.group_id.substring(0, 8)}...
                          </Badge>
                          {student.is_group_leader && (
                            <Badge bg="warning" className="ms-2">Leader</Badge>
                          )}
                        </div>
                      ) : (
                        <Badge bg="secondary">Not in group</Badge>
                      )}
                    </td>
                    <td>
                      {student.is_group_leader ? (
                        <Badge bg="primary">Group Leader</Badge>
                      ) : (
                        <Badge bg="secondary">Member</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default AdminStudents;