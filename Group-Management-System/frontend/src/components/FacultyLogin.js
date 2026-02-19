import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';

function FacultyLogin({ setUser }) {
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

      if (response.data.success && response.data.user.role === 'faculty') {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        toast.success('Faculty login successful!');
        
        // Redirect to change password if first login
        if (response.data.user.is_first_login) {
          navigate('/change-password');
        } else {
          navigate('/faculty/dashboard');
        }
      } else {
        setError('Invalid faculty credentials');
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
          <h2 className="text-center mb-4 text-success">Faculty Login</h2>
          <p className="text-muted text-center">Group Management System</p>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Faculty ID</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your faculty ID"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </Form.Group>

            <Button 
              variant="success" 
              type="submit" 
              className="w-100 py-2 fw-bold"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Form>

          <div className="mt-4 text-center">
            <Alert variant="info" className="py-3">
              <small>
                <strong>🔑 First time login?</strong><br />
                Use your faculty ID as username and <strong>faculty123</strong> as password<br />
                <strong>Example:</strong> Username: <code>1</code>, Password: <code>faculty123</code><br />
                <span className="text-warning">⚠️ You'll be asked to change password</span>
              </small>
            </Alert>
          </div>

          <div className="mt-3 text-center">
            <Link to="/admin/forgot-password" className="text-decoration-none">
              <small>Forgot Password?</small>
            </Link>
            <br />
            <Link to="/" className="text-muted text-decoration-none">
              <small>← Back to Home</small>
            </Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default FacultyLogin;