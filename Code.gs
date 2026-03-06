/**
 * Clinic Automation System v2.3
 * Description: Automates clinic bookings, SLA enforcement, and staff notifications.
 * Author: [Your Name/GitHub Username]
 * License: MIT
 */

// =====================================================
// MAIN CONFIGURATION (REPLACE VALUES HERE)
// =====================================================

const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
const CALENDAR_ID = 'YOUR_CALENDAR_ID_HERE';
const FORM_URL = 'YOUR_GOOGLE_FORM_URL_HERE';
const FORM_ENTRY_ID = 'YOUR_GOOGLE_FORM_ID_HERE'; 

const SHEET_NAME = 'YOUR_PATIENT_DATABASE_SHEET_NAME';
const STAFF_SHEET_NAME = 'YOUR_STAFF_LIST_SHEET_NAME'; 
const ADMIN_EMAIL = 'admin@yourdomain.com'; 
const HELP_DESK_NUM = 'YOUR_HELPDESK_NUMBER_HERE'; 
const STATUS_HEADER_NAME = 'Status Semakan'; 

// TELEGRAM SETTINGS
const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE'; 
const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID_HERE'; 

// 4-DAY RULE (SLA)
const SLA_DAYS = 4;
const SLA_MS = SLA_DAYS * 24 * 60 * 60 * 1000;

// =====================================================
// UTILITIES: ID SEARCH, EMAIL & TELEGRAM LOOKUP
// =====================================================

function getEventIdFromRow(sheet, row) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const eventIdCol = headers.indexOf('EventID');

  if (eventIdCol === -1) {
    throw new Error('Column "EventID" not found in Sheet. Please ensure exact spelling.');
  }
  return sheet.getRange(row, eventIdCol + 1).getValue();
}

function getPatientEmailList(event) {
  const guests = event.getGuestList();
  let patientEmails = [];
  const ownerEmail = Session.getActiveUser().getEmail(); 

  for (let i = 0; i < guests.length; i++) {
    const email = guests[i].getEmail();
    
    if (email !== ADMIN_EMAIL && email !== CALENDAR_ID && email !== ownerEmail) {
      patientEmails.push(email);
    }
  }
  return patientEmails.join(','); 
}

function getTelegramMention(reviewerName) {
  if (!reviewerName || reviewerName === 'System / Not Specified' || reviewerName === 'Not specified') {
    return reviewerName;
  }

  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(STAFF_SHEET_NAME);
    if (!sheet) return reviewerName;

    const data = sheet.getDataRange().getValues(); 
    
    for (let i = 1; i < data.length; i++) {
      const name = data[i][0]; 
      const usernameTg = data[i][2]; 
      
      if (name === reviewerName) {
        if (usernameTg && usernameTg.toString().trim() !== '') {
          let uname = usernameTg.toString().trim();
          if (!uname.startsWith('@')) {
            uname = '@' + uname;
          }
          return `${reviewerName} (${uname})`; 
        }
        break; 
      }
    }
  } catch (err) {
    Logger.log('Error finding Telegram Username: ' + err.message);
  }
  
  return reviewerName; 
}

// =====================================================
// TRIGGER 1: CALENDAR GUARDIAN (SEND LINK & AUTO-CANCEL)
// =====================================================

