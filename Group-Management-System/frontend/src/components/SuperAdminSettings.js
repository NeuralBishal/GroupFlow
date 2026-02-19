import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tabs, Tab, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Gear, ShieldLock, Bell, Eye, EyeSlash, 
  Save, ArrowRepeat, Envelope, Smartphone,
  Globe, Database, Server, Key, Clock,
  Cloud, Lock, Person, Telephone, EnvelopeFill
} from 'react-bootstrap-icons';

function SuperAdminSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState({});
  
  const [settings, setSettings] = useState({
    general: {
      siteName: 'GroupFlow',
      siteUrl: 'http://localhost:3000',
      adminEmail: 'admin@groupflow.com',
      timezone: 'Asia/Kolkata',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h'
    },
    security: {
      sessionTimeout: 30, // minutes
      maxLoginAttempts: 5,
      lockoutDuration: 15, // minutes
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSpecial: true,
      twoFactorRequired: false,
      sessionPerUser: true,
      ipWhitelist: []
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'noreply@groupflow.com',
      smtpPassword: '',
      useTLS: true,
      fromEmail: 'noreply@groupflow.com',
      fromName: 'GroupFlow System'
    },
    features: {
      allowStudentRegistration: true,
      allowFacultyRegistration: false,
      requireEmailVerification: true,
      requirePhoneVerification: false,
      maxGroupSize: 4,
      minGroupSize: 2,
      allowTopicSelection: true,
      maxGroupsPerTopic: 3,
      maxGroupsPerFaculty: 3
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily', // daily, weekly, monthly
      backupTime: '02:00',
      retentionDays: 30,
      lastBackup: null
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      adminAlerts: true,
      securityAlerts: true,
      backupAlerts: true,
      dailyDigest: false
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/super-admin/settings/');
      if (response.data) {
        setSettings(response.data);
      }
    } catch (error) {
      toast.error('Failed to load settings');
      console.error('Settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await axios.post('/super-admin/settings/', settings);
      if (response.data.success) {
        toast.success('✅ Settings saved successfully!');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (window.confirm('Are you sure? This will reset all settings to default values.')) {
      try {
        const response = await axios.post('/super-admin/settings/reset/');
        if (response.data.success) {
          setSettings(response.data.settings);
          toast.info('Settings reset to defaults');
        }
      } catch (error) {
        toast.error('Failed to reset settings');
      }
    }
  };

  const handleGeneralChange = (field, value) => {
    setSettings({
      ...settings,
      general: { ...settings.general, [field]: value }
    });
  };

  const handleSecurityChange = (field, value) => {
    setSettings({
      ...settings,
      security: { ...settings.security, [field]: value }
    });
  };

  const handleEmailChange = (field, value) => {
    setSettings({
      ...settings,
      email: { ...settings.email, [field]: value }
    });
  };

  const handleFeaturesChange = (field, value) => {
    setSettings({
      ...settings,
      features: { ...settings.features, [field]: value }
    });
  };

  const handleBackupChange = (field, value) => {
    setSettings({
      ...settings,
      backup: { ...settings.backup, [field]: value }
    });
  };

  const handleNotificationsChange = (field, value) => {
    setSettings({
      ...settings,
      notifications: { ...settings.notifications, [field]: value }
    });
  };

  const testEmailConnection = async () => {
    try {
      const response = await axios.post('/super-admin/test-email/', settings.email);
      if (response.data.success) {
        toast.success('✅ Email configuration working!');
      }
    } catch (error) {
      toast.error('Email test failed');
    }
  };

  const runBackup = async () => {
    if (window.confirm('Start manual backup now?')) {
      try {
        const response = await axios.post('/super-admin/backup/');
        if (response.data.success) {
          toast.success('✅ Backup completed successfully!');
          fetchSettings();
        }
      } catch (error) {
        toast.error('Backup failed');
      }
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-5" fluid>
      <Card>
        <Card.Header className="bg-primary text-white">
          <Row>
            <Col>
              <h3><Gear className="me-2" /> System Settings</h3>
            </Col>
            <Col className="text-end">
              <Button 
                variant="light" 
                onClick={resetToDefaults}
                className="me-2"
              >
                <ArrowRepeat /> Reset to Defaults
              </Button>
              <Button 
                variant="success" 
                onClick={saveSettings}
                disabled={saving}
              >
                <Save /> {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
            fill
          >
            {/* General Settings Tab */}
            <Tab eventKey="general" title="General">
              <Card className="border-0">
                <Card.Body>
                  <h5 className="mb-4"><Globe className="me-2" /> General Configuration</h5>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Site Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={settings.general.siteName}
                          onChange={(e) => handleGeneralChange('siteName', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Site URL</Form.Label>
                        <Form.Control
                          type="url"
                          value={settings.general.siteUrl}
                          onChange={(e) => handleGeneralChange('siteUrl', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Admin Email</Form.Label>
                        <Form.Control
                          type="email"
                          value={settings.general.adminEmail}
                          onChange={(e) => handleGeneralChange('adminEmail', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Timezone</Form.Label>
                        <Form.Select
                          value={settings.general.timezone}
                          onChange={(e) => handleGeneralChange('timezone', e.target.value)}
                        >
                          <option value="Asia/Kolkata">India (IST)</option>
                          <option value="America/New_York">US Eastern (EST)</option>
                          <option value="America/Los_Angeles">US Pacific (PST)</option>
                          <option value="Europe/London">UK (GMT)</option>
                          <option value="Europe/Paris">Central Europe (CET)</option>
                          <option value="Asia/Dubai">UAE (GST)</option>
                          <option value="Asia/Singapore">Singapore (SGT)</option>
                          <option value="Australia/Sydney">Australia (AEST)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Date Format</Form.Label>
                        <Form.Select
                          value={settings.general.dateFormat}
                          onChange={(e) => handleGeneralChange('dateFormat', e.target.value)}
                        >
                          <option value="YYYY-MM-DD">2024-12-31</option>
                          <option value="DD/MM/YYYY">31/12/2024</option>
                          <option value="MM/DD/YYYY">12/31/2024</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Time Format</Form.Label>
                        <Form.Select
                          value={settings.general.timeFormat}
                          onChange={(e) => handleGeneralChange('timeFormat', e.target.value)}
                        >
                          <option value="24h">24 Hour (14:30)</option>
                          <option value="12h">12 Hour (2:30 PM)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Tab>

            {/* Security Settings Tab */}
            <Tab eventKey="security" title="Security">
              <Card className="border-0">
                <Card.Body>
                  <h5 className="mb-4"><ShieldLock className="me-2" /> Security Configuration</h5>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Session Timeout (minutes)</Form.Label>
                        <Form.Control
                          type="number"
                          value={settings.security.sessionTimeout}
                          onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value))}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Max Login Attempts</Form.Label>
                        <Form.Control
                          type="number"
                          value={settings.security.maxLoginAttempts}
                          onChange={(e) => handleSecurityChange('maxLoginAttempts', parseInt(e.target.value))}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Lockout Duration (minutes)</Form.Label>
                        <Form.Control
                          type="number"
                          value={settings.security.lockoutDuration}
                          onChange={(e) => handleSecurityChange('lockoutDuration', parseInt(e.target.value))}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <h6 className="mt-4 mb-3">Password Policy</h6>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Minimum Password Length</Form.Label>
                        <Form.Control
                          type="number"
                          value={settings.security.passwordMinLength}
                          onChange={(e) => handleSecurityChange('passwordMinLength', parseInt(e.target.value))}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={8}>
                      <Form.Group className="mb-3">
                        <Form.Label>Password Requirements</Form.Label>
                        <div>
                          <Form.Check
                            type="checkbox"
                            label="Require Uppercase Letters"
                            checked={settings.security.passwordRequireUppercase}
                            onChange={(e) => handleSecurityChange('passwordRequireUppercase', e.target.checked)}
                            className="mb-2"
                          />
                          <Form.Check
                            type="checkbox"
                            label="Require Lowercase Letters"
                            checked={settings.security.passwordRequireLowercase}
                            onChange={(e) => handleSecurityChange('passwordRequireLowercase', e.target.checked)}
                            className="mb-2"
                          />
                          <Form.Check
                            type="checkbox"
                            label="Require Numbers"
                            checked={settings.security.passwordRequireNumbers}
                            onChange={(e) => handleSecurityChange('passwordRequireNumbers', e.target.checked)}
                            className="mb-2"
                          />
                          <Form.Check
                            type="checkbox"
                            label="Require Special Characters"
                            checked={settings.security.passwordRequireSpecial}
                            onChange={(e) => handleSecurityChange('passwordRequireSpecial', e.target.checked)}
                            className="mb-2"
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mt-3">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          label="Require Two-Factor Authentication for Admins"
                          checked={settings.security.twoFactorRequired}
                          onChange={(e) => handleSecurityChange('twoFactorRequired', e.target.checked)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          label="One Session Per User"
                          checked={settings.security.sessionPerUser}
                          onChange={(e) => handleSecurityChange('sessionPerUser', e.target.checked)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Tab>

            {/* Email Settings Tab */}
            <Tab eventKey="email" title="Email">
              <Card className="border-0">
                <Card.Body>
                  <h5 className="mb-4"><Envelope className="me-2" /> Email Configuration</h5>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>SMTP Host</Form.Label>
                        <Form.Control
                          type="text"
                          value={settings.email.smtpHost}
                          onChange={(e) => handleEmailChange('smtpHost', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>SMTP Port</Form.Label>
                        <Form.Control
                          type="number"
                          value={settings.email.smtpPort}
                          onChange={(e) => handleEmailChange('smtpPort', parseInt(e.target.value))}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Encryption</Form.Label>
                        <Form.Select
                          value={settings.email.useTLS ? 'tls' : 'none'}
                          onChange={(e) => handleEmailChange('useTLS', e.target.value === 'tls')}
                        >
                          <option value="none">None</option>
                          <option value="tls">TLS</option>
                          <option value="ssl">SSL</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>SMTP Username</Form.Label>
                        <Form.Control
                          type="text"
                          value={settings.email.smtpUser}
                          onChange={(e) => handleEmailChange('smtpUser', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>SMTP Password</Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showPassword.smtp ? "text" : "password"}
                            value={settings.email.smtpPassword}
                            onChange={(e) => handleEmailChange('smtpPassword', e.target.value)}
                          />
                          <Button 
                            variant="outline-secondary"
                            onClick={() => setShowPassword({...showPassword, smtp: !showPassword.smtp})}
                          >
                            {showPassword.smtp ? <EyeSlash /> : <Eye />}
                          </Button>
                        </InputGroup>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>From Email</Form.Label>
                        <Form.Control
                          type="email"
                          value={settings.email.fromEmail}
                          onChange={(e) => handleEmailChange('fromEmail', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>From Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={settings.email.fromName}
                          onChange={(e) => handleEmailChange('fromName', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Button variant="info" onClick={testEmailConnection}>
                    Test Email Connection
                  </Button>
                </Card.Body>
              </Card>
            </Tab>

            {/* Features Tab */}
            <Tab eventKey="features" title="Features">
              <Card className="border-0">
                <Card.Body>
                  <h5 className="mb-4"><Server className="me-2" /> Feature Configuration</h5>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Maximum Group Size</Form.Label>
                        <Form.Control
                          type="number"
                          value={settings.features.maxGroupSize}
                          onChange={(e) => handleFeaturesChange('maxGroupSize', parseInt(e.target.value))}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Minimum Group Size</Form.Label>
                        <Form.Control
                          type="number"
                          value={settings.features.minGroupSize}
                          onChange={(e) => handleFeaturesChange('minGroupSize', parseInt(e.target.value))}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Max Groups Per Topic</Form.Label>
                        <Form.Control
                          type="number"
                          value={settings.features.maxGroupsPerTopic}
                          onChange={(e) => handleFeaturesChange('maxGroupsPerTopic', parseInt(e.target.value))}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Max Groups Per Faculty</Form.Label>
                        <Form.Control
                          type="number"
                          value={settings.features.maxGroupsPerFaculty}
                          onChange={(e) => handleFeaturesChange('maxGroupsPerFaculty', parseInt(e.target.value))}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Check
                        type="switch"
                        label="Allow Student Self-Registration"
                        checked={settings.features.allowStudentRegistration}
                        onChange={(e) => handleFeaturesChange('allowStudentRegistration', e.target.checked)}
                        className="mb-3"
                      />
                      <Form.Check
                        type="switch"
                        label="Allow Faculty Registration (Admin Only)"
                        checked={settings.features.allowFacultyRegistration}
                        onChange={(e) => handleFeaturesChange('allowFacultyRegistration', e.target.checked)}
                        className="mb-3"
                      />
                    </Col>
                    <Col md={6}>
                      <Form.Check
                        type="switch"
                        label="Require Email Verification"
                        checked={settings.features.requireEmailVerification}
                        onChange={(e) => handleFeaturesChange('requireEmailVerification', e.target.checked)}
                        className="mb-3"
                      />
                      <Form.Check
                        type="switch"
                        label="Allow Topic Selection"
                        checked={settings.features.allowTopicSelection}
                        onChange={(e) => handleFeaturesChange('allowTopicSelection', e.target.checked)}
                        className="mb-3"
                      />
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Tab>

            {/* Backup Tab */}
            <Tab eventKey="backup" title="Backup">
              <Card className="border-0">
                <Card.Body>
                  <h5 className="mb-4"><Database className="me-2" /> Backup Configuration</h5>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="switch"
                          label="Enable Automatic Backups"
                          checked={settings.backup.autoBackup}
                          onChange={(e) => handleBackupChange('autoBackup', e.target.checked)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      {settings.backup.lastBackup && (
                        <p className="text-muted">
                          Last Backup: {new Date(settings.backup.lastBackup).toLocaleString()}
                        </p>
                      )}
                    </Col>
                  </Row>
                  {settings.backup.autoBackup && (
                    <>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Backup Frequency</Form.Label>
                            <Form.Select
                              value={settings.backup.backupFrequency}
                              onChange={(e) => handleBackupChange('backupFrequency', e.target.value)}
                            >
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Backup Time (24h)</Form.Label>
                            <Form.Control
                              type="time"
                              value={settings.backup.backupTime}
                              onChange={(e) => handleBackupChange('backupTime', e.target.value)}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Retention Period (days)</Form.Label>
                            <Form.Control
                              type="number"
                              value={settings.backup.retentionDays}
                              onChange={(e) => handleBackupChange('retentionDays', parseInt(e.target.value))}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    </>
                  )}
                  <Button variant="warning" onClick={runBackup}>
                    Run Manual Backup Now
                  </Button>
                </Card.Body>
              </Card>
            </Tab>

            {/* Notifications Tab */}
            <Tab eventKey="notifications" title="Notifications">
              <Card className="border-0">
                <Card.Body>
                  <h5 className="mb-4"><Bell className="me-2" /> Notification Settings</h5>
                  <Row>
                    <Col md={6}>
                      <Form.Check
                        type="switch"
                        label="Email Notifications"
                        checked={settings.notifications.emailNotifications}
                        onChange={(e) => handleNotificationsChange('emailNotifications', e.target.checked)}
                        className="mb-3"
                      />
                      <Form.Check
                        type="switch"
                        label="SMS Notifications"
                        checked={settings.notifications.smsNotifications}
                        onChange={(e) => handleNotificationsChange('smsNotifications', e.target.checked)}
                        className="mb-3"
                      />
                      <Form.Check
                        type="switch"
                        label="Admin Alerts"
                        checked={settings.notifications.adminAlerts}
                        onChange={(e) => handleNotificationsChange('adminAlerts', e.target.checked)}
                        className="mb-3"
                      />
                    </Col>
                    <Col md={6}>
                      <Form.Check
                        type="switch"
                        label="Security Alerts"
                        checked={settings.notifications.securityAlerts}
                        onChange={(e) => handleNotificationsChange('securityAlerts', e.target.checked)}
                        className="mb-3"
                      />
                      <Form.Check
                        type="switch"
                        label="Backup Alerts"
                        checked={settings.notifications.backupAlerts}
                        onChange={(e) => handleNotificationsChange('backupAlerts', e.target.checked)}
                        className="mb-3"
                      />
                      <Form.Check
                        type="switch"
                        label="Daily Digest"
                        checked={settings.notifications.dailyDigest}
                        onChange={(e) => handleNotificationsChange('dailyDigest', e.target.checked)}
                        className="mb-3"
                      />
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default SuperAdminSettings;