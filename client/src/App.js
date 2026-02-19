import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Spin } from "antd";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Show loader while checking authentication
  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>

        {/* Login Route */}
        <Route
          path="/login"
          element={
            user ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />

        {/* Protected Dashboard Route */}
        <Route
          path="/dashboard"
          element={
            user ? <Dashboard user={user} /> : <Navigate to="/login" replace />
          }
        />

        {/* Default Route */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

      </Routes>
    </Router>
  );
};

export default App;
