import { useEffect, useState } from "react";
import { ArrowRight, FileText, LoaderCircle, Plus, Printer, Sparkles, Trash2, Upload } from "lucide-react";
import "./resume-builder.css";

type Experience = {
  id: string;
  role: string;
  company: string;
  location: string;
  start: string;
  end: string;
  bullets: string;
};

type Education = {
  id: string;
  school: string;
  degree: string;
  location: string;
  start: string;
  end: string;
  details: string;
};

type Project = {
  id: string;
  name: string;
  link: string;
  details: string;
};

type ResumeTemplate = "classic" | "modern" | "minimal";
type ResumeAiAction = "write" | "tailor" | "keywords" | "ats" | "import";

type ResumeData = {
  template: ResumeTemplate;
  name: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  links: string;
  summary: string;
  skills: string;
  experience: Experience[];
  education: Education[];
  projects: Project[];
};

type ResumeAttachment = {
  id: string;
  name: string;
  size: number;
  lastModified: number;
  blob: Blob;
};

type ResumeAssistResult =
  | { action: "write"; summary: string; bullets: string[]; suggestions: string[] }
  | { action: "tailor"; fitSummary: string; coverLetter: string; resumeBullets: string[]; reviewChecklist: string[] }
  | { action: "keywords"; matchSummary: string; currentKeywords: string[]; relevantKeywords: string[]; suggestedSummary: string; suggestedBullets: string[]; reviewNotes: string[] }
  | { action: "ats"; score: number; summary: string; strengths: string[]; gaps: string[]; missingKeywords: string[]; actions: string[] }
  | { action: "import"; resume: Omit<ResumeData, "template"> };

const STORAGE_KEY = "codexsheet-resume-builder-v1";
const ATTACHMENT_DB = "codexsheet-resume-attachments";
const ATTACHMENT_STORE = "files";
const ATTACHMENT_ID = "current-resume-pdf";
const resumeTemplates: { id: ResumeTemplate; name: string; description: string }[] = [
  { id: "classic", name: "Classic", description: "Centered header · timeless" },
  { id: "modern", name: "Modern", description: "Bold sidebar · contemporary" },
  { id: "minimal", name: "Minimal", description: "Clean type · quiet detail" },
];
const resumeAiActions: { id: ResumeAiAction; label: string }[] = [
  { id: "write", label: "Improve writing" },
  { id: "tailor", label: "Tailor to a job" },
  { id: "keywords", label: "Optimize keywords" },
  { id: "ats", label: "ATS review" },
  { id: "import", label: "Read uploaded PDF" },
];

function createId() {
  return crypto.randomUUID();
}

function emptyResume(): ResumeData {
  return {
    template: "classic",
    name: "",
    role: "",
    email: "",
    phone: "",
    location: "",
    links: "",
    summary: "",
    skills: "",
    experience: [],
    education: [],
    projects: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function resumeTemplateValue(value: unknown): ResumeTemplate {
  return value === "modern" || value === "minimal" ? value : "classic";
}

function loadResume(): { resume: ResumeData; warning: string } {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return { resume: emptyResume(), warning: "" };
    const parsed: unknown = JSON.parse(saved);
    if (!isRecord(parsed)) throw new Error("Saved resume has an invalid format.");
    const entries = (key: string) => Array.isArray(parsed[key]) ? parsed[key] : [];
    return {
      resume: {
        template: resumeTemplateValue(parsed.template),
        name: stringValue(parsed.name),
        role: stringValue(parsed.role),
        email: stringValue(parsed.email),
        phone: stringValue(parsed.phone),
        location: stringValue(parsed.location),
        links: stringValue(parsed.links),
        summary: stringValue(parsed.summary),
        skills: stringValue(parsed.skills),
        experience: entries("experience").filter(isRecord).map((item) => ({
          id: stringValue(item.id) || createId(),
          role: stringValue(item.role),
          company: stringValue(item.company),
          location: stringValue(item.location),
          start: stringValue(item.start),
          end: stringValue(item.end),
          bullets: stringValue(item.bullets),
        })),
        education: entries("education").filter(isRecord).map((item) => ({
          id: stringValue(item.id) || createId(),
          school: stringValue(item.school),
          degree: stringValue(item.degree),
          location: stringValue(item.location),
          start: stringValue(item.start),
          end: stringValue(item.end),
          details: stringValue(item.details),
        })),
        projects: entries("projects").filter(isRecord).map((item) => ({
          id: stringValue(item.id) || createId(),
          name: stringValue(item.name),
          link: stringValue(item.link),
          details: stringValue(item.details),
        })),
      },
      warning: "",
    };
  } catch (error) {
    console.error("Could not load the saved resume.", error);
    return { resume: emptyResume(), warning: "The saved resume could not be loaded. A new local draft is open." };
  }
}

function lines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

function resumeProfessionalText(resume: ResumeData) {
  const sections = [
    ["Target role", resume.role],
    ["Professional summary", resume.summary],
    ["Skills", resume.skills],
    ["Experience", resume.experience.map((item) => [item.role, item.company, item.location, item.start, item.end, item.bullets].filter(Boolean).join(" · ")).filter(Boolean).join("\n")],
    ["Projects", resume.projects.map((item) => [item.name, item.link, item.details].filter(Boolean).join(" · ")).filter(Boolean).join("\n")],
    ["Education", resume.education.map((item) => [item.school, item.degree, item.location, item.start, item.end, item.details].filter(Boolean).join(" · ")).filter(Boolean).join("\n")],
  ];
  return sections.filter(([, value]) => value.trim()).map(([label, value]) => `${label}:\n${value}`).join("\n\n");
}

async function extractPdfText(file: Blob) {
  const [{ GlobalWorkerOptions, getDocument }, worker] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  GlobalWorkerOptions.workerSrc = worker.default;
  const document = await getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= Math.min(document.numPages, 50); pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.filter((item) => "str" in item).map((item) => item.str).join(" "));
    page.cleanup();
    if (pages.join("\n").length > 16_000) break;
  }
  const text = pages.join("\n").replace(/\s+/g, " ").trim().slice(0, 16_000);
  if (!text) throw new Error("No selectable text was found in the PDF. Scanned PDFs need OCR before import.");
  return text;
}

