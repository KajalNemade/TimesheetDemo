import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  DatePicker,
  Select,
  message,
  Popconfirm,
  Empty
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
  deleteDoc,
  doc,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase";
import TimeEntryModal from "../components/TimeEntryModal";
import dayjs from "dayjs";
import BulkTimeEntryModal from "../components/BulkTimeEntryModal";

const { RangePicker } = DatePicker;
const { Option } = Select;

const Dashboard = ({ user }) => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [openBulkModal, setOpenBulkModal] = useState(false);

  /* =========================
     FETCH PROJECTS & TASKS
  ========================= */

  const fetchDropdownData = async () => {
    const projectSnap = await getDocs(collection(db, "projects"));
    const projectList = projectSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setProjects(projectList);

    const taskSnap = await getDocs(collection(db, "tasks"));
    const taskList = taskSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setTasks(taskList);
  };

  /* =========================
     FETCH TIME ENTRIES
  ========================= */

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const q = query(
        collection(db, "timeEntries"),
        where("userId", "==", user.uid)
      );

      const snapshot = await getDocs(q);

      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setData(list);
      setFilteredData(list);

    } catch (error) {
      message.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdownData();
    fetchData();
  }, [user]);

  /* =========================
     DATE FILTER
  ========================= */

  const filterByDate = (sourceData, range) => {
    if (!range || range.length !== 2) {
      setFilteredData(sourceData);
      return;
    }

    const [start, end] = range;

    const filtered = sourceData.filter((item) => {
      const itemDate = dayjs(item.date);
      return (
        itemDate.isSame(start, "day") ||
        itemDate.isSame(end, "day") ||
        (itemDate.isAfter(start) && itemDate.isBefore(end))
      );
    });

    setFilteredData(filtered);
  };

  const handleDateChange = (range) => {
    setDateRange(range);
    filterByDate(data, range);
  };

  /* =========================
     DELETE
  ========================= */

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "timeEntries", id));
      message.success("Deleted successfully");
      fetchData();
    } catch {
      message.error("Delete failed");
    }
  };

  /* =========================
     EDIT
  ========================= */

  const handleEdit = (record) => {
    setEditingEntry(record);
    setOpenModal(true);
  };

  /* =========================
     HELPER FUNCTIONS
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
     TABLE COLUMNS
  ========================= */

  const uniqueTasks = [
    ...new Set(filteredData.map(d => getTaskName(d.taskId)))
  ];

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      sorter: (a, b) => a.date.localeCompare(b.date)
    },
    {
      title: "Project",
      render: (_, record) => getProjectName(record.projectId),
      sorter: (a, b) =>
        getProjectName(a.projectId).localeCompare(
          getProjectName(b.projectId)
        )
    },
    {
      title: "Task",
      render: (_, record) => getTaskName(record.taskId),
      filters: uniqueTasks.map((task) => ({
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
      filters: [
        { text: "Yes", value: true },
        { text: "No", value: false }
      ],
      onFilter: (value, record) =>
        record.billable === value,
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
    <div className="dashboard-container">

      <div className="dashboard-toolbar">

        <RangePicker
          value={dateRange}
          onChange={handleDateChange}
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
            style={{
              backgroundColor: "#1677ff",
              borderColor: "#1677ff"
            }}
          >
            Time Entry
          </Button>

        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 6 }}
        locale={{
          emptyText:
            "No time entries found for selected date range"
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
  );
};

export default Dashboard;
