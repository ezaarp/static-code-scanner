import { execFileSync } from "child_process";
import { SEMGREP_CMD_BASE, SEMGREP_TIMEOUT } from "../config/semgrep.js";

export function runSemgrepJson(targetDir, config) {
  const cmd = "semgrep";
  const args = [
    ...SEMGREP_CMD_BASE,
    "--json",
    "--config",
    config,
    "--no-git-ignore",
    targetDir
  ];

  return execFileSync(cmd, args, {
    encoding: "utf-8",
    timeout: SEMGREP_TIMEOUT
  });
}
