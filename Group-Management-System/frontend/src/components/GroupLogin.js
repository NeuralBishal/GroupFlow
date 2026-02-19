import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';

function GroupLogin({ user }) {
  const [rollNumber, setRollNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`/check-group-status/${rollNumber}/`);
      
      if (response.data.in_group) {
        toast.success('Group found!');
        navigate(`/student/group/${response.data.group.group_id}`);  // ✅ FIXED: Added /student/ prefix
      } else {
        setError('You are not a member of any group');
        toast.error('No group found');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to check group status');
      toast.error('Check failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card style={{ width: '400px' }} className="p-4">
        <Card.Body>
          <h2 className="text-center mb-4">Group Login</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Enter your Roll Number</Form.Label>
              <Form.Control
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                required
                placeholder="Enter your roll number"
              />
            </Form.Group>

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={loading} className="flex-grow-1">
                {loading ? 'Checking...' : 'Check Group'}
              </Button>
              <Button variant="secondary" onClick={() => navigate('/student/dashboard')}>
                Back
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default GroupLogin;