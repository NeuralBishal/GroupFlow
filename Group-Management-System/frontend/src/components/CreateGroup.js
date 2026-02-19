import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Container, Form, Button, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';

function CreateGroup({ user }) {
  const [groupSize, setGroupSize] = useState(2);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingName, setFetchingName] = useState({});
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSizeChange = (size) => {
    setGroupSize(size);
    // Reset members array
    const newMembers = [];
    for (let i = 0; i < size - 1; i++) {
      newMembers.push({ roll_number: '', name: '', fetching: false });
    }
    setMembers(newMembers);
    setFetchingName({});
  };

  const handleMemberChange = (index, field, value) => {
    const updatedMembers = [...members];
    updatedMembers[index][field] = value;
    setMembers(updatedMembers);
  };

  const fetchStudentName = async (index, rollNumber) => {
    if (!rollNumber || rollNumber.trim() === '') return;
    
    // Don't fetch if already fetching for this index
    if (fetchingName[index]) return;
    
    setFetchingName(prev => ({ ...prev, [index]: true }));
    
    try {
      // You need to create this endpoint in your backend
      const response = await axios.get(`/get-student-name/${rollNumber}/`);
      
      if (response.data.success) {
        const updatedMembers = [...members];
        updatedMembers[index].name = response.data.name;
        setMembers(updatedMembers);
      } else {
        toast.warning(`Student with roll ${rollNumber} not found`);
      }
    } catch (error) {
      console.error('Error fetching student name:', error);
      toast.error(`Failed to fetch name for roll ${rollNumber}`);
    } finally {
      setFetchingName(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleRollBlur = (index, rollNumber) => {
    fetchStudentName(index, rollNumber);
  };

  const handleRollKeyPress = (e, index, rollNumber) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      fetchStudentName(index, rollNumber);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate all fields are filled
    for (let member of members) {
      if (!member.roll_number || !member.name) {
        setError('Please fill in all member details');
        setLoading(false);
        return;
      }
    }

    // Prevent adding self as member
    const isSelfInMembers = members.some(m => m.roll_number === user.roll_number);
    if (isSelfInMembers) {
      setError('You cannot add yourself as a member. You are already the group leader.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/create-group/', {
        leader_roll_number: user.roll_number,
        group_size: groupSize,
        members: members.map(m => ({ roll_number: m.roll_number, name: m.name }))
      });

      if (response.data.success) {
        toast.success('Group created successfully!');
        navigate('/student/group-login');
      }
    } catch (error) {
      console.error("Error response:", error.response?.data);
      setError(error.response?.data?.error || 'Failed to create group');
      toast.error('Group creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Card>
        <Card.Body>
          <h2 className="text-center mb-4">Create Group</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label>Group Size</Form.Label>
              <div>
                <Form.Check
                  inline
                  type="radio"
                  label="2 Members"
                  name="groupSize"
                  checked={groupSize === 2}
                  onChange={() => handleSizeChange(2)}
                />
                <Form.Check
                  inline
                  type="radio"
                  label="4 Members"
                  name="groupSize"
                  checked={groupSize === 4}
                  onChange={() => handleSizeChange(4)}
                />
              </div>
            </Form.Group>

            <h5>Group Members (excluding you)</h5>
            {members.map((member, index) => (
              <Row key={index} className="mb-3">
                <Col md={5}>
                  <Form.Control
                    type="text"
                    placeholder="Roll Number"
                    value={member.roll_number}
                    onChange={(e) => handleMemberChange(index, 'roll_number', e.target.value)}
                    onBlur={(e) => handleRollBlur(index, e.target.value)}
                    onKeyPress={(e) => handleRollKeyPress(e, index, member.roll_number)}
                    required
                  />
                </Col>
                <Col md={5}>
                  <div className="d-flex align-items-center">
                    <Form.Control
                      type="text"
                      placeholder="Name (auto-fetched)"
                      value={member.name}
                      onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                      readOnly={fetchingName[index]}
                      required
                    />
                    {fetchingName[index] && (
                      <Spinner animation="border" size="sm" className="ms-2" />
                    )}
                  </div>
                </Col>
                <Col md={2}>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => fetchStudentName(index, member.roll_number)}
                    disabled={!member.roll_number || fetchingName[index]}
                  >
                    Fetch
                  </Button>
                </Col>
              </Row>
            ))}

            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Group'}
              </Button>
              <Button variant="secondary" onClick={() => navigate('/student/dashboard')}>
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default CreateGroup;