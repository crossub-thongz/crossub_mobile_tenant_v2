# CROS Tenant staging test cases

20 Nov 2026. App: CROS Tenant Staging, TestFlight build 18. API: https://crossub-api-staging.onrender.com.

Do not create a record unless the step says to. Do not submit Forgot password unless you mean to send the reset email.

Build 18 has the phone changes. Staging does not yet serve the attendance save or the completed move-in checklist. Those two rows say what the screen must show until the API is deployed.

## Accounts

Password for every login below: ChangeMe!Now123

These staging logins were checked on 22 Nov 2026. Each service type has three tenant logins and three agent logins. Every tenant in the three service groups is linked to one property. Agent logins are for https://crossub-mobile-agent.onrender.com/login. The tenant app must refuse every agent login.

## Full Service

Level 2 full management. Rent is in the Crossub trust. Tony's three tenants are on Tony Demo Agency and are managed by tony.chan+agent. Avery and Blair each have their own Full Service agency. Their occupied streets use dummy emails, so use Tony, Casey, and Drew when the tenant app needs a Full Service home.

| Side | Name | Email | Linked to |
| --- | --- | --- | --- |
| Tenant | Tony Chan | tony.chan+tenant@crossub.com.au | 7 Demo Street, Sydney. ACTIVE lease, $850 a week. Full Service, Crossub trust. Home opens here. Four other tenancies are signed only. |
| Tenant | Casey Qatenant | qa.charlie.tenant@crossub.com.au | 31 QA Home Street, Sydney. One ACTIVE lease, $610 a week. Full Service, Crossub trust. |
| Tenant | Drew Qatenant | qa.delta.tenant@crossub.com.au | 32 QA Home Street, Sydney. One ACTIVE lease, $620 a week. Full Service, Crossub trust. |
| Agent | Tony Chan | tony.chan+agent@crossub.com.au | Tony Demo Agency. Principal, Account Manager (Full Access). Sees 7 Demo Street, 31 QA Home Street, and 32 QA Home Street. |
| Agent | Avery Qaagent | qa.alpha.agent@crossub.com.au | CROSSUB QA Let Alpha. Principal, Account Manager. Level 2 full management, Crossub trust. |
| Agent | Blair Qaagent | qa.bravo.agent@crossub.com.au | CROSSUB QA Let Bravo. Principal, Account Manager. Level 2 full management, Crossub trust. |

## Self-Manage

Self-Manage, free plan. The agency folio is external, so the tenant app shows self-managed rent. All three agents are principals on QA Tenant Self-Manage Agency and can open all three streets.

| Side | Name | Email | Linked to |
| --- | --- | --- | --- |
| Tenant | Sam Qatenant | qa.self.sam.tenant@crossub.com.au | 41 QA Self Street, Sydney. One ACTIVE lease, $510 a week. Self-managed. |
| Tenant | Taylor Qatenant | qa.self.taylor.tenant@crossub.com.au | 42 QA Self Street, Sydney. One ACTIVE lease, $520 a week. Self-managed. |
| Tenant | Jordan Qatenant | qa.self.jordan.tenant@crossub.com.au | 43 QA Self Street, Sydney. One ACTIVE lease, $530 a week. Self-managed. |
| Agent | Morgan Qaagent | qa.self.morgan.agent@crossub.com.au | QA Tenant Self-Manage Agency. Principal, Account Manager. |
| Agent | Parker Qaagent | qa.self.parker.agent@crossub.com.au | QA Tenant Self-Manage Agency. Principal, Account Manager. |
| Agent | Reese Qaagent | qa.self.reese.agent@crossub.com.au | QA Tenant Self-Manage Agency. Principal, Account Manager. |

## Inspection Only

Level 1, inspection and tribunal. The agency folio stays Crossub, so the tenant app still shows Crossub-trust rent. The Inspection Only plan does not include tenancy management; these leases exist so the tenant app has a property to open. All three agents are principals on QA Tenant Inspection Only Agency and can open all three streets.

| Side | Name | Email | Linked to |
| --- | --- | --- | --- |
| Tenant | Rowan Qatenant | qa.inspect.rowan.tenant@crossub.com.au | 51 QA Inspect Street, Sydney. One ACTIVE lease, $410 a week. Crossub trust. |
| Tenant | Sage Qatenant | qa.inspect.sage.tenant@crossub.com.au | 52 QA Inspect Street, Sydney. One ACTIVE lease, $420 a week. Crossub trust. |
| Tenant | Vale Qatenant | qa.inspect.vale.tenant@crossub.com.au | 53 QA Inspect Street, Sydney. One ACTIVE lease, $430 a week. Crossub trust. |
| Agent | Noel Qaagent | qa.inspect.noel.agent@crossub.com.au | QA Tenant Inspection Only Agency. Principal, Account Manager. |
| Agent | Oakley Qaagent | qa.inspect.oakley.agent@crossub.com.au | QA Tenant Inspection Only Agency. Principal, Account Manager. |
| Agent | Paige Qaagent | qa.inspect.paige.agent@crossub.com.au | QA Tenant Inspection Only Agency. Principal, Account Manager. |

