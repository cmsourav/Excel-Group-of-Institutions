import { useState , useEffect } from 'react';
import { 
  FaEnvelope, 
  FaLock, 
  FaInfoCircle, 
  FaSpinner, 
  FaExclamationTriangle,
  FaArrowLeft,
  FaUserPlus,
  FaCheckCircle,
  FaTimesCircle,
  FaEye,
  FaEyeSlash 
} from 'react-icons/fa';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Login.css';

const LoginPage = () => {
  const navigate = useNavigate();
  
  // State management
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetStatus, setResetStatus] = useState({
    state: 'idle', // 'idle', 'sending', 'sent', 'error'
    message: ''
  });

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    if (!validateEmail(email)) {
      setLoginError('Please enter a valid email');
      return;
    }

    if (password.length < 6) {
      setLoginError('Password must be at least 6 characters');
      return;
    }

    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setLoginError(
        error.code === 'auth/invalid-credential' ? 'Invalid email or password' :
        error.code === 'auth/too-many-requests' ? 'Account locked - try resetting password' :
        'Login failed. Please try again.'
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setResetStatus({
        state: 'error',
        message: 'Please enter a valid email address'
      });
      return;
    }
  
    setResetLoading(true);
    setResetStatus({
      state: 'sending',
      message: 'Sending password reset link...'
    });
  
    try {
      await sendPasswordResetEmail(auth, email);
      setResetStatus({
        state: 'sent',
        message: 'Password reset link sent successfully! Check your email (including spam folder)'
      });
    } catch (error) {
      let errorMessage = 'Failed to send reset link. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.';
      }
      
      setResetStatus({
        state: 'error',
        message: errorMessage
      });
    } finally {
      setResetLoading(false);
    }
  };
  
  useEffect(() => {
    if (resetStatus.state === 'sent') {
      const timer = setTimeout(() => {
        setShowReset(false);
        setEmail('');
        setResetStatus({ state: 'idle', message: '' });
      }, 3000); // 3 seconds
  
      return () => clearTimeout(timer);
    }
  }, [resetStatus]);
  
  const getStatusIcon = () => {
    switch(resetStatus.state) {
      case 'sending':
        return <FaSpinner className="spinner" />;
      case 'sent':
        return <FaCheckCircle className="success-icon" />;
      case 'error':
        return <FaTimesCircle className="error-icon" />;
      default:
        return <FaInfoCircle />;
    }
  };

  return (
    <div className="auth-container">
      <div className={`auth-card ${showReset ? 'reset-mode' : ''}`}>
        {showReset && (
          <button 
            className="back-button"
            onClick={() => {
              setShowReset(false);
              setResetStatus({ state: 'idle', message: '' });
            }}
            aria-label="Back to login"
          >
            <FaArrowLeft />
          </button>
        )}

        <h2>{showReset ? 'Reset Password' : 'Welcome Back'}</h2>
        
        <form onSubmit={showReset ? handleResetPassword : handleLogin}>
          <div className="input-field">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              required
              autoFocus={showReset}
              disabled={resetStatus.state === 'sent'}
            />
          </div>

          {!showReset && (
            <div className="input-field password-field">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
              />
              <span 
                className="password-toggle"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          )}

          {loginError && !showReset && (
            <div className="status-message error">
              <FaInfoCircle /> {loginError}
            </div>
          )}

          {showReset && resetStatus.message && (
            <div className={`status-message ${resetStatus.state}`}>
              {getStatusIcon()} {resetStatus.message}
            </div>
          )}

          <button 
            type="submit" 
            className={`primary-btn ${showReset ? 'reset-btn' : ''}`}
            disabled={
              loginLoading || 
              (showReset && (
                !email || 
                resetLoading || 
                resetStatus.state === 'sent'
              ))
            }
          >
            {loginLoading || resetLoading ? (
              <FaSpinner className="spinner" />
            ) : showReset ? (
              resetStatus.state === 'sent' ? (
                'Link Sent'
              ) : (
                'Send Reset Link'
              )
            ) : (
              'Log In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          {!showReset ? (
            <>
              <button 
                className="text-btn"
                onClick={() => {
                  setShowReset(true);
                  setLoginError('');
                  setResetStatus({ state: 'idle', message: '' });
                }}
              >
                Forgot password ??
              </button>
              <div className="signup-prompt">
                Don't have an account?{' '}
                <Link to="/signup" className="signup-link">
                  <FaUserPlus /> Sign up
                </Link>
              </div>
            </>
          ) : resetStatus.state !== 'sent' && (
            <div className="reset-hint">
              <FaExclamationTriangle /> Enter your email to receive a reset link
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;