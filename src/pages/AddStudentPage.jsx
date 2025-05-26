import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, Timestamp, collection, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
import "../styles/AddStudent.css";

const validateStudent = (student, enquiryFields) => {
  const errors = {};
  const requiredFields = student.applicationStatus === "Enquiry"
    ? enquiryFields
    : Object.keys(student).filter((k) => k !== "createdBy");

  requiredFields.forEach((key) => {
    if (!student[key]) {
      errors[key] = "This field is required.";
    }
  });

  if (student.studentId && !/^\d+$/.test(student.studentId)) {
    errors.studentId = "Student ID should contain only numbers.";
  }

  if (student.candidateNumber && !/^\d{10}$/.test(student.candidateNumber)) {
    errors.candidateNumber = "Enter a valid 10-digit number.";
  }

  if (
    student.applicationStatus === "Enroll" &&
    student.parentNumber &&
    !/^\d{10}$/.test(student.parentNumber)
  ) {
    errors.parentNumber = "Enter a valid 10-digit number.";
  }

  return errors;
};

const Stepper = ({ currentStep }) => (
  <div className="stepper">
    <div className={`step ${currentStep === 1 ? "active" : ""}`}>
      <div className="circle">1</div>
      <span>Verify</span>
    </div>
    <div className={`step ${currentStep === 2 ? "active" : ""}`}>
      <div className="circle">2</div>
      <span>Details</span>
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="add_student_modal_overlay">
      <div className="add_student_modal_content">
        <div className="add_student_modal_header">
          <svg className="add_student_modal_icon" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm0-12h2v10h-2V5z"
            />
          </svg>
          <h2 className="add_student_modal_title">{message.name}</h2>
        </div>
        <div className="add_student_modal_body">
          <p className="add_student_modal_text">{message.text}</p>
        </div>
        <div className="add_student_modal_footer">
          <button
            className="add_student_modal_button"
            onClick={onClose}
          >
            Close
            {/* <svg className="add_student_modal_button_icon" viewBox="0 0 24 24">
              <path 
                fill="currentColor" 
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg> */}
          </button>
        </div>
      </div>
    </div>
  );
};

