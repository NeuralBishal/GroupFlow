import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { CloudUpload, PersonBadge } from 'react-bootstrap-icons';

function ImportFaculty() {
  const [sheetId, setSheetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleImport = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/import-faculty/', {
        sheet_id: sheetId
      });
      setResult(response.data);
    } catch (error) {
      setResult({ 
        success: false, 
        error: error.response?.data?.error || 'Import failed' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Card>
        <Card.Header className="bg-success text-white">
          <h5><PersonBadge className="me-2" /> Import Faculty from Google Sheet</h5>
        </Card.Header>
        <Card.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Google Sheet ID</Form.Label>
              <Form.Control
                type="text"
                value={sheetId}
                onChange={(e) => setSheetId(e.target.value)}
                placeholder="1GPXdfCqKvs16BNS8G8IIfedj97d8Q5jsWWoaLgYyOIg"
              />
              <Form.Text className="text-muted">
                Make sure your sheet is public and has columns: Name, Email (optional), Faculty ID (optional), Max Groups (optional)
              </Form.Text>
            </Form.Group>

            <Row className="mb-3">
              <Col md={6}>
                <Alert variant="info" className="small">
                  <strong>Sheet Format:</strong><br />
                  Column A: Faculty Name (required)<br />
                  Column B: Email (optional)<br />
                  Column C: Faculty ID (optional - auto-generated if blank)<br />
                  Column D: Max Groups (optional - defaults to 3)
                </Alert>
              </Col>
              <Col md={6}>
                <Alert variant="warning" className="small">
                  <strong>Example:</strong><br />
                  Dr. Sharma, sharma@college.edu, FAC001, 3<br />
                  Prof. Patel, patel@college.edu, FAC002, 3
                </Alert>
              </Col>
            </Row>
            
            <Button 
              variant="success" 
              onClick={handleImport}
              disabled={loading || !sheetId}
            >
              {loading ? 'Importing...' : 'Import Faculty'}
            </Button>
          </Form>

          {result && (
            <Alert className="mt-3" variant={result.success ? 'success' : 'danger'}>
              {result.success ? (
                <>
                  <h6>✅ {result.message}</h6>
                  <p className="mb-0">
                    New: {result.imported} | Updated: {result.updated} | Total: {result.total}
                  </p>
                </>
              ) : (
                <>❌ Error: {result.error}</>
              )}
            </Alert>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

export default ImportFaculty;