## Logins that are not linked to a property

| Name | Email | What happens |
| --- | --- | --- |
| Quinn Qatenant | qa.alpha.tenant@crossub.com.au | Tenant. Signs in. Tenancy list is empty. |
| Riley Qatenant | qa.bravo.tenant@crossub.com.au | Tenant. Signs in, then tenancies are refused because the user is not linked to a tenant profile. |

Tony's ACTIVE lease, last read 20 Nov 2026: Crossub trust, $850 a week, paid-to date set. The other four are signed, not the home default. One of them is self-managed at $640 a week. Routine inspections on the account: 21 (19 completed, 1 in progress, 1 scheduled). None required the tenant to act. Ledger lines: 0. Move-in checklist on the live API: 404 because the lease is already current.

`tony.chan@crossub.com.au` is the Super Admin. The demo setup leaves that password alone. Do not use it here.

## Cases

| Do this | Expected |
| --- | --- |
| Open CROS Tenant Staging. Sign in as tony.chan+tenant@crossub.com.au. | Home opens. The address is the ACTIVE tenancy, not one of the signed-only leases. |
| Sign in as tony.chan+tenant@crossub.com.au with a wrong password. | Sign-in is refused. Home does not open. |
| Leave the email and password empty and tap sign in. | Home does not open. |
| Sign out. Sign in as tony.chan+agent@crossub.com.au. | Sign-in is refused. The tenant app accepts the TENANT role only. |
| Sign in as qa.alpha.agent@crossub.com.au, then as qa.bravo.agent@crossub.com.au. | Both are refused. These logins are for the agent app. |
| On the login page, tap the empty space beside Forgot password, and beside the three lines under it. | Only the words themselves navigate. The empty space beside them does not. |
| Open Forgot password. Do not send it. | The screen is there. Sending it emails a real reset link. |
| From the login page, open Browse listings, then open one listing. Do not apply and do not check in. | Listings load with no account. Staging had 26 on 20 Nov 2026. The listing detail opens. Apply and check-in would create a record. |
| Sign back in as Tony. Open Profile, then My properties. Tap a signed tenancy, then open Home, Payments, Activity, and the inspection list. Tap the ACTIVE tenancy again. | The selected card says Showing on Home. Home, payments, repairs, inspections, rent review, and vacating follow that tenancy. Returning to the ACTIVE lease restores the original home. |
| On Tony's ACTIVE property, open Inspections and Activity. | Routine visits are listed with the other inspections. Completed ones are history. The next open routine appears on Home with its date. A self-inspection opens only if that visit says the tenant must act. Tony's list had none in that state on 20 Nov 2026. |
| Open the next in-person routine visit. Tap "I can attend". | After the API deploy, the answer is saved and the appointment time stays the same. Until that deploy, the save fails and the screen shows the error. It must not say the attendance was saved. |
| Open Profile, then Onboarding. | Today the screen says the checklist is already complete, with no step rows, because staging still returns 404. After the API deploy, the same complete notice includes the real deposit, bond, lease, and key steps. It must not show four pending steps with made-up amounts. |
| Open the rent review for the selected property. | Tony's review is completed and is not a fixed-term agreement waiting for a signature, so Sign agreement stays hidden and Download lease agreement stays hidden. The notice of rent increase still downloads. Sign agreement and the agreement download appear only when the review is accepted, the notice requires a signature, and the agreement file is available. |
| Open the open vacating case and Final settlement. | Accept or decline for repair responsibilities appears only when the case is open and that review is pending. The repair quote appears only when the quote is pending and the bond acknowledgement has been sent. A decline without a reason is refused. A failed save does not show success. |
| Open Payments, the ledger, receipts, and invoices. Leave "I've paid" unsent unless you mean to send the message. | The ledger call succeeds and shows no lines. Invoices are empty because the documents on the account are inspection files. "I've paid" asks for a type and a photo, then sends a message. It does not change the ledger. |
| Open Documents. | The files are inspection documents. Staging had 11 on 20 Nov 2026. |
| Open card pay, authenticator setup, and notification settings. | Card payments are not taken. Authenticator setup is not available. Notification choices stay on this phone. |
| Open Notifications. | Notices from the tenancy load. Staging had 114 on 20 Nov 2026. |
| Open Privacy and security. | Authenticator setup is not available. Sessions from this account are listed. Staging had 5 on 20 Nov 2026. |
| Open Household members. | Names and roles load. Staging had 2 people on 20 Nov 2026. |
| Open Applications. | The list loads. Staging had 7 on 20 Nov 2026. |
| Open Tenancy details. | Lease documents, inspections, and repairs open from here. The page does not edit the lease. |
| Open Help, then FAQ. | FAQ opens. |
| Open Report a repair. Leave it unsent. | The form is there. Sending it creates a real repair. |
| Sign in as Quinn. Sign out. Sign in as Riley. | Quinn reaches Home with no property. Riley is signed in, then the tenancy list is refused. |
| As Quinn, open Profile, then My properties. | There are no properties. |
| Open Inbox and the repair list. | Threads and repairs load from the account. A repair opened from the list is that repair. Maintenance messages that do not carry a repair id open the repair list. |
| Sign out, then sign in as Tony again. | Login returns. Home starts again on the ACTIVE lease. |