// Small component for info icon
const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AddStudent = () => {
  const [student, setStudent] = useState({
    studentId: "", candidateName: "", applicationStatus: "",
    candidateNumber: "", fatherName: "", parentNumber: "",
    dob: "", gender: "", adhaarNumber: "", college: "", course: "",
    place: "", amountPaid: "", transactionId: "",
    createdBy: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState({ name: "", text: "" });
  const [submissionStatus, setSubmissionStatus] = useState("idle");
  const [collegeOptions, setCollegeOptions] = useState([]);
  const [courseOptions, setCourseOptions] = useState([]);

  const enquiryFields = [
    "studentId", "applicationStatus", "candidateName", "fatherName", "candidateNumber",
    "dob", "course", "college",
  ];

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const snapshot = await getDocs(collection(db, "excel-colleges"));
        const options = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          courses: doc.data().courses || [],
        }));
        setCollegeOptions(options);
      } catch {
        toast.error("Failed to load colleges.");
      }
    };

    fetchColleges();
  }, []);


  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "college") {
      const selected = collegeOptions.find((c) => c.name === value);
      setCourseOptions(selected?.courses || []);
      setStudent((prev) => ({ ...prev, course: "", [name]: value }));
    } else {
      setStudent((prev) => ({ ...prev, [name]: value }));
    }

    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleVerify = async () => {
    const id = student.studentId.trim();

    if (!id || !/^\d+$/.test(id)) {
      setFormErrors({ studentId: "Please enter a valid numeric register number." });
      return;
    }

    const docSnap = await getDoc(doc(db, "excel", id));
    if (docSnap.exists()) {
      const data = docSnap.data();
      setModalMessage({ name: data.candidateName, text: "Student ID already exists." });
      setIsModalOpen(true);
    } else {
      setCurrentStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStep !== 2) return;

    const errors = validateStudent(student, enquiryFields);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setModalMessage({ name: "Validation", text: "Please correct the errors." });
      setIsModalOpen(true);
      return;
    }

    const user = auth.currentUser;
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!user) {
      setModalMessage({ name: "Error", text: "User not authenticated." });
      setIsModalOpen(true);
      return;
    }
    const userData = userDoc.data();
    const userName = userData.fullName || "Unknown";
    const consultancyName = userData.userType === "Freelance Associate" ? "" : userData.consultancyName || "";
    const referenceValue = {
      userName,
      consultancyName,
    };

    setSubmissionStatus("loading");

    const isEnquiry = student.applicationStatus === "Enquiry";
    const studentData = isEnquiry
      ? enquiryFields.reduce((acc, key) => ({ ...acc, [key]: student[key] }), {
        parentNumber: "", gender: "", place: "",
        adhaarNumber: "", amountPaid: "", transactionId: ""
      })
      : { ...student };

    studentData.createdAt = Timestamp.now();
    studentData.reference = referenceValue
    studentData.createdBy = user.uid

    try {
      await setDoc(doc(db, "excel", student.studentId), studentData);
      setSubmissionStatus("idle");
      setModalMessage({ name: student.candidateName, text: "Student successfully registered!" });
      setIsModalOpen(true);
      setStudent({
        studentId: "", candidateName: "", applicationStatus: "", candidateNumber: "",
        dob: "", gender: "", college: "", course: "", fatherName: "", parentNumber: "",
        adhaarNumber: "", amountPaid: "", transactionId: "", place: "",
        createdBy: "",
      });
      setCurrentStep(1);
    } catch (err) {
      setSubmissionStatus("idle");
      setModalMessage({ name: "Error", text: "Something went wrong." });
      setIsModalOpen(true);
    }
  };

  return (
    <div className="add_student_container">
      <div className="add_student_header">
        <h2>Student Registration</h2>
        <p>{currentStep === 1 ? "Verify student ID" : "Enter student details"}</p>
      </div>

      <div className="add_student_stepper">
        <div className={`add_student_step ${currentStep === 1 ? "add_student_active" : ""}`}>
          <div className="add_student_step_number">1</div>
          <div className="add_student_step_label">Verify</div>
        </div>
        <div className="add_student_step_connector"></div>
        <div className={`add_student_step ${currentStep === 2 ? "add_student_active" : ""}`}>
          <div className="add_student_step_number">2</div>
          <div className="add_student_step_label">Details</div>
        </div>
      </div>

      <form className="add_student_form" onSubmit={handleSubmit}>
        {currentStep === 1 && (
          <div className="add_student_verify_step">
            <div className="add_student_input_group">
              <label htmlFor="studentId">Register Number</label>
              <input
                type="text"
                id="studentId"
                name="studentId"
                value={student.studentId}
                onChange={handleChange}
                placeholder="Enter register number"
                className={formErrors.studentId ? "add_student_error" : ""}
              />
              {formErrors.studentId && <span className="add_student_error_message">{formErrors.studentId}</span>}
            </div>

            {/* Help Card */}
            <div className="help-card">
              <div className="help-header">
                <InfoIcon />
                <span>Which number should I enter?</span>
              </div>
              <ul className="help-list">
                <li>For <strong>State Board</strong> students: Enter the Register Number from SSLC marks card</li>
                <li>For <strong>CBSE</strong> students: Enter the Roll Number from CBSE certificate</li>
                <li>For <strong>Other Boards</strong>: Enter the official registration number</li>
              </ul>
            </div>

            <button
              type="button"
              className="add_student_primary_btn"
              onClick={handleVerify}
            >
              Verify
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="add_student_details_step">
            <div className="add_student_form_grid">
              {/* Application Status */}
              <div className="add_student_input_group">
                <label htmlFor="applicationStatus">Application Status *</label>
                <select
                  id="applicationStatus"
                  name="applicationStatus"
                  value={student.applicationStatus}
                  onChange={handleChange}
                  className={formErrors.applicationStatus ? "add_student_error" : ""}
                >
                  <option value="">Select Status</option>
                  <option value="Enquiry">Enquiry</option>
                  <option value="Enroll">Enroll</option>
                </select>
                {formErrors.applicationStatus && (
                  <span className="add_student_error_message">{formErrors.applicationStatus}</span>
                )}
              </div>

              {/* Dynamic Fields */}
              {Object.keys(student).map((key) => {
                if (["studentId", "applicationStatus", "createdBy"].includes(key)) return null;
                if (student.applicationStatus === "Enquiry" && !enquiryFields.includes(key)) return null;

                if (key === "college") {
                  return (
                    <div className="add_student_input_group" key={key}>
                      <label htmlFor={key}>College *</label>
                      <select
                        id={key}
                        name={key}
                        value={student[key]}
                        onChange={handleChange}
                        className={formErrors[key] ? "add_student_error" : ""}
                      >
                        <option value="">Select College</option>
                        {collegeOptions.map((college) => (
                          <option key={college.id} value={college.name}>
                            {college.name}
                          </option>
                        ))}
                      </select>
                      {formErrors[key] && <span className="add_student_error_message">{formErrors[key]}</span>}
                    </div>
                  );
                }

                if (key === "course") {
                  return (
                    <div className="add_student_input_group" key={key}>
                      <label htmlFor={key}>Course *</label>
                      <select
                        id={key}
                        name={key}
                        value={student[key]}
                        onChange={handleChange}
                        disabled={!student.college}
                        className={formErrors[key] ? "add_student_error" : ""}
                      >
                        <option value="">Select Course</option>
                        {courseOptions.map((course, index) => (
                          <option key={index} value={course}>
                            {course}
                          </option>
                        ))}
                      </select>
                      {formErrors[key] && <span className="add_student_error_message">{formErrors[key]}</span>}
                    </div>
                  );
                }

                return (
                  <div className="add_student_input_group" key={key}>
                    <label htmlFor={key}>
                      {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                      {enquiryFields.includes(key) && " *"}
                    </label>
                    {key === "gender" ? (
                      <select
                        id={key}
                        name={key}
                        value={student[key]}
                        onChange={handleChange}
                        className={formErrors[key] ? "add_student_error" : ""}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <input
                        type={key === "dob" ? "date" : "text"}
                        id={key}
                        name={key}
                        value={student[key]}
                        onChange={handleChange}
                        placeholder={`Enter ${key.replace(/([A-Z])/g, " $1").toLowerCase()}`}
                        className={formErrors[key] ? "add_student_error" : ""}
                      />
                    )}
                    {formErrors[key] && <span className="add_student_error_message">{formErrors[key]}</span>}
                  </div>
                );
              })}
            </div>

            <div className="add_student_actions_container">
              <div className="add_student_form_actions">
                <button
                  type="button"
                  className="add_student_secondary_btn"
                  onClick={() => setCurrentStep(1)}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="add_student_primary_btn"
                  disabled={submissionStatus === "loading"}
                >
                  {submissionStatus === "loading" ? (
                    <>
                      <span className="add_student_spinner"></span> Submitting...
                    </>
                  ) : "Submit"}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        message={modalMessage}
      />
    </div>
  );
};

export default AddStudent;