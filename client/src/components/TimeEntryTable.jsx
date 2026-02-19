import React, { useEffect, useState } from "react";
import { Table } from "antd";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const TimeEntryTable = ({ user, refresh }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchData();
  }, [refresh]);

  const fetchData = async () => {
    const q = query(
      collection(db, "timeEntries"),
      where("userId", "==", user.uid)
    );
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(doc => ({
      key: doc.id,
      ...doc.data()
    }));
    setData(list);
  };

  const columns = [
    { title: "Date", dataIndex: "date" },
    { title: "Project", dataIndex: "project" },
    { title: "Task", dataIndex: "task" },
    { title: "Time", dataIndex: "logTime" },
    { title: "Description", dataIndex: "description" }
  ];

  return <Table columns={columns} dataSource={data} />;
};

export default TimeEntryTable;
