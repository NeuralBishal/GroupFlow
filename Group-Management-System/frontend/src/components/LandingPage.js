import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { PersonBadge, PeopleFill, ShieldLock, ArrowRight, Star, Award, Book, Gear } from 'react-bootstrap-icons';
import './LandingPage.css';

// Particle animation background component
const ParticleBackground = () => {
  useEffect(() => {
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.color = `rgba(100, 100, 255, ${Math.random() * 0.5})`;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }
      
      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    const init = () => {
      for (let i = 0; i < 100; i++) {
        particles.push(new Particle());
      }
    };
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let particle of particles) {
        particle.update();
        particle.draw();
      }
      requestAnimationFrame(animate);
    };
    
    init();
    animate();
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      init();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return <canvas id="particle-canvas" className="particle-canvas"></canvas>;
};

// Animated counter component
const AnimatedCounter = ({ end, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [end, duration]);
  
  return <span className="counter">{count}+</span>;
};

function LandingPage() {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [showSuperAdminHint, setShowSuperAdminHint] = useState(false);
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Secret super admin easter egg
  const handleAdminIconClick = () => {
    const newCount = adminClickCount + 1;
    setAdminClickCount(newCount);
    
    if (newCount === 3) {
      setShowSuperAdminHint(true);
      setTimeout(() => setShowSuperAdminHint(false), 3000);
    }
    
    if (newCount === 7) {
      navigate('/super-admin/login');
    }
  };
  
  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0 }
  };
  
  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const cardHover = {
    rest: { scale: 1, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" },
    hover: { 
      scale: 1.05, 
      boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="landing-page">
      {/* Secret Super Admin Trigger (Top Right Corner) */}
      <motion.div 
        className="super-admin-trigger"
        onClick={handleAdminIconClick}
        initial={{ opacity: 0.3 }}
        whileHover={{ opacity: 1, scale: 1.1 }}
        title="Super Admin Access"
      >
        <Gear size={24} className={adminClickCount > 0 ? 'spinning' : ''} />
      </motion.div>

      {/* Super Admin Hint Tooltip */}
      {showSuperAdminHint && (
        <motion.div 
          className="super-admin-hint"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          🔐 Super Admin Portal detected...
        </motion.div>
      )}

      {/* Animated Background */}
      <ParticleBackground />
      
      {/* Floating Elements */}
      <div className="floating-elements">
        <motion.div 
          className="floating-circle circle1"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="floating-circle circle2"
          animate={{
            x: [0, -80, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>
      
      {/* Main Content */}
      <Container className="position-relative" style={{ zIndex: 10 }}>
        {/* Header with 3D Tilt Effect */}
        <motion.div 
          className="text-center mb-5 pt-5"
          animate={{
            transform: `perspective(1000px) rotateX(${mousePosition.y}deg) rotateY(${mousePosition.x}deg)`
          }}
        >
          <motion.h1 
            className="display-1 fw-bold gradient-text"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            GroupFlow
          </motion.h1>
          
          <motion.p 
            className="lead text-light fs-3"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Where Collaboration Meets Innovation
          </motion.p>
          
          <motion.div 
            className="d-flex justify-content-center gap-4 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="stat-badge">
              <Star className="text-warning me-2" />
              <AnimatedCounter end={500} /> Active Students
            </div>
            <div className="stat-badge">
              <Award className="text-info me-2" />
              <AnimatedCounter end={50} /> Faculty
            </div>
            <div className="stat-badge">
              <Book className="text-success me-2" />
              <AnimatedCounter end={100} /> Projects
            </div>
          </motion.div>
        </motion.div>
        
        {/* Role Cards with Stagger Animation */}
        <motion.div 
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
          className="row g-4 mt-5"
        >
{/* Student Card */}
<Col md={4}>
  <motion.div variants={fadeInUp}>
    <motion.div
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      className="role-card student-card"
      onClick={() => {
        new Audio('/sounds/click.mp3').play().catch(() => {});
        navigate('/student/login');
      }}
    >
      <Card className="h-100 glass-card">
        <Card.Body className="text-center">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <PeopleFill size={80} className="text-primary mb-3 icon-float" />
          </motion.div>
          
          <Card.Title as="h2">Students</Card.Title>
          
          <motion.div 
            className="feature-list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p>✓ Login with Roll Number</p>
            <p>✓ Create & Join Groups</p>
            <p>✓ Select Topics</p>
            <p>✓ Choose Faculty</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="primary" 
              size="lg" 
              className="w-100 mt-3 pulse-button"
            >
              Student Login
              <ArrowRight className="ms-2" />
            </Button>
          </motion.div>
          
          {/* REMOVED: The "New here? Create account" link */}
          
        </Card.Body>
      </Card>
    </motion.div>
  </motion.div>
</Col>
          
          {/* Faculty Card */}
          <Col md={4}>
            <motion.div variants={fadeInUp}>
              <motion.div
                variants={cardHover}
                initial="rest"
                whileHover="hover"
                className="role-card faculty-card"
                onClick={() => {
                  new Audio('/sounds/click.mp3').play().catch(() => {});
                  navigate('/faculty/login');
                }}
              >
                <Card className="h-100 glass-card">
                  <Card.Body className="text-center">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <PersonBadge size={80} className="text-success mb-3 icon-bounce" />
                    </motion.div>
                    
                    <Card.Title as="h2">Faculty</Card.Title>
                    
                    <motion.div 
                      className="feature-list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <p>✓ View Assigned Groups</p>
                      <p>✓ Monitor Progress</p>
                      <p>✓ Guide Projects</p>
                      <p>✓ Evaluate Work</p>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        variant="success" 
                        size="lg" 
                        className="w-100 mt-3 pulse-button"
                      >
                        Faculty Portal
                        <ArrowRight className="ms-2" />
                      </Button>
                    </motion.div>
                    
                    <p className="mt-3 text-muted">
                      <small>Access your dashboard</small>
                    </p>
                  </Card.Body>
                </Card>
              </motion.div>
            </motion.div>
          </Col>
          
          {/* Admin Card */}
          <Col md={4}>
            <motion.div variants={fadeInUp}>
              <motion.div
                variants={cardHover}
                initial="rest"
                whileHover="hover"
                className="role-card admin-card"
                onClick={() => {
                  new Audio('/sounds/click.mp3').play().catch(() => {});
                  navigate('/admin/login');
                }}
              >
                <Card className="h-100 glass-card">
                  <Card.Body className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      <ShieldLock size={80} className="text-danger mb-3 icon-spin" />
                    </motion.div>
                    
                    <Card.Title as="h2">Administrators</Card.Title>
                    
                    <motion.div 
                      className="feature-list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <p>✓ Manage Faculty</p>
                      <p>✓ Configure Domains</p>
                      <p>✓ System Settings</p>
                      <p>✓ Analytics</p>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        variant="danger" 
                        size="lg" 
                        className="w-100 mt-3 pulse-button"
                      >
                        Admin Console
                        <ArrowRight className="ms-2" />
                      </Button>
                    </motion.div>
                    
                    <p className="mt-3 text-muted">
                      <small>Secure access only</small>
                    </p>
                  </Card.Body>
                </Card>
              </motion.div>
            </motion.div>
          </Col>
        </motion.div>
        
        {/* Footer */}
        <motion.footer 
          className="text-center mt-5 pb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-light">
            © 2026 GroupFlow - Empowering Collaborative Learning
          </p>
        </motion.footer>
      </Container>
    </div>
  );
}

export default LandingPage;