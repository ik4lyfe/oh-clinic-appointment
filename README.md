# Clinic Booking & Verification Automation

Google Apps Script automates clinic bookings via Google Calendar, Sheets, and Telegram. It enforces a 4-day SLA for form submissions, auto-cancels unverified slots, and enables instant staff approval/cancellation with automated patient emails.

---

## What the Project Does

This system serves as a bridge between patient bookings and administrative management:

* **Monitors Calendar**: Scans Google Calendar for new appointments and tags them for verification.
* **Enforces Deadlines**: Automatically cancels appointments if a confirmation form isn't filled within the 4-day SLA.
* **Facilitates Communication**: Sends automated HTML emails to patients for confirmation, approval, or cancellation.
* **Centralizes Data**: Logs patient information and appointment dates into a Google Sheet for easy review.
* **Alerts Staff**: Sends real-time notifications to a Telegram group when forms are submitted or actions are taken.

## Why the Project is Useful

* **Efficiency**: Reduces manual follow-up by automating the "pending confirmation" phase through automated email triggers.
* **Accountability**: Tracks which staff member reviewed a case and notifies the team via Telegram mentions.
* **Reduced No-Shows**: The SLA ensures that only committed patients retain their slots, freeing up time for others.
* **Real-Time Updates**: Integration with Telegram ensures staff are aware of new data without needing to check the spreadsheet constantly.

## Technical Requirements

* **Google Workspace Account**: Required for access to Sheets, Calendar, and Gmail.
* **Telegram Bot**: A bot token and Chat ID are necessary for real-time notifications.
* **Google Form**: Used to collect patient verification data linked to the spreadsheet.
* **Specific Triggers**: Requires Time-driven, On Form Submit, and On Edit triggers for full automation.

## How Users Can Get Started

1. **Prepare the Sheet**: Create a Google Sheet with two tabs:
* **Main Database**: Headers must include `EventID`, `Nama`, and `Status Semakan`.
* **Staff List**: Staff names in Column A and Telegram usernames in Column C.

2. **Configure Script**: Copy the code into a Google Apps Script project and update the following constants:
* `SPREADSHEET_ID` 
* `CALENDAR_ID` 
* `TELEGRAM_BOT_TOKEN` & `TELEGRAM_CHAT_ID` 
* `FORM_URL` & `FORM_ENTRY_ID` 

3. **Deploy Triggers**:
* Set `checkNewBookings` to a **Time-driven** trigger (e.g., hourly).
* Set `onFormSubmit` to an **On form submit** trigger.
* Set `onStatusEdit` to an **On edit** trigger.

## Known Limitations

* **Email Quotas**: Subject to daily limits imposed by Google on outgoing emails.
* **Trigger Latency**: Time-based triggers may not execute at the exact minute specified.
* **Data Dependencies**: The system requires the `EventID` to be accurately passed from the form for row-matching.

## Who Maintains the Project

The system is designed for administration teams to maintain. Updates to the script, such as changing the `SLA_DAYS` or contact information, can be done directly in the main configuration block.

---
