import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Select,
  Input,
  DatePicker,
  TimePicker,
  Switch,
  Button,
  Row,
  Col,
  message
} from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs
} from "firebase/firestore";
import dayjs from "dayjs";

const { Option } = Select;
const { confirm } = Modal;

const TimeEntryModal = ({
  open,
  setOpen,
  user,
  onSuccess,
  editingEntry
}) => {
  const [form] = Form.useForm();

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  /* =========================
     FETCH PROJECTS & TASKS
  ========================= */

  useEffect(() => {
    if (!open) return;

    const fetchDropdownData = async () => {
      try {
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
      } catch (error) {
        console.error("Dropdown fetch error:", error);
      }
    };

    fetchDropdownData();
  }, [open]);

  /* =========================
     PREFILL DATA FOR EDIT
  ========================= */

  useEffect(() => {
    if (editingEntry && open) {
      form.setFieldsValue({
        project: editingEntry.projectId,
        task: editingEntry.taskId,
        type: editingEntry.type,
        ticket: editingEntry.ticket,
        date: editingEntry.date
          ? dayjs(editingEntry.date)
          : null,
        logTime: editingEntry.totalMinutes
          ? dayjs()
              .hour(Math.floor(editingEntry.totalMinutes / 60))
              .minute(editingEntry.totalMinutes % 60)
          : null,
        description: editingEntry.description,
        billable: editingEntry.billable
      });
    } else if (!editingEntry && open) {
      form.resetFields();
    }
  }, [editingEntry, open, form]);

  /* =========================
     CONFIRM CLOSE
  ========================= */

  const handleCancel = () => {
    const isFieldsTouched = form.isFieldsTouched();

    if (!isFieldsTouched) {
      setOpen(false);
      return;
    }

    confirm({
      title: "Are you sure you want to close?",
      icon: <ExclamationCircleOutlined />,
      content: "Any unsaved changes will be lost.",
      okText: "Yes, Close",
      okType: "danger",
      cancelText: "Cancel",
      centered: true,
      onOk() {
        form.resetFields();
        setOpen(false);
      }
    });
  };

  /* =========================
     SUBMIT
  ========================= */

  const onFinish = async (values) => {
    if (!user) {
      message.error("Please login first");
      return;
    }

    try {
      const hours = values.logTime.hour();
      const minutes = values.logTime.minute();
      const totalMinutes = hours * 60 + minutes;

      const payload = {
        userId: user.uid,
        projectId: values.project,
        taskId: values.task,
        type: values.type || "",
        ticket: values.ticket || "",
        date: values.date.format("YYYY-MM-DD"),
        hours,
        minutes,
        totalMinutes,
        description: values.description,
        billable: values.billable || false,
        status: "Pending",
        updatedAt: serverTimestamp()
      };

      if (editingEntry) {
        await updateDoc(
          doc(db, "timeEntries", editingEntry.id),
          payload
        );
        message.success("Time entry updated successfully");
      } else {
        await addDoc(collection(db, "timeEntries"), {
          ...payload,
          createdAt: serverTimestamp()
        });
        message.success("Time entry created successfully");
      }

      form.resetFields();
      setOpen(false);
      onSuccess();
    } catch (error) {
      message.error(error.message);
    }
  };

  /* =========================
     UI
  ========================= */

  return (
    <Modal
      open={open}
      footer={null}
      width={760}
      onCancel={handleCancel}
      centered
      destroyOnClose
      maskClosable={false}
    >
      <div
        style={{
          borderBottom: "1px solid #e5e5e5",
          marginBottom: 24,
          paddingBottom: 16
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>
          {editingEntry ? "Edit Time Entry" : "Time Entry"}
        </h2>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark>

        {/* PROJECT */}
        <Form.Item
          label="Project"
          name="project"
          rules={[{ required: true, message: "Please select project" }]}
        >
          <Select
            placeholder="Select Project"
            size="large"
            onChange={() => form.setFieldsValue({ task: null })}
          >
            {projects.map((project) => (
              <Option key={project.id} value={project.id}>
                {project.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* TASK (NO RESTRICTION) */}
        <Form.Item
          label="Task"
          name="task"
          rules={[{ required: true, message: "Please select task" }]}
        >
          <Select
            placeholder="Select Task"
            size="large"
          >
            {tasks.map(task => (
              <Option key={task.id} value={task.id}>
                {task.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Type" name="type">
          <Input placeholder="Enter Type" size="large" />
        </Form.Item>

        <Form.Item label="Ticket" name="ticket">
          <Input placeholder="Enter Ticket Number" size="large" />
        </Form.Item>

        <Row gutter={20}>
          <Col span={12}>
            <Form.Item
              label="Date"
              name="date"
              rules={[{ required: true, message: "Please select date" }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                size="large"
                format="DD MMM YYYY"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Work Duration (Max 12 Hours)"
              name="logTime"
              rules={[{ required: true, message: "Please select duration" }]}
            >
              <TimePicker
                style={{ width: "100%" }}
                size="large"
                format="HH:mm"
                minuteStep={15}
                hideDisabledOptions
                disabledHours={() =>
                  Array.from({ length: 24 }, (_, i) =>
                    i === 0 || i > 12 ? i : null
                  ).filter(Boolean)
                }
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: "Please enter description" }]}
        >
          <Input.TextArea rows={4} placeholder="Enter description..." />
        </Form.Item>

        <Row justify="space-between" align="middle">
          <Col>
            <Form.Item
              name="billable"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
            >
              <Switch />
              <span style={{ marginLeft: 10 }}>Billable</span>
            </Form.Item>
          </Col>

          <Col>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              style={{ minWidth: 120 }}
            >
              {editingEntry ? "Update" : "Create"}
            </Button>
          </Col>
        </Row>

      </Form>
    </Modal>
  );
};

export default TimeEntryModal;





