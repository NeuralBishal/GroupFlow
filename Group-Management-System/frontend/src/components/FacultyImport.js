import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col, Table, Tabs, Tab } from 'react-bootstrap';
import axios from 'axios';
import { CloudUpload, CloudDownload, Grid3x3, CheckCircle } from 'react-bootstrap-icons';

function FacultyImport() {
  const [sheetId, setSheetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [facultyList, setFacultyList] = useState([]);
  const [domains, setDomains] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [activeTab, setActiveTab] = useState('import');

  useEffect(() => {
    fetchFaculty();
    fetchDomains();
  }, []);

  const fetchFaculty = async () => {
    try {
      const response = await axios.get('/admin/faculties/');
      setFacultyList(response.data);
    } catch (error) {
      console.error('Error fetching faculty:', error);
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await axios.get('/domains/');
      setDomains(response.data);
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };

const handleImport = async () => {
  setLoading(true);
  try {
    const response = await axios.post('/import-faculty/', {  // ✅ Fixed endpoint
      sheet_id: sheetId
    });
    setResult(response.data);
    fetchFaculty(); // Refresh list
  } catch (error) {
    console.error("Import error:", error);
    console.error("Error response:", error.response?.data);
    setResult({ 
      success: false, 
      error: error.response?.data?.error || 'Import failed' 
    });
  } finally {
    setLoading(false);
  }
};

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/faculty/export/?sheet_id=${sheetId}`);
      setResult({
        success: true,
        message: `✅ Exported ${response.data.data.length} faculty members`,
        data: response.data.data
      });
    } catch (error) {
      setResult({ 
        success: false, 
        error: error.response?.data?.error || 'Export failed' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDomain = async () => {
    if (!selectedFaculty || !selectedDomain) {
      alert('Please select both faculty and domain');
      return;
    }

    try {
      const response = await axios.post('/faculty/assign-domain/', {
        faculty_id: selectedFaculty,
        domain_id: selectedDomain
      });

      if (response.data.success) {
        alert('Domain assigned successfully!');
        setSelectedFaculty(null);
        setSelectedDomain('');
      }
    } catch (error) {
      alert('Failed to assign domain');
    }
  };

  return (
    <Container className="mt-5">
      <Card>
        <Card.Header className="bg-primary text-white">
          <h4>Faculty Management</h4>
        </Card.Header>
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
          >
            <Tab eventKey="import" title="Import/Export">
              <Row className="mb-4">
                <Col md={8}>
                  <Form.Group>
                    <Form.Label>Google Sheet ID</Form.Label>
                    <Form.Control
                      type="text"
                      value={sheetId}
                      onChange={(e) => setSheetId(e.target.value)}
                      placeholder="Enter Google Sheet ID"
                    />
                    <Form.Text className="text-muted">
                      Sheet should have columns: Name, Email, Faculty ID, Max Groups
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={4} className="d-flex align-items-end">
                  <Button 
                    variant="success" 
                    onClick={handleImport}
                    disabled={loading || !sheetId}
                    className="me-2"
                  >
                    <CloudUpload className="me-2" /> Import
                  </Button>
                  <Button 
                    variant="info" 
                    onClick={handleExport}
                    disabled={loading || !sheetId}
                  >
                    <CloudDownload className="me-2" /> Export
                  </Button>
                </Col>
              </Row>

              {result && (
                <Alert variant={result.success ? 'success' : 'danger'}>
                  {result.success ? (
                    <>
                      <h6>✅ {result.message}</h6>
                      {result.data && (
                        <Table size="sm" className="mt-3">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Faculty ID</th>
                              <th>Email</th>
                              <th>Max Groups</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.data.slice(0, 5).map((f, i) => (
                              <tr key={i}>
                                <td>{f.Name}</td>
                                <td>{f['Faculty ID']}</td>
                                <td>{f.Email}</td>
                                <td>{f['Max Groups']}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      )}
                    </>
                  ) : (
                    <>❌ {result.error}</>
                  )}
                </Alert>
              )}
            </Tab>

            <Tab eventKey="assign" title="Assign Domains">
              <Row>
                <Col md={6}>
                  <Card>
                    <Card.Header>Select Faculty</Card.Header>
                    <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {facultyList.map(f => (
                        <div 
                          key={f.id}
                          className={`p-2 mb-2 border rounded ${selectedFaculty === f.id ? 'bg-primary text-white' : 'bg-light'}`}
                          onClick={() => setSelectedFaculty(f.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <strong>{f.name}</strong>
                          <br />
                          <small>{f.email}</small>
                          <br />
                          <small>Groups: {f.current_groups}/{f.max_groups}</small>
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card>
                    <Card.Header>Select Domain</Card.Header>
                    <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {domains.map(d => (
                        <div 
                          key={d.id}
                          className={`p-2 mb-2 border rounded ${selectedDomain === d.id ? 'bg-success text-white' : 'bg-light'}`}
                          onClick={() => setSelectedDomain(d.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <strong>{d.name}</strong>
                          <br />
                          <small>{d.description}</small>
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row className="mt-3">
                <Col className="text-center">
                  <Button 
                    variant="primary" 
                    onClick={handleAssignDomain}
                    disabled={!selectedFaculty || !selectedDomain}
                  >
                    <CheckCircle className="me-2" /> Assign Domain to Faculty
                  </Button>
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default FacultyImport;