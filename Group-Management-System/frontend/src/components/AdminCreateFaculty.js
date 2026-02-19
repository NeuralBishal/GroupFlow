import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Container, Form, Button, Card, Alert, Table } from 'react-bootstrap';

function AdminCreateFaculty({ user }) {
  const [faculties, setFaculties] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'faculty123',
    faculty_id: '',
    max_groups: 3
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    try {
      const response = await axios.get('/faculties/');
      setFaculties(response.data);
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/admin/create-faculty/', formData);
      
      if (response.data.success) {
        toast.success('Faculty created successfully!');
        setFormData({
          name: '',
          email: '',
          password: 'faculty123',
          faculty_id: '',
          max_groups: 3
        });
        fetchFaculties(); // Refresh list
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create faculty');
      toast.error('Creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Card className="mb-4">
        <Card.Header>
          <h3>Create Faculty Account</h3>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Faculty Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Dr. Sharma"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Faculty ID</Form.Label>
                  <Form.Control
                    type="text"
                    name="faculty_id"
                    value={formData.faculty_id}
                    onChange={handleChange}
                    required
                    placeholder="FAC001"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="faculty@college.edu"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Max Groups Allowed</Form.Label>
                  <Form.Control
                    type="number"
                    name="max_groups"
                    value={formData.max_groups}
                    onChange={handleChange}
                    required
                    min="1"
                    max="10"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Default Password</Form.Label>
              <Form.Control
                type="text"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <Form.Text className="text-muted">
                Faculty can change password after first login
              </Form.Text>
            </Form.Group>

            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Faculty'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h4>Existing Faculties</h4>
        </Card.Header>
        <Card.Body>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Faculty ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Max Groups</th>
                <th>Current Groups</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {faculties.map(f => (
                <tr key={f.id}>
                  <td>{f.faculty_id}</td>
                  <td>{f.name}</td>
                  <td>{f.email}</td>
                  <td>{f.max_groups}</td>
                  <td>{f.current_groups}</td>
                  <td>
                    <span className={`badge ${f.is_available ? 'bg-success' : 'bg-danger'}`}>
                      {f.is_available ? 'Available' : 'Full'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default AdminCreateFaculty;