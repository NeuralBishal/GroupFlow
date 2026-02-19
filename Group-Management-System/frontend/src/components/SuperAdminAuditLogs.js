import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Form, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { Clock, FileText, Filter } from 'react-bootstrap-icons';

function SuperAdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchLogs();
  }, [filter, dateRange]);

  const fetchLogs = async () => {
    try {
      const response = await axios.get('/super-admin/audit-logs/', {
        params: { filter, ...dateRange }
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const getActionBadge = (action) => {
    const colors = {
      'LOGIN': 'success',
      'FAILED_LOGIN': 'danger',
      'CREATE_ADMIN': 'info',
      'DELETE_ADMIN': 'warning',
      'PASSWORD_RESET': 'primary',
      'EMERGENCY_RECOVERY': 'danger'
    };
    return <Badge bg={colors[action] || 'secondary'}>{action}</Badge>;
  };

  return (
    <Container className="mt-5">
      <Card>
        <Card.Header className="bg-dark text-white">
          <h4><Clock className="me-2" /> System Audit Logs</h4>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={4}>
              <Form.Group>
                <Form.Label><Filter /> Filter by Action</Form.Label>
                <Form.Select value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option value="all">All Actions</option>
                  <option value="LOGIN">Logins</option>
                  <option value="FAILED_LOGIN">Failed Logins</option>
                  <option value="CREATE_ADMIN">Admin Creation</option>
                  <option value="DELETE_ADMIN">Admin Deletion</option>
                  <option value="PASSWORD_RESET">Password Resets</option>
                  <option value="EMERGENCY_RECOVERY">Emergency Recovery</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                />
              </Form.Group>
            </Col>
          </Row>

          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>IP Address</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={index}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>{log.user}</td>
                    <td>{getActionBadge(log.action)}</td>
                    <td>{log.ip_address}</td>
                    <td>
                      <Badge bg={log.success ? 'success' : 'danger'}>
                        {log.success ? 'Success' : 'Failed'}
                      </Badge>
                    </td>
                    <td>
                      <Button 
                        variant="link" 
                        size="sm"
                        onClick={() => alert(JSON.stringify(log.details, null, 2))}
                      >
                        <FileText /> View
                      </Button>
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

export default SuperAdminAuditLogs;