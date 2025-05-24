var express = require("express");
var path = require("path");
var fetch = require("node-fetch");

var app = express();
var PORT = process.env.PORT || 3000;

// Serve the public folder
app.use(express.static(path.join(__dirname, "public")));

// Route to get user stats
app.get("/api/leetcode/:username", async function(req, res) {
  var maxTries = 3;
  var delay = 1000;
  var attempt = 1;

  // Keep trying a few times if it fails
  while (attempt <= maxTries) {
    try {
      var query = `
        query userProfileAndStats($username: String!) {
          matchedUser(username: $username) {
            username
            profile {
              ranking
            }
            submitStats {
              acSubmissionNum {
                difficulty
                count
              }
            }
            tagProblemCounts {
              advanced {
                tagName
                problemsSolved
              }
              intermediate {
                tagName
                problemsSolved
              }
              fundamental {
                tagName
                problemsSolved
              }
            }
          }
        }
      `;
      var response = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query, variables: { username: req.params.username } })
      });

      if (!response.ok) {
        res.status(response.status).json({ error: "HTTP error " + response.status });
        return;
      }

      var data = await response.json();
      res.json(data);
      return;

    } catch (err) {
      if (attempt === maxTries) {
        res.status(500).json({ error: err.message });
        return;
      }
      attempt++;
      // Wait a bit before trying again
      await new Promise(function(resolve) {
        setTimeout(resolve, delay * attempt);
      });
    }
  }
});

// Route to get problems for a topic
app.get("/api/leetcode/problems/:topic", async function(req, res) {
  try {
    var query = `
      query problemsetQuestionList($categorySlug: String, $filters: ProblemsetQuestionListFilterInput) {
        problemsetQuestionList(categorySlug: $categorySlug, limit: 1, filters: $filters) {
          questions {
            title
            titleSlug
          }
        }
      }
    `;
    // Map the topic names to what LeetCode expects
    var tagMap = {
      "divide-and-conquer": "divide-and-conquer",
      "trie": "trie",
      "union-find": "union-find",
      "hash-table": "hash-table",
      "tree": "tree",
      "binary-tree": "binary-tree",
      "graph": "graph",
      "greedy": "greedy",
      "binary-search": "binary-search",
      "depth-first-search": "depth-first-search",
      "breadth-first-search": "breadth-first-search",
      "recursion": "recursion",
      "sliding-window": "sliding-window",
      "bit-manipulation": "bit-manipulation",
      "math": "math",
      "array": "array",
      "matrix": "matrix",
      "string": "string",
      "simulation": "simulation",
      "enumeration": "enumeration",
      "sorting": "sorting",
      "stack": "stack",
      "linked-list": "linked-list",
      "two-pointers": "two-pointers"
    };
    var topic = req.params.topic.toLowerCase().replace(/ /g, "-");
    var formattedTag = tagMap[topic] || topic;

    var response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query,
        variables: {
          categorySlug: "all",
          filters: { tags: [formattedTag] }
        }
      })
    });

    if (!response.ok) {
      res.status(response.status).json({ error: "HTTP error " + response.status });
      return;
    }

    var data = await response.json();
    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route to get submission calendar
app.get("/api/leetcode/calendar/:username", async function(req, res) {
  var maxTries = 3;
  var delay = 1000;
  var attempt = 1;

  while (attempt <= maxTries) {
    try {
      var query = `
        query userCalendar($username: String!) {
          matchedUser(username: $username) {
            userCalendar {
              submissionCalendar
            }
          }
        }
      `;
      var response = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query,
          variables: { username: req.params.username }
        })
      });

      if (!response.ok) {
        res.status(response.status).json({ error: "HTTP error " + response.status });
        return;
      }

      var data = await response.json();
      res.json(data);
      return;

    } catch (err) {
      if (attempt === maxTries) {
        res.status(500).json({ error: err.message });
        return;
      }
      attempt++;
      await new Promise(function(resolve) {
        setTimeout(resolve, delay * attempt);
      });
    }
  }
});

// Serve the main page
app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start the server
app.listen(PORT, function() {
  console.log("Server is running on http://localhost:" + PORT);
});