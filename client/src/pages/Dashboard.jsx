import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  Button,
  Space,
  DatePicker,
  Select,
  message,
  Popconfirm,
  Empty,
  Spin
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CalendarOutlined
} from "@ant-design/icons";
import {
  collection,
  getDocs,
  updateDoc,          // ✅ UPDATED
  doc,
  query,
  where,
  serverTimestamp     // ✅ ADDED
} from "firebase/firestore";

import { db } from "../firebase";
import TimeEntryModal from "../components/TimeEntryModal";
import dayjs from "dayjs";
import BulkTimeEntryModal from "../components/BulkTimeEntryModal";

const { RangePicker } = DatePicker;
const { Option } = Select;

const Dashboard = ({ user }) => {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [openBulkModal, setOpenBulkModal] = useState(false);
  const [groupBy, setGroupBy] = useState(null);

  /* =========================
     FETCH PROJECTS & TASKS
  ========================= */

  const fetchDropdownData = async () => {
    const projectSnap = await getDocs(collection(db, "projects"));
    setProjects(
      projectSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    );

    const taskSnap = await getDocs(collection(db, "tasks"));
    setTasks(
      taskSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    );
  };

  /* =========================
     FETCH TIME ENTRIES
  ========================= */

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const q = query(
        collection(db, "timeEntries"),
        where("userId", "==", user.uid),
        where("deleted", "==", false)   // ✅ SOFT DELETE FILTER
      );

      const snapshot = await getDocs(q);

      const list = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix());

      setData(list);
    } catch {
      message.error("Failed to fetch data");
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        await fetchDropdownData();
        await fetchData();
      } finally {
        setInitialLoading(false);
      }
    };

    loadAllData();
  }, [fetchData]);

  /* =========================
     DATE FILTER
  ========================= */

  const filteredData = dateRange
    ? data.filter(item => {
        const itemDate = dayjs(item.date);
        return (
          itemDate.isSame(dateRange[0], "day") ||
          itemDate.isSame(dateRange[1], "day") ||
          (itemDate.isAfter(dateRange[0]) &&
            itemDate.isBefore(dateRange[1]))
        );
      })
    : data;

  /* =========================
     HELPERS
  ========================= */

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : "";
  };

  const getTaskName = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    return task ? task.name : "";
  };

  /* =========================
     GROUPING
  ========================= */

  const processedData = groupBy
    ? [...filteredData].sort((a, b) => {
        if (groupBy === "project") {
          return getProjectName(a.projectId)
            .localeCompare(getProjectName(b.projectId));
        }
        if (groupBy === "date") {
          return dayjs(a.date).unix() - dayjs(b.date).unix();
        }
        return 0;
      })
    : filteredData;

  const uniqueTasks = [
    ...new Set(processedData.map(d => getTaskName(d.taskId)))
  ];

  /* =========================
     SOFT DELETE
  ========================= */

  const handleDelete = async (id) => {
    try {
      await updateDoc(doc(db, "timeEntries", id), {
        deleted: true,
        deletedAt: serverTimestamp()
      });

      message.success("Deleted successfully");
      fetchData();
    } catch {
      message.error("Delete failed");
    }
  };

  const handleEdit = (record) => {
    setEditingEntry(record);
    setOpenModal(true);
  };

  /* =========================
     TABLE COLUMNS
  ========================= */

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      sorter: (a, b) => a.date.localeCompare(b.date)
    },
    {
      title: "Project",
      render: (_, record) => getProjectName(record.projectId)
    },
    {
      title: "Task",
      render: (_, record) => getTaskName(record.taskId),
      filters: uniqueTasks.map(task => ({
        text: task,
        value: task
      })),
      onFilter: (value, record) =>
        getTaskName(record.taskId) === value
    },
    {
      title: "Hour(s)",
      render: (_, record) => {
        if (!record.totalMinutes) return "0h 0m";
        const hours = Math.floor(record.totalMinutes / 60);
        const minutes = record.totalMinutes % 60;
        return `${hours}h ${minutes}m`;
      }
    },
    {
      title: "Description",
      dataIndex: "description"
    },
    {
      title: "Status",
      render: () => (
        <span className="status-pending">Pending</span>
      )
    },
    {
      title: "Billable",
      render: (_, record) =>
        record.billable ? (
          <CheckOutlined className="billable-icon" />
        ) : null
    },
    {
      title: "Type",
      dataIndex: "type"
    },
    {
      title: "Ticket",
      dataIndex: "ticket"
    },
    {
      title: "Action",
      render: (_, record) => (
        <div className="action-icons">
          <EditOutlined onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Delete this entry?"
            onConfirm={() => handleDelete(record.id)}
          >
            <DeleteOutlined />
          </Popconfirm>
        </div>
      )
    }
  ];

  /* =========================
     UI
  ========================= */

  return (
    <Spin spinning={initialLoading} size="large">
      <div className="dashboard-container">

        <div className="dashboard-toolbar">
          <RangePicker
            value={dateRange}
            onChange={(range) => setDateRange(range)}
            allowClear
          />

          <Space size="middle">
            <Button
              icon={<CalendarOutlined />}
              onClick={() => setOpenBulkModal(true)}
            >
              Bulk Time Entry
            </Button>

            <Select
              placeholder="Group by"
              style={{ width: 150 }}
              onChange={(value) => setGroupBy(value)}
              allowClear
            >
              <Option value="project">Project</Option>
              <Option value="date">Date</Option>
            </Select>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingEntry(null);
                setOpenModal(true);
              }}
            >
              Time Entry
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={processedData}
          loading={!initialLoading && loading}
          rowKey="id"
          locale={{
            emptyText: <Empty description="No time entries found" />
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20", "50"],
            position: ["bottomCenter"]
          }}
        />

        <TimeEntryModal
          open={openModal}
          setOpen={setOpenModal}
          user={user}
          editingEntry={editingEntry}
          onSuccess={fetchData}
        />

        <BulkTimeEntryModal
          open={openBulkModal}
          setOpen={setOpenBulkModal}
          user={user}
          onSuccess={fetchData}
        />

      </div>
    </Spin>
  );
};

export default Dashboard;
