import React, { useState } from "react";
import { Input, Collapse, Button, message } from "antd";

// Initial data for the recipients
const initialData = [
  { email: "ann@timescale.com", isSelected: false },
  { email: "bob@timescale.com", isSelected: false },
  { email: "brian@qwerty.com", isSelected: true },
  { email: "james@qwerty.com", isSelected: false },
  { email: "jane@awesome.com", isSelected: false },
  { email: "kate@qwerty.com", isSelected: true },
  { email: "mike@hello.com", isSelected: true },
];

// Helper function to group emails by domain
const groupByDomain = (data) => {
  const grouped = {};
  data.forEach(({ email }) => {
    const domain = email.split("@")[1];
    if (!grouped[domain]) grouped[domain] = [];
    grouped[domain].push(email);
  });
  return grouped;
};

// Pre-process the initial data to split available and selected recipients
const processInitialData = (data) => {
  const available = [];
  const selected = { companyRecipients: {}, emailRecipients: [] };

  data.forEach((item) => {
    const domain = item.email.split("@")[1];

    if (item.isSelected) {
      if (!selected.companyRecipients[domain]) {
        selected.companyRecipients[domain] = [];
      }
      selected.companyRecipients[domain].push(item.email);
    } else {
      available.push(item);
    }
  });

  return {
    availableRecipients: groupByDomain(available),
    selectedRecipients: selected,
  };
};

const {
  availableRecipients: initialAvailable,
  selectedRecipients: initialSelected,
} = processInitialData(initialData);

const RecipientManager = () => {
  const [availableRecipients, setAvailableRecipients] =
    useState(initialAvailable);
  const [selectedRecipients, setSelectedRecipients] = useState(initialSelected);
  const [searchTerm, setSearchTerm] = useState("");

  // Select all emails for a specific domain
  const handleSelectDomain = (domain) => {
    const emails = availableRecipients[domain] || [];
    setAvailableRecipients((prev) => {
      const updated = { ...prev };
      delete updated[domain];
      return updated;
    });
    setSelectedRecipients((prev) => ({
      ...prev,
      companyRecipients: { ...prev.companyRecipients, [domain]: emails },
    }));
  };

  // Select a single email
  const handleSelectEmail = (email) => {
    const domain = email.split("@")[1];
    setAvailableRecipients((prev) => {
      const updated = { ...prev };
      updated[domain] = updated[domain].filter((e) => e !== email);
      if (updated[domain].length === 0) delete updated[domain];
      return updated;
    });
    setSelectedRecipients((prev) => ({
      ...prev,
      emailRecipients: [...prev.emailRecipients, email],
    }));
  };

  // Remove all emails for a specific domain from the selected list
  const handleRemoveDomain = (domain) => {
    const emails = selectedRecipients.companyRecipients[domain] || [];
    setSelectedRecipients((prev) => {
      const updated = { ...prev };
      delete updated.companyRecipients[domain];
      return updated;
    });
    setAvailableRecipients((prev) => ({ ...prev, [domain]: emails }));
  };

  // Remove a single email from the selected list
  const handleRemoveEmail = (email) => {
    const domain = email.split("@")[1];
    setSelectedRecipients((prev) => ({
      ...prev,
      emailRecipients: prev.emailRecipients.filter((e) => e !== email),
    }));
    setAvailableRecipients((prev) => ({
      ...prev,
      [domain]: [...(prev[domain] || []), email],
    }));
  };

  // Handle search functionality and add email if not found
  const handleSearch = (value) => {
    setSearchTerm(value);
    const emailFound =
      Object.values(availableRecipients).flat().includes(value) ||
      selectedRecipients.emailRecipients.includes(value) ||
      Object.values(selectedRecipients.companyRecipients).some((emails) =>
        emails.includes(value)
      );

    if (!emailFound) {
      handleAddEmail(value);
    }
  };

  // Add a new email to available recipients
  const handleAddEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      message.error("Invalid email format!");
      return;
    }

    const domain = email.split("@")[1];

    // Check for duplicates
    const isDuplicate =
      (availableRecipients[domain] &&
        availableRecipients[domain].includes(email)) ||
      selectedRecipients.emailRecipients.includes(email) ||
      Object.keys(selectedRecipients.companyRecipients).some((d) =>
        selectedRecipients.companyRecipients[d].includes(email)
      );

    if (isDuplicate) {
      message.error("Email already exists!");
      return;
    }

    setAvailableRecipients((prev) => ({
      ...prev,
      [domain]: [...(prev[domain] || []), email],
    }));
  };

  // Filter available recipients based on the search term
  const filteredAvailableRecipients = Object.keys(availableRecipients).reduce(
    (acc, domain) => {
      const filteredEmails = availableRecipients[domain].filter((email) =>
        email.includes(searchTerm)
      );
      if (filteredEmails.length > 0) acc[domain] = filteredEmails;
      return acc;
    },
    {}
  );

  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        justifyContent: "center",
        marginTop: "50px",
      }}
    >
      {/* Available Recipients */}
      <div
        style={{
          border: "1px solid #ccc",
          padding: "0 20px 20px",
          borderRadius: "5px",
          width: "300px",
        }}
      >
        <h2>Available Recipients</h2>
        <Input.Search
          placeholder="Search or add email"
          onSearch={handleSearch}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: 20 }}
        />
        <Collapse>
          {Object.keys(filteredAvailableRecipients).map((domain) => (
            <Collapse.Panel header={domain} key={domain}>
              {filteredAvailableRecipients[domain].map((email) => (
                <div
                  key={email}
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  {email}
                  <Button type="link" onClick={() => handleSelectEmail(email)}>
                    Select
                  </Button>
                </div>
              ))}
              <Button type="primary" onClick={() => handleSelectDomain(domain)}>
                Select All
              </Button>
            </Collapse.Panel>
          ))}
        </Collapse>
      </div>

      {/* Selected Recipients */}
      <div
        style={{
          border: "1px solid #ccc",
          padding: "0 20px 20px",
          borderRadius: "5px",
          width: "300px",
        }}
      >
        <h2>Selected Recipients</h2>
        <Collapse>
          <Collapse.Panel header="Company Recipients" key="companyRecipients">
            {Object.keys(selectedRecipients.companyRecipients).map((domain) => (
              <Collapse key={domain} defaultActiveKey={["0"]}>
                <Collapse.Panel header={domain}>
                  {selectedRecipients.companyRecipients[domain].map((email) => (
                    <div
                      key={email}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      {email}
                    </div>
                  ))}
                  <Button
                    type="primary"
                    danger
                    onClick={() => handleRemoveDomain(domain)}
                  >
                    Remove All
                  </Button>
                </Collapse.Panel>
              </Collapse>
            ))}
          </Collapse.Panel>

          <Collapse.Panel header="Email Recipients" key="emailRecipients">
            {selectedRecipients.emailRecipients.map((email) => (
              <div
                key={email}
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                {email}
                <Button
                  type="link"
                  danger
                  onClick={() => handleRemoveEmail(email)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </Collapse.Panel>
        </Collapse>
      </div>
    </div>
  );
};

export default RecipientManager;
