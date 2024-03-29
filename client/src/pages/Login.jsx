// Login.jsx
// Login form

import { useState } from "react";
import { useMutation } from "@apollo/client";

import { useNotification } from "../components/contextproviders/NotificationProvider.jsx";

import Header from "../components/other/Header";

import { LOGIN_USER } from "../utils/mutations";

import Auth from "../utils/auth";

const Login = (props) => {

  // Notification context for error messages
  const { openNotification } = useNotification();

  const [formState, setFormState] = useState({ username: "", password: "" });

  // Mutation for logging in user
  const [login, { error, data }] = useMutation(LOGIN_USER);

  // Update state based on form input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormState({
      ...formState,
      [name]: value,
    });
  };

  // Handle error messages for login form
  const handleLoginError = (error) => {
    let errorMessage = "";

    if (error.message.includes("UserNotFoundError") && !errorMessage) {
      errorMessage = "Username not found. Please sign up to create a new account.";
    } else if (error.message.includes("IncorrectPasswordError") && !errorMessage) {
      errorMessage = "Incorrect password. Please try again.";
    } else {
      errorMessage = "An error occurred. Please try again.";
    }
    openNotification(errorMessage, "error");
  };

  // Handle form submission
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    try {

      // Use login mutation to log in user
      const { data } = await login({
        variables: { ...formState },
      });

      // Log user in and redirect to dashboard
      Auth.login(data.login.token);
    } catch (e) {
      console.error(e);
      handleLoginError(e);
    }

    // Clear form values
    setFormState({
      username: "",
      password: "",
    });
  };

  return (
    <main className="main-jg">
      <Header />
      <div className="login-signup-jg">
        <div className="box-jg login-signup-box-jg">
          <h4>Login</h4>
          <div className="login-form-jg">
            {data ? (
              <p>Login successful! Preparing your dashboard... </p>
            ) : (
              <form
                className="login-signup-form-fields-jg"
                onSubmit={handleFormSubmit}
              >
                <input
                  className="form-input login-signup-input-jg"
                  placeholder="Your username"
                  name="username"
                  type="text"
                  value={formState.name}
                  onChange={handleChange}
                />
                <input
                  className="form-input login-signup-input-jg"
                  placeholder="Your password"
                  name="password"
                  type="password"
                  value={formState.password}
                  onChange={handleChange}
                />
                <button
                  className="button-jg login-signup-button-jg"
                  style={{ cursor: "pointer" }}
                  type="submit"
                >
                  Submit
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Login;
