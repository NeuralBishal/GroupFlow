import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Container, Card, Form, Button, Table, Alert, Row, Col, Modal } from 'react-bootstrap';

function ManageDomains() {
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // New domain form
  const [domainForm, setDomainForm] = useState({
    name: '',
    description: ''
  });

  // New topic form
  const [topicForm, setTopicForm] = useState({
    name: '',
    description: '',
    max_groups: 3
  });

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const response = await axios.get('/domains/');
      setDomains(response.data);
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };

  const handleDomainSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/admin/create-domain/', domainForm);
      
      if (response.data) {
        toast.success('Domain created successfully!');
        setDomainForm({ name: '', description: '' });
        fetchDomains();
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create domain');
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`/admin/create-topic/${selectedDomain.id}/`, topicForm);
      
      if (response.data) {
        toast.success('Topic created successfully!');
        setShowTopicModal(false);
        setTopicForm({ name: '', description: '', max_groups: 3 });
        fetchDomains(); // Refresh to show new topic
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create topic');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Row>
        <Col md={5}>
          <Card className="mb-4">
            <Card.Header>
              <h4>Create New Domain</h4>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Form onSubmit={handleDomainSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Domain Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={domainForm.name}
                    onChange={(e) => setDomainForm({...domainForm, name: e.target.value})}
                    required
                    placeholder="e.g., Artificial Intelligence"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={domainForm.description}
                    onChange={(e) => setDomainForm({...domainForm, description: e.target.value})}
                    placeholder="Describe the domain"
                  />
                </Form.Group>

                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Domain'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={7}>
          <Card>
            <Card.Header>
              <h4>Domains & Topics</h4>
            </Card.Header>
            <Card.Body>
              {domains.map(domain => (
                <Card key={domain.id} className="mb-3">
                  <Card.Header>
                    <strong>{domain.name}</strong>
                    <Button 
                      variant="success" 
                      size="sm" 
                      className="float-end"
                      onClick={() => {
                        setSelectedDomain(domain);
                        setShowTopicModal(true);
                      }}
                    >
                      + Add Topic
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    <p>{domain.description}</p>
                    <h6>Topics:</h6>
                    <ul>
                      {domain.topics?.map(topic => (
                        <li key={topic.id}>
                          {topic.name} - {topic.description} 
                          <span className="badge bg-info ms-2">
                            {topic.max_groups - topic.current_groups} slots left
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Card.Body>
                </Card>
              ))}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add Topic Modal */}
      <Modal show={showTopicModal} onHide={() => setShowTopicModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Topic to {selectedDomain?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleTopicSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Topic Name</Form.Label>
              <Form.Control
                type="text"
                value={topicForm.name}
                onChange={(e) => setTopicForm({...topicForm, name: e.target.value})}
                required
                placeholder="e.g., Machine Learning"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={topicForm.description}
                onChange={(e) => setTopicForm({...topicForm, description: e.target.value})}
                placeholder="Describe the topic"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Maximum Groups Allowed</Form.Label>
              <Form.Control
                type="number"
                value={topicForm.max_groups}
                onChange={(e) => setTopicForm({...topicForm, max_groups: parseInt(e.target.value)})}
                min="1"
                max="10"
                required
              />
            </Form.Group>

            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Topic'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default ManageDomains;