const fetch = require("node-fetch");

module.exports = async (req, res) => {
  const { username } = req.query;
  const maxTries = 3;
  const delay = 1000;

  for (let attempt = 1; attempt <= maxTries; attempt++) {
    try {
      const query = `
        query userCalendar($username: String!) {
          matchedUser(username: $username) {
            userCalendar {
              submissionCalendar
            }
          }
        }
      `;
      const response = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { username } }),
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `HTTP error ${response.status}` });
      }

      const data = await response.json();
      return res.json(data);
    } catch (err) {
      if (attempt === maxTries) {
        return res.status(500).json({ error: err.message });
      }
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
};