function checkNewBookings() {
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!calendar) return;

  const now = new Date();
  const events = calendar.getEvents(now, new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000));
  const properties = PropertiesService.getScriptProperties();

  events.forEach(event => {
    const eventId = event.getId();
    const title = event.getTitle();

    if (!title.includes('Appointment')) return;

    const createdKey = `CREATED_AT_${eventId}`;
    const notifiedKey = `CLIENT_NOTIFIED_${eventId}`;
    const formSubmittedKey = `FORM_SUBMITTED_${eventId}`;
    const canceledKey = `CANCELED_${eventId}`;

    if (properties.getProperty(canceledKey)) return;

    let createdAt = properties.getProperty(createdKey);
    if (!createdAt) {
      properties.setProperty(createdKey, new Date().toISOString());
      createdAt = new Date();
    } else {
      createdAt = new Date(createdAt);
    }

    const isFormSubmitted = properties.getProperty(formSubmittedKey);
    const guestEmail = getPatientEmailList(event); 

    // --- AUTO-CANCEL IF NO CONFIRMATION WITHIN SLA ---
    if (title.includes('[Pending Verification]') && !isFormSubmitted && (new Date() - createdAt) > SLA_MS) {
      event.deleteEvent();

      if (guestEmail && guestEmail !== '') {
        MailApp.sendEmail({
          to: guestEmail,
          subject: 'Appointment Cancelled - Verification Required',
          name: 'Clinic Health Centre',
          body: 'Please be informed that your clinic appointment has been automatically cancelled as the confirmation form was not completed within the 4-day window.'
        });
      }
      
      MailApp.sendEmail(
        ADMIN_EMAIL,
        '🚨 AUTO-CANCEL: Appointment Slot Expired',
        `The system has automatically cancelled an appointment because the confirmation form was not completed within the 4-day SLA period.`
      );

      properties.setProperty(canceledKey, 'TRUE');
      return;
    }

    if (properties.getProperty(notifiedKey)) return;

    if (!title.includes('[Pending Verification]')) {
      event.setTitle('[Pending Verification] ' + title);
    }

    if (!guestEmail || guestEmail === '') return; 

    const formLink = `${FORM_URL}?usp=pp_url&entry.${FORM_ENTRY_ID}=${eventId}`;

    // --- ACTION REQUIRED EMAIL: CONFIRMATION LINK ---
    MailApp.sendEmail({
      to: guestEmail,
      subject: 'ACTION REQUIRED: Confirm Your Clinic Appointment',
      name: 'Occupational Health Clinic',
      htmlBody: `
        <div style="font-family: Arial, Helvetica, sans-serif; color: #333333; line-height: 1.6;">
          <p>Greetings,</p>
          <br>
          <p>Thank you for your booking. To ensure this slot remains reserved for you, please provide confirmation by clicking the button below:</p>
          
          <p style="margin: 25px 0;">
            <a href="${formLink}" style="display: inline-block; background-color: #F05A28; color: #ffffff; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              Complete Confirmation Form
            </a>
          </p>

          <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 12px 16px; margin: 25px 0; max-width: 650px;">
            <p style="margin: 0; font-size: 14px; color: #721c24;">
              <b>⚠️ ATTENTION:</b> This form must be completed within <b>4 DAYS</b>. The system will automatically cancel your slot if no response is received.
            </p>
          </div>
        </div>
      `
    });

    properties.setProperty(notifiedKey, new Date().toISOString());
  });
}

// =====================================================
// TRIGGER 2: FORM SUBMITTED -> TELEGRAM ALERT
// =====================================================

function onFormSubmit(e) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const row = e.range.getRow();
  
  const responses = e.namedValues;
  const patientName = responses['Name'] ? responses['Name'][0] : 'Unknown Name'; 

  let eventId;
  try {
    eventId = getEventIdFromRow(sheet, row);
  } catch (err) {
    Logger.log(err.message);
    return;
  }

  if (!eventId) return;

  const properties = PropertiesService.getScriptProperties();
  properties.setProperty(`FORM_SUBMITTED_${eventId}`, 'TRUE');

  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  const event = calendar.getEventById(eventId);
  let appointmentDate = 'Date not found';

  if (event) {
    const startTime = event.getStartTime();
    appointmentDate = Utilities.formatDate(startTime, "GMT+8", "dd/MM/yyyy hh:mm a");
    
    // Fill the Date column in the Sheet
    sheet.getRange(row, 4).setValue(Utilities.formatDate(startTime, "GMT+8", "dd/MM/yyyy"));
  }

  const message = `🚨 <b>PATIENT INFORMATION RECEIVED</b> 🚨\n\n<b>Patient:</b> ${patientName}\n<b>Appointment Date:</b> ${appointmentDate}\n\nPlease review the Database & Google Calendar to confirm or cancel this slot.`;
  
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const payload = { chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'HTML' }; 
  
  UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true });
}

// =====================================================
// TRIGGER 3: CONFIRMATION / CANCELLATION VIA SHEET
// =====================================================

