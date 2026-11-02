import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const LANGUAGE_KEY = "ejat.language";

const translations = {
  "A project with this name already exists": "በዚህ ስም ፕሮጀክት አስቀድሞ አለ",
  "A user with this email already exists": "በዚህ ኢሜይል ተጠቃሚ አስቀድሞ አለ",
  "API connected": "API ተገናኝቷል",
  "API unavailable": "API አልተገናኘም",
  Account: "መለያ",
  "Account details": "የመለያ ዝርዝር",
  Actions: "ድርጊቶች",
  Activate: "አንቃ",
  "Activate {name}? They will be able to sign in again.":
    "ተጠቃሚ {name} ይንቃ? እንደገና መግባት ይችላሉ።",
  "Activate {name}? Users will be able to send SMS again.":
    "ፕሮጀክት {name} ይንቃ? ተጠቃሚዎች እንደገና መልዕክት መላክ ይችላሉ።",
  "Activate project": "ፕሮጀክት አንቃ",
  "Activate user": "ተጠቃሚ አንቃ",
  Active: "ንቁ",
  "Active projects": "ንቁ ፕሮጀክቶች",
  Activity: "እንቅስቃሴ",
  Approve: "ፍቀድ",
  "Approve batch": "ስብስቡን ፍቀድ",
  "Approve {count} numbers for {project}? They will be queued after you confirm.":
    "ለ{project} {count} ቁጥሮች ይፈቀዱ? ካረጋገጡ በኋላ ወደ ወረፋ ይገባሉ።",
  Approvals: "ፈቃዶች",
  "Approving...": "በመፍቀድ ላይ...",
  "Batch approved. {queued} numbers were queued.":
    "ስብስቡ ተፈቅዷል። {queued} ቁጥሮች ወረፋ ገብተዋል።",
  "Batch rejected. The allocation was released.":
    "ስብስቡ ተቀባይነት አላገኘም። የተያዘው ድልድል ተለቅቋል።",
  "Add at least one phone number.": "ቢያንስ አንድ ስልክ ቁጥር ያክሉ።",
  Allocated: "የተመደበ",
  Allocation: "ድልድል",
  "All projects": "ሁሉም ፕሮጀክቶች",
  "Assigned users": "የተመደቡ ተጠቃሚዎች",
  Cancel: "ይቅር",
  "Change a field before saving.": "ከማስቀመጥዎ በፊት መስክ ይቀይሩ።",
  "Add {name}": "{name} ጨምር",
  "Click + to add a number, or − to remove it.":
    "ቁጥር ለመጨመር + ይጫኑ፣ ወይም ለማስወገድ − ይጫኑ።",
  "Remove {name}": "{name} አስወግድ",
  Contacts: "እውቂያዎች",
  "Contact created.": "እውቂያ ተፈጥሯል።",
  "Contact deleted.": "እውቂያ ተሰርዟል።",
  "Contact not found": "እውቂያ አልተገኘም",
  "Contact updated.": "እውቂያ ተዘምኗል።",
  "Create contact": "እውቂያ ፍጠር",
  Delete: "ሰርዝ",
  "Delete contact": "እውቂያ ሰርዝ",
  "Delete {name}? This only removes them from the contact list.":
    "{name} ይሰረዝ? ከእውቂያ ዝርዝር ብቻ ይወገዳሉ።",
  "Deleting...": "በመሰረዝ ላይ...",
  "Edit contact": "እውቂያ አርትዕ",
  "Enter a valid Ethiopian mobile number.": "ትክክለኛ የኢትዮጵያ ሞባይል ቁጥር ያስገቡ።",
  "Every project's contacts. Choose a project to narrow the list.":
    "የሁሉም ፕሮጀክቶች እውቂያዎች። ዝርዝሩን ለማጥበብ ፕሮጀክት ይምረጡ።",
  "Loading contacts": "እውቂያዎች በመጫን ላይ",
  "Manage contacts": "እውቂያዎችን ያስተዳድሩ",
  "No contacts yet": "እስካሁን እውቂያ የለም",
  "No saved contacts yet.": "የተቀመጠ እውቂያ የለም።",
  "Other projects cannot see these contacts.": "ሌሎች ፕሮጀክቶች እነዚህን እውቂያዎች ማየት አይችሉም።",
  "Phone number": "ስልክ ቁጥር",
  "Phone number is required.": "ስልክ ቁጥር ያስፈልጋል።",
  "Save people this project texts often, then pick them when sending.":
    "ይህ ፕሮጀክት ብዙ ጊዜ የሚልክላቸውን ሰዎች ያስቀምጡ፣ ከዚያ ሲልኩ ይምረጡ።",
  "Save the people your project texts often.": "ፕሮጀክትዎ ብዙ ጊዜ የሚልክላቸውን ሰዎች ያስቀምጡ።",
  "Saved for one project": "ለአንድ ፕሮጀክት የተቀመጠ",
  "Search by name or phone": "በስም ወይም በስልክ ፈልግ",
  "Search contacts": "እውቂያ ፈልግ",
  "This project already has a contact with that phone number":
    "ይህ ፕሮጀክት ይህን ስልክ ቁጥር ያለው እውቂያ አስቀድሞ አለው",
  "Choose a project to see this month's usage and send history.":
    "የዚህን ወር አጠቃቀም እና የመላኪያ ታሪክ ለማየት ፕሮጀክት ይምረጡ።",
  "Choose a project.": "ፕሮጀክት ይምረጡ።",
  "Choose project": "ፕሮጀክት ይምረጡ",
  Close: "ዝጋ",
  "Close navigation": "ዳሰሳ ዝጋ",
  "Confirm new password": "አዲስ የይለፍ ቃል ያረጋግጡ",
  "Correct the highlighted numbers before sending.":
    "ከመላክዎ በፊት የተመረጡትን ቁጥሮች ያስተካክሉ።",
  "Could not record SMS usage": "የመልዕክት አጠቃቀም መመዝገብ አልተቻለም",
  "Create a project user and assign them to one project.":
    "የፕሮጀክት ተጠቃሚ ይፍጠሩ እና ወደ አንድ ፕሮጀክት ይመድቡ።",
  "Create a project, set the leader, and give it a monthly SMS allocation.":
    "ፕሮጀክት ይፍጠሩ፣ መሪውን ያስቀምጡ እና ወርሃዊ የመልዕክት ድልድል ይስጡ።",
  "Create accounts for one project each.": "ለእያንዳንዱ ፕሮጀክት መለያ ይፍጠሩ።",
  "Create project": "ፕሮጀክት ፍጠር",
  "Create user": "ተጠቃሚ ፍጠር",
  Creating: "በመፍጠር ላይ",
  "Current password": "የአሁኑ የይለፍ ቃል",
  "Current password is incorrect": "የአሁኑ የይለፍ ቃል ትክክል አይደለም",
  Deactivate: "አቁም",
  "Deactivate {name}? They will be signed out and cannot log in until you activate the account.":
    "ተጠቃሚ {name} ይቁም? ከመለያው ይወጣሉ እና እስኪያነቁት ድረስ መግባት አይችሉም።",
  "Deactivate {name}? Users can still sign in and read history, but they cannot send SMS.":
    "ፕሮጀክት {name} ይቁም? ተጠቃሚዎች መግባትና ታሪክ ማየት ይችላሉ፣ ነገር ግን መልዕክት መላክ አይችሉም።",
  "Deactivate project": "ፕሮጀክት አቁም",
  "Deactivate user": "ተጠቃሚ አቁም",
  Directory: "ማውጫ",
  Duplicate: "ተደጋጋሚ",
  "EJAT notifications": "የEJAT ማሳወቂያ",
  Edit: "አርትዕ",
  "Edit project": "ፕሮጀክት አርትዕ",
  "Edit user": "ተጠቃሚ አርትዕ",
  Email: "ኢሜይል",
  "Email address": "የኢሜይል አድራሻ",
  "Enter a valid email address.": "ትክክለኛ ኢሜይል ያስገቡ።",
  "Enter a whole number from 0 to 10,000,000.":
    "ከ 0 እስከ 10,000,000 ያለ ሙሉ ቁጥር ያስገቡ።",
  "Enter the current password to set a new one.":
    "አዲስ የይለፍ ቃል ለማዘጋጀት የአሁኑን ያስገቡ።",
  "Enter your password": "የይለፍ ቃልዎን ያስገቡ",
  Error: "ስህተት",
  "Every message recorded for your project.": "ለፕሮጀክትዎ የተመዘገበ እያንዳንዱ መልዕክት።",
  Failed: "አልተሳካም",
  "Filter by project": "በፕሮጀክት አጣራ",
  "First name": "ስም",
  "First name is required.": "ስም ያስፈልጋል።",
  History: "ታሪክ",
  Inactive: "የቆመ",
  "Integer from 0 to 10,000,000. Lowering the allocation does not erase messages already counted.":
    "ከ 0 እስከ 10,000,000 ያለ ኢንቲጀር። ድልድሉን መቀነስ ቀድሞ የተቆጠሩ መልዕክቶችን አያጠፋም።",
  Invalid: "ልክ ያልሆነ",
  "Invalid email or password": "ኢሜይል ወይም የይለፍ ቃል ትክክል አይደለም",
  Language: "ቋንቋ",
  "Last name": "የአባት ስም",
  "Last name is required.": "የአባት ስም ያስፈልጋል።",
  Leader: "መሪ",
  "Leader name": "የመሪ ስም",
  "Leader name is required.": "የመሪ ስም ያስፈልጋል።",
  "Leader, {name}": "መሪ፣ {name}",
  "Leave blank to keep the current password.": "የአሁኑን የይለፍ ቃል ለመጠበቅ ባዶ ይተዉት።",
  "Loading messages": "መልዕክቶች በመጫን ላይ",
  "Loading projects": "ፕሮጀክቶች በመጫን ላይ",
  "Loading users": "ተጠቃሚዎች በመጫን ላይ",
  "Main navigation": "ዋና ዳሰሳ",
  "Member since": "አባል ከ",
  Message: "መልዕክት",
  "Message is required": "መልዕክት ያስፈልጋል",
  "Message must be at most 335 characters": "መልዕክት ቢበዛ 335 ቁምፊ መሆን አለበት",
  "Messages sent for this project will appear here.":
    "ለዚህ ፕሮጀክት የተላኩ መልዕክቶች እዚህ ይታያሉ።",
  "Messages you send will appear here.": "የሚልኳቸው መልዕክቶች እዚህ ይታያሉ።",
  "Monthly SMS allocation": "ወርሃዊ የመልዕክት ድልድል",
  "Monthly SMS allocation exceeded": "ወርሃዊ የመልዕክት ድልድል አልፏል",
  "More than 100 numbers need a super admin before anything is queued.":
    "ከ100 በላይ ቁጥሮች ከመላክ በፊት የሱፐር አስተዳዳሪ ፈቃድ ይፈልጋሉ።",
  Name: "ስም",
  "Name is required.": "ስም ያስፈልጋል።",
  "New password": "አዲስ የይለፍ ቃል",
  Next: "ቀጣይ",
  "No batches are waiting for approval.": "ፈቃድ የሚጠብቅ ስብስብ የለም።",
  "No messages yet": "እስካሁን መልዕክት የለም",
  "No more than 500 numbers at a time.": "በአንድ ጊዜ ከ 500 ቁጥሮች በላይ አይሆንም።",
  "No project": "ፕሮጀክት የለም",
  "No projects yet": "እስካሁን ፕሮጀክት የለም",
  "No SMS remaining this month.": "በዚህ ወር የቀረ መልዕክት የለም።",
  "Nothing was queued yet.": "እስካሁን ወረፋ አልገባም።",
  Numbers: "ቁጥሮች",
  "No users in this project yet.": "በዚህ ፕሮጀክት እስካሁን ተጠቃሚ የለም።",
  "No users yet": "እስካሁን ተጠቃሚ የለም",
  Notifications: "ማሳወቂያዎች",
  "One or more phone numbers are invalid": "አንድ ወይም ከዚያ በላይ ስልክ ቁጥሮች ልክ አይደሉም",
  "Only a project user can send SMS": "መልዕክት መላክ የሚችለው የፕሮጀክት ተጠቃሚ ብቻ ነው",
  "Open navigation": "ዳሰሳ ክፈት",
  "Open profile": "መገለጫ ክፈት",
  Password: "የይለፍ ቃል",
  "Password is required.": "የይለፍ ቃል ያስፈልጋል።",
  "Password must be at least 8 characters.": "የይለፍ ቃል ቢያንስ 8 ቁምፊ መሆን አለበት።",
  "Password must be 72 characters or fewer.": "የይለፍ ቃል ቢበዛ 72 ቁምፊ መሆን አለበት።",
  "Too many login attempts. Try again later.": "የመግቢያ ሙከራ በጣም ብዙ ነው። ቆይተው እንደገና ይሞክሩ።",
  "Password updated.": "የይለፍ ቃል ተዘምኗል።",
  "Passwords do not match.": "የይለፍ ቃሎቹ አይዛመዱም።",
  Phone: "ስልክ",
  "Phone numbers": "ስልክ ቁጥሮች",
  Previous: "ቀዳሚ",
  Profile: "መገለጫ",
  "Profile saved.": "መገለጫ ተቀምጧል።",
  Project: "ፕሮጀክት",
  "Project activity": "የፕሮጀክት እንቅስቃሴ",
  "Project created.": "ፕሮጀክት ተፈጥሯል።",
  "Project directory": "የፕሮጀክት ማውጫ",
  "Project may send SMS": "ፕሮጀክቱ መልዕክት መላክ ይችላል",
  "Project not found": "ፕሮጀክት አልተገኘም",
  "Project updated.": "ፕሮጀክት ተዘምኗል።",
  "Project user": "የፕሮጀክት ተጠቃሚ",
  "projectId is required": "የፕሮጀክት መታወቂያ ያስፈልጋል",
  Projects: "ፕሮጀክቶች",
  "Project users can send 100 numbers or fewer without this step.":
    "የፕሮጀክት ተጠቃሚዎች 100 ወይም ከዚያ ያነሱ ቁጥሮችን ያለዚህ ደረጃ መላክ ይችላሉ።",
  Queued: "ወረፋ ገብቷል",
  Reject: "አትቀበል",
  "Reject batch": "ስብስቡን አትቀበል",
  "Reject {count} numbers for {project}? Nothing will be sent, and the reserved allocation is released.":
    "ለ{project} {count} ቁጥሮች አይቀበሉ? ምንም አይላክም፣ የተያዘው ድልድልም ይለቀቃል።",
  Rejected: "ተቀባይነት አላገኘም",
  "Rejecting...": "በመከልከል ላይ...",
  Recent: "የቅርብ ጊዜ",
  "Recent messages": "የቅርብ ጊዜ መልዕክቶች",
  Refresh: "አድስ",
  Remaining: "የቀረ",
  "Request approval": "ፈቃድ ጠይቅ",
  "Request failed": "ጥያቄው አልተሳካም",
  "Restoring session": "ክፍለ ጊዜ በመመለስ ላይ",
  Retry: "እንደገና ሞክር",
  "Retry failed numbers": "ያልተሳኩ ቁጥሮችን እንደገና ሞክር",
  Role: "ሚና",
  "SMS used this month": "በዚህ ወር የተላከ",
  "A send of more than 100 numbers stays here until you approve or reject it.":
    "ከ100 በላይ የሆነ መላኪያ እርስዎ እስኪፈቅዱ ወይም እስኪከለክሉ እዚህ ይቆያል።",
  "SMS workspace": "የአጭር መልዕክት መድረክ",
  Save: "አስቀምጥ",
  "Save changes": "ለውጦችን አስቀምጥ",
  Saving: "በማስቀመጥ ላይ",
  Send: "ላክ",
  "Send SMS": "መልዕክት ላክ",
  "Send each project's messages inside its monthly allocation.":
    "የእያንዳንዱን ፕሮጀክት መልዕክት በወርሃዊ ድልድሉ ውስጥ ይላኩ።",
  "Send history": "የመላኪያ ታሪክ",
  "Send message": "መልዕክት ላክ",
  Sender: "ላኪ",
  Sending: "በመላክ ላይ",
  "Sending stays closed until next month.": "እስከ የሚቀጥለው ወር ድረስ መላክ ተዘግቷል።",
  "Separate numbers with commas or new lines. 0911223344, 911223344, and +251911223344 are the same kind of number.":
    "ቁጥሮችን በኮማ ወይም በአዲስ መስመር ይለዩ። 0911223344፣ 911223344 እና +251911223344 አንድ ዓይነት ቁጥሮች ናቸው።",
  "Session is no longer valid": "ክፍለ ጊዜው ከአሁን በኋላ የሚሰራ አይደለም",
  "Set a new password": "አዲስ የይለፍ ቃል ያዘጋጁ",
  "Set password": "የይለፍ ቃል አዘጋጅ",
  "Set the leader, the monthly allocation, and whether the project may send.":
    "መሪውን፣ ወርሃዊ ድልድሉን እና ፕሮጀክቱ መላክ መቻሉን ያስቀምጡ።",
  "Share this password with the user. 8 to 72 characters.":
    "ይህን የይለፍ ቃል ለተጠቃሚው ያጋሩ። ከ8 እስከ 72 ቁምፊ።",
  "Sign in": "ግባ",
  "Sign in to notifications": "ወደ ማሳወቂያ ይግቡ",
  "Sign out": "ውጣ",
  "Signed-in account": "የገቡበት መለያ",
  "Signing in": "በመግባት ላይ",
  "Something went wrong. Please try again.": "የሆነ ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።",
  Status: "ሁኔታ",
  "Super admin": "ዋና አስተዳዳሪ",
  "Super admin accounts are not managed from the user directory":
    "የዋና አስተዳዳሪ መለያዎች ከተጠቃሚ ማውጫ አይመሩም",
  "The SMS queue is unavailable. No messages were sent.":
    "የመልዕክት ወረፋው አልተገኘም። ምንም መልዕክት አልተላከም።",
  "The latest messages for your project.": "የፕሮጀክትዎ የቅርብ ጊዜ መልዕክቶች።",
  "The notification service could not be reached. Check that it is running and try again.":
    "የማሳወቂያ አገልግሎቱ አልተገኘም። እየሰራ መሆኑን ያረጋግጡ እና እንደገና ይሞክሩ።",
  "The passwords do not match.": "የይለፍ ቃሎቹ አይዛመዱም።",
  "This account is deactivated": "ይህ መለያ ቆሟል",
  "This month": "በዚህ ወር",
  "This project is deactivated and cannot send SMS.":
    "ይህ ፕሮጀክት ቆሟል፣ መልዕክት መላክ አይችልም።",
  Time: "ሰዓት",
  Waiting: "በመጠበቅ ላይ",
  "Waiting for approval": "ፈቃድ በመጠበቅ ላይ",
  "{count} numbers are waiting for a super admin.":
    "{count} ቁጥሮች የሱፐር አስተዳዳሪን እየጠበቁ ነው።",
  "Unable to complete the request": "ጥያቄውን ማጠናቀቅ አልተቻለም",
  "Unable to reach the notification service.": "የማሳወቂያ አገልግሎቱን ማግኘት አልተቻለም።",
  "Unicode is allowed, including Amharic. 335 characters at most.":
    "ዩኒኮድ ይፈቀዳል፣ አማርኛን ጨምሮ። ቢበዛ 335 ቁምፊ።",
  "Unknown sender": "ያልታወቀ ላኪ",
  "Update your name and password.": "ስምዎን እና የይለፍ ቃልዎን ያዘምኑ።",
  "Use at most 120 characters.": "ቢበዛ 120 ቁምፊ ይጠቀሙ።",
  "Use 0911223344, 911223344, or +251911223344.":
    "0911223344፣ 911223344 ወይም +251911223344 ይጠቀሙ።",
  "Use the account issued to you.": "የተሰጠዎትን መለያ ይጠቀሙ።",
  Used: "የተጠቀመ",
  "Used this month": "በዚህ ወር የተጠቀመ",
  "User created.": "ተጠቃሚ ተፈጥሯል።",
  "User not found": "ተጠቃሚ አልተገኘም",
  "User updated.": "ተጠቃሚ ተዘምኗል።",
  Users: "ተጠቃሚዎች",
  "Usage and the send log.": "አጠቃቀም እና የመላኪያ መዝገብ።",
  "Usage is counted per project. Choose one project to see its allocation.":
    "አጠቃቀም በፕሮጀክት ይቆጠራል። ድልድሉን ለማየት አንድ ፕሮጀክት ይምረጡ።",
  "Validation failed": "ማረጋገጫ አልተሳካም",
  "View history": "ታሪክ ይመልከቱ",
  "Welcome back": "እንኳን በደህና መጡ",
  Workspace: "የስራ ቦታ",
  "Working": "በመስራት ላይ",
  "Write one message, then add one number or a list.":
    "አንድ መልዕክት ይጻፉ፣ ከዚያ አንድ ቁጥር ወይም ዝርዝር ያክሉ።",
  "You can only access your own project": "የራስዎን ፕሮጀክት ብቻ ማየት ይችላሉ",
  "You can still read usage and history.": "አጠቃቀምን እና ታሪክን ማንበብ ይችላሉ።",
  "{count} duplicate numbers were removed.": "{count} ተደጋጋሚ ቁጥሮች ተወግደዋል።",
  "{count} duplicate numbers will be sent once.": "{count} ተደጋጋሚ ቁጥሮች አንድ ጊዜ ይላካሉ።",
  "{count} numbers could not be queued.": "{count} ቁጥሮች ወረፋ መግባት አልቻሉም።",
  "{count} numbers do not fit. {remaining} SMS remaining this month. Shorten the list. Nothing will be sent until they fit.":
    "{count} ቁጥሮች አይስማሙም። በዚህ ወር {remaining} መልዕክት ቀርቷል። ዝርዝሩን ያሳጥሩ። እስኪስማሙ ድረስ ምንም አይላክም።",
  "{count} numbers ready.": "{count} ቁጥሮች ዝግጁ ናቸው።",
  "{queued} numbers were queued.": "{queued} ቁጥሮች ወረፋ ገብተዋል።",
  "{remaining} SMS remaining. You asked to send {requested}. Shorten the list and try again. Nothing was sent.":
    "{remaining} መልዕክት ቀርቷል። {requested} ለመላክ ጠይቀዋል። ዝርዝሩን ያሳጥሩ እና እንደገና ይሞክሩ። ምንም አልተላከም።",
  "72 characters at most.": "ቢበዛ 72 ቁምፊ።",
  Hide: "ደብቅ",
  Show: "አሳይ",
  "Page {page} of {pages}": "ገጽ {page} ከ {pages}",
  "Saving...": "በማስቀመጥ ላይ...",
  "Signing in...": "በመግባት ላይ...",
  "Sending...": "በመላክ ላይ...",
  "Creating...": "በመፍጠር ላይ...",
  "Activating...": "በማንቃት ላይ...",
  "Deactivating...": "በማቆም ላይ...",
};

const I18nContext = createContext(null);

function readLanguage() {
  return localStorage.getItem(LANGUAGE_KEY) === "am" ? "am" : "en";
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(readLanguage);

  const setLanguage = useCallback((next) => {
    const value = next === "am" ? "am" : "en";
    localStorage.setItem(LANGUAGE_KEY, value);
    setLanguageState(value);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "am" ? "am" : "en";
  }, [language]);

  const t = useCallback(
    (key, vars) => {
      const template = language === "am" ? (translations[key] ?? key) : key;
      if (!vars) return template;
      return template.replace(/\{(\w+)\}/g, (match, name) =>
        vars[name] == null ? match : String(vars[name]),
      );
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// Hook shared with the provider in this module.
// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used within I18nProvider");
  return value;
}
