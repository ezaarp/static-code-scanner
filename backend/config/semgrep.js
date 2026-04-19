export const MAX_UPLOAD_SIZE = 200 * 1024 * 1024; // 200 MB
export const SEMGREP_CMD_BASE = ["scan"];
export const SEMGREP_TIMEOUT = 180 * 1000; // ms
export const GIT_TIMEOUT = 90 * 1000;

export const AVAILABLE_CONFIGS = {
  auto: "Auto (multi-language default)",
  "p/security-audit": "Security Audit (all languages)",
  "p/javascript": "JavaScript",
  "p/python": "Python",
  "p/php": "PHP",
  "p/nodejs": "Node.js"
};