function onStatusEdit(e) {
  if (!e || !e.range) return; 
  
  const sheet = e.range.getSheet();
  if (sheet.getName() !== SHEET_NAME) return; 
  
  const row = e.range.getRow();
  if (row === 1) return; 
  
  const col = e.range.getColumn();
  const newValue = e.value;
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const statusCol = headers.indexOf(STATUS_HEADER_NAME) + 1;
  const nameCol = headers.indexOf('Nama') + 1; 
  const reviewedByCol = headers.indexOf('Reviewed By') + 1; 
  
  if (col !== statusCol || !newValue) return; 
  
  const eventId = getEventIdFromRow(sheet, row);
  if (!eventId) return;
  
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  const event = calendar.getEventById(eventId);
  
  const patientName = nameCol > 0 ? sheet.getRange(row, nameCol).getValue() : 'Patient';
  const reviewerName = reviewedByCol > 0 ? sheet.getRange(row, reviewedByCol).getValue() : 'System / Not Specified';
  const guestEmail = event ? getPatientEmailList(event) : '';
  
  const picMention = getTelegramMention(reviewerName);
  
  let appointmentDate = 'Date not found';
  if (event) {
    appointmentDate = Utilities.formatDate(event.getStartTime(), "GMT+8", "dd/MM/yyyy hh:mm a");
  }

  // --- CASE: STATUS APPROVED ---
  if (newValue.toLowerCase() === 'approve' || newValue.toLowerCase() === 'confirmed') {
    if (event) event.setTitle(event.getTitle().replace(/\[Pending Verification\]\s?/g, '')); 
    
    if (guestEmail && guestEmail !== '') {
      MailApp.sendEmail({
        to: guestEmail,
        subject: 'CONFIRMED: Your Clinic Appointment',
        name: 'Clinic Health Centre',
        htmlBody: `
          <p>Greetings,</p>
          <p>We are pleased to inform you that your health appointment on <b>${appointmentDate}</b> has been <b>CONFIRMED</b>.</p>
          <p>For any inquiries regarding this booking, please contact us at <b>${HELP_DESK_NUM}</b> (WhatsApp only).</p>
          <p>Thank you.</p>
        `
      });
    }
    
    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: `RECORD CONFIRMATION: ${patientName}`,
      htmlBody: `
        <p>Record Update: The appointment for <b>${patientName}</b> on <b>${appointmentDate}</b> has been successfully confirmed and notification sent.</p>
        <br>
        <p><i>Action reviewed and confirmed by: <b>${reviewerName}</b></i></p>
      `
    });

    const message = `✅ <b>Appointment Confirmed</b> ✅\n\n<b>Patient:</b> ${patientName}\n<b>Date:</b> ${appointmentDate}\n\n<b>Confirmed By:</b> ${picMention}\n\nThe system has sent a confirmation email and updated the calendar.`;
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = { chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'HTML' }; 
    
    UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true });
  }

  // --- CASE: STATUS CANCELLED ---
  else if (newValue.toLowerCase() === 'cancel' || newValue.toLowerCase() === 'reject') {
    if (event) {
      event.deleteEvent();
    }
    
    if (guestEmail && guestEmail !== '') {
      MailApp.sendEmail({
        to: guestEmail,
        subject: 'CANCELLED: Your Clinic Appointment',
        name: 'Clinic Health Centre',
        htmlBody: `
          <p>Greetings,</p>
          <p>Please be informed that your appointment on ${appointmentDate} has been cancelled. <b>The requested medical examination services are currently unavailable.</b></p>
          <p>Please contact <b>${HELP_DESK_NUM}</b> via WhatsApp for further inquiries.</p>
          <p>Thank you.</p>
        `
      });
    }
    
    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: `RECORD CANCELLATION: ${patientName}`,
      htmlBody: `
        <p>Record Update: The appointment for <b>${patientName}</b> on <b>${appointmentDate}</b> has been CANCELLED and removed from the calendar.</p>
        <br>
        <p><i>Action cancelled by: <b>${reviewerName}</b></i></p>
      `
    });

    const message = `❌ <b>Appointment Cancelled</b> ❌\n\n<b>Patient:</b> ${patientName}\n<b>Scheduled Date:</b> ${appointmentDate}\n\n<b>Cancelled By:</b> ${picMention}\n\nThe system has notified the patient and cleared the calendar slot.`;
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = { chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'HTML' }; 
    
    UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true });
  }
}
