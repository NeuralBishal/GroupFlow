import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Container, Card, Button, ListGroup, Form, Row, Col, Alert, Badge } from 'react-bootstrap';
import { Clock, HourglassSplit } from 'react-bootstrap-icons';

function GroupWindow({ user }) {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [faculty, setFaculty] = useState([]);
  const [domains, setDomains] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [hasSelection, setHasSelection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [queue, setQueue] = useState([]);
  const [queuePosition, setQueuePosition] = useState(null);
  const [submissionTime, setSubmissionTime] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.roll_number) {
      fetchGroupDetails();
      fetchAvailableFaculty();
      fetchDomains();
      fetchQueue();
    } else {
      setError('User not authenticated');
      setLoading(false);
    }
  }, [groupId, user]);

  useEffect(() => {
    const interval = setInterval(fetchQueue, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchGroupDetails = async () => {
  try {
    if (!user?.roll_number) {
      throw new Error('No user roll number');
    }
    
    const response = await axios.get(`/check-group-status/${user.roll_number}/`);
    console.log("🔥 FULL GROUP RESPONSE:", response.data);
    
    if (response.data.in_group) {
      // Log the exact structure of members
      console.log("🔥 Members data type:", typeof response.data.group.members);
      console.log("🔥 Is members array?", Array.isArray(response.data.group.members));
      console.log("🔥 Members count:", response.data.group.members?.length);
      console.log("🔥 First member:", response.data.group.members?.[0]);
      
      setGroup(response.data.group);
      if (response.data.group.selection) {
        setHasSelection(true);
        setSubmissionTime(response.data.group.selection.submitted_at);
      }
    } else {
      setError('You are not in any group');
    }
  } catch (error) {
    console.error('Failed to fetch group details:', error);
    setError('Failed to fetch group details');
  } finally {
    setLoading(false);
  }
};
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const fetchAvailableFaculty = async () => {
    try {
      const response = await axios.get('/available-faculty/');
      console.log("Faculty response:", response.data);
      setFaculty(response.data);
    } catch (error) {
      console.error('Failed to fetch faculty:', error);
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await axios.get('/domains/');
      console.log("Domains response:", response.data);
      setDomains(response.data);
    } catch (error) {
      console.error('Failed to fetch domains:', error);
    }
  };

  const fetchQueue = async () => {
    try {
      const response = await axios.get('/selection-queue/');
      setQueue(response.data.queue || []);
      
      const position = response.data.queue.findIndex(
        item => item.group_id === groupId
      ) + 1;
      setQueuePosition(position > 0 ? position : null);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    }
  };

  const handleDomainChange = async (domainId) => {
    setSelectedDomain(domainId);
    setSelectedTopic('');
    
    try {
      const response = await axios.get(`/topics/${domainId}/`);
      console.log("Topics response:", response.data);
      setTopics(response.data);
    } catch (error) {
      console.error('Failed to fetch topics:', error);
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!selectedFaculty || !selectedDomain || !selectedTopic) {
    setError('Please select all options');
    return;
  }

  setSubmitting(true);
  setError('');

  try {
    const response = await axios.post('/select-fcfs/', {
      group_id: groupId,
      faculty_id: selectedFaculty,
      domain_id: selectedDomain,
      topic_id: selectedTopic
    });

    if (response.data.success) {
      setSubmissionTime(response.data.submission_time);
      setQueuePosition(response.data.queue_position);
      
      toast.success(
        <div>
          <strong>✅ Selection Successful!</strong>
          <br />
          <small>Submitted at: {response.data.submission_time}</small>
        </div>,
        { autoClose: 5000 }
      );
      
      setHasSelection(true);
      
      // 🔥 IMPORTANT: Refresh group data to get the selection
      const groupResponse = await axios.get(`/check-group-status/${user.roll_number}/`);
      if (groupResponse.data.in_group) {
        setGroup(groupResponse.data.group);
      }
      
      fetchQueue();
    }
  } catch (error) {
    console.error('Submission error:', error);
    setError(error.response?.data?.error || 'Failed to save preferences');
    toast.error('Selection failed');
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <Container className="d-flex justify-content-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <Card>
        <Card.Header className="bg-primary text-white">
          <Row>
            <Col>
              <h3>Group Window</h3>
              <small>Group ID: {groupId}</small>
            </Col>
            {queuePosition && (
              <Col className="text-end">
                <Badge bg="warning" className="p-2">
                  <HourglassSplit className="me-2" />
                  Queue Position: #{queuePosition}
                </Badge>
              </Col>
            )}
          </Row>
        </Card.Header>
<Card.Body>
  {error && <Alert variant="danger">{error}</Alert>}

  <Row>  {/* ← ADD THIS */}
    <Col md={6}>
      <h5>Group Members</h5>
      <ListGroup className="mb-4">
        {group?.members && Array.isArray(group.members) && group.members.length > 0 ? (
          group.members.map((member, index) => {
            const studentName = member.student_details?.name || member.student?.name || member.name || 'Unknown';
            const studentRoll = member.student_details?.roll_number || member.student?.roll_number || member.roll_number || 'N/A';
            
            return (
              <ListGroup.Item key={index}>
                {studentName} ({studentRoll})
                {studentRoll === user?.roll_number && ' (You)'}
                {index === 0 && ' (Leader)'}
              </ListGroup.Item>
            );
          })
        ) : (
          <ListGroup.Item>
            <Alert variant="warning" className="mb-0">
              <strong>Debug Info:</strong><br/>
              Group exists: {group ? 'Yes' : 'No'}<br/>
              Members data: {JSON.stringify(group?.members) || 'null'}<br/>
              Members type: {typeof group?.members}<br/>
              Is array: {Array.isArray(group?.members) ? 'Yes' : 'No'}
            </Alert>
          </ListGroup.Item>
        )}
      </ListGroup>
    </Col>
    
    <Col md={6}>
      <Card className="bg-light">
        <Card.Header>
          <h6><Clock className="me-2" /> FCFS Queue</h6>
        </Card.Header>
        <Card.Body style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {/* ... queue code ... */}
        </Card.Body>
      </Card>
    </Col>
  </Row>  

{hasSelection ? (
  <Alert variant="info">
    <h5>Your Group's Selections:</h5>
    <Row>
      <Col md={4}>
        <strong>Faculty:</strong> {group?.selection_info?.faculty_name || 'Not assigned'}
      </Col>
      <Col md={4}>
        <strong>Domain:</strong> {group?.selection_info?.domain_name || 'Not assigned'}
      </Col>
      <Col md={4}>
        <strong>Topic:</strong> {group?.selection_info?.topic_name || 'Not assigned'}
      </Col>
      {group?.selection_info?.submitted_at && (
        <Col md={12} className="mt-2">
          <small className="text-muted">
            Submitted at: {formatTimestamp(group.selection_info.submitted_at)}
          </small>
        </Col>
      )}
    </Row>
  </Alert>
) : (
            <Form onSubmit={handleSubmit}>
              <h5 className="mb-3">Select Your Preferences (FCFS)</h5>
              
              <Form.Group className="mb-3">
                <Form.Label>Select Faculty</Form.Label>
                <Form.Select 
                  value={selectedFaculty} 
                  onChange={(e) => setSelectedFaculty(e.target.value)}
                  required
                >
                  <option value="">Choose faculty...</option>
                  {faculty.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.max_groups - f.current_groups} slots left)
                    </option>
                  ))}
                </Form.Select>
                {faculty.length === 0 && (
                  <Form.Text className="text-muted">
                    No faculty available. Please check back later.
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Select Domain</Form.Label>
                <Form.Select 
                  value={selectedDomain} 
                  onChange={(e) => handleDomainChange(e.target.value)}
                  required
                >
                  <option value="">Choose domain...</option>
                  {domains.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Form.Select>
                {domains.length === 0 && (
                  <Form.Text className="text-muted">
                    No domains available. Please contact administrator.
                  </Form.Text>
                )}
              </Form.Group>

              {selectedDomain && (
                <Form.Group className="mb-3">
                  <Form.Label>Select Topic</Form.Label>
                  <Form.Select 
                    value={selectedTopic} 
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    required
                  >
                    <option value="">Choose topic...</option>
                    {topics.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.max_groups - t.current_groups} slots left)
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}

              <div className="d-flex gap-2">
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={submitting || faculty.length === 0 || domains.length === 0}
                >
                  {submitting ? 'Processing...' : 'Save Preferences'}
                </Button>
                <Button variant="secondary" onClick={() => navigate('/student/dashboard')}>
                  Back to Dashboard
                </Button>
              </div>
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default GroupWindow;