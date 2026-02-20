import React, { useState } from "react";
import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  ProjectOutlined,
  FileTextOutlined,
  UserOutlined,
  SettingOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Sider, Content } = Layout;

const SidebarLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        width={220}
      >
        <div
          style={{
            color: "#fff",
            textAlign: "center",
            padding: "16px",
            fontWeight: "bold",
            fontSize: 16
          }}
        >
          Timesheet
        </div>

        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={["1"]}
          onClick={({ key }) => navigate(key)}
          items={[
            {
              key: "/dashboard",
              icon: <DashboardOutlined />,
              label: "Dashboard"
            },
            {
              key: "/projects",
              icon: <ProjectOutlined />,
              label: "Projects"
            },
            {
              key: "/reports",
              icon: <FileTextOutlined />,
              label: "Reports"
            },
            {
              key: "/users",
              icon: <UserOutlined />,
              label: "Users"
            },
            {
              key: "/settings",
              icon: <SettingOutlined />,
              label: "Settings"
            }
          ]}
        />
      </Sider>

      <Layout>
        <Content style={{ margin: "24px", background: "#fff", padding: 24 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default SidebarLayout;