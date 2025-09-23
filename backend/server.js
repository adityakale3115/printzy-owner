// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch"); // For Node < 18
const { exec } = require("child_process");
const printer = require("pdf-to-printer");
const { PDFDocument } = require("pdf-lib");

const app = express();
const PORT = 5000;

app.use(cors({ origin: "*" }));
app.use(bodyParser.json());

// 🔹 List printers
app.get("/printers", async (req, res) => {
  try {
    const printers = await printer.getPrinters();
    res.json(
      printers.map((p) => ({
        name: p.name,
        deviceId: p.name,
      }))
    );
  } catch (err) {
    console.error("❌ Failed to list printers:", err);
    res.status(500).json({ error: "Failed to fetch printers: " + err });
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

// 🔹 Extract selected pages and apply orientation
async function processPdfPages(pdfPath, pageRanges, orientation) {
  const pdfBytes = fs.readFileSync(pdfPath);
  const srcPdf = await PDFDocument.load(pdfBytes);
  const newPdf = await PDFDocument.create();

  // parse ranges like "1,3,5-7"
  const pagesSet = new Set();
  pageRanges.split(",").forEach((part) => {
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(Number);
      for (let i = start; i <= end; i++) pagesSet.add(i - 1); // zero-based
    } else {
      const num = Number(part);
      if (!isNaN(num)) pagesSet.add(num - 1);
    }
  });

  const pagesArray = Array.from(pagesSet).sort((a, b) => a - b);
  for (const i of pagesArray) {
    if (i >= 0 && i < srcPdf.getPageCount()) {
      const [copiedPage] = await newPdf.copyPages(srcPdf, [i]);
      if (orientation === "Landscape") {
        copiedPage.setRotation(degrees(90));
      }
      newPdf.addPage(copiedPage);
    }
  }

  const tempPath = pdfPath.replace(/\.pdf$/i, "-processed.pdf");
  const pdfBytesOut = await newPdf.save();
  fs.writeFileSync(tempPath, pdfBytesOut);
  return tempPath;
}

// helper for rotation
function degrees(angle) {
  return (angle * Math.PI) / 180;
}

// 🔹 Print file
async function printFile(printerId, filePath, copies = 1, sides = "Single", tray = "Tray 1") {
  const options = {
    printer: printerId,
    copies,
    win32: [
      `/pt "${printerId}"`, // print file
      `/d:"${printerId}"`,
      `/t:"${tray}"`,
    ],
  };

  if (sides === "Double") {
    options.win32.push("/print-settings:duplex");
    if (process.platform !== "win32") {
      options.unix = ["-o", "sides=two-sided-long-edge"];
    }
  }

  await printer.print(filePath, options);
}

// 🔹 Print endpoint
app.post("/print", async (req, res) => {
  try {
    const { printerId, order } = req.body;
    if (!printerId || !order?.fileURL)
      return res.status(400).json({ error: "Missing printerId or fileURL" });

    const filename = path.basename(order.fileURL.split("?")[0]);
    const ext = path.extname(filename).toLowerCase();
    const downloadsDir = path.join(__dirname, "downloads");
    if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

    const localPath = path.join(downloadsDir, filename);
    await downloadFileFromUrl(order.fileURL, localPath);

    let fileToPrint = localPath;

    // DOC/DOCX → PDF
    if (ext === ".doc" || ext === ".docx") {
      fileToPrint = await convertDocxToPdf(localPath);
    }

    // ✅ Handle page ranges + orientation
    if (order.selectedPages || order.options?.orientation) {
      const orientation = order.options?.orientation || "Portrait";
      const ranges = order.selectedPages || Array.from({ length: pdf.getPageCount() }, (_, i) => i + 1).join(",");
      fileToPrint = await processPdfPages(fileToPrint, ranges, orientation);
    }

    await printFile(
      printerId,
      fileToPrint,
      order.options?.copies || 1,
      order.options?.sides || "Single",
      order.options?.tray || "Tray 1"
    );

    // cleanup
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    if (fileToPrint !== localPath && fs.existsSync(fileToPrint)) fs.unlinkSync(fileToPrint);

    res.json({ success: true, message: "✅ Print job completed" });
  } catch (err) {
    console.error("❌ Print job failed:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});
