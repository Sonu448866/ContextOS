export type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Archived';

export interface IProject {
  _id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  members: string[];
  startDate?: string | null;
  targetDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type KnowledgeSourceType =
  | 'Meeting Notes'
  | 'Project Update'
  | 'Technical Documentation'
  | 'Decision'
  | 'Handover'
  | 'General Note'
  | 'Imported Document';

export type ProcessingStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Needs Review';
export type ExtractionStatus = 'Pending' | 'Completed' | 'Failed' | 'Needs Review' | 'Skipped';

export interface IFileMetadata {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
}

export interface IKnowledgeSource {
  _id: string;
  projectId: string;
  title: string;
  sourceType: KnowledgeSourceType;
  originalText: string;
  fileMetadata?: IFileMetadata | null;
  tags: string[];
  author?: string | null;
  processingStatus: ProcessingStatus;
  extractionStatus: ExtractionStatus;
  extractionError?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type KnowledgeRecordType = 'Fact' | 'Decision' | 'Risk' | 'Blocker' | 'Question' | 'Contradiction';

export interface IKnowledgeRecord {
  _id: string;
  projectId: string;
  sourceId: string;
  recordType: KnowledgeRecordType;
  title: string;
  content: string;
  structuredData?: Record<string, any>;
  evidence?: string;
  confidence?: number;
  reviewStatus: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  updatedAt: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskStatus = 'Open' | 'In Progress' | 'Blocked' | 'Completed' | 'Cancelled';

export interface ISourceReference {
  sourceId: string;
  title: string;
  excerpt?: string;
}

export interface ITask {
  _id: string;
  projectId: string;
  title: string;
  description?: string;
  owner?: string | null;
  dueDate?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dependencies: string[];
  blockerDescription?: string | null;
  sourceReferences: ISourceReference[];
  relatedDecisionIds: string[];
  carriedForwardFromId?: string | null;
  carriedForwardCount: number;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TaskEventType =
  | 'Created'
  | 'OwnerAssigned'
  | 'OwnerChanged'
  | 'DueDateChanged'
  | 'StatusChanged'
  | 'BlockerAdded'
  | 'BlockerResolved'
  | 'Completed'
  | 'Reopened'
  | 'CarriedForward'
  | 'Edited';

export interface ITaskHistory {
  _id: string;
  taskId: string;
  projectId: string;
  eventType: TaskEventType;
  previousValue?: string | null;
  newValue?: string | null;
  actor?: string | null;
  sourceId?: string | null;
  contextTransferId?: string | null;
  requestId?: string | null;
  createdAt: string;
}

export type TransferType =
  | 'Full Project'
  | 'Workstream'
  | 'Task Set'
  | 'Role Handover'
  | 'New Member Onboarding'
  | 'Meeting Catchup';

export interface IHandoverPackage {
  executiveSummary: string;
  projectBackground: string;
  currentProjectState: string;
  importantDecisions: Array<{ title: string; content: string; rationale?: string }>;
  decisionRationale: string;
  completedWork: string[];
  openTasks: Array<{ title: string; owner?: string | null; dueDate?: string | null; status: string; priority: string }>;
  taskOwnersAndDueDates: string;
  blockers: Array<{ title: string; description: string; affectedTask?: string }>;
  dependencies: Array<{ dependent: string; dependsOn: string }>;
  knownRisks: Array<{ title: string; impact?: string }>;
  unresolvedQuestions: string[];
  recentChanges: string[];
  criticalDocumentation: Array<{ title: string; reference?: string }>;
  recommendedNextSteps: string[];
  missingOrConflictingInformation: string[];
  sourceReferences: Array<{ sourceId: string; title: string }>;
  rawMarkdown?: string;
}

export interface IContextTransfer {
  _id: string;
  projectId: string;
  transferType: TransferType;
  outgoingOwner?: string | null;
  incomingOwner?: string | null;
  period?: string | null;
  instructions?: string | null;
  selectedSourceIds: string[];
  selectedTaskIds: string[];
  generatedContent: IHandoverPackage;
  sourceReferences: ISourceReference[];
  generationStatus: 'Pending' | 'Completed' | 'Failed';
  createdAt: string;
  updatedAt: string;
}

export type GapType =
  | 'MissingOwner'
  | 'MissingDueDate'
  | 'BlockedWithoutReason'
  | 'StaleTask'
  | 'UnresolvedDependency'
  | 'MissingRationale'
  | 'ConflictingDeadline'
  | 'ConflictingOwner'
  | 'ConflictingStatus'
  | 'OmittedOpenTask'
  | 'OmittedHandoverInfo'
  | 'UnrepresentedBlocker';

export type GapSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type GapStatus = 'Open' | 'Acknowledged' | 'Resolved' | 'Dismissed';
export type DetectionMethod = 'Deterministic' | 'AI-Assisted';

export interface IContextGap {
  _id: string;
  projectId: string;
  gapType: GapType;
  severity: GapSeverity;
  description: string;
  affectedRecordType: 'Task' | 'Decision' | 'Source' | 'Handover';
  affectedRecordId?: string | null;
  evidence: string;
  recommendedResolution: string;
  detectionMethod: DetectionMethod;
  status: GapStatus;
  detectedAt: string;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ActivityEventType =
  | 'ProjectCreated'
  | 'ProjectUpdated'
  | 'KnowledgeAdded'
  | 'FileParsed'
  | 'AIExtractionStarted'
  | 'AIExtractionCompleted'
  | 'AIExtractionFailed'
  | 'TaskCreated'
  | 'TaskReassigned'
  | 'TaskStatusChanged'
  | 'TaskCompleted'
  | 'TaskCarriedForward'
  | 'ContextTransferGenerated'
  | 'ContextGapDetected'
  | 'ContextGapResolved'
  | 'ContextGapDismissed';

export interface IActivityEvent {
  _id: string;
  projectId?: string | null;
  eventType: ActivityEventType;
  entityType: string;
  entityId?: string | null;
  message: string;
  metadata?: Record<string, any>;
  requestId?: string | null;
  outcome: 'Success' | 'Failure' | 'Warning';
  actor?: string;
  createdAt: string;
}

export interface AIExtractionResult {
  summary: string;
  facts: Array<{ title: string; content: string; excerpt?: string; confidence?: number }>;
  decisions: Array<{ title: string; content: string; rationale?: string; excerpt?: string }>;
  actionItems: Array<{
    title: string;
    description?: string;
    owner?: string | null;
    dueDate?: string | null;
    priority?: TaskPriority;
    status?: 'Open' | 'In Progress' | 'Blocked';
    dependencies?: string[];
    blockerDescription?: string;
    excerpt?: string;
    confidence?: number;
  }>;
  blockers: Array<{ title: string; description: string; affectedTask?: string; excerpt?: string }>;
  risks: Array<{ title: string; description: string; impact?: string; excerpt?: string }>;
  dependencies: Array<{ dependent: string; dependsOn: string; excerpt?: string }>;
  openQuestions: Array<{ question: string; context?: string; excerpt?: string }>;
  contradictions: Array<{ issue: string; sourceA?: string; sourceB?: string; explanation: string }>;
}

export interface AIQuestionAnswer {
  answer: string;
  citations: Array<{ sourceId: string; sourceTitle: string; excerpt: string }>;
  uncertaintyNotes?: string | null;
  conflictsDetected?: string[];
  confidenceScore?: number;
}

export interface DashboardSummary {
  totalActiveProjects: number;
  totalKnowledgeSources: number;
  openTasks: number;
  overdueTasks: number;
  blockedTasks: number;
  tasksMissingOwners: number;
  criticalContextGaps: number;
  projectHealth: {
    status: 'Healthy' | 'At Risk' | 'Critical';
    score: number;
    summary: string;
  };
  recentActivity: IActivityEvent[];
  recentKnowledge: IKnowledgeSource[];
  upcomingDeadlines: ITask[];
  criticalGaps: IContextGap[];
}
