import Layout from "../components/Layout";
import { mockLeads } from "../data/mockLeads";
import "./LeadTable.css";

const Leads = () => {
  return (
    <Layout>
      <div className="leads-container">

        <div className="leads-header">
          <h1 className="leads-title">Lead Management</h1>

          <button className="leads-button">
            + Add Lead
          </button>
        </div>

        <input
          type="text"
          placeholder="Search leads..."
          className="leads-search"
        />

        <div className="table-wrapper">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {mockLeads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.name}</td>
                  <td>{lead.email}</td>
                  <td>{lead.phone}</td>
                  <td>
                    <span
                      className={`status ${
                        lead.status.toLowerCase()
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </Layout>
  );
};

export default Leads;