## More cases

Use Tony unless the step names another account. Do not send a message, save a phone number, submit keys, save cleaning, request a mover, approve a report, or accept the access agreement unless you mean to create that record.

| Do this | Expected |
| --- | --- |
| On Home, open the menu. Do not log out. | Browse listings, Applications, Onboarding, Lease renewal, Notifications, Documents, Settings, Profile, App tutorial, and FAQ are listed. Log out is separate at the bottom. |
| On Home, open Report Issue, Contact Us, Inspections, and Key Handover. Do not submit. | Report Issue opens the repair form. Contact Us opens a new message. Inspections opens the inspection list. Key Handover opens key collection or key return for the selected tenancy. |
| Open Activity. Tap All, Action Required, In Progress, and Completed. | Completed routine visits sit under Completed. Open repairs and the open routine sit under In Progress. Action Required stays empty unless a visit or repair asks the tenant to act. |
| Open Inbox. Tap All, Unread, Maintenance, Inspection, Leasing, and General. Open one conversation. Do not reply. | The list follows the filter. The conversation you open is that thread. A reply is a real message. |
| Open Ask Cros. Do not start the call. | Report a repair, the routine inspection, and a new message are listed. Starting the call asks staging for a voice session. If voice is unavailable, the screen says so. |
| Open New message. Leave the subject empty and tap Send message. | The app asks for a subject and a message. No thread is created. Categories are General, Maintenance, Inspection, and Leasing. |
| Open Personal information. Do not tap Save phone. | The name and email on the account are shown and cannot be edited here. Only the phone number can be saved, and saving changes it on the account. |
| Open My lease for the selected property. | The address, rent, and dates match that tenancy. The notice of rent increase downloads. The tenancy agreement download shows an error when that file is not on the account. |
| Open the entry condition report. Do not approve, reject, or dispute it. | A published ingoing report opens with its sections. If none is published for this tenancy, the screen says no entry report has been published. An empty dispute reason is refused. |
| Open the final inspection. Do not answer attendance, dispute a section, or approve the report. | A published outgoing report opens for this tenancy. If none is published, the screen says no final report has been published. Yes or No saves attendance. A dispute needs a reason. Approve saves the approval. |
| Open Key handover. Do not add a photo or tap Submit key return. | Key return uses the vacating case on the selected property. Submit with no photo does not mark the keys returned. |
| Open Moving out, then Cleaning and Move-out services. Do not tap Save choice or Ask for a moving referral. | Moving out lists cleaning, services, the final inspection, key return, and final settlement. Save choice writes the cleaning arrangement. A moving referral is a real request and does not book a mover. |
| Open Lease renewal. | Renewal applications on the account are listed. If none are marked as a renewal, the screen says no lease renewal offer is on this tenancy. |
| Open Help, then App tutorial, Move-in guide, and System access agreement. Do not accept the agreement. | Each page opens. Accepting the agreement records it on the tenancy. An empty name or an unchecked agreement is refused. |
| From the login page, open I have an invitation. | The page explains that an invitation email is sent after the tenancy is confirmed, expires on day 7, and is checked on the server. Back to sign in returns to login. |
| Open one application. Do not upload a document. | The application you tap is that application, with its status and property. Uploading a document adds it to that application. |
| Open the final statement. Do not tap Question this statement. | For a Crossub trust tenancy, the figures come from the vacating settlement. If no settlement has been issued, the screen says so. The statement PDF is not stored in the app. |
