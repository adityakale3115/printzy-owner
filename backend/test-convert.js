const fs = require("fs");
const libre = require("libreoffice-convert");

process.env.LIBREOFFICE_BIN = "C:\\Program Files\\LibreOffice\\program\\soffice.exe";

function convertBufferToPdf(inputBuffer) {
  return new Promise((resolve, reject) => {
    libre.convert(inputBuffer, ".pdf", undefined, (err, pdfBuf) => {
      if (err) return reject(err);
      resolve(pdfBuf);
    });
  });
}

(async () => {
  const input = fs.readFileSync("./sample.docx"); // put a real DOCX here
  const pdfBuf = await convertBufferToPdf(input);
  fs.writeFileSync("out.pdf", pdfBuf);
  console.log("✅ Conversion successful -> out.pdf");
})();
