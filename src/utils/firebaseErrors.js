const getFriendlyAuthError = (errorCode) => {
    switch (errorCode) {
        case "auth/email-already-in-use":
            return "This email is already registered.";
        case "auth/invalid-email":
            return "Please enter a valid email address.";
        case "auth/weak-password":
            return "Password should be at least 6 characters.";
        case "auth/operation-not-allowed":
            return "Email/password accounts are not enabled.";
        case "auth/network-request-failed":
            return "Network error. Please check your internet connection.";
        default:
            return "An unexpected error occurred. Please try again.";
    }
};
