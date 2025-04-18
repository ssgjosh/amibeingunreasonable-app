// Defines keywords associated with specific domains for RAG triggering.
// Rule: If >= 2 keywords from a domain's list are found in the user's input (context + query),
// that domain is considered detected for snippet retrieval.

export const domainKeywords: Record<string, string[]> = {
  parenting: [
    'parent', 'child', 'baby', 'toddler', 'teenager', 'family', 'discipline',
    'kid', 'son', 'daughter', 'newborn', 'behaviour', 'safety', 'nspcc',
    'parental responsibility', 'leave', 'maternity', 'paternity'
  ],
  tenancy: [
    'landlord', 'tenant', 'rent', 'lease', 'repair', 'deposit', 'eviction',
    'property', 'flatmate', 'housemate', 'lodger', 'housing', 'shelter',
    'citizens advice', 'notice', 'moneyhelper', 'payments', 'home'
  ],
  workplace: [
    'boss', 'colleague', 'job', 'manager', 'hr', 'grievance', 'work',
    'employment', 'contract', 'employer', 'employee', 'office', 'acas',
    'disciplinary', 'procedure', 'hse', 'stress', 'ico', 'gdpr'
  ],
  consumer: [
    'product', 'service', 'refund', 'faulty', 'goods', 'purchase', 'consumer',
    'rights', 'contract', 'shop', 'store', 'tv', 'debt', 'money', 'bought',
    'citizens advice', 'moneyhelper', 'budgeting', 'unfair terms', 'cma',
    'stepchange', 'dmp', 'national debtline', 'priority debts'
  ],
  health: [
    'doctor', 'nhs', 'hospital', 'mental health', 'anxiety', 'depression',
    'stress', 'wellbeing', 'illness', 'treatment', 'gp', 'health', 'mind',
    'samaritans', 'cqc', 'rights'
  ],
  equality: [
    'discrimination', 'equality', 'rights', 'disability', 'race', 'gender',
    'religion', 'fairness', 'adjustments', 'equal', 'scope', 'acas',
    'equality act', 'disabled person', 'reasonable adjustments'
  ]
};

// Generate a set of all unique domain names from the keywords object
export const approvedDomainSet = new Set(Object.keys(domainKeywords));

// Type representing the allowed domain strings
export type ApprovedDomain = keyof typeof domainKeywords;