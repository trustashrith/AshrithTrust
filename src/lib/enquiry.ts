/**
 * Enquiry submission — single integration point.
 *
 * No backend is connected yet. Submissions are validated, normalised and
 * handed to `deliverEnquiry`, which currently stores them locally and logs
 * them. To connect a real backend (Lovable Cloud, an email service, a CRM),
 * replace ONLY the body of `deliverEnquiry` — every form on the site routes
 * through it.
 */

export type EnquiryPayload = {
  source: "admissions" | "contact" | "programme";
  fullName: string;
  phone: string;
  email: string;
  programme?: string;
  institution?: string;
  qualification?: string;
  city?: string;
  subject?: string;
  message?: string;
  submittedAt: string;
};

const STORAGE_KEY = "ashrith:enquiries";

/** Google Apps Script endpoint for form submissions */
export const ENQUIRY_ENDPOINT: string =
  "https://script.google.com/macros/s/AKfycbxqBen1QxpsLplfBCDosSLChFOgvudmXYIP8tMz7yisd0qIsd38dG1nO-DXimFl2GZE/exec";

export async function deliverEnquiry(payload: EnquiryPayload): Promise<void> {
  // Map the payload to Google Apps Script expected format
  const formData = new URLSearchParams();
  formData.append("name", payload.fullName);
  formData.append("phone", payload.phone);
  formData.append("email", payload.email);

  // Build subject based on form type
  let subject = "";
  if (payload.source === "admissions") {
    subject = `Admission Enquiry - ${payload.programme || "Programme"} at ${payload.institution || "Institution"}`;
  } else if (payload.subject) {
    subject = payload.subject;
  } else {
    subject = "General Enquiry";
  }
  formData.append("subject", subject);

  // Build message with all relevant details
  let message = payload.message || "";
  if (payload.source === "admissions") {
    const details = [
      payload.programme && `Programme: ${payload.programme}`,
      payload.institution && `Institution: ${payload.institution}`,
      payload.qualification && `Qualification: ${payload.qualification}`,
      payload.city && `City: ${payload.city}`,
    ]
      .filter(Boolean)
      .join("\n");
    message = details + (message ? `\n\nAdditional Message:\n${message}` : "");
  }
  formData.append("message", message);

  try {
    const res = await fetch(ENQUIRY_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    const responseText = await res.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      // If response is not JSON, consider it an error
      throw new Error("Invalid response from server");
    }

    if (!result.success) {
      throw new Error(result.message || "Enquiry submission failed");
    }

    // Also store locally as backup
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as EnquiryPayload[];
      existing.push(payload);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(-50)));
    } catch {
      /* storage unavailable — ignore */
    }

    if (import.meta.env.DEV) console.info("[Ashrith] Enquiry submitted successfully:", payload);
  } catch (error) {
    // Store locally if submission fails
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as EnquiryPayload[];
      existing.push(payload);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(-50)));
    } catch {
      /* storage unavailable — ignore */
    }

    if (import.meta.env.DEV) console.error("[Ashrith] Enquiry submission failed:", error);
    throw error;
  }
}

export function readStoredEnquiries(): EnquiryPayload[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as EnquiryPayload[];
  } catch {
    return [];
  }
}
