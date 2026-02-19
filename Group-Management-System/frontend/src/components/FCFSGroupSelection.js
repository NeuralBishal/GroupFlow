import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Container, Card, Button, ListGroup, Form, 
  Row, Col, Alert, Badge, ProgressBar 
} from 'react-bootstrap';
import { Clock, CheckCircle, XCircle, HourglassSplit } from 'react-bootstrap-icons';

function FCFSGroupSelection() {
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
  const [timeLeft, setTimeLeft] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroupDetails();
    fetchAvailableFaculty();
    fetchDomains();
    fetchQueue();
  }, [groupId]);

  useEffect(() => {
    // Real-time queue updates every 2 seconds
    const interval = setInterval(fetchQueue, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchGroupDetails = async () => {
    try {
      const response = await axios.get(`/check-group-status/${groupId}/`);
      setGroup(response.data.group);
      
      if (response.data.group.selection) {
        setHasSelection(true);
        setSubmissionTime(response.data.group.selection.submitted_at);
      }
    } catch (error) {
      setError('Failed to fetch group details');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableFaculty = async () => {
    try {
      const response = await axios.get('/available-faculty/');
      setFaculty(response.data);
    } catch (error) {
      console.error('Failed to fetch faculty:', error);
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await axios.get('/domains/');
      setDomains(response.data);
    } catch (error) {
      console.error('Failed to fetch domains:', error);
    }
  };

  const fetchQueue = async () => {
    try {
      const response = await axios.get('/selection-queue/');
      setQueue(response.data.queue || []);
      
      // Find current group's position
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
      const startTime = Date.now();
      
      const response = await axios.post('/select-fcfs/', {
        group_id: groupId,
        faculty_id: selectedFaculty,
        domain_id: selectedDomain,
        topic_id: selectedTopic
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (response.data.success) {
        setSubmissionTime(response.data.submission_time);
        setQueuePosition(response.data.queue_position);
        
        toast.success(
          <div>
            <strong>✅ Selection Successful!</strong>
            <br />
            <small>Submitted at: {response.data.submission_time}</small>
            <br />
            <small>Response time: {responseTime}ms</small>
            <br />
            <small>Queue position: {response.data.queue_position}</small>
          </div>,
          { autoClose: 10000 }
        );
        
        setHasSelection(true);
        fetchQueue();
      }
    } catch (error) {
      const errorTime = new Date().toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      });
      
      setError(
        <div>
          <strong>❌ {error.response?.data?.error || 'Selection failed'}</strong>
          <br />
          <small>Failed at: {errorTime}</small>
          {error.response?.data?.faculty_current && (
            <div className="mt-2">
              Faculty: {error.response.data.faculty_current}/{error.response.data.faculty_max} groups filled
            </div>
          )}
          {error.response?.data?.topic_current && (
            <div>
              Topic: {error.response.data.topic_current}/{error.response.data.topic_max} groups filled
            </div>
          )}
        </div>
      );
      
      toast.error('Selection failed');
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <Container className="d-flex justify-content-center mt-5">
        <div className="spinner-border text-primary" role="status">
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
              <h3>FCFS Group Selection - {groupId}</h3>
            </Col>
            <Col className="text-end">
              {queuePosition && (
                <Badge bg="warning" className="p-2">
                  <HourglassSplit className="me-2" />
                  Queue Position: #{queuePosition}
                </Badge>
              )}
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Row>
            <Col md={6}>
              <h5>Group Members</h5>
              <ListGroup className="mb-4">
                {group?.members?.map((member, index) => (
                  <ListGroup.Item key={index}>
                    {member.student_details.name} ({member.student_details.roll_number})
                    {member.student_details.roll_number === group.group_leader_details.roll_number && ' (Leader)'}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Col>
            
            <Col md={6}>
              <Card className="bg-light">
                <Card.Header>
                  <h6><Clock className="me-2" /> FCFS Queue Status</h6>
                </Card.Header>
                <Card.Body style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {queue.length > 0 ? (
                    queue.map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`d-flex justify-content-between align-items-center mb-2 p-2 rounded ${
                          item.group_id === groupId ? 'bg-warning' : 'bg-white'
                        }`}
                      >
                        <div>
                          <strong>#{item.position}</strong> - {item.group_id}
                        </div>
                        <small className="text-muted">
                          {formatTimestamp(item.submitted_at)}
                        </small>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted">No selections yet</p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {hasSelection ? (
            <Alert variant="info">
              <h5>Your Group's Selections:</h5>
              <Row>
                <Col md={4}>
                  <strong>Faculty:</strong> {group.selection?.faculty_details?.name}
                </Col>
                <Col md={4}>
                  <strong>Domain:</strong> {group.selection?.domain_details?.name}
                </Col>
                <Col md={4}>
                  <strong>Topic:</strong> {group.selection?.topic_details?.name}
                </Col>
                <Col md={12} className="mt-2">
                  <small className="text-muted">
                    Submitted at: {formatTimestamp(group.selection?.submitted_at)}
                  </small>
                </Col>
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
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Form.Select>
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
                  disabled={submitting}
                  className="flex-grow-1"
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Processing...
                    </>
                  ) : (
                    'Submit Selection (FCFS)'
                  )}
                </Button>
                <Button variant="secondary" onClick={() => navigate('/student/dashboard')}>
                  Back
                </Button>
              </div>

              {submissionTime && (
                <Alert variant="success" className="mt-3">
                  <small>
                    Submitted at: <strong>{submissionTime}</strong>
                  </small>
                </Alert>
              )}
            </Form>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default FCFSGroupSelection;