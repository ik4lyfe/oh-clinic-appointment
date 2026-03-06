# Clinic Automation System

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

## How Users Can Get Started

1. **Prepare the Sheet**: Create a Google Sheet with specific headers: `EventID`, `Nama`, `Status Semakan`, and `Disemak Oleh`.

2. **Configure Script**: Copy the code into a Google Apps Script project and update the `SPREADSHEET_ID`, `CALENDAR_ID`, and Telegram credentials.

3. **Deploy Triggers**:
* Set `checkNewBookings` to a time-driven trigger to handle periodic calendar scans.
* Set `onFormSubmit` to a "From spreadsheet - On form submit" trigger.
* Set `onStatusEdit` to a "From spreadsheet - On edit" trigger.


## Where Users Can Get Help

* **Documentation**: Refer to the configuration comments at the top of the script for proper ID placement.
* **Staff Lookup**: Ensure the staff sheet contains names and Telegram usernames to enable automatic mentions.
* **Logs**: Use the Google Apps Script execution logs to troubleshoot errors such as missing "EventID" columns.

## Who Maintains the Project

The system is designed for administration teams to maintain. Updates to the script, such as changing the `SLA_DAYS` or contact information, can be done directly in the main configuration block.

---
