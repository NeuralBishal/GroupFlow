import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';
import { CloudUpload } from 'react-bootstrap-icons';

function ImportStudents() {
  const [sheetId, setSheetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleImport = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/import-students/', {
        sheet_id: sheetId
      });
      setResult(response.data);
    } catch (error) {
      setResult({ success: false, error: error.response?.data?.error || 'Import failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Card>
        <Card.Header className="bg-primary text-white">
          <h5><CloudUpload className="me-2" /> Import Students from Google Sheet</h5>
        </Card.Header>
        <Card.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Google Sheet ID</Form.Label>
              <Form.Control
                type="text"
                value={sheetId}
                onChange={(e) => setSheetId(e.target.value)}
                placeholder="1WqCpSjIiu-_N2qsVpi9WUcFjLDsmyK5Tbps81_DWQTI"
              />
              <Form.Text className="text-muted">
                Make sure your sheet is public (Share → "Anyone with link can view")
              </Form.Text>
            </Form.Group>
            
            <Button 
              variant="primary" 
              onClick={handleImport}
              disabled={loading || !sheetId}
            >
              {loading ? 'Importing...' : 'Import Students'}
            </Button>
          </Form>

          {result && (
            <Alert className="mt-3" variant={result.success ? 'success' : 'danger'}>
              {result.success ? (
                <>✅ {result.message} (Total: {result.total})</>
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

export default ImportStudents;