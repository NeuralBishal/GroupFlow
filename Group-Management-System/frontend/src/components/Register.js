import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Container, Form, Button, Card, Alert, InputGroup, Row, Col } from 'react-bootstrap';
import { Person, Envelope, Key, Telephone, Fingerprint } from 'react-bootstrap-icons';

function Register({ setUser }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    roll_number: '',
    name: '',
    email: '',
    phone: ''  // New field
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/register/', {
        username: formData.username,
        password: formData.password,
        roll_number: formData.roll_number,
        name: formData.name,
        email: formData.email,
        phone: formData.phone  // Include phone
      });

      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success('Registration successful!');
        navigate('/student/dashboard');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '500px' }} className="p-4 shadow">
        <Card.Body>
          <h2 className="text-center mb-4">Student Registration</h2>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <InputGroup>
                    <InputGroup.Text><Person /></InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Your name"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Roll Number</Form.Label>
                  <Form.Control
                    type="text"
                    name="roll_number"
                    value={formData.roll_number}
                    onChange={handleChange}
                    required
                    placeholder="e.g., CS101"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <InputGroup>
                <InputGroup.Text><Fingerprint /></InputGroup.Text>
                <Form.Control
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Choose username"
                />
              </InputGroup>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <InputGroup>
                    <InputGroup.Text><Envelope /></InputGroup.Text>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone (for recovery)</Form.Label>
                  <InputGroup>
                    <InputGroup.Text><Telephone /></InputGroup.Text>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1234567890"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <InputGroup>
                    <InputGroup.Text><Key /></InputGroup.Text>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Password"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm password"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Button 
              type="submit" 
              variant="primary" 
              className="w-100 mt-3"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </Form>

          <div className="text-center mt-3">
            Already have an account? <Link to="/student/login">Login here</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Register;