import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Select,
  Input,
  DatePicker,
  TimePicker,
  Button,
  Row,
  Col,
  Switch,
  Divider,
  message
} from "antd";
import {
  PlusOutlined,
  MinusCircleOutlined
} from "@ant-design/icons";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs
} from "firebase/firestore";
import { db } from "../firebase";

const { Option } = Select;

const BulkTimeEntryModal = ({
  open,
  setOpen,
  user,
  onSuccess
}) => {
  const [form] = Form.useForm();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [saving, setSaving] = useState(false);

  /* =========================
     FETCH PROJECTS & TASKS
  ========================= */

  useEffect(() => {
    if (!open) return;

    const fetchDropdownData = async () => {
      try {
        const [projectSnap, taskSnap] = await Promise.all([
          getDocs(collection(db, "projects")),
          getDocs(collection(db, "tasks"))
        ]);

        setProjects(
          projectSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        );

        setTasks(
          taskSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        );
      } catch {
        message.error("Failed to load dropdown data");
      }
    };

    fetchDropdownData();
  }, [open]);

  /* =========================
     SUBMIT
  ========================= */

  const onFinish = async (values) => {
    if (!user) {
      message.error("Please login first");
      return;
    }

    try {
      setSaving(true);

      await Promise.all(
        values.entries.map((entry) => {
          const hours = entry.logTime.hour();
          const minutes = entry.logTime.minute();
          const totalMinutes = hours * 60 + minutes;

          return addDoc(collection(db, "timeEntries"), {
            userId: user.uid,
            projectId: entry.project,
            taskId: entry.task,
            type: entry.type || "",
            ticket: entry.ticket || "",
            date: entry.date.format("YYYY-MM-DD"),
            hours,
            minutes,
            totalMinutes,
            description: entry.description,
            billable: entry.billable === true,
            status: "Pending",
            deleted: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        })
      );

      message.success("Bulk time entries created successfully");
      form.resetFields();
      setOpen(false);
      onSuccess();

    } catch {
      message.error("Failed to save bulk entries");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     UI
  ========================= */

  return (
    <Modal
      open={open}
      footer={null}
      width={1100}
      onCancel={() => setOpen(false)}
      centered
      destroyOnClose
    >
      <div className="modal-header">
        <h2 className="modal-title">Bulk Time Entry</h2>
      </div>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.List name="entries">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }) => (
                <div key={key} className="bulk-row-wrapper">

                  <Row gutter={16}>
                    <Col span={4}>
                      <Form.Item
                        label="Project"
                        name={[name, "project"]}
                        rules={[{ required: true }]}
                      >
                        <Select placeholder="Select Project">
                          {projects.map(project => (
                            <Option key={project.id} value={project.id}>
                              {project.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col span={4}>
                      <Form.Item
                        label="Task"
                        name={[name, "task"]}
                        rules={[{ required: true }]}
                      >
                        <Select placeholder="Select Task">
                          {tasks.map(task => (
                            <Option key={task.id} value={task.id}>
                              {task.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col span={3}>
                      <Form.Item
                        label="Date"
                        name={[name, "date"]}
                        rules={[{ required: true }]}
                      >
                        <DatePicker className="full-width" />
                      </Form.Item>
                    </Col>

                    <Col span={3}>
                      <Form.Item
                        label="Duration"
                        name={[name, "logTime"]}
                        rules={[{ required: true }]}
                      >
                        <TimePicker
                          className="full-width"
                          format="HH:mm"
                          minuteStep={15}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={3}>
                      <Form.Item
                        label="Type"
                        name={[name, "type"]}
                      >
                        <Input placeholder="Type" />
                      </Form.Item>
                    </Col>

                    <Col span={3}>
                      <Form.Item
                        label="Ticket"
                        name={[name, "ticket"]}
                      >
                        <Input placeholder="Ticket" />
                      </Form.Item>
                    </Col>

                    <Col span={3}>
                      <Form.Item
                        label="Billable"
                        name={[name, "billable"]}
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Col>

                    <Col span={1} className="remove-col">
                      <MinusCircleOutlined
                        className="remove-icon"
                        onClick={() => remove(name)}
                      />
                    </Col>
                  </Row>

                  <Form.Item
                    label="Description"
                    name={[name, "description"]}
                    rules={[{ required: true }]}
                  >
                    <Input.TextArea rows={2} />
                  </Form.Item>

                  <Divider />
                </div>
              ))}

              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  block
                >
                  Add Another Entry
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={saving}
        >
          {saving ? "Saving..." : "Save All Entries"}
        </Button>
      </Form>
    </Modal>
  );
};

export default BulkTimeEntryModal;