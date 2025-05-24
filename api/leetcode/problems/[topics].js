const fetch = require("node-fetch");

module.exports = async (req, res) => {
  const { topic } = req.query;
  try {
    const query = `
      query problemsetQuestionList($categorySlug: String, $filters: ProblemsetQuestionListFilterInput) {
        problemsetQuestionList(categorySlug: $categorySlug, limit: 1, filters: $filters) {
          questions {
            title
            titleSlug
          }
        }
      }
    `;
    const tagMap = {
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
      "two-pointers": "two-pointers",
    };
    const formattedTag = tagMap[topic.toLowerCase().replace(/ /g, "-")] || topic.toLowerCase().replace(/ /g, "-");

    const response = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        variables: { categorySlug: "all", filters: { tags: [formattedTag] } },
      }),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `HTTP error ${response.status}` });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};