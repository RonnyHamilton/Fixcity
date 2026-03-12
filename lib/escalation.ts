// ─── Escalation Utility ───────────────────────────────────────────────────────
//
// Returns the correct escalation level for a report based on its age and SLA.
// Levels:
//   0 = Ward Officer (default)
//   1 = Taluk Officer (escalated after 1× SLA hours unresolved)
//   2 = District Authority (escalated after 2× SLA hours unresolved)
//
// This function is passive — no cron job is wired yet.
// To activate: call this in a scheduled function / webhook and UPDATE reports
// SET escalation_level = getEscalationLevel(report) WHERE status != 'resolved'.
// ─────────────────────────────────────────────────────────────────────────────

export interface EscalationInput {
    created_at:       string;
    escalation_level: number;
    sla_hours:        number;
    status:           string;
}

export type EscalationLevel = 0 | 1 | 2;

export function getEscalationLevel(report: EscalationInput): EscalationLevel {
    // Resolved / rejected reports do not escalate
    if (report.status === 'resolved' || report.status === 'rejected') {
        return report.escalation_level as EscalationLevel;
    }

    const ageHours = (Date.now() - new Date(report.created_at).getTime()) / (1000 * 60 * 60);
    const sla = report.sla_hours || 72;

    if (ageHours > sla * 2) return 2;  // > 2× SLA → District Authority
    if (ageHours > sla)     return 1;  // > 1× SLA → Taluk Officer
    return 0;                           // within SLA → Ward Officer
}

export const ESCALATION_LABELS: Record<EscalationLevel, string> = {
    0: 'Ward Officer',
    1: 'Taluk Officer',
    2: 'District Authority',
};
