import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Form, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { 
  ShieldLock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Download,
  Filter
} from 'react-bootstrap-icons';

function SecurityAudit() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchAuditLogs();
  }, [filter, dateRange]);

  const fetchAuditLogs = async () => {
    try {
      const response = await axios.get('/superadmin/audit-logs/', {
        params: { filter, ...dateRange }
      });
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const getSeverityBadge = (severity) => {
    const badges = {
      'critical': 'danger',
      'high': 'warning',
      'medium': 'info',
      'low': 'secondary'
    };
    return <Badge bg={badges[severity]}>{severity}</Badge>;
  };

  return (
    <Container className="mt-5" fluid>
      <Card className="shadow">
        <Card.Header className="bg-dark text-white">
          <h4><ShieldLock className="me-2" /> Security Audit Log</h4>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Filter by Severity</Form.Label>
                <Form.Select value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option value="all">All Events</option>
                  <option value="critical">Critical Only</option>
                  <option value="high">High Severity</option>
                  <option value="medium">Medium Severity</option>
                  <option value="low">Low Severity</option>
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
              <thead className="sticky-top bg-light">
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>IP Address</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={index}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>{log.user}</td>
                    <td>{log.action}</td>
                    <td>{log.ip_address}</td>
                    <td>{getSeverityBadge(log.severity)}</td>
                    <td>
                      {log.success ? 
                        <CheckCircle className="text-success" /> : 
                        <XCircle className="text-danger" />
                      }
                    </td>
                    <td>
                      <Button 
                        variant="link" 
                        size="sm"
                        onClick={() => alert(JSON.stringify(log.details, null, 2))}
                      >
                        View
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

export default SecurityAudit;