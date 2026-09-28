# Updated Google Apps Script

Replace your current Google Apps Script with this version to fix the "Formula parse error":

```javascript
const SHEET_NAME = "Sheet1";
const NOTIFICATION_EMAIL = "trustashrith@gmail.com"; // Update with your email

function doPost(e) {
  try {
    const data = e.parameter;
    
    // Sanitize inputs to prevent formula injection
    const name = sanitizeInput(data.name || "");
    const phone = sanitizeInput(data.phone || "");
    const email = sanitizeInput(data.email || "");
    const subject = sanitizeInput(data.subject || "");
    const message = sanitizeInput(data.message || "");

    const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(SHEET_NAME);

    // Append data as plain text values
    sheet.appendRow([
      new Date(),
      name,
      phone,
      email,
      subject,
      message
    ]);

    // Send email notification
    const emailSubject = `New Website Enquiry: ${subject}`;
    const emailBody = `
New enquiry received from the Ashrith Group website.

Full Name: ${name}
Phone Number: ${phone}
Email: ${email}
Subject: ${subject}

Message:
${message}

--------------------------------
Submitted from Ashrith Group Website
`;

    GmailApp.sendEmail(
      NOTIFICATION_EMAIL,
      emailSubject,
      emailBody,
      {
        replyTo: email,
        name: "Ashrith Group Website"
      }
    );

    return ContentService
      .createTextOutput(
        JSON.stringify({
          success: true,
          message: "Enquiry submitted successfully"
        })
      )
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("Error: " + error.toString());
    
    return ContentService
      .createTextOutput(
        JSON.stringify({
          success: false,
          message: error.toString()
        })
      )
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Sanitize input to prevent formula injection in Google Sheets
 * Prepends single quote to strings starting with =, +, -, @, or tab
 */
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return input;
  }
  
  const trimmed = input.trim();
  
  // Check if input starts with characters that could be interpreted as formula
  if (trimmed.match(/^[=+\-@\t]/)) {
    return "'" + trimmed;
  }
  
  return trimmed;
}

/**
 * Optional: Test function to verify the script works
 * Run this from the Apps Script editor to test
 */
function testSubmission() {
  const testEvent = {
    parameter: {
      name: "Test User",
      phone: "+91 9876543210",
      email: "test@example.com",
      subject: "Test Enquiry",
      message: "This is a test message"
    }
  };
  
  const result = doPost(testEvent);
  Logger.log(result.getContent());
}
```

## Key Changes:

1. **Added `sanitizeInput()` function**: Prevents formula injection by prepending a single quote to values that start with `=`, `+`, `-`, `@`, or tab characters
2. **Updated email variable**: Changed to `trustashrith@gmail.com` (update if needed)
3. **Added error logging**: Better debugging with `Logger.log()`
4. **Added test function**: You can test the script without deploying

## How to Update:

1. Open your Google Apps Script: https://script.google.com
2. Replace the entire code with the updated version above
3. Update `NOTIFICATION_EMAIL` with your actual email address
4. Save the script (File → Save or Ctrl+S)
5. Optional: Run `testSubmission()` to verify it works
6. The deployment URL remains the same, no need to redeploy

## Sheet Column Headers:

Ensure your Sheet1 has these headers in row 1:
- Column A: Timestamp
- Column B: Full Name
- Column C: Phone Number
- Column D: Email
- Column E: Subject
- Column F: Message
