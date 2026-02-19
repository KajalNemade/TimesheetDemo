
import React, { useEffect, useState } from "react";
import { Table } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

const TimeEntryTable = ({ user, refresh }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [refresh, user]);

  const fetchData = async () => {
    try {
      const q = query(
        collection(db, "timeEntries"),
        where("userId", "==", user.uid)
      );

      const snapshot = await getDocs(q);

      const list = snapshot.docs.map((doc) => {
        const d = doc.data();

        return {
          key: doc.id,
          date: d.date,
          project: d.project,
          task: d.task,
          description: d.description,

          // Format time properly
          time: `${d.hours || 0}h ${d.minutes || 0}m`,

          // Ensure boolean
          billable: Boolean(d.billable),
        };
      });

      setData(list);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const columns = [
    { title: "Date", dataIndex: "date" },
    { title: "Project", dataIndex: "project" },
    { title: "Task", dataIndex: "task" },
    { title: "Time", dataIndex: "time" },
    { title: "Description", dataIndex: "description" },

    {
      title: "Billable",
      dataIndex: "billable",
      render: (billable) =>
        billable ? (
          <CheckOutlined style={{ color: "green", fontSize: 16 }} />
        ) : (
          "-"
        ),
    },
  ];

  return <Table columns={columns} dataSource={data} />;
};

export default TimeEntryTable;

// import React, { useEffect, useState } from "react";
// import { Table } from "antd";
// import { db } from "../firebase";
// import { collection, getDocs, query, where } from "firebase/firestore";

// const TimeEntryTable = ({ user, refresh }) => {
//   const [data, setData] = useState([]);

//   useEffect(() => {
//     fetchData();
//   }, [refresh]);

//   const fetchData = async () => {
//     const q = query(
//       collection(db, "timeEntries"),
//       where("userId", "==", user.uid)
//     );
//     const snapshot = await getDocs(q);
//     const list = snapshot.docs.map(doc => ({
//       key: doc.id,
//       ...doc.data()
//     }));
//     setData(list);
//   };

//   const columns = [
//     { title: "Date", dataIndex: "date" },
//     { title: "Project", dataIndex: "project" },
//     { title: "Task", dataIndex: "task" },
//     { title: "Time", dataIndex: "logTime" },
//     { title: "Description", dataIndex: "description" }
//   ];

//   return <Table columns={columns} dataSource={data} />;
// };

// export default TimeEntryTable;
