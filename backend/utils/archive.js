import AdmZip from "adm-zip";
import tar from "tar";
import fs from "fs";

export function extractArchive(archivePath, destDir, originalName = "") {
  console.log(">> Trying to extract:", archivePath, "original:", originalName);

  const lower = (originalName || "").toLowerCase();

  if (lower.endsWith(".zip")) {
    console.log(">> Detected ZIP via name");
    const zip = new AdmZip(archivePath);
    zip.extractAllTo(destDir, true);
    return;
  } else if (
    lower.endsWith(".tar.gz") ||
    lower.endsWith(".tgz") ||
    lower.endsWith(".tar")
  ) {
    console.log(">> Detected TAR via name");
    tar.x({ file: archivePath, cwd: destDir, sync: true });
    return;
  }

  // fallback: cek magic number
  const buf = fs.readFileSync(archivePath);
  if (buf[0] === 0x50 && buf[1] === 0x4b) {
    console.log(">> Detected ZIP via magic number");
    const zip = new AdmZip(archivePath);
    zip.extractAllTo(destDir, true);
    return;
  }
  if (buf[0] === 0x1f && buf[1] === 0x8b) {
    console.log(">> Detected TAR.GZ via magic number");
    tar.x({ file: archivePath, cwd: destDir, sync: true });
    return;
  }

  throw new Error("Unsupported archive format: " + (originalName || archivePath));
}
