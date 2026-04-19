import path from "path";
import fs from "fs";
import unzipper from "unzipper";
import { exec } from "child_process";
import AnsiToHtml from "ansi-to-html";

// Variabel global
let repoDir = null;

export const handleAudit = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Tentukan lokasi ekstrak
    const extractPath = path.join(process.cwd(), "uploads", Date.now().toString());
    fs.mkdirSync(extractPath, { recursive: true });

    // Ekstrak file zip
    await fs.createReadStream(req.file.path)
      .pipe(unzipper.Extract({ path: extractPath }))
      .promise();

    repoDir = extractPath;

    // Cek format output dari query param
    const format = req.query.format || "json";
    const cmd =
      format === "text"
        ? `/home/shangrila/allvenv/bin/semgrep --config=p/security-audit --text ${repoDir}`
        : `/home/shangrila/allvenv/bin/semgrep --config=p/security-audit --json ${repoDir}`;

    exec(cmd, { maxBuffer: 1024 * 1024 * 20 }, (err, stdout, stderr) => {
      if (err) {
        console.error("Scan error:", err);
        return res.status(500).json({ error: "Scanning failed", details: stderr });
      }

      if (format === "text") {
        // Konversi ANSI → HTML
        const convert = new AnsiToHtml();
        const htmlOutput = convert.toHtml(stdout);

        return res.json({
          success: true,
          repoDir,
          format: "text",
          result: htmlOutput
        });
      } else {
        // JSON structured
        let results;
        try {
          results = JSON.parse(stdout);
        } catch (e) {
          results = { raw: stdout };
        }

        return res.json({
          success: true,
          repoDir,
          format: "json",
          findings: results
        });
      }
    });
  } catch (err) {
    console.error("Error in handleAudit:", err);
    return res.status(500).json({ error: err.message });
  }
};
