# Database Migration: Consolidate Duplicate Reports

This script analyzes all existing reports in the database and merges duplicates using the same logic as the report submission endpoint.

## Prerequisites

- Ensure `tsx` is installed: `npm install -D tsx`
- Have Supabase credentials configured in `.env.local`

## Usage

### Step 1: Dry Run (Recommended First)

Run the migration in dry-run mode to see what would be changed without actually modifying the database:

```bash
npm run migrate:dry-run
```

This will:
- Fetch all canonical reports
- Identify duplicates using location and description similarity
- Print a summary of what would be merged
- **NO DATABASE CHANGES WILL BE MADE**

### Step 2: Execute Migration

Once you've reviewed the dry-run results and are satisfied, execute the actual migration:

```bash
npm run migrate:execute
```

This will:
- Perform the same analysis as the dry run
- Create `report_evidence` records for each duplicate submission
- Update parent reports with new counts and priorities
- Delete duplicate report records
- **THIS WILL MODIFY YOUR DATABASE**

## What the Script Does

1. **Fetches all canonical reports** (where `parent_report_id IS NULL`)

2. **Groups reports by category** for efficient processing
   - Sanitation-related categories are grouped together
   - Other categories are processed individually

3. **Detects duplicates** using:
   - Location proximity (within configured distance threshold)
   - Category matching
   - Description similarity using Levenshtein distance

4. **Merges duplicates** by:
   - Creating evidence records with original submission details
   - Updating parent report's `report_count` and `priority`
   - Removing duplicate report entries

## Example Output

```
================================================================================
DUPLICATE REPORT CONSOLIDATION SCRIPT
================================================================================
Mode: DRY RUN (no changes will be made)

[STEP 1] Fetching all canonical reports...
Found 45 canonical reports

[STEP 2] Grouping reports by category...
Grouped into 6 categories
  - SANITATION_GROUP: 12 reports
  - pothole: 15 reports
  - streetlight: 8 reports
  - water_leak: 6 reports
  - graffiti: 3 reports
  - other: 1 reports

[STEP 3] Finding and merging duplicates...

Processing category: SANITATION_GROUP (12 reports)
  Found 2 duplicate(s) for report ABC123
    - Merging DEF456 into ABC123
      New count: 3, Priority: medium

================================================================================
SUMMARY
================================================================================
Total duplicates found: 8
Total merge actions: 8

[DRY RUN] No changes made to database.
Run with --execute to execute actual merges.

Merge actions that would be executed:
  1. DEF456 → ABC123 (count: 3, priority: medium)
  2. GHI789 → ABC123 (count: 4, priority: high)
  ...
```

## Important Notes

- **Backup your database** before running the live migration
- The script processes reports chronologically (oldest first becomes the parent)
- Duplicate detection uses the same thresholds as the live submission endpoint
- Evidence records preserve all original submission data
- User submissions remain visible in "My Reports" through the evidence table

## Troubleshooting

If you encounter errors:

1. **"tsx: command not found"**
   ```bash
   npm install -D tsx
   ```

2. **Supabase connection errors**
   - Check `.env.local` has correct credentials
   - Verify Supabase project is accessible

3. **Script fails mid-migration**
   - Check console output for specific error
   - Database transactions are not used, so partial merges may occur
   - Re-run the script (it will skip already processed duplicates)

## Rollback

There is no automatic rollback. If you need to undo changes:

1. Restore from database backup
2. Or manually recreate duplicate reports from the `report_evidence` table
