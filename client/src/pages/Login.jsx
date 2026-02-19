import React, { useState } from "react";
import { Card, Form, Input, Button, Typography, message } from "antd";
import { LoginOutlined } from "@ant-design/icons";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      message.success("Login successful");
      navigate("/dashboard");
    } catch (error) {
      message.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <Card bordered={false} className="login-card">
        <div className="login-header">
          <div className="icon-box">
            <LoginOutlined />
          </div>

          <Title level={2} className="login-title">
            Login
          </Title>

          <Text className="login-subtitle">
            Enter your login credentials.
          </Text>
        </div>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Enter valid email" }
            ]}
          >
            <Input size="large" placeholder="Enter Email" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Please enter password" }
            ]}
          >
            <Input.Password
              size="large"
              placeholder="Enter password"
            />
          </Form.Item>

          <div className="forgot-password">
            Forgot password?
          </div>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            className="login-btn"
          >
            Login
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
