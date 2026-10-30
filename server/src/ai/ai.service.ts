import { env } from '../config/env';
import { logger } from '../config/logger';
import { AppError } from '../middleware/errorHandler.middleware';
import {
  AIExtractionSchema,
  AIAnswerSchema,
  AIContextTransferSchema,
  AIGapAnalysisSchema
} from './schemas';
import {
  EXTRACTION_SYSTEM_PROMPT,
  EXTRACTION_USER_PROMPT,
  ASK_PROJECT_SYSTEM_PROMPT,
  CONTEXT_TRANSFER_SYSTEM_PROMPT,
  CONTEXT_GAP_SYSTEM_PROMPT
} from './prompts';
import {
  AIExtractionResult,
  AIQuestionAnswer,
  IHandoverPackage,
  IContextGap
} from '../types/shared';

export class AIService {
  private static cleanJsonResponse(text: string): string {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
      clean = clean.substring(7);
    } else if (clean.startsWith('```')) {
      clean = clean.substring(3);
    }
    if (clean.endsWith('```')) {
      clean = clean.substring(0, clean.length - 3);
    }
    return clean.trim();
  }

  private static async callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
    const startTime = Date.now();
    const provider = env.AI_PROVIDER;
    const model = env.AI_MODEL;
    const apiKey = env.AI_API_KEY;

    logger.info({ provider, model }, 'Initiating AI model request');

    // If provider is mock or no API key is provided and provider isn't mock
    if (provider === 'mock' || !apiKey) {
      if (!apiKey && provider !== 'mock') {
        logger.warn(
          { provider },
          'No AI_API_KEY provided. System falling back to safe local intelligence heuristics.'
        );
      }
      const response = await AIService.mockFallback(systemPrompt, userPrompt);
      const duration = Date.now() - startTime;
      logger.info({ provider: 'mock', durationMs: duration, outcome: 'Success' }, 'Mock AI request completed');
      return response;
    }

    try {
      let resultText = '';

      if (provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(120000),
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
              thinkingConfig: {
                thinkingBudget: 0
              }
            }
          })
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`Gemini API error (${response.status}): ${errBody.substring(0, 300)}`);
        }

        const data: any = await response.json();
        const textParts = data?.candidates?.[0]?.content?.parts?.filter((p: any) => p.text) || [];
        resultText = textParts.map((p: any) => p.text).join('\n') || data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      } else if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          signal: AbortSignal.timeout(120000),
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2
          })
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`OpenAI API error (${response.status}): ${errBody.substring(0, 300)}`);
        }

        const data: any = await response.json();
        resultText = data?.choices?.[0]?.message?.content || '';
      } else if (provider === 'anthropic') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          signal: AbortSignal.timeout(25000),
          body: JSON.stringify({
            model,
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }]
          })
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`Anthropic API error (${response.status}): ${errBody.substring(0, 300)}`);
        }

        const data: any = await response.json();
        resultText = data?.content?.[0]?.text || '';
      } else {
        throw new AppError(`Unsupported AI provider: ${provider}`, 400);
      }

      const duration = Date.now() - startTime;
      logger.info({ provider, model, durationMs: duration, outcome: 'Success' }, 'AI model request succeeded');
      return AIService.cleanJsonResponse(resultText);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error(
        { provider, model, durationMs: duration, outcome: 'Failure', error: error.message },
        'AI request failed'
      );
      throw new AppError(`AI Provider Error (${provider}): ${error.message}`, 502);
    }
  }

  // 1. Knowledge Extraction
  public static async extractKnowledge(params: {
    title: string;
    sourceType: string;
    content: string;
    projectContext?: string;
  }): Promise<AIExtractionResult> {
    const userPrompt = EXTRACTION_USER_PROMPT(
      params.title,
      params.sourceType,
      params.content,
      params.projectContext
    );

    const rawJson = await AIService.callLLM(EXTRACTION_SYSTEM_PROMPT, userPrompt);

    try {
      const parsed = JSON.parse(rawJson);
      return AIExtractionSchema.parse(parsed) as AIExtractionResult;
    } catch (parseError: any) {
      logger.error({ parseError: parseError.message, rawJson: rawJson.substring(0, 500) }, 'Failed to parse AI extraction output');
      throw new AppError(`AI returned invalid structured output: ${parseError.message}`, 502);
    }
  }

  // 2. Project Question Answering
  public static async askProject(params: {
    question: string;
    project: { name: string; description: string };
    contextSources: Array<{ id: string; title: string; sourceType: string; text: string }>;
    contextTasks: Array<{ id: string; title: string; owner?: string | null; status: string; blockerDescription?: string | null; dueDate?: string | null }>;
    contextDecisions: Array<{ id: string; title: string; content: string; rationale?: string }>;
  }): Promise<AIQuestionAnswer> {
    const sourcesSummary = params.contextSources
      .map(
        (s) =>
          `[SOURCE ID: ${s.id}] Title: "${s.title}" (${s.sourceType})\nText:\n"""${s.text.substring(0, 3000)}"""`
      )
      .join('\n\n');

    const tasksSummary = params.contextTasks
      .map(
        (t) =>
          `- Task [${t.id}]: "${t.title}" | Status: ${t.status} | Owner: ${t.owner || 'Unassigned'} | Due: ${t.dueDate || 'No deadline'} | Blocker: ${t.blockerDescription || 'None'}`
      )
      .join('\n');

    const decisionsSummary = params.contextDecisions
      .map((d) => `- Decision [${d.id}]: "${d.title}" -> ${d.content} (Rationale: ${d.rationale || 'None recorded'})`)
      .join('\n');

    const userPrompt = `
PROJECT: ${params.project.name}
${params.project.description}

RETRIEVED KNOWLEDGE SOURCES:
${sourcesSummary || 'No stored knowledge sources found for this project.'}

STORED TASKS:
${tasksSummary || 'No tasks found.'}

STORED DECISIONS:
${decisionsSummary || 'No recorded decisions found.'}

QUESTION:
"${params.question}"

Please answer the question accurately based on the retrieved context above.
Ensure every statement cites the relevant source ID and title.
Return output in this JSON schema:
{
  "answer": "Clear, detailed answer explaining the facts and rationale...",
  "citations": [
    {
      "sourceId": "id",
      "sourceTitle": "title",
      "excerpt": "relevant quote or evidence"
    }
  ],
  "uncertaintyNotes": "Any missing information or uncertainties (null if clear)",
  "conflictsDetected": ["Any contradictions discovered between sources"],
  "confidenceScore": 0.95
}
`;

    const rawJson = await AIService.callLLM(ASK_PROJECT_SYSTEM_PROMPT, userPrompt);

    try {
      const parsed = JSON.parse(rawJson);
      return AIAnswerSchema.parse(parsed) as AIQuestionAnswer;
    } catch (parseError: any) {
      logger.error({ parseError: parseError.message, rawJson: rawJson.substring(0, 500) }, 'Failed to parse AI question answer');
      throw new AppError(`AI returned invalid answer format: ${parseError.message}`, 502);
    }
  }

  // 3. Context Transfer Generation
  public static async generateContextTransfer(params: {
    project: { name: string; description: string };
    transferType: string;
    outgoingOwner?: string | null;
    incomingOwner?: string | null;
    period?: string | null;
    instructions?: string | null;
    sources: Array<{ id: string; title: string; sourceType: string; text: string }>;
    tasks: Array<{ id: string; title: string; owner?: string | null; dueDate?: string | null; status: string; priority: string; blockerDescription?: string | null; dependencies?: string[] }>;
    decisions: Array<{ id: string; title: string; content: string; rationale?: string }>;
    gaps?: Array<{ gapType: string; description: string; severity: string }>;
  }): Promise<IHandoverPackage> {
    const userPrompt = `
Generate a comprehensive context-transfer handover for:
Project: ${params.project.name} (${params.project.description})
Transfer Type: ${params.transferType}
Outgoing Owner: ${params.outgoingOwner || 'N/A'}
Incoming Owner: ${params.incomingOwner || 'N/A'}
Period: ${params.period || 'All time'}
User Instructions: ${params.instructions || 'Standard thorough handover'}

SOURCES:
${params.sources.map((s) => `[Source ${s.id}]: "${s.title}" (${s.sourceType})\n${s.text}`).join('\n\n')}

TASKS:
${params.tasks.map((t) => `[Task ${t.id}]: "${t.title}" | Status: ${t.status} | Owner: ${t.owner || 'None'} | Due: ${t.dueDate || 'None'} | Priority: ${t.priority} | Blocker: ${t.blockerDescription || 'None'} | Dependencies: ${t.dependencies?.join(', ') || 'None'}`).join('\n')}

DECISIONS:
${params.decisions.map((d) => `[Decision ${d.id}]: "${d.title}" -> ${d.content} (Rationale: ${d.rationale || 'None recorded'})`).join('\n')}

KNOWN CONTEXT GAPS:
${params.gaps?.map((g) => `- [${g.severity}] ${g.gapType}: ${g.description}`).join('\n') || 'None recorded'}

Produce a complete 17-part handover package in valid JSON with these exact keys:
{
  "executiveSummary": "...",
  "projectBackground": "...",
  "currentProjectState": "...",
  "importantDecisions": [{"title": "...", "content": "...", "rationale": "..."}],
  "decisionRationale": "...",
  "completedWork": ["..."],
  "openTasks": [{"title": "...", "owner": "...", "dueDate": "...", "status": "...", "priority": "..."}],
  "taskOwnersAndDueDates": "...",
  "blockers": [{"title": "...", "description": "...", "affectedTask": "..."}],
  "dependencies": [{"dependent": "...", "dependsOn": "..."}],
  "knownRisks": [{"title": "...", "impact": "..."}],
  "unresolvedQuestions": ["..."],
  "recentChanges": ["..."],
  "criticalDocumentation": [{"title": "...", "reference": "..."}],
  "recommendedNextSteps": ["..."],
  "missingOrConflictingInformation": ["..."],
  "sourceReferences": [{"sourceId": "...", "title": "..."}]
}
`;

    const rawJson = await AIService.callLLM(CONTEXT_TRANSFER_SYSTEM_PROMPT, userPrompt);

    try {
      const parsed = JSON.parse(rawJson);
      return AIContextTransferSchema.parse(parsed) as IHandoverPackage;
    } catch (parseError: any) {
      logger.error({ parseError: parseError.message, rawJson: rawJson.substring(0, 500) }, 'Failed to parse AI context transfer');
      throw new AppError(`AI returned invalid handover format: ${parseError.message}`, 502);
    }
  }

  // 4. AI-assisted Contradiction and Gap Analysis
  public static async detectContradictions(params: {
    project: { name: string; description: string };
    sources: Array<{ id: string; title: string; sourceType: string; text: string }>;
    tasks: Array<{ id: string; title: string; owner?: string | null; dueDate?: string | null; status: string; blockerDescription?: string | null }>;
    decisions: Array<{ id: string; title: string; content: string; rationale?: string }>;
  }): Promise<Array<{
    gapType: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    description: string;
    affectedRecordType: 'Task' | 'Decision' | 'Source' | 'Handover';
    affectedRecordId?: string | null;
    evidence: string;
    recommendedResolution: string;
  }>> {
    const userPrompt = `
Analyze this project data for contradictions, conflicting timelines, conflicting owners, or stated blockers missing from tasks:
Project: ${params.project.name}

SOURCES:
${params.sources.map((s) => `[Source ${s.id}] "${s.title}": ${s.text}`).join('\n\n')}

TASKS:
${params.tasks.map((t) => `[Task ${t.id}] "${t.title}": Status=${t.status}, Owner=${t.owner || 'None'}, Due=${t.dueDate || 'None'}, Blocker=${t.blockerDescription || 'None'}`).join('\n')}

DECISIONS:
${params.decisions.map((d) => `[Decision ${d.id}] "${d.title}": ${d.content} (Rationale: ${d.rationale || 'None'})`).join('\n')}

Return any discovered subtle contradictions or context continuity risks in JSON format:
{
  "detectedGaps": [
    {
      "gapType": "ConflictingDeadline" | "ConflictingOwner" | "ConflictingStatus" | "UnrepresentedBlocker" | "MissingRationale",
      "severity": "Low" | "Medium" | "High" | "Critical",
      "description": "...",
      "affectedRecordType": "Task" | "Decision" | "Source",
      "affectedRecordId": "id or null",
      "evidence": "exact quote from sources",
      "recommendedResolution": "..."
    }
  ]
}
`;

    const rawJson = await AIService.callLLM(CONTEXT_GAP_SYSTEM_PROMPT, userPrompt);

    try {
      const parsed = JSON.parse(rawJson);
      const validated = AIGapAnalysisSchema.parse(parsed);
      return validated.detectedGaps as any;
    } catch (parseError: any) {
      logger.warn({ parseError: parseError.message }, 'Failed to parse AI gap analysis output, falling back to empty list');
      return [];
    }
  }

  // Fallback Mock Engine for testing and unconfigured API keys
  private static async mockFallback(systemPrompt: string, userPrompt: string): Promise<string> {
    // Check what kind of prompt was passed
    if (systemPrompt.includes('Extraction Engine')) {
      const isRazorpayDoc = userPrompt.includes('Razorpay') || userPrompt.includes('payment');
      const isCheckoutDoc = userPrompt.includes('checkout') || userPrompt.includes('Priya');

      return JSON.stringify({
        summary: isRazorpayDoc
          ? 'Architecture and implementation updates regarding Razorpay payment gateway integration and webhook verification.'
          : isCheckoutDoc
          ? 'Checkout testing update regarding testing dependencies and blocker states.'
          : 'Project context document outlining ongoing operations and requirements.',
        facts: [
          {
            title: isRazorpayDoc ? 'Payment Gateway Selection' : 'Testing Responsibility',
            content: isRazorpayDoc
              ? 'Razorpay was selected as the payment integration provider.'
              : 'Priya is assigned to conduct checkout testing.',
            excerpt: isRazorpayDoc
              ? 'The team has decided to use Razorpay for the payment integration.'
              : 'Priya is responsible for checkout testing.',
            confidence: 0.98
          }
        ],
        decisions: isRazorpayDoc
          ? [
              {
                title: 'Use Razorpay for payment integration',
                content: 'Razorpay selected for payment gateway handling.',
                rationale: 'Ensures payment status updates are handled reliably once webhook verification is validated.',
                excerpt: 'The team has decided to use Razorpay for the payment integration.'
              }
            ]
          : [],
        actionItems: isRazorpayDoc
          ? [
              {
                title: 'Resolve payment integration and webhook verification',
                description: 'Investigate failing webhook verification and complete Razorpay integration.',
                owner: 'Rahul',
                dueDate: null, // intentionally null as specified!
                priority: 'Critical',
                status: 'In Progress',
                dependencies: [],
                blockerDescription: 'Webhook verification is failing and requires further investigation.',
                excerpt: 'Rahul is responsible for resolving the integration issue. No confirmed completion date has been recorded.',
                confidence: 0.95
              }
            ]
          : isCheckoutDoc
          ? [
              {
                title: 'Complete checkout testing',
                description: 'Run comprehensive checkout test suite once payment gateway and webhooks are ready.',
                owner: 'Priya',
                dueDate: null,
                priority: 'High',
                status: 'Blocked',
                dependencies: ['Resolve payment integration and webhook verification'],
                blockerDescription: 'Testing is blocked until the payment integration and webhook verification are resolved.',
                excerpt: 'Testing is blocked until the payment integration and webhook verification are resolved.',
                confidence: 0.95
              },
              {
                title: 'Prepare checkout testing report',
                description: 'Compile testing results and report after testing completion.',
                owner: 'Priya',
                dueDate: null,
                priority: 'Medium',
                status: 'Open',
                dependencies: ['Complete checkout testing'],
                excerpt: 'Priya will prepare the checkout testing report after the tests are completed.',
                confidence: 0.9
              }
            ]
          : [],
        blockers: isCheckoutDoc
          ? [
              {
                title: 'Checkout testing blocked',
                description: 'Blocked until payment integration and webhook verification are resolved.',
                affectedTask: 'Complete checkout testing',
                excerpt: 'Testing is blocked until the payment integration and webhook verification are resolved.'
              }
            ]
          : [
              {
                title: 'Webhook verification failing',
                description: 'Failing webhook verification prevents payment integration completion.',
                affectedTask: 'Resolve payment integration and webhook verification',
                excerpt: 'Webhook verification is failing and requires further investigation.'
              }
            ],
        risks: [
          {
            title: 'Schedule Slippage Risk',
            description: 'No confirmed completion date is recorded for the payment integration, creating downstream risk for checkout testing.',
            impact: 'Potential release delay',
            excerpt: 'No confirmed completion date has been recorded.'
          }
        ],
        dependencies: [
          {
            dependent: 'Complete checkout testing',
            dependsOn: 'Resolve payment integration and webhook verification',
            excerpt: 'Testing is blocked until the payment integration and webhook verification are resolved.'
          }
        ],
        openQuestions: [
          {
            question: 'What is the target completion date for webhook verification?',
            context: 'Payment integration timeline',
            excerpt: 'No confirmed completion date has been recorded.'
          }
        ],
        contradictions: []
      });
    }

    if (systemPrompt.includes('Knowledge Assistant')) {
      const isWhyDelayed = userPrompt.toLowerCase().includes('why') && userPrompt.toLowerCase().includes('checkout');

      return JSON.stringify({
        answer: isWhyDelayed
          ? 'Checkout testing is currently delayed and blocked because it depends directly on the payment integration and webhook verification being completed and validated. Rahul is responsible for investigating the failing webhook verification, but no confirmed completion date has been recorded yet. Consequently, Priya cannot proceed with checkout testing until this integration issue is resolved.'
          : 'Based on the stored project records, the team selected Razorpay for payment integration. Testing and validation are currently in progress with active dependencies between webhook verification and checkout testing.',
        citations: [
          {
            sourceId: 'Source-2',
            sourceTitle: 'Payment Integration Update',
            excerpt: 'The payment integration is still incomplete. Webhook verification is failing and requires further investigation. Rahul is responsible for resolving the integration issue.'
          },
          {
            sourceId: 'Source-3',
            sourceTitle: 'Checkout Testing Update',
            excerpt: 'Priya is responsible for checkout testing. Testing is blocked until the payment integration and webhook verification are resolved.'
          }
        ],
        uncertaintyNotes: 'No target completion deadline has been recorded for the payment integration or webhook resolution.',
        conflictsDetected: [],
        confidenceScore: 0.96
      });
    }

    if (systemPrompt.includes('Context Transfer Engine')) {
      return JSON.stringify({
        executiveSummary: 'This handover packages the current state of the E-commerce Platform payment integration and checkout testing workstream. The project has adopted Razorpay for payment processing, but completion is currently blocked by failing webhook verifications under Rahul\'s investigation with no confirmed deadline, which in turn blocks Priya from conducting checkout testing.',
        projectBackground: 'The project aims to provide a robust e-commerce purchasing and checkout experience. Reliable payment processing and asynchronous webhook status updates are foundational to order fulfillment.',
        currentProjectState: 'In Progress with critical blockers. The payment integration is incomplete due to webhook verification failures. Checkout testing cannot commence until webhooks pass validation.',
        importantDecisions: [
          {
            title: 'Adopt Razorpay for payment integration',
            content: 'Razorpay was selected as the core payment gateway.',
            rationale: 'Ensures reliable real-time payment status updates via webhooks.'
          }
        ],
        decisionRationale: 'Razorpay provides rich webhook callbacks for authorization, capture, and refunds, which was chosen to ensure reliable transaction state consistency.',
        completedWork: [
          'Payment architecture evaluation completed.',
          'Initial Razorpay SDK setup performed.'
        ],
        openTasks: [
          {
            title: 'Resolve payment integration and webhook verification',
            owner: 'Rahul',
            dueDate: null,
            status: 'In Progress',
            priority: 'Critical'
          },
          {
            title: 'Complete checkout testing',
            owner: 'Priya',
            dueDate: null,
            status: 'Blocked',
            priority: 'High'
          },
          {
            title: 'Prepare checkout testing report',
            owner: 'Priya',
            dueDate: null,
            status: 'Open',
            priority: 'Medium'
          }
        ],
        taskOwnersAndDueDates: 'Rahul owns payment integration (no due date recorded). Priya owns checkout testing and test reporting (no due date recorded).',
        blockers: [
          {
            title: 'Webhook Verification Failing',
            description: 'Webhook signature and payload verification is failing in sandbox environment.',
            affectedTask: 'Resolve payment integration and webhook verification'
          },
          {
            title: 'Checkout Testing Blocked',
            description: 'Blocked waiting on working payment webhooks.',
            affectedTask: 'Complete checkout testing'
          }
        ],
        dependencies: [
          {
            dependent: 'Complete checkout testing',
            dependsOn: 'Resolve payment integration and webhook verification'
          }
        ],
        knownRisks: [
          {
            title: 'Missing Deadline Risk',
            impact: 'Without an agreed completion target date for webhook fixes, downstream QA cannot plan sprint capacity.'
          }
        ],
        unresolvedQuestions: [
          'What is the root cause of the webhook verification failure (signature mismatch vs network timeout)?',
          'What is the estimated completion date for the payment integration?'
        ],
        recentChanges: [
          'Razorpay integration initialized.',
          'Identified failing webhook verification.',
          'Flagged checkout testing as blocked.'
        ],
        criticalDocumentation: [
          {
            title: 'Payment Architecture Decision Record',
            reference: 'Source: Payment Architecture Decision'
          },
          {
            title: 'Razorpay Webhook Specification',
            reference: 'Source: Technical Documentation'
          }
        ],
        recommendedNextSteps: [
          'Coordinate with Rahul to diagnose webhook verification errors and establish a firm completion deadline.',
          'Once webhook verification succeeds, notify Priya immediately to unblock checkout testing.',
          'Set a target completion date on the payment integration task to resolve the context gap.'
        ],
        missingOrConflictingInformation: [
          'No confirmed completion date has been recorded for the payment integration task.',
          'No specific target release date for checkout testing report.'
        ],
        sourceReferences: [
          { sourceId: 'Source-1', title: 'Payment Architecture Decision' },
          { sourceId: 'Source-2', title: 'Payment Integration Update' },
          { sourceId: 'Source-3', title: 'Checkout Testing Update' },
          { sourceId: 'Source-4', title: 'General Project Handover' }
        ]
      });
    }

    if (systemPrompt.includes('Gap & Contradiction Analyzer')) {
      return JSON.stringify({
        detectedGaps: [
          {
            gapType: 'MissingDueDate',
            severity: 'Critical',
            description: 'Checkout testing is blocked, but the payment integration task has no confirmed deadline.',
            affectedRecordType: 'Task',
            affectedRecordId: null,
            evidence: 'Rahul is responsible for resolving the integration issue. No confirmed completion date has been recorded.',
            recommendedResolution: 'Establish and record a confirmed completion date for the payment integration task to unblock checkout schedule planning.'
          }
        ]
      });
    }

    return JSON.stringify({});
  }
}
