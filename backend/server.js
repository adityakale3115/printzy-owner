// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch"); // For Node < 18
const { exec } = require("child_process");
const printer = require("pdf-to-printer");

const app = express();
const PORT = 5000;

app.use(cors({ origin: "*" }));
app.use(bodyParser.json());

// 🔹 List printers
app.get("/printers", async (req, res) => {
  try {
    const printers = await printer.getPrinters();
    res.json(printers.map(p => ({
      name: p.name,
      deviceId: p.name
    })));
  } catch (err) {
    console.error("❌ Failed to list printers:", err);
    res.status(500).json({ error: "Failed to fetch printers" });
  }
});

// 🔹 Download file from URL
async function downloadFileFromUrl(url, localPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to download file: " + res.statusText);
  const buffer = await res.buffer();
  fs.writeFileSync(localPath, buffer);
  return localPath;
}

// 🔹 Convert DOC/DOCX → PDF with LibreOffice
async function convertDocxToPdf(docxPath) {
  return new Promise((resolve, reject) => {
    const outDir = path.dirname(docxPath);

    // full path to soffice.exe (Windows)
    const sofficePath = `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"`;

    exec(
      `${sofficePath} --headless --convert-to pdf --outdir "${outDir}" "${docxPath}"`,
      (err) => {
        if (err) return reject(err);
        const pdfPath = docxPath.replace(/\.(docx?|DOCX?|DOC)$/i, ".pdf");
        resolve(pdfPath);
      }
    );
  });
}

// 🔹 Print file
async function printFile(printerId, filePath, copies = 1, sides = "Single") {
  const options = {
    printer: printerId,
    copies,
  };

  // 🖨️ Duplex option
  if (sides === "Double") {
    options.unix = ["-o", "sides=two-sided-long-edge"]; // Linux/macOS
    options.win32 = ["-print-settings", "duplex"];      // Windows
  }

  await printer.print(filePath, options);
}

// 🔹 Print endpoint
app.post("/print", async (req, res) => {
  try {
    const { printerId, order } = req.body;
    if (!printerId || !order?.fileURL) {
      return res.status(400).json({ error: "Missing printerId or fileURL" });
    }

    const filename = path.basename(order.fileURL.split("?")[0]);
    const ext = path.extname(filename).toLowerCase();
    const downloadsDir = path.join(__dirname, "downloads");
    if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

    const localPath = path.join(downloadsDir, filename);

    // Download file
    await downloadFileFromUrl(order.fileURL, localPath);

    let fileToPrint = localPath;

    // Convert DOC/DOCX → PDF
    if (ext === ".doc" || ext === ".docx") {
      fileToPrint = await convertDocxToPdf(localPath);
    }

    // ✅ Print
    await printFile(
      printerId,
      fileToPrint,
      order.options?.copies || 1,
      order.options?.sides || "Single"
    );

    // Clean up
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    if (fileToPrint !== localPath && fs.existsSync(fileToPrint)) {
      fs.unlinkSync(fileToPrint);
    }

    res.json({ success: true, message: "✅ Print job completed" });
  } catch (err) {
    console.error("❌ Print job failed:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
