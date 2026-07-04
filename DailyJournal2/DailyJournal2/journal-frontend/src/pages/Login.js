import React, { useState, useContext, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Alert,
  Container,
  InputAdornment,
  IconButton,
  Fade,
  Slide
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  Explore as ExploreIcon
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const quotes = [
    "Every entry is a step towards self-discovery.",
    "Write your thoughts today, create your better tomorrow.",
    "Paper has more patience than people.",
    "Your life is your story. Write well. Edit often.",
    "Journaling is like whispering to one's self and listening at the same time.",
    "Document the moments you feel most in love with yourself.",
    "A personal journal is an ideal environment in which to become.",
    "What a comfort is this journal. I tell myself to myself.",
    "Fill your paper with the breathings of your heart.",
    "Keep a notebook. Travel with it, eat with it, sleep with it."
  ];

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fadeQuote, setFadeQuote] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeQuote(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % quotes.length);
        setFadeQuote(true);
      }, 800); // 800ms for smooth fade out
    }, 6000); // Change quote every 6 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'url("/images/login_bg_v2.png") no-repeat center center fixed',
        backgroundSize: 'cover',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%)',
          zIndex: 0
        }
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 40, md: 80 },
          right: { xs: 20, md: 80 },
          zIndex: 1,
          maxWidth: 350,
          textAlign: 'right',
          display: { xs: 'none', md: 'block' }
        }}
      >
        <Fade in={fadeQuote} timeout={800}>
          <Typography
            variant="h5"
            sx={{
              color: 'white',
              fontStyle: 'italic',
              fontWeight: 300,
              textShadow: '0 4px 12px rgba(0,0,0,0.5)',
              fontFamily: '"Caveat", "Dancing Script", cursive, "Segoe UI"',
              lineHeight: 1.4
            }}
          >
            "{quotes[quoteIndex]}"
          </Typography>
        </Fade>
      </Box>

      {/* Explore Published Journals on the left */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 'auto', md: '50%' },
          bottom: { xs: 40, md: 'auto' },
          left: { xs: '50%', md: 80 },
          transform: { xs: 'translateX(-50%)', md: 'translateY(-50%)' },
          zIndex: 1,
          maxWidth: { xs: '90%', md: 350 },
          textAlign: { xs: 'center', md: 'left' }
        }}
      >
        <Fade in timeout={1200}>
          <Box>
            <Typography
              variant="h3"
              sx={{
                color: 'white',
                fontWeight: 800,
                mb: 2,
                textShadow: '0 4px 15px rgba(0,0,0,0.6)',
                display: { xs: 'none', md: 'block' },
                lineHeight: 1.2
              }}
            >
              Discover <br />
              <span style={{ color: '#a3bffa' }}>Inspiring</span> <br />
              Journeys.
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                mb: 4,
                textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                fontSize: '1.1rem',
                display: { xs: 'none', md: 'block' }
              }}
            >
              Take a peek into our public community. See what others are sharing and find inspiration for your own daily journal.
            </Typography>
            <Button
              component={Link}
              to="/published-journals"
              variant="contained"
              size="large"
              startIcon={<ExploreIcon />}
              sx={{
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(15px)',
                color: 'white',
                fontWeight: 700,
                fontSize: '1.1rem',
                px: 4,
                py: 1.5,
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.25)',
                  transform: 'translateY(-5px) scale(1.02)',
                  borderColor: 'white',
                  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)'
                }
              }}
            >
              Explore Community
            </Button>
          </Box>
        </Fade>
      </Box>

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
        <Fade in timeout={800}>
          <Paper
            elevation={24}
            sx={{
              p: { xs: 3, sm: 5 },
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
              }
            }}
          >
            <Slide direction="down" in timeout={600}>
              <Box textAlign="center" mb={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, gap: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
                    }}
                  >
                    <LoginIcon sx={{ fontSize: 28, color: 'white' }} />
                  </Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      m: 0
                    }}
                  >
                    Welcome Back
                  </Typography>
                </Box>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontSize: '1.1rem' }}
                >
                  Sign in to continue your journal journey
                </Typography>
              </Box>
            </Slide>

            <Slide direction="up" in timeout={800}>
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  margin="normal"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon sx={{ color: '#667eea' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)'
                      },
                      '&.Mui-focused': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.25)'
                      }
                    }
                  }}
                />
                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  margin="normal"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon sx={{ color: '#667eea' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                          sx={{ color: '#667eea' }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.15)'
                      },
                      '&.Mui-focused': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.25)'
                      }
                    }
                  }}
                />

                {error && (
                  <Slide direction="left" in timeout={300}>
                    <Alert
                      severity="error"
                      sx={{
                        mb: 3,
                        borderRadius: 2,
                        '& .MuiAlert-icon': {
                          color: '#f44336'
                        }
                      }}
                    >
                      {error}
                    </Alert>
                  </Slide>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 30px rgba(102, 126, 234, 0.6)'
                    },
                    '&:active': {
                      transform: 'translateY(0px)'
                    },
                    '&.Mui-disabled': {
                      background: 'linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%)',
                      color: 'white'
                    }
                  }}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>

                <Box
                  textAlign="center"
                  mt={4}
                  sx={{
                    borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                    pt: 3
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Don't have an account?
                  </Typography>
                  <Button
                    component={Link}
                    to="/register"
                    variant="outlined"
                    startIcon={<RegisterIcon />}
                    sx={{
                      borderRadius: 2,
                      borderColor: '#667eea',
                      color: '#667eea',
                      fontWeight: 600,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#5a67d8',
                        backgroundColor: 'rgba(102, 126, 234, 0.05)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    Create Account
                  </Button>
                </Box>
              </Box>
            </Slide>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
}

export default Login;