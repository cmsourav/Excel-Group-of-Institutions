import { useState, useEffect } from "react";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaPhone,
  FaBuilding,
  FaMapMarkedAlt,
  FaLocationArrow,
} from "react-icons/fa";
import "../styles/SignupPage.css";
import PageTransitionWrapper from "../components/PageTransitionWrapper";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, query, where, collection, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    userType: "",
    consultancyName: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "userType") {
      setFormData((prevData) => ({
        ...prevData,
        userType: value,
        consultancyName: value === "Consultant" ? prevData.consultancyName : "",
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const pincodeRegex = /^[0-9]{6}$/;

    if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required.";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Phone number must be 10 digits.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (!formData.userType) newErrors.userType = "User type is required.";

    if (formData.userType === "Consultant" && !formData.consultancyName.trim()) {
      newErrors.consultancyName = "Consultancy name is required for Consultants.";
    }

    if (!formData.address.trim()) newErrors.address = "Complete address is required.";
    if (!formData.city.trim()) newErrors.city = "City is required.";
    if (!formData.state.trim()) newErrors.state = "State is required.";

    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pincode is required.";
    } else if (!pincodeRegex.test(formData.pincode)) {
      newErrors.pincode = "Pincode must be 6 digits.";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();

    if (!formData.city || !formData.state || !formData.pincode) {
      validationErrors.city = "Please complete the full address (City, State, Pincode).";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const q = query(collection(db, "users"), where("email", "==", formData.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        toast.error("This email is already registered.");
        return;
      }
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      const userData = {
        uid: user.uid,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        userType: formData.userType,
        consultancyName: formData.userType === "Consultant" ? formData.consultancyName : "",
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        createdAt: new Date(),
      };

      await setDoc(doc(db, "users", user.uid), userData);

      toast.success("Signup successful!");
      navigate('/dashboard', { replace: true });

      setFormData({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        userType: "",
        consultancyName: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
      });

    } catch (error) {
      console.error("Signup Error:", error);
      const friendlyMessage = error.code || "An error occurred during signup.";
      toast.error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransitionWrapper direction="right">
      <div className="signup-wrapper">
        <div className="signup-left">
          <img
            src="https://res.cloudinary.com/da82lkb5h/image/upload/v1744143245/signup_mwrkx0.jpg"
            alt="Visual"
            className="signup-full-image"
          />
        </div>

        <div className="signup-right">
          <div className="signup-cardbg">
            <h2 className="signup-heading">Create Account</h2>
            <p className="signup-subheading">Join us to get started</p>
            <form className="signup-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className={`input-group ${errors.fullName ? 'has-error' : ''}`}>
                  <div className="input-field-container">
                    <FaUser className="input-icon" />
                    <input
                      className="form-input"
                      name="fullName"
                      placeholder="Full Name *"
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.fullName && <span className="error">{errors.fullName}</span>}
                </div>
                <div className={`input-group ${errors.phone ? 'has-error' : ''}`}>
                  <div className="input-field-container">
                    <FaPhone className="input-icon" />
                    <input
                      className="form-input"
                      name="phone"
                      placeholder="Contact Number *"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.phone && <span className="error">{errors.phone}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className={`input-group ${errors.email ? 'has-error' : ''}`}>
                  <div className="input-field-container">
                    <FaEnvelope className="input-icon" />
                    <input
                      className="form-input"
                      name="email"
                      placeholder="Email ID *"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.email && <span className="error">{errors.email}</span>}
                </div>
                <div className={`input-group ${errors.password ? 'has-error' : ''}`}>
                  <div className="input-field-container">
                    <FaLock className="input-icon" />
                    <input
                      type="password"
                      className="form-input"
                      name="password"
                      placeholder="Password *"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.password && <span className="error">{errors.password}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className={`input-group ${errors.confirmPassword ? 'has-error' : ''}`}>
                  <div className="input-field-container">
                    <FaLock className="input-icon" />
                    <input
                      type="password"
                      className="form-input"
                      name="confirmPassword"
                      placeholder="Confirm Password *"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
                </div>

                <div className={`input-group ${errors.userType ? 'has-error' : ''}`}>
                  <div className="input-field-container">
                    <FaUser className="input-icon" />
                    <select
                      className="form-input"
                      name="userType"
                      value={formData.userType}
                      onChange={handleChange}
                    >
                      <option value="">Select User Type *</option>
                      <option value="Consultant">Consultant</option>
                      <option value="Freelance Associate">Freelance Associate</option>
                    </select>
                  </div>
                  {errors.userType && <span className="error">{errors.userType}</span>}
                </div>
              </div>

              {formData.userType === "Consultant" && (
                <div className="form-row">
                  <div className={`input-group ${errors.consultancyName ? 'has-error' : ''}`}>
                    <div className="input-field-container">
                      <FaBuilding className="input-icon" />
                      <input
                        className="form-input"
                        name="consultancyName"
                        placeholder="Consultancy Name *"
                        value={formData.consultancyName}
                        onChange={handleChange}
                      />
                    </div>
                    {errors.consultancyName && <span className="error">{errors.consultancyName}</span>}
                  </div>
                </div>
              )}

              <div className={`input-group ${errors.address ? 'has-error' : ''}`}>
                <div className="input-field-container">
                  <FaLocationArrow className="input-icon" />
                  <input
                    className="form-input"
                    name="address"
                    placeholder="Street address *"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
                {errors.address && <span className="error">{errors.address}</span>}
              </div>

              <div className="form-row">
                <div className={`input-group ${errors.city ? 'has-error' : ''}`}>
                  <div className="input-field-container">
                    <input
                      className="form-input"
                      name="city"
                      placeholder="City *"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.city && <span className="error">{errors.city}</span>}
                </div>
                <div className={`input-group ${errors.state ? 'has-error' : ''}`}>
                  <div className="input-field-container">
                    <FaMapMarkedAlt className="input-icon" />
                    <input
                      className="form-input"
                      name="state"
                      placeholder="State *"
                      value={formData.state}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.state && <span className="error">{errors.state}</span>}
                </div>
                <div className={`input-group ${errors.pincode ? 'has-error' : ''}`}>
                  <div className="input-field-container">
                    <input
                      className="form-input"
                      name="pincode"
                      placeholder="Pincode *"
                      value={formData.pincode}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.pincode && <span className="error">{errors.pincode}</span>}
                </div>
              </div>

              <button className="register-button" type="submit" disabled={loading}>
                {loading ? "Signing Up..." : "Create Account"}
              </button>

              <p className="login-redirect">Already have an account? <Link to="/" className="login-link">Sign in</Link></p>
            </form>
          </div>
        </div>
      </div>
    </PageTransitionWrapper>
  );
};

export default SignupPage;