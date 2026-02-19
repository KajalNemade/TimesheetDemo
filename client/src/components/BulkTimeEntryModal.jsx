import React from "react";
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
  Space,
  message
} from "antd";
import {
  PlusOutlined,
  MinusCircleOutlined
} from "@ant-design/icons";
import {
  collection,
  addDoc,
  serverTimestamp
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

  const onFinish = async (values) => {
    if (!user) {
      message.error("Please login first");
      return;
    }

    try {
      await Promise.all(
        values.entries.map((entry) =>
          addDoc(collection(db, "timeEntries"), {
            userId: user.uid,
            project: entry.project,
            task: entry.task,
            date: entry.date.format("YYYY-MM-DD"),
            logTime: entry.logTime.format("HH:mm"),
            description: entry.description,
            billable: false,
            status: "Pending",
            createdAt: serverTimestamp()
          })
        )
      );

      message.success("Bulk time entries created");
      form.resetFields();
      setOpen(false);
      onSuccess();

    } catch (error) {
      message.error("Failed to save bulk entries");
    }
  };

  return (
    <Modal
      open={open}
      footer={null}
      width={900}
      onCancel={() => setOpen(false)}
      centered
      destroyOnClose
    >
      <h2 style={{ marginBottom: 20 }}>
        Bulk Time Entry
      </h2>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.List name="entries">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }) => (
                <Row gutter={16} key={key} align="middle">
                  <Col span={4}>
                    <Form.Item
                      name={[name, "project"]}
                      rules={[{ required: true }]}
                    >
                      <Select placeholder="Project">
                        <Option value="BFC new phase Team">
                          BFC new phase Team
                        </Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col span={4}>
                    <Form.Item
                      name={[name, "task"]}
                      rules={[{ required: true }]}
                    >
                      <Select placeholder="Task">
                        <Option value="Development">
                          Development
                        </Option>
                        <Option value="Meeting">
                          Meeting
                        </Option>
                        <Option value="Bug Fix">
                          Bug Fix
                        </Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col span={4}>
                    <Form.Item
                      name={[name, "date"]}
                      rules={[{ required: true }]}
                    >
                      <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>

                  <Col span={4}>
                        <Form.Item
                            name={[name, "logTime"]}
                            rules={[{ required: true, message: "Please select duration" }]}
                        >
                            <TimePicker
                            style={{ width: "100%" }}
                            format="HH:mm"
                            minuteStep={30}
                            hideDisabledOptions
                            disabledHours={() =>
                                Array.from({ length: 24 }, (_, i) => i).filter(
                                (h) => h === 0 || h > 12
                                )
                            }
                            />
                        </Form.Item>
                        </Col>


                  <Col span={6}>
                    <Form.Item
                      name={[name, "description"]}
                      rules={[{ required: true }]}
                    >
                      <Input placeholder="Description" />
                    </Form.Item>
                  </Col>

                  <Col span={2}>
                    <MinusCircleOutlined
                      onClick={() => remove(name)}
                      style={{
                        fontSize: 18,
                        color: "red",
                        cursor: "pointer"
                      }}
                    />
                  </Col>
                </Row>
              ))}

              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  block
                >
                  Add Row
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
        >
          Save All Entries
        </Button>
      </Form>
    </Modal>
  );
};

export default BulkTimeEntryModal;
