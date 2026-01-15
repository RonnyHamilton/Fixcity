import { ChatRole } from '@/types/chat';

/**
 * Enhanced Rule-Based Chat System for FixCity
 * Comprehensive support for Public, Officer, and Technician roles
 * Smart intent matching with typo/synonym support
 */

interface Intent {
    keywords: string[];
    synonyms: string[];
    typos: string[];
    hinglish: string[];
    response: (role: ChatRole) => string;
    allowedRoles: ChatRole[];
}

/**
 * Normalize text for matching (lowercase, remove extra spaces)
 */
function normalize(text: string): string {
    return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Calculate match score for an intent
 */
function calculateScore(message: string, intent: Intent): number {
    const normalized = normalize(message);
    let score = 0;

    // Check keywords (highest weight)
    for (const keyword of intent.keywords) {
        if (normalized.includes(keyword.toLowerCase())) {
            score += 10;
        }
    }

    // Check synonyms
    for (const synonym of intent.synonyms) {
        if (normalized.includes(synonym.toLowerCase())) {
            score += 7;
        }
    }

    // Check typos
    for (const typo of intent.typos) {
        if (normalized.includes(typo.toLowerCase())) {
            score += 5;
        }
    }

    // Check Hinglish
    for (const hindi of intent.hinglish) {
        if (normalized.includes(hindi.toLowerCase())) {
            score += 8;
        }
    }

    return score;
}

/**
 * Comprehensive Intent Database
 */
const INTENTS: Intent[] = [
    // ============================================
    // UNIVERSAL INTENTS (All Roles)
    // ============================================
    {
        keywords: ['hi', 'hello', 'hey', 'greetings'],
        synonyms: ['namaste', 'good morning', 'good evening'],
        typos: ['helo', 'hii', 'hiii'],
        hinglish: ['namaste', 'hy'],
        allowedRoles: ['Public', 'Officer', 'Technician'],
        response: (role) => `Hello! 👋 Welcome to FixCity Chat.

I can help you with common tasks for ${role} users.

**Quick options:**
${role === 'Public' ? '• Report a problem\n• Track my complaint\n• OTP or login help' : role === 'Officer' ? '• View complaints\n• Assign technicians\n• Check status' : '• View my tasks\n• Update work status\n• Mark work complete'}

What do you need help with?`
    },
    {
        keywords: ['thank'],
        synonyms: ['thanks', 'thankyou', 'appreciated'],
        typos: ['thnks', 'thanx'],
        hinglish: ['dhanyavaad', 'shukriya'],
        allowedRoles: ['Public', 'Officer', 'Technician'],
        response: () => `You're welcome! Let me know if you need anything else. 🤝`
    },
    {
        keywords: ['bye', 'goodbye'],
        synonyms: ['exit', 'quit', 'close'],
        typos: ['by', 'byee'],
        hinglish: [],
        allowedRoles: ['Public', 'Officer', 'Technician'],
        response: () => `Goodbye! Have a great day! 👋`
    },

    // ============================================
    // PUBLIC ROLE INTENTS
    // ============================================
    {
        keywords: ['otp', 'not received', 'didn\'t get'],
        synonyms: ['code', 'verification', 'pin'],
        typos: ['otop', 'opt', 'otpp'],
        hinglish: ['otp nahi aaya', 'nahi aa raha'],
        allowedRoles: ['Public'],
        response: () => `OTP not received? Here's what to do:

**Steps:**
1. Wait 2-3 minutes (sometimes delayed)
2. Check SMS spam folder
3. Verify mobile number is correct
4. Use Master OTP: **123456** (for testing)

If OTP still doesn't arrive, contact support at 1800-FIX-CITY.

Need help with anything else?`
    },
    {
        keywords: ['wrong number', 'change mobile', 'edit phone'],
        synonyms: ['incorrect number', 'update mobile'],
        typos: ['rong number', 'chang number'],
        hinglish: ['number galat hai', 'number badalna hai'],
        allowedRoles: ['Public'],
        response: () => `To change your mobile number:

**Steps:**
1. Go back to login page
2. Re-enter correct Aadhaar number
3. Enter correct mobile number
4. Click "Send OTP"

**Note:** Mobile must match Aadhaar records.

What page are you on? I can guide you further.`
    },
    {
        keywords: ['login error', 'can\'t login', 'login failed'],
        synonyms: ['cannot login', 'unable to login'],
        typos: ['loggin error', 'login erro', 'cant login'],
        hinglish: ['login nahi ho raha'],
        allowedRoles: ['Public'],
        response: () => `Login issue? Let's fix it:

**Common solutions:**
• Use Master OTP: **123456**
• Ensure Aadhaar + Mobile match records
• Clear browser cache and retry
• Try different browser

**Still stuck?**
Tell me which error message you see, and I'll help!`
    },
    {
        keywords: ['invalid otp', 'wrong otp', 'incorrect code'],
        synonyms: ['otp wrong', 'code invalid'],
        typos: ['invalod otp', 'rong otp'],
        hinglish: ['otp galat hai'],
        allowedRoles: ['Public'],
        response: () => `Invalid OTP error:

**Try this:**
1. Use Master OTP: **123456**
2. If real OTP, check it's 6 digits
3. Make sure it's not expired (5 min limit)
4. Request new OTP

**Tip:** Copy-paste OTP to avoid typos!

Need anything else?`
    },
    {
        keywords: ['how to report', 'report problem', 'report issue'],
        synonyms: ['file complaint', 'submit report', 'lodge complaint'],
        typos: ['repot problem', 'reprort issue'],
        hinglish: ['report kaise kare', 'complaint kaise'],
        allowedRoles: ['Public'],
        response: () => `Here's how to report a problem:

**Steps:**
1. Login to FixCity
2. Click "Report Issue" button
3. Select issue type (pothole/garbage/etc.)
4. Take/upload photo
5. Add location (auto or manual)
6. Write description
7. Click "Submit"

You'll get a complaint ID to track it!

On which step do you need help?`
    },
    {
        keywords: ['upload image', 'upload photo', 'camera'],
        synonyms: ['add picture', 'take photo'],
        typos: ['uplod image', 'camra'],
        hinglish: ['photo kaise lagaye'],
        allowedRoles: ['Public'],
        response: () => `Photo upload help:

**Camera not working?**
• Allow camera permission in browser
• Use "Choose File" to pick existing photo
• Photo should be clear and relevant

**Camera permission denied?**
1. Click lock icon in address bar
2. Allow camera access
3. Refresh page

Need help with the next step?`
    },
    {
        keywords: ['gps', 'location', 'not detected'],
        synonyms: ['map', 'coordinates', 'geolocation'],
        typos: ['gos', 'locaton'],
        hinglish: ['location nahi mil raha'],
        allowedRoles: ['Public'],
        response: () => `GPS/Location issue:

**Auto-detect not working?**
1. Allow location permission
2. Ensure GPS is ON in phone
3. Or manually enter address

**Manual entry:**
• Type your address in location field
• Or drag map pin to exact spot

Your complaint will still be submitted!

What else can I help with?`
    },
    {
        keywords: ['issue types', 'what can report', 'categories'],
        synonyms: ['problem types', 'complaint categories'],
        typos: ['isue types', 'catgories'],
        hinglish: ['kya report kar sakte'],
        allowedRoles: ['Public'],
        response: () => `You can report these issues:

**Categories:**
• 🛣️ Potholes / Road damage
• 🗑️ Garbage / Waste
• 💧 Water logging / Drainage
• 💡 Street lights not working
• 🌳 Trees / Parks
• 🏗️ Other civic issues

Select the closest match when reporting!

Ready to report?`
    },
    {
        keywords: ['submitted twice', 'duplicate', 'double report'],
        synonyms: ['repeated', 'already reported'],
        typos: ['dubplicate', 'submited twice'],
        hinglish: ['do baar submit ho gaya'],
        allowedRoles: ['Public'],
        response: () => `Submitted twice by accident?

**Don't worry!**
• Officers can merge duplicates
• Both will have same ID eventually
• No penalty for duplicates

**To avoid in future:**
• Wait for "Success" message
• Don't click Submit multiple times

Track your complaints in dashboard!

Need help tracking them?`
    },
    {
        keywords: ['track complaint', 'check status', 'where is complaint'],
        synonyms: ['track report', 'complaint status', 'report status'],
        typos: ['trac complaint', 'chek status'],
        hinglish: ['complaint kaha hai', 'status kya hai'],
        allowedRoles: ['Public'],
        response: () => `Track your complaint:

**Steps:**
1. Go to "My Reports" in dashboard
2. Find your complaint by ID or date
3. Click to view status

**Status meanings:**
• **Pending:** Not assigned yet
• **In Progress:** Technician working on it
• **Resolved:** Work completed!

On which page are you right now?`
    },
    {
        keywords: ['status meaning', 'what is pending', 'status types'],
        synonyms: ['explain status', 'status definitions'],
        typos: ['statuz meaning', 'staus types'],
        hinglish: ['status ka matlab'],
        allowedRoles: ['Public'],
        response: () => `Complaint status explained:

**📌 Pending:**
• Complaint received
• Not assigned to technician yet
• Officer will review soon

**🔧 In Progress:**
• Technician assigned
• Work is ongoing

**✅ Resolved:**
• Work completed
• You can verify and close

**❌ Rejected:**
• Cannot be fixed (with reason)

Which status is confusing you?`
    },
    {
        keywords: ['report failed', 'submission error', 'didn\'t submit'],
        synonyms: ['submit failed', 'submission failed'],
        typos: ['submision error', 'didnt submitt'],
        hinglish: ['submit nahi hua'],
        allowedRoles: ['Public'],
        response: () => `Report submission failed?

**Try these fixes:**
1. Check internet connection
2. Ensure all fields are filled
3. Photo uploaded correctly
4. Try submitting again

**Still failing?**
• Take screenshot of error
• Note what step fails
• Tell me, I'll guide you!

Which field is giving trouble?`
    },

    // ============================================
    // OFFICER ROLE INTENTS
    // ============================================
    {
        keywords: ['view complaints', 'see reports', 'all complaints'],
        synonyms: ['check complaints', 'list reports'],
        typos: ['vew complaints', 'se reports'],
        hinglish: ['complaint kaha dekhe'],
        allowedRoles: ['Officer'],
        response: () => `View all complaints:

**Navigation:**
1. Click "Reports" in sidebar
2. You'll see all complaints list
3. Use filters to narrow down

**Quick filters:**
• Status (pending/in progress/resolved)
• Priority (urgent/high/medium/low)
• Date range

You're on officer dashboard, right?`
    },
    {
        keywords: ['complaint details', 'open complaint', 'view details'],
        synonyms: ['see full report', 'complaint info'],
        typos: ['complant details', 'ope complaint'],
        hinglish: ['complaint ki details'],
        allowedRoles: ['Officer'],
        response: () => `View complaint details:

**Steps:**
1. Go to "Reports" page
2. Click on any complaint row
3. Modal opens with full details

**Details shown:**
• Photo, description, location
• Status, priority
• Citizen name
• Date reported

From there, you can assign technician!

Need help assigning?`
    },
    {
        keywords: ['assign technician', 'assign work', 'assign to'],
        synonyms: ['assign task', 'allot work'],
        typos: ['asign technician', 'asign work'],
        hinglish: ['technician ko work assign kare'],
        allowedRoles: ['Officer'],
        response: () => `Assign work to technician:

**Steps:**
1. Click on complaint to open details
2. Scroll to bottom
3. Select technician from dropdown
4. Click "Assign Technician"

**Status auto-updates** to "In Progress"!

**Tip:** Choose technician by area/specialty

On which step are you stuck?`
    },
    {
        keywords: ['reassign', 'change technician', 'reassign work'],
        synonyms: ['assign different technician', 'switch technician'],
        typos: ['reasign', 'chang technician'],
        hinglish: ['technician change kare'],
        allowedRoles: ['Officer'],
        response: () => `Reassign work to different technician:

**If already assigned:**
• Open complaint details
• Select new technician
• Click "Assign" again
• Previous assignment is replaced

**Note:** Inform old technician if needed

Need help with anything else?`
    },
    {
        keywords: ['filter complaints', 'search complaints', 'sort reports'],
        synonyms: ['filter reports', 'search reports'],
        typos: ['filtr complaints', 'serch complaints'],
        hinglish: ['complaints filter kare'],
        allowedRoles: ['Officer'],
        response: () => `Filter/Search complaints:

**Available filters:**
• Status (top buttons: All/Pending/In Progress/Resolved)
• Search bar (by ID, description, location)

**To use:**
1. Click status filter buttons at top
2. Or type in search box
3. Results update instantly

Which filter do you need?`
    },
    {
        keywords: ['status workflow', 'how it works', 'complaint flow'],
        synonyms: ['workflow', 'process flow'],
        typos: ['workflo', 'proces flow'],
        hinglish: [],
        allowedRoles: ['Officer'],
        response: () => `Complaint workflow:

**Flow:**
1. **Citizen reports** → Status: Pending
2. **You assign technician** → Status: In Progress
3. **Technician completes** → Status: Resolved

**Your role:**
• Review new complaints
• Assign to right technician
• Monitor progress
• Handle duplicates

What part needs clarification?`
    },
    {
        keywords: ['duplicate complaints', 'same issue', 'duplicate handling'],
        synonyms: ['repeated complaints', 'similar reports'],
        typos: ['dublicate complaints'],
        hinglish: [],
        allowedRoles: ['Officer'],
        response: () => `Handle duplicate complaints:

**If same issue reported multiple times:**
• Pick the oldest/most detailed one
• Assign technician to that
• Others can be marked as duplicates

**Note:** Duplicates show citizens care!

**Pro tip:** Check location/photos to confirm

Need help with specific case?`
    },
    {
        keywords: ['track technician', 'technician status', 'work status'],
        synonyms: ['monitor technician', 'check progress'],
        typos: ['trac technician'],
        hinglish: [],
        allowedRoles: ['Officer'],
        response: () => `Track technician work:

**To check:**
1. Go to "Reports" page
2. Filter by "In Progress"
3. See which technician assigned
4. Check update time

**Or:**
• Go to "Technicians" tab (if exists)
• View workload per technician

What info do you need exactly?`
    },

    // ============================================
    // TECHNICIAN ROLE INTENTS
    // ============================================
    {
        keywords: ['my tasks', 'assigned work', 'my work'],
        synonyms: ['my assignments', 'assigned tasks'],
        typos: ['my task', 'asigned work'],
        hinglish: ['mera kaam', 'mere tasks'],
        allowedRoles: ['Technician'],
        response: () => `View your assigned tasks:

**Navigation:**
1. Go to "All Tasks" in sidebar
2. See all work assigned to you
3. Click on any task to view details

**Task info shown:**
• Problem description
• Location
• Priority
• Photos

Which task are you working on?`
    },
    {
        keywords: ['update status', 'mark progress', 'change status'],
        synonyms: ['update work status', 'set status'],
        typos: ['updat status', 'chang status'],
        hinglish: ['status update kare'],
        allowedRoles: ['Technician'],
        response: () => `Update task status:

**Steps:**
1. Open task details
2. Click "Update Status" button
3. Select status (In Progress/Resolved)
4. Add notes if needed
5. Save

**Status options:**
• In Progress (while working)
• Resolved (when done)

On which task page are you?`
    },
    {
        keywords: ['upload proof', 'completion photo', 'after photo'],
        synonyms: ['upload evidence', 'proof photo'],
        typos: ['uplod proof', 'completion photo'],
        hinglish: ['proof photo kaise lagaye'],
        allowedRoles: ['Technician'],
        response: () => `Upload completion proof:

**Photo guidelines:**
• Same angle as "before" photo
• Clear, not blurry
• Shows completed work

**How to upload:**
1. Open task
2. Scroll to resolution section
3. Click camera/choose file
4. Upload clear photo
5. Mark as resolved

**Important:** Proof validates your work!

Need camera permission help?`
    },
    {
        keywords: ['task not visible', 'task not showing', 'sync issue'],
        synonyms: ['cannot see task', 'task missing'],
        typos: ['task not visble', 'sync isue'],
        hinglish: ['task dikhai nahi de raha'],
        allowedRoles: ['Technician'],
        response: () => `Task not showing up?

**Try these:**
1. Refresh the page (F5)
2. Logout and login again
3. Check internet connection
4. Verify you're on "All Tasks" page

**Still not visible?**
• Officer may not have assigned yet
• Check with officer

Which task ID are you looking for?`
    },
    {
        keywords: ['mark completed', 'mark resolved', 'finish task'],
        synonyms: ['complete task', 'done with task'],
        typos: ['mark complte', 'finnish task'],
        hinglish: ['task complete kare'],
        allowedRoles: ['Technician'],
        response: () => `Mark task as completed:

**Steps:**
1. Open task details
2. Upload "after" photo (proof)
3. Add completion notes
4. Click "Mark as Resolved"
5. Confirm

**Required:**
✓ After photo uploaded
✓ Notes added (optional but good)

**Status changes** to "Resolved"

Ready to mark complete?`
    },
    {
        keywords: ['update failed', 'can\'t update', 'submission failed'],
        synonyms: ['cannot update', 'update error'],
        typos: ['cant updat', 'submision failed'],
        hinglish: ['update nahi ho raha'],
        allowedRoles: ['Technician'],
        response: () => `Status update failing?

**Check these:**
1. All required fields filled?
2. Photo uploaded (if needed)?
3. Internet connection stable?
4. Try again after refresh

**Common issues:**
• Missing required photo
• Network timeout
• Browser cache

Tell me which error you see!`
    },
];

/**
 * Find best matching intent for a message
 */
function findBestIntent(message: string, role: ChatRole): Intent | null {
    const scores = INTENTS
        .filter(intent => intent.allowedRoles.includes(role))
        .map(intent => ({
            intent,
            score: calculateScore(message, intent)
        }))
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score);

    // Return best match if confidence is high enough
    if (scores.length > 0 && scores[0].score >= 5) {
        return scores[0].intent;
    }

    return null;
}

/**
 * Main export function - Enhanced rule-based response system
 */
export function getRuleBasedResponse(role: ChatRole, message: string): string {
    const normalized = normalize(message);

    // Find best matching intent
    const matchedIntent = findBestIntent(normalized, role);

    if (matchedIntent) {
        return matchedIntent.response(role);
    }

    // No confident match - provide clarification
    const roleExample = role === 'Public'
        ? 'OTP, Report Problem, Track Status'
        : role === 'Officer'
            ? 'View Complaints, Assign Technician, Check Status'
            : 'My Tasks, Update Status, Mark Complete';

    return `I couldn't understand that clearly.

**Try asking about:**
${role === 'Public' ? '• OTP or login issues\n• How to report a problem\n• Track complaint status' : role === 'Officer' ? '• View all complaints\n• Assign work to technicians\n• Complaint workflow' : '• View my assigned tasks\n• Update work status\n• Upload completion proof'}

**Example:** Type "${roleExample}"

What do you need help with?`;
}
