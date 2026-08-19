import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.resolve(__dirname, "../../other/welcome_letter/attachments");
const targetDir = path.resolve(__dirname, "../public");

const langMap = {
  en: "Company Details Sheet — Viasglobal (en).pdf",
  es: "Company Details Sheet — Viasglobal (es).pdf",
  de: "Company Details Sheet — Viasglobal (de).pdf",
  fr: "Company Details Sheet — Viasglobal (fr).pdf",
  it: "Company Details Sheet — Viasglobal (it).pdf",
};

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

if (fs.existsSync(sourceDir)) {
  for (const [lang, fileName] of Object.entries(langMap)) {
    const src = path.join(sourceDir, fileName);
    const dest = path.join(targetDir, `viasglobal-company-details-${lang}.pdf`);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`[sync-pdf] Synced: ${fileName} -> public/viasglobal-company-details-${lang}.pdf`);
    }
  }
  const defaultSrc = path.join(sourceDir, langMap.en);
  const defaultDest = path.join(targetDir, "viasglobal-company-details.pdf");
  if (fs.existsSync(defaultSrc)) {
    fs.copyFileSync(defaultSrc, defaultDest);
  }
} else {
  console.warn(`[sync-pdf] Warning: Source directory ${sourceDir} not found, skipping sync.`);
}
