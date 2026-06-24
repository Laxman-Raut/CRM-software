import { useState, useEffect, useMemo } from "react";
import {
  FaBell,
  FaSearch,
  FaTasks,
  FaProjectDiagram,
  FaInfoCircle,
  FaCheck,
  FaTrash,
  FaFilePdf
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import { useSearch } from "../context/SearchContext";
import api from "../services/api";
import "./Navbar.css";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";


const Navbar = () => {

  const { search, setSearch } = useSearch();

  const email = localStorage.getItem("email") || "";
  const name = localStorage.getItem("name") || "";
  const role = localStorage.getItem("role") || "employee";

  const navigate = useNavigate();


  const [notifications,setNotifications] = useState([]);
  const [dropdownOpen,setDropdownOpen] = useState(false);

  const exportLeadsPDF = async () => {
    try {
      const response = await api.get("/leads");
      const leads = Array.isArray(response.data) ? response.data : [];

      if (leads.length === 0) {
        alert("No leads available to export.");
        return;
      }

      const doc = new jsPDF();

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("CRM Leads Management Report", 14, 22);

      // Metadata
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 29);
      doc.text(`Total Leads: ${leads.length}`, 14, 34);

      // Format headers and data
      const tableHeaders = [["Name", "Company", "Email", "Phone", "Status", "Value (INR)"]];
      const tableData = leads.map((lead) => [
        lead.name || "",
        lead.company || "",
        lead.email || "",
        lead.phone || "",
        lead.status || "New",
        lead.value ? lead.value.toLocaleString("en-IN") : "0"
      ]);

      // Draw the table
      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        startY: 40,
        theme: "striped",
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] }, // Royal Blue
        alternateRowStyles: { fillColor: [248, 250, 252] }, // Slate-50
      });

      // Save
      doc.save(`leads_report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("PDF export failed", error);
      alert("Failed to export PDF: " + (error.response?.data?.message || error.message));
    }
  };



  const fetchNotifications = async()=>{

    try{

      const res = await api.get(
        "/notifications"
      );

      setNotifications(
        Array.isArray(res.data)
        ? res.data
        : []
      );


    }catch(error){

      console.log(
        "Notification error",
        error
      );

    }

  };



  useEffect(()=>{

    fetchNotifications();


    const interval =
      setInterval(
        fetchNotifications,
        20000
      );


    return ()=>clearInterval(interval);


  },[]);





  const unreadCount = useMemo(()=>{

    return notifications.filter(
      item=>!item.read
    ).length;


  },[notifications]);





  const getInitials =()=>{

    const display =
      name || email || "User";


    const parts =
      display
      .split("@")[0]
      .split(/[._ -]/);


    if(parts.length >= 2){

      return (
        parts[0][0] +
        parts[1][0]
      ).toUpperCase();

    }


    return display
      .slice(0,2)
      .toUpperCase();

  };





  const markRead = async(id,e)=>{

    e.stopPropagation();


    try{

      await api.put(
        `/notifications/${id}/read`
      );


      setNotifications(prev=>
        prev.map(n=>
          n._id===id
          ? {...n,read:true}
          : n
        )
      );


    }catch(error){

      console.log(error);

    }

  };





  const markAllRead = async()=>{

    try{

      await api.put(
        "/notifications/read-all"
      );


      setNotifications(prev=>
        prev.map(n=>({
          ...n,
          read:true
        }))
      );


    }catch(error){

      console.log(error);

    }

  };





  const deleteNotification = async(id,e)=>{

    e.stopPropagation();


    try{

      await api.delete(
        `/notifications/${id}`
      );


      setNotifications(prev=>
        prev.filter(
          n=>n._id!==id
        )
      );


    }catch(error){

      console.log(error);

    }

  };





  const notificationClick = async(item)=>{


    if(!item.read){

      await api.put(
        `/notifications/${item._id}/read`
      );

    }


    setDropdownOpen(false);


    if(item.link){

      navigate(item.link);

    }

  };





  const getIcon=(type)=>{

    switch(type){

      case "task_assigned":
        return <FaTasks/>;


      case "task_updated":
        return <FaTasks/>;


      case "lead_status_changed":
        return <FaProjectDiagram/>;


      default:
        return <FaInfoCircle/>;

    }

  };





return (

<header className="navbar">



<div className="navbar-search">

<FaSearch/>


<input

type="text"

placeholder="Search leads, email, or status globally..."

value={search}

onChange={(e)=>setSearch(e.target.value)}

/>

</div>





<div className="navbar-actions">

      <button
        onClick={exportLeadsPDF}
        className="export-btn"
      >
        <FaFilePdf /> Export PDF
      </button>





<div className="navbar-notification-container">


<button

className="navbar-notification-btn"

onClick={()=>
setDropdownOpen(!dropdownOpen)
}

>

<FaBell/>


{
unreadCount>0 &&

<span className="notification-badge">

{unreadCount}

</span>

}


</button>







{
dropdownOpen &&


<div className="notification-dropdown">



<div className="notification-dropdown-header">


<h3>
Notifications
</h3>


{
unreadCount>0 &&

<button
onClick={markAllRead}
>

Mark all read

</button>

}


</div>







<div className="notification-dropdown-list">



{

notifications.length===0 ?

(
<div className="notification-empty-state">

No notifications

</div>
)


:

notifications.map(item=>(


<div

key={item._id}

className="notification-item"

onClick={()=>
notificationClick(item)
}

>


<div className="notif-icon-box">

{getIcon(item.type)}

</div>



<div className="notif-content">


<span>

{item.title}

</span>


<p>

{item.message}

</p>


</div>





<div className="notif-actions">


{
!item.read &&

<button

onClick={(e)=>
markRead(item._id,e)
}

>

<FaCheck/>

</button>

}



<button

onClick={(e)=>
deleteNotification(
item._id,
e
)
}

>

<FaTrash/>

</button>



</div>



</div>


))


}


</div>


</div>


}



</div>







<div className="navbar-profile">


<div className="profile-details">


<span className="profile-name">

{name || email.split("@")[0]}

</span>


<span className="profile-role">

{role}

</span>


</div>





<div className="profile-avatar">

{getInitials()}

</div>


</div>





</div>


</header>

);


};


export default Navbar;