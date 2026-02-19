import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { ShieldLock, Person, Key } from 'react-bootstrap-icons';

function AdminLogin({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/login/', {
        username,
        password
      });

      if (response.data.success && response.data.user.role === 'admin') {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success('Admin login successful!');
        navigate('/admin/dashboard');
      } else {
        setError('Invalid admin credentials');
        toast.error('Login failed');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed. Please try again.');
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '400px' }} className="p-4 shadow-lg border-0">
        <Card.Body>
          <div className="text-center mb-4">
            <ShieldLock size={50} className="text-primary mb-3" />
            <h2 className="text-primary">Administrator Login</h2>
            <p className="text-muted">Group Management System</p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Admin Username</Form.Label>
              <div className="d-flex align-items-center border rounded p-2">
                <Person className="text-muted me-2" />
                <Form.Control
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Enter admin username"
                  className="border-0 p-0"
                  style={{ boxShadow: 'none' }}
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <div className="d-flex align-items-center border rounded p-2">
                <Key className="text-muted me-2" />
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter admin password"
                  className="border-0 p-0"
                  style={{ boxShadow: 'none' }}
                />
              </div>
            </Form.Group>

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 py-2 fw-bold"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login as Administrator'}
            </Button>
          </Form>

          <div className="text-center mt-4">
            <Link to="/admin/forgot-password" className="text-decoration-none">
              <small>Forgot Password?</small>
            </Link>
          </div>

          <hr className="my-4" />

          <div className="text-center">
            <Link to="/" className="text-decoration-none">
              <small>← Back to Home</small>
            </Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default AdminLogin;