function decodeResumeAssistResult(action: ResumeAiAction, value: unknown): ResumeAssistResult | null {
  if (!isRecord(value)) return null;
  const isTextList = (item: unknown): item is string[] =>
    Array.isArray(item) && item.every((entry) => typeof entry === "string");

  if (action === "write" && typeof value.summary === "string" && isTextList(value.bullets) && isTextList(value.suggestions)) {
    return { action, summary: value.summary, bullets: value.bullets, suggestions: value.suggestions };
  }
  if (action === "tailor" && typeof value.fitSummary === "string" && typeof value.coverLetter === "string" &&
    isTextList(value.resumeBullets) && isTextList(value.reviewChecklist)) {
    return { action, fitSummary: value.fitSummary, coverLetter: value.coverLetter, resumeBullets: value.resumeBullets, reviewChecklist: value.reviewChecklist };
  }
  if (action === "keywords" && typeof value.matchSummary === "string" && isTextList(value.currentKeywords) &&
    isTextList(value.relevantKeywords) && typeof value.suggestedSummary === "string" &&
    isTextList(value.suggestedBullets) && isTextList(value.reviewNotes)) {
    return {
      action,
      matchSummary: value.matchSummary,
      currentKeywords: value.currentKeywords,
      relevantKeywords: value.relevantKeywords,
      suggestedSummary: value.suggestedSummary,
      suggestedBullets: value.suggestedBullets,
      reviewNotes: value.reviewNotes,
    };
  }
  if (action === "ats" && typeof value.score === "number" && typeof value.summary === "string" &&
    isTextList(value.strengths) && isTextList(value.gaps) && isTextList(value.missingKeywords) && isTextList(value.actions)) {
    return {
      action,
      score: value.score,
      summary: value.summary,
      strengths: value.strengths,
      gaps: value.gaps,
      missingKeywords: value.missingKeywords,
      actions: value.actions,
    };
  }
  if (action !== "import" || !isRecord(value.resume)) return null;

  const imported = value.resume;
  const fields = ["name", "role", "email", "phone", "location", "links", "summary", "skills"] as const;
  if (!fields.every((field) => typeof imported[field] === "string")) return null;
  const mappedEntries = <T extends Record<string, string>>(key: string, entryFields: string[], create: (entry: Record<string, string>) => T): T[] | null => {
    const entries = imported[key];
    if (!Array.isArray(entries) || !entries.every((entry) =>
      isRecord(entry) && entryFields.every((field) => typeof entry[field] === "string")
    )) return null;
    return entries.map((entry) => create(entry as Record<string, string>));
  };
  const experience = mappedEntries("experience", ["role", "company", "location", "start", "end", "bullets"], (entry) => ({
    id: createId(), role: entry.role, company: entry.company, location: entry.location, start: entry.start, end: entry.end, bullets: entry.bullets,
  }));
  const education = mappedEntries("education", ["school", "degree", "location", "start", "end", "details"], (entry) => ({
    id: createId(), school: entry.school, degree: entry.degree, location: entry.location, start: entry.start, end: entry.end, details: entry.details,
  }));
  const projects = mappedEntries("projects", ["name", "link", "details"], (entry) => ({
    id: createId(), name: entry.name, link: entry.link, details: entry.details,
  }));
  if (!experience || !education || !projects) return null;

  return {
    action,
    resume: {
      name: imported.name as string,
      role: imported.role as string,
      email: imported.email as string,
      phone: imported.phone as string,
      location: imported.location as string,
      links: imported.links as string,
      summary: imported.summary as string,
      skills: imported.skills as string,
      experience,
      education,
      projects,
    },
  };
}

function openAttachmentDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("This browser does not support local PDF storage."));
      return;
    }

    const request = window.indexedDB.open(ATTACHMENT_DB, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(ATTACHMENT_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local PDF storage."));
    request.onblocked = () => reject(new Error("Local PDF storage is blocked by another browser tab."));
  });
}

async function saveAttachment(attachment: ResumeAttachment) {
  const db = await openAttachmentDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(ATTACHMENT_STORE, "readwrite");
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("Could not save the PDF."));
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error ?? new Error("Saving the PDF was cancelled."));
    };
    transaction.objectStore(ATTACHMENT_STORE).put(attachment);
  });
}

async function loadAttachment() {
  const db = await openAttachmentDb();
  return await new Promise<ResumeAttachment | null>((resolve, reject) => {
    const transaction = db.transaction(ATTACHMENT_STORE, "readonly");
    const request = transaction.objectStore(ATTACHMENT_STORE).get(ATTACHMENT_ID);
    request.onsuccess = () => resolve((request.result as ResumeAttachment | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("Could not load the saved PDF."));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("Could not load the saved PDF."));
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error ?? new Error("Loading the saved PDF was cancelled."));
    };
  });
}

async function deleteAttachment() {
  const db = await openAttachmentDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(ATTACHMENT_STORE, "readwrite");
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("Could not remove the PDF."));
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error ?? new Error("Removing the PDF was cancelled."));
    };
    transaction.objectStore(ATTACHMENT_STORE).delete(ATTACHMENT_ID);
  });
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="resume-field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="resume-field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={rows} />
    </label>
  );
}

export default function ResumeBuilder() {
  const [initial] = useState(loadResume);
  const [resume, setResume] = useState(initial.resume);
  const [saveMessage, setSaveMessage] = useState(initial.warning || "Saved on this device");
  const [attachment, setAttachment] = useState<ResumeAttachment | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentMessage, setAttachmentMessage] = useState("Checking for an uploaded PDF…");
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [aiAction, setAiAction] = useState<ResumeAiAction>("write");
  const [aiConsent, setAiConsent] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [aiResult, setAiResult] = useState<ResumeAssistResult | null>(null);

  useEffect(() => {
    let active = true;
    void loadAttachment().then((saved) => {
      if (!active) return;
      setAttachment(saved);
      setAttachmentMessage(saved ? "PDF saved on this device." : "No PDF attached.");
    }).catch((error: unknown) => {
      console.error("Could not load the saved resume PDF.", error);
      if (active) setAttachmentMessage("The saved PDF could not be loaded.");
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!attachment) {
      setAttachmentUrl("");
      return;
    }
    const url = URL.createObjectURL(attachment.blob);
    setAttachmentUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [attachment]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
      setSaveMessage("Saved on this device");
    } catch (error) {
      console.error("Could not save the resume locally.", error);
      setSaveMessage("Could not save on this device");
    }
  }, [resume]);

  function updateField(key: keyof Omit<ResumeData, "template" | "experience" | "education" | "projects">, value: string) {
    setResume((current) => ({ ...current, [key]: value }));
  }

  function updateTemplate(template: ResumeTemplate) {
    setResume((current) => ({ ...current, template }));
  }

  function updateExperience(id: string, key: keyof Omit<Experience, "id">, value: string) {
    setResume((current) => ({
      ...current,
      experience: current.experience.map((item) => item.id === id ? { ...item, [key]: value } : item),
    }));
  }

  function updateEducation(id: string, key: keyof Omit<Education, "id">, value: string) {
    setResume((current) => ({
      ...current,
      education: current.education.map((item) => item.id === id ? { ...item, [key]: value } : item),
    }));
  }

  function updateProject(id: string, key: keyof Omit<Project, "id">, value: string) {
    setResume((current) => ({
      ...current,
      projects: current.projects.map((item) => item.id === id ? { ...item, [key]: value } : item),
    }));
  }

  function printResume() {
    window.print();
  }

  async function runResumeAssistant() {
    if (!aiConsent) return;
    setAiBusy(true);
    setAiError("");
    setAiResult(null);
    try {
      let profile: string;
      if (aiAction === "import") {
        if (!attachment) throw new Error("Upload a PDF before asking the assistant to read it.");
        profile = await extractPdfText(attachment.blob);
      } else {
        profile = resumeProfessionalText(resume);
        if (!profile.trim()) throw new Error("Add resume details first. Contact information is not sent to the assistant.");
      }

      const response = await fetch("/api/resume-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: aiAction,
          profile,
          jobDescription: aiAction === "tailor" || aiAction === "keywords" ? jobDescription.trim() : "",
        }),
      });
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const message = isRecord(body) && typeof body.error === "string" ? body.error : "The resume assistant could not finish this request.";
        throw new Error(message);
      }
      const body: unknown = await response.json();
      const result = isRecord(body) ? decodeResumeAssistResult(aiAction, body.result) : null;
      if (!result) throw new Error("The resume assistant returned an invalid response. Please try again.");
      setAiResult(result);
    } catch (error) {
      console.error("Could not complete the resume assistant request.", error);
      setAiError(error instanceof Error ? error.message : "The resume assistant could not finish this request.");
    } finally {
      setAiBusy(false);
    }
  }

  function applyAssistantSummary(summary: string) {
    updateField("summary", summary);
  }

  function applyAssistantBullets(bullets: string[]) {
    const additions = bullets.map((bullet) => bullet.trim()).filter(Boolean);
    if (!additions.length) return;
    setResume((current) => {
      if (current.experience.length) {
        const [first, ...rest] = current.experience;
        const existing = lines(first.bullets);
        return {
          ...current,
          experience: [{ ...first, bullets: [...existing, ...additions].join("\n") }, ...rest],
        };
      }
      return {
        ...current,
        experience: [{ id: createId(), role: "", company: "", location: "", start: "", end: "", bullets: additions.join("\n") }],
      };
    });
  }

  function applyImportedResume(imported: Omit<ResumeData, "template">) {
    const hasExistingDetails = Boolean(resume.name || resume.role || resume.summary || resume.experience.length || resume.education.length || resume.projects.length || resume.skills);
    if (hasExistingDetails && !window.confirm("Replace your current resume details with the extracted PDF content?")) return;
    setResume({ ...imported, template: resume.template });
    setAiResult(null);
  }

  async function uploadPdf(file: File) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setAttachmentMessage("Choose a PDF file.");
      return;
    }

    setAttachmentBusy(true);
    setAttachmentMessage("Saving PDF on this device…");
    try {
      const saved = {
        id: ATTACHMENT_ID,
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        blob: file,
      };
      await saveAttachment(saved);
      setAttachment(saved);
      setAttachmentMessage("PDF saved on this device.");
    } catch (error) {
      console.error("Could not save the resume PDF.", error);
      setAttachmentMessage("Could not save this PDF in browser storage.");
    } finally {
      setAttachmentBusy(false);
    }
  }

  async function removePdf() {
    setAttachmentBusy(true);
    try {
      await deleteAttachment();
      setAttachment(null);
      setAttachmentMessage("PDF removed from this device.");
    } catch (error) {
      console.error("Could not remove the resume PDF.", error);
      setAttachmentMessage("Could not remove the saved PDF.");
    } finally {
      setAttachmentBusy(false);
    }
  }

  return (
    <main className="resume-builder-page">
      <header className="resume-builder-header">
        <div>
          <span className="resume-builder-eyebrow"><FileText size={14} /> CAREER TOOLKIT</span>
          <h1>Resume <em>builder</em></h1>
          <p>Write it once, preview it live, and print or save a clean PDF when you’re ready.</p>
        </div>
        <div className="resume-builder-header-actions">
          <span className="resume-save-state" role="status">{saveMessage}</span>
          <button type="button" className="resume-print-button primary-button" onClick={printResume}><Printer size={15} /> Print / Save PDF</button>
        </div>
      </header>

      <div className="resume-builder-layout">
        <section className="resume-editor" aria-label="Resume details">
          <div className="resume-editor-heading">
            <div><span>YOUR DETAILS</span><h2>Build your resume</h2></div>
            <span className="resume-local-badge">Private · saved locally</span>
          </div>

          <section className="resume-upload-section" aria-label="Attach an existing PDF">
            <div className="resume-upload-copy">
              <strong>Have an existing resume?</strong>
              <span>Keep a copy of your original PDF with this local draft.</span>
              <span className="resume-upload-status" role="status">{attachmentMessage}</span>
              {attachment && <span className="resume-upload-filename" title={attachment.name}>{attachment.name} · {(attachment.size / 1024 / 1024).toFixed(1)} MB</span>}
            </div>
            <div className="resume-upload-actions">
              {attachmentUrl && attachment && (
                <>
                  <a className="resume-upload-link" href={attachmentUrl} target="_blank" rel="noreferrer">View PDF</a>
                  <a className="resume-upload-link" href={attachmentUrl} download={attachment.name}>Download PDF</a>
                </>
              )}
              <label className={`resume-upload-button${attachmentBusy ? " is-disabled" : ""}`}>
                <Upload size={14} /> {attachment ? "Replace PDF" : "Upload PDF"}
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={attachmentBusy}
                  onChange={(event) => {
                    if (!(event.target instanceof HTMLInputElement)) return;
                    const input = event.target;
                    const file = input.files?.[0];
                    input.value = "";
                    if (file) void uploadPdf(file);
                  }}
                />
              </label>
              {attachment && <button type="button" className="resume-upload-remove" onClick={() => void removePdf()} disabled={attachmentBusy}>Remove</button>}
            </div>
          </section>

          <section className="resume-template-section" aria-label="Choose a resume template">
            <div className="resume-section-heading">
              <div>
                <h3>Choose a template</h3>
                <p>Switch styles anytime. Your content stays the same.</p>
              </div>
              <span className="resume-template-count">03 STYLES</span>
            </div>
            <div className="resume-template-grid">
              {resumeTemplates.map((template) => (
                <button
                  type="button"
                  className={`resume-template-card${resume.template === template.id ? " selected" : ""}`}
                  key={template.id}
                  aria-pressed={resume.template === template.id}
                  onClick={() => updateTemplate(template.id)}
                >
                  <span className={`resume-template-thumb resume-template-thumb-${template.id}`} aria-hidden="true">
                    <i /><i /><i /><i /><i />
                  </span>
                  <span className="resume-template-name">{template.name}</span>
                  <span className="resume-template-description">{template.description}</span>
                  <span className="resume-template-selected">{resume.template === template.id ? "Selected" : "Use template"}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="resume-ai-section" aria-label="AI resume assistant">
            <header className="resume-ai-heading">
              <span className="resume-ai-icon"><Sparkles size={16} /></span>
              <div><h3>AI resume assistant</h3><p>Draft faster, then review and edit every suggestion.</p></div>
            </header>
            <div className="resume-ai-tabs" role="group" aria-label="AI resume tasks">
              {resumeAiActions.map((item) => (
                <button
                  type="button"
                  className={aiAction === item.id ? "active" : ""}
                  key={item.id}
                  aria-pressed={aiAction === item.id}
                  onClick={() => {
                    setAiAction(item.id);
                    setAiConsent(false);
                    setAiResult(null);
                    setAiError("");
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="resume-ai-description">
              {aiAction === "write" && "Get a stronger summary, clearer achievement bullets, and specific improvement ideas."}
              {aiAction === "tailor" && "Compare your experience with a job and draft tailored, reviewable content."}
              {aiAction === "keywords" && "Compare your resume with a target role and surface relevant terms. Suggestions never add unverified skills."}
              {aiAction === "ats" && "Get a practical readability and keyword review, not a promise of an ATS score."}
              {aiAction === "import" && (attachment ? `Extract editable fields from ${attachment.name}.` : "Upload a text-based PDF above to extract editable fields.")}
            </p>
            {(aiAction === "tailor" || aiAction === "keywords") && (
              <label className="resume-field resume-job-description">
                <span>{aiAction === "keywords" ? "Target role or job description" : "Job description"}</span>
                <textarea value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} maxLength={8000} rows={5} placeholder={aiAction === "keywords" ? "Add a target title and/or paste a job description for relevant keywords." : "Paste the role description you want to tailor for."} />
              </label>
            )}
            <label className="resume-ai-consent">
              <input type="checkbox" checked={aiConsent} onChange={(event) => {
                if (event.target instanceof HTMLInputElement) setAiConsent(event.target.checked);
              }} />
              <span>
                I agree to send the relevant resume text{aiAction === "tailor" || aiAction === "keywords" ? " and target role/job description" : aiAction === "import" ? " extracted from my PDF" : ""} to the configured AI provider for this request. Nothing is sent until I run it.
              </span>
            </label>
            <button
              type="button"
              className="resume-ai-run"
              onClick={() => void runResumeAssistant()}
              disabled={!aiConsent || aiBusy || (aiAction === "import" && !attachment) || ((aiAction === "tailor" || aiAction === "keywords") && !jobDescription.trim())}
            >
              {aiBusy ? <LoaderCircle size={15} className="resume-ai-spinner" /> : <Sparkles size={15} />}
              {aiBusy ? "Working…" : resumeAiActions.find((item) => item.id === aiAction)?.label}
              {!aiBusy && <ArrowRight size={15} />}
            </button>
            {aiError && <p className="resume-ai-error" role="alert">{aiError}</p>}

            {aiResult?.action === "write" && (
              <div className="resume-ai-result">
                <section><h4>Suggested summary</h4><p>{aiResult.summary}</p><button type="button" onClick={() => applyAssistantSummary(aiResult.summary)}>Use this summary</button></section>
                <section><h4>Achievement bullets</h4><ul>{aiResult.bullets.map((bullet, index) => <li key={`${index}-${bullet}`}>{bullet}</li>)}</ul><button type="button" onClick={() => applyAssistantBullets(aiResult.bullets)}>Add reviewed bullets to experience</button></section>
                <section><h4>Ways to strengthen it</h4><ul>{aiResult.suggestions.map((suggestion, index) => <li key={`${index}-${suggestion}`}>{suggestion}</li>)}</ul></section>
              </div>
            )}
            {aiResult?.action === "tailor" && (
              <div className="resume-ai-result">
                <section><h4>Experience fit</h4><p>{aiResult.fitSummary}</p></section>
                <section><h4>Cover letter draft</h4><p className="resume-ai-letter">{aiResult.coverLetter}</p></section>
                <section><h4>Suggested resume bullets</h4><ul>{aiResult.resumeBullets.map((bullet, index) => <li key={`${index}-${bullet}`}>{bullet}</li>)}</ul><button type="button" onClick={() => applyAssistantBullets(aiResult.resumeBullets)}>Add reviewed bullets to experience</button></section>
                <section><h4>Review before using</h4><ul>{aiResult.reviewChecklist.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></section>
              </div>
            )}
            {aiResult?.action === "keywords" && (
              <div className="resume-ai-result">
                <section><h4>Keyword match</h4><p>{aiResult.matchSummary}</p></section>
                <section><h4>Already represented</h4><p>{aiResult.currentKeywords.length ? aiResult.currentKeywords.join(" · ") : "No clear matches found in the current resume."}</p></section>
                <section><h4>Relevant terms to verify</h4><p>{aiResult.relevantKeywords.length ? aiResult.relevantKeywords.join(" · ") : "No additional terms were identified."}</p></section>
                <section><h4>Suggested summary</h4><p>{aiResult.suggestedSummary}</p><button type="button" onClick={() => applyAssistantSummary(aiResult.suggestedSummary)}>Use this summary</button></section>
                <section><h4>Keyword-aware bullets</h4><ul>{aiResult.suggestedBullets.map((bullet, index) => <li key={`${index}-${bullet}`}>{bullet}</li>)}</ul><button type="button" onClick={() => applyAssistantBullets(aiResult.suggestedBullets)}>Add reviewed bullets to experience</button></section>
                <section><h4>Truth check</h4><ul>{aiResult.reviewNotes.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></section>
              </div>
            )}
            {aiResult?.action === "ats" && (
              <div className="resume-ai-result">
                <section className="resume-ai-score"><span>READABILITY CHECK</span><strong>{aiResult.score}<small>/100</small></strong><p>{aiResult.summary}</p></section>
                <section><h4>What works</h4><ul>{aiResult.strengths.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></section>
                <section><h4>Potential gaps</h4><ul>{aiResult.gaps.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></section>
                {!!aiResult.missingKeywords.length && <section><h4>Keywords to verify</h4><p>{aiResult.missingKeywords.join(" · ")}</p></section>}
                <section><h4>Suggested next steps</h4><ul>{aiResult.actions.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></section>
              </div>
            )}
            {aiResult?.action === "import" && (
              <div className="resume-ai-result">
                <section><h4>Extracted details</h4>
                  <p>{[aiResult.resume.name, aiResult.resume.role, aiResult.resume.email, aiResult.resume.phone].filter(Boolean).join(" · ") || "No contact details found."}</p>
                  <p>{aiResult.resume.summary || "No summary found."}</p>
                  <p>{aiResult.resume.experience.length} experience · {aiResult.resume.education.length} education · {aiResult.resume.projects.length} projects</p>
                </section>
                <button type="button" onClick={() => applyImportedResume(aiResult.resume)}>Review and use extracted details</button>
              </div>
            )}
            <p className="resume-ai-disclaimer">AI can make mistakes. Verify every detail; never add a skill, result, or qualification that is not true. The assistant does not submit applications.</p>
          </section>

          <section className="resume-form-section">
            <h3>Contact</h3>
            <div className="resume-field-grid">
              <FormField label="Full name" value={resume.name} onChange={(value) => updateField("name", value)} placeholder="Your name" />
              <FormField label="Target role" value={resume.role} onChange={(value) => updateField("role", value)} placeholder="Software engineer" />
              <FormField label="Email" type="email" value={resume.email} onChange={(value) => updateField("email", value)} placeholder="you@example.com" />
              <FormField label="Phone" type="tel" value={resume.phone} onChange={(value) => updateField("phone", value)} placeholder="+91 98765 43210" />
              <FormField label="City, country" value={resume.location} onChange={(value) => updateField("location", value)} placeholder="Bengaluru, India" />
              <FormField label="Links" value={resume.links} onChange={(value) => updateField("links", value)} placeholder="LinkedIn · GitHub · Portfolio" />
            </div>
          </section>

          <section className="resume-form-section">
            <h3>Professional summary</h3>
            <TextAreaField label="A short introduction" value={resume.summary} onChange={(value) => updateField("summary", value)} placeholder="Summarize your strengths, experience, and the work you want to do." rows={4} />
          </section>

          <section className="resume-form-section">
            <div className="resume-section-heading"><h3>Experience</h3><button type="button" className="resume-add-button" onClick={() => setResume((current) => ({ ...current, experience: [...current.experience, { id: createId(), role: "", company: "", location: "", start: "", end: "", bullets: "" }] }))}><Plus size={14} /> Add experience</button></div>
            {resume.experience.map((item, index) => (
              <div className="resume-entry-form" key={item.id}>
                <div className="resume-entry-heading"><strong>Experience {index + 1}</strong><button type="button" aria-label={`Remove experience ${index + 1}`} onClick={() => setResume((current) => ({ ...current, experience: current.experience.filter((entry) => entry.id !== item.id) }))}><Trash2 size={14} /></button></div>
                <div className="resume-field-grid">
                  <FormField label="Role" value={item.role} onChange={(value) => updateExperience(item.id, "role", value)} placeholder="Software Engineer" />
                  <FormField label="Company" value={item.company} onChange={(value) => updateExperience(item.id, "company", value)} placeholder="Company name" />
                  <FormField label="Location" value={item.location} onChange={(value) => updateExperience(item.id, "location", value)} placeholder="City or Remote" />
                  <FormField label="Dates" value={item.start} onChange={(value) => updateExperience(item.id, "start", value)} placeholder="Jan 2024 – Present" />
                </div>
                <TextAreaField label="Achievements (one per line)" value={item.bullets} onChange={(value) => updateExperience(item.id, "bullets", value)} placeholder={"What did you build or improve?\nAdd scope, tools, or measurable impact when you know it."} rows={4} />
              </div>
            ))}
            {!resume.experience.length && <p className="resume-empty-hint">Add your work, internship, or volunteer experience.</p>}
          </section>

          <section className="resume-form-section">
            <div className="resume-section-heading"><h3>Education</h3><button type="button" className="resume-add-button" onClick={() => setResume((current) => ({ ...current, education: [...current.education, { id: createId(), school: "", degree: "", location: "", start: "", end: "", details: "" }] }))}><Plus size={14} /> Add education</button></div>
            {resume.education.map((item, index) => (
              <div className="resume-entry-form" key={item.id}>
                <div className="resume-entry-heading"><strong>Education {index + 1}</strong><button type="button" aria-label={`Remove education ${index + 1}`} onClick={() => setResume((current) => ({ ...current, education: current.education.filter((entry) => entry.id !== item.id) }))}><Trash2 size={14} /></button></div>
                <div className="resume-field-grid">
                  <FormField label="School" value={item.school} onChange={(value) => updateEducation(item.id, "school", value)} placeholder="University or institution" />
                  <FormField label="Degree" value={item.degree} onChange={(value) => updateEducation(item.id, "degree", value)} placeholder="B.Tech, Computer Science" />
                  <FormField label="Location" value={item.location} onChange={(value) => updateEducation(item.id, "location", value)} placeholder="City, country" />
                  <FormField label="Dates" value={item.start} onChange={(value) => updateEducation(item.id, "start", value)} placeholder="2022 – 2026" />
                </div>
                <TextAreaField label="Additional details (optional)" value={item.details} onChange={(value) => updateEducation(item.id, "details", value)} placeholder="Relevant coursework, honors, or activities" rows={2} />
              </div>
            ))}
            {!resume.education.length && <p className="resume-empty-hint">Add your education or training.</p>}
          </section>

          <section className="resume-form-section">
            <div className="resume-section-heading"><h3>Projects</h3><button type="button" className="resume-add-button" onClick={() => setResume((current) => ({ ...current, projects: [...current.projects, { id: createId(), name: "", link: "", details: "" }] }))}><Plus size={14} /> Add project</button></div>
            {resume.projects.map((item, index) => (
              <div className="resume-entry-form" key={item.id}>
                <div className="resume-entry-heading"><strong>Project {index + 1}</strong><button type="button" aria-label={`Remove project ${index + 1}`} onClick={() => setResume((current) => ({ ...current, projects: current.projects.filter((entry) => entry.id !== item.id) }))}><Trash2 size={14} /></button></div>
                <div className="resume-field-grid">
                  <FormField label="Project name" value={item.name} onChange={(value) => updateProject(item.id, "name", value)} placeholder="Project name" />
                  <FormField label="Link (optional)" value={item.link} onChange={(value) => updateProject(item.id, "link", value)} placeholder="github.com/you/project" />
                </div>
                <TextAreaField label="What you built (one point per line)" value={item.details} onChange={(value) => updateProject(item.id, "details", value)} placeholder="Describe the problem, your contribution, and the tools used." rows={3} />
              </div>
            ))}
            {!resume.projects.length && <p className="resume-empty-hint">Add projects that show how you apply your skills.</p>}
          </section>

          <section className="resume-form-section">
            <h3>Skills</h3>
            <TextAreaField label="Separate skills with commas" value={resume.skills} onChange={(value) => updateField("skills", value)} placeholder="JavaScript, React, Python, SQL, communication" rows={2} />
          </section>
          <p className="resume-privacy-note">Your resume details and uploaded PDF are stored in this browser on this device. CodexSheet does not upload them. Use “Print / Save PDF” to export the live preview.</p>
        </section>

        <aside className="resume-preview-wrap" aria-label="Live resume preview">
          <div className="resume-preview-label"><span>LIVE PREVIEW</span><span>A4 · CLEAN LAYOUT</span></div>
          <article className={`resume-paper resume-template-${resume.template}`}>
            <header className="resume-paper-header">
              <h2>{resume.name || "Your Name"}</h2>
              {resume.role && <strong>{resume.role}</strong>}
              <div>{[resume.email, resume.phone, resume.location, resume.links].filter(Boolean).join("  ·  ") || "Email · Phone · Location · Links"}</div>
            </header>
            {resume.summary && <section className="resume-paper-section"><h3>Profile</h3><p>{resume.summary}</p></section>}
            {!!resume.experience.length && <section className="resume-paper-section"><h3>Experience</h3>{resume.experience.filter((item) => item.role || item.company || item.bullets).map((item) => <div className="resume-paper-entry" key={item.id}><div className="resume-paper-entry-head"><strong>{item.role || item.company}</strong><span>{[item.start, item.end].filter(Boolean).join(" – ")}</span></div><div className="resume-paper-entry-sub">{[item.company, item.location].filter(Boolean).join(" · ")}</div>{lines(item.bullets).length > 0 && <ul>{lines(item.bullets).map((bullet, index) => <li key={`${item.id}-${index}`}>{bullet}</li>)}</ul>}</div>)}</section>}
            {!!resume.projects.length && <section className="resume-paper-section"><h3>Projects</h3>{resume.projects.filter((item) => item.name || item.details).map((item) => <div className="resume-paper-entry" key={item.id}><div className="resume-paper-entry-head"><strong>{item.name || "Project"}</strong>{item.link && <span>{item.link}</span>}</div>{lines(item.details).length > 0 && <ul>{lines(item.details).map((detail, index) => <li key={`${item.id}-${index}`}>{detail}</li>)}</ul>}</div>)}</section>}
            {!!resume.education.length && <section className="resume-paper-section"><h3>Education</h3>{resume.education.filter((item) => item.school || item.degree).map((item) => <div className="resume-paper-entry" key={item.id}><div className="resume-paper-entry-head"><strong>{item.school || item.degree}</strong><span>{[item.start, item.end].filter(Boolean).join(" – ")}</span></div><div className="resume-paper-entry-sub">{[item.degree, item.location].filter(Boolean).join(" · ")}</div>{item.details && <p>{item.details}</p>}</div>)}</section>}
            {lines(resume.skills).length > 0 && <section className="resume-paper-section"><h3>Skills</h3><p>{lines(resume.skills).join(" · ")}</p></section>}
            {!resume.name && !resume.summary && !resume.experience.length && !resume.education.length && !resume.projects.length && !resume.skills && <p className="resume-paper-placeholder">Your resume preview will appear here as you add details.</p>}
          </article>
        </aside>
      </div>
    </main>
  );
}
