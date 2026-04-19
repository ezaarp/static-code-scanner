import express from "express";
import auditRoutes from "./routes/audit.js";

const app = express();
app.use(express.json());

// routes
app.use("/audit", auditRoutes);

app.get("/", (req, res) => {
  res.send(`
    <h1>Semgrep Audit</h1>
    <form method="POST" action="/audit" enctype="multipart/form-data">
      <h3>Upload archive (zip/tar.gz)</h3>
      <input type="file" name="archive" /><br/><br/>
      <label>Config:</label>
      <select name="config">
        <option value="auto">Auto</option>
        <option value="p/security-audit">Security Audit</option>
        <option value="p/javascript">JavaScript</option>
        <option value="p/python">Python</option>
        <option value="p/php">PHP</option>
        <option value="p/nodejs">Node.js</option>
      </select>
      <button type="submit">Upload & Scan</button>
    </form>

    <hr/>

    <form method="POST" action="/audit">
      <h3>Or clone Git repo</h3>
      <input type="text" name="git_url" placeholder="https://github.com/user/repo.git" size="60"/>
      <br/><br/>
      <label>Config:</label>
      <select name="config">
        <option value="auto">Auto</option>
        <option value="p/security-audit">Security Audit</option>
        <option value="p/javascript">JavaScript</option>
        <option value="p/python">Python</option>
        <option value="p/php">PHP</option>
        <option value="p/nodejs">Node.js</option>
      </select>
      <button type="submit">Clone & Scan</button>
    </form>
  `);
});


app.listen(9991, () => {
  console.log("Server running on http://127.0.0.1:9991");
});
