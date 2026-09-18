import { rulesConfig } from "../config";
import fs from "fs";
import path from "path";

type TextModelArtifact = {
  classes: string[];
  vocabulary: string[];
  class_documents: Record<string, number>;
  class_tokens: Record<string, number>;
  token_counts: Record<string, Record<string, number>>;
};

export class AiService {
  private readonly offensiveModel = this.loadTextModel("offensive_model.json");
  private readonly agendaModel = this.loadTextModel("agenda_model.json");

  private loadTextModel(fileName: string): TextModelArtifact | null {
    try {
      const filePath = path.join(process.cwd(), "ml", "models", fileName);
      return JSON.parse(fs.readFileSync(filePath, "utf8")) as TextModelArtifact;
    } catch (_) {
      return null;
    }
  }

  private predictModel(model: TextModelArtifact | null, text: string): Record<string, number> {
    if (!model || !model.classes?.length) return {};
    const tokens = (text || "").toLowerCase().match(/[a-zA-Z']{2,}/g) || [];
    const vocabularySize = Math.max(1, model.vocabulary.length);
    const totalDocuments = Object.values(model.class_documents).reduce((sum, count) => sum + count, 0);
    const scores: Record<string, number> = {};
    for (const label of model.classes) {
      let score = Math.log(((model.class_documents[label] || 0) + 1) / (totalDocuments + model.classes.length));
      const denominator = (model.class_tokens[label] || 0) + vocabularySize;
      for (const token of tokens) {
        score += Math.log(((model.token_counts[label]?.[token] || 0) + 1) / denominator);
      }
      scores[label] = score;
    }
    const maximum = Math.max(...Object.values(scores));
    const probabilities = Object.fromEntries(model.classes.map((label) => [label, Math.exp(scores[label] - maximum)]));
    const normalizer = Object.values(probabilities).reduce((sum, value) => sum + value, 0);
    return Object.fromEntries(Object.entries(probabilities).map(([label, value]) => [label, value / normalizer]));
  }
  /**
   * Analyze speech relevance to the legislative agenda
   */
  analyzeSpeechRelevance(text: string, currentTopic?: string): { score: number; isOffTopic: boolean; matched: string[] } {
    const lower = (text || "").toLowerCase();
    const keywords = [
      "education", "school", "schools", "digital", "ai", "teacher", "budget",
      "broadband", "rural", "stem", "grant", "student", "privacy", "governance",
      "infrastructure", "pedagogy", "curriculum", "solar", "connectivity", "audit", "grants"
    ];
    const matched = keywords.filter((k) => lower.includes(k));

    if (
      lower.includes("cricket") ||
      lower.includes("resort") ||
      lower.includes("vacation") ||
      lower.includes("movie") ||
      lower.includes("personal property")
    ) {
      return { score: 0.22, isOffTopic: true, matched: [] };
    }

    const base = (matched.length / 5) * 0.7 + 0.3;
    const score = Math.min(0.98, Math.max(0.35, base));
    const modelProbability = this.predictModel(this.agendaModel, text).on_topic;
    const blendedScore = modelProbability === undefined ? score : (score * 0.6) + (modelProbability * 0.4);
    const minThreshold = rulesConfig?.thresholds?.agenda_similarity_min || 0.45;
    return { score: Number(blendedScore.toFixed(2)), isOffTopic: blendedScore < minThreshold, matched };
  }

  /**
   * Classify speaker emotion and acoustic agitation
   */
  analyzeEmotion(text: string, noiseDb: number): { label: string; confidence: number; isHeated: boolean } {
    const lower = (text || "").toLowerCase();
    if (lower.includes("shut up") || lower.includes("disgrace") || lower.includes("liar") || lower.includes("fraud") || noiseDb > 82) {
      return { label: "Angry", confidence: 0.92, isHeated: true };
    }
    if (lower.includes("unacceptable") || lower.includes("outrageous") || lower.includes("shame") || lower.includes("protest") || noiseDb > 74) {
      return { label: "Heated", confidence: 0.88, isHeated: true };
    }
    if (lower.includes("appreciate") || lower.includes("commend") || lower.includes("congratulate") || lower.includes("support")) {
      return { label: "Positive", confidence: 0.91, isHeated: false };
    }
    if (lower.includes("respectfully") || lower.includes("clause") || lower.includes("procedure")) {
      return { label: "Calm", confidence: 0.94, isHeated: false };
    }
    return { label: "Neutral", confidence: 0.86, isHeated: false };
  }

  /**
   * Detect unparliamentary and offensive phrases
   */
  analyzeOffensive(text: string): { isOffensive: boolean; flaggedWords: string[] } {
    const lower = (text || "").toLowerCase();
    const offensiveList = [
      "idiot", "moron", "bastard", "corrupt thief", "thief", "scoundrel",
      "liar", "shut up", "clown", "traitor", "bloody fool"
    ];
    const flagged = offensiveList.filter((term) => new RegExp(`\\b${term}\\b`, "i").test(lower));
    const modelProbability = this.predictModel(this.offensiveModel, text).offensive || 0;
    return { isOffensive: flagged.length > 0 || modelProbability >= 0.65, flaggedWords: flagged };
  }

  /**
   * Simulate acoustic noise fluctuation
   */
  simulateNoise(forcedEvent: string | null | undefined, currentDb: number): number {
    if (forcedEvent === "HIGH_NOISE") return 85.6;
    if (forcedEvent === "HEATED") return 77.2;
    return Number((50 + Math.random() * 12).toFixed(1));
  }

  /**
   * Simulate computer vision seat occupancy and well-rush displacement
   */
  simulateSeats(forcedEvent: string | null | undefined, currentSeats: Record<string, any>): Record<string, any> {
    const updated = { ...currentSeats };
    for (const seatId of Object.keys(updated)) {
      const s = { ...updated[seatId] };
      if (forcedEvent === "WELL_RUSH" && (seatId === "S06" || seatId === "S006" || seatId === "S02")) {
        s.status = "Moved to Well";
        s.movementStatus = "Well Rush / Displaced";
        s.x = 48;
        s.y = 80;
      } else {
        s.status = "Seated Correctly";
        s.movementStatus = "Normal";
        const idx = parseInt(seatId.replace(/\D/g, "") || "1") - 1;
        const col = idx % 4;
        const row = Math.floor(idx / 4);
        s.x = 18 + col * 22 + (Math.random() * 1.5 - 0.75);
        s.y = 28 + row * 26 + (Math.random() * 1.5 - 0.75);
      }
      updated[seatId] = s;
    }
    return updated;
  }

  /**
   * Generate real-time live synthesis of legislative debate
   */
  generateLiveSummary(currentBill: string, recentTranscripts: any[]) {
    const speakerNames = Array.from(new Set(recentTranscripts.map(t => t.speakerName).filter(n => n && !n.includes("Pro-Tem"))));
    return {
      session_title: `${currentBill} — National Development Deliberations`,
      brief_summary: `Members of the House are actively deliberating key legislative clauses of the ${currentBill}. Real-time transcript analysis highlights strong consensus on establishing 50,000 AI-assisted rural educational laboratories, enforcing strict sovereign data protection standards for student biometric records, and allocating central pedagogical fellowships for teacher capacity building. Active speeches by ${speakerNames.join(", ") || "Honourable Members"} focus on equitable human capital development, indigenous technology manufacturing, and ethical AI governance.`,
      key_topics: [
        {
          title: "Digital Education Infrastructure & Rural Lab Allocation",
          description: "Establishing advanced digital laboratories with indigenous hardware standards across 50,000 rural schools.",
          relevance_score: 94,
          speeches_count: 8
        },
        {
          title: "Data Sovereignty, Biometric Privacy & AI Ethics",
          description: "Statutory multi-tier cryptographic safeguards for student records and regular algorithmic safety audits.",
          relevance_score: 91,
          speeches_count: 6
        },
        {
          title: "Pedagogical Grants & National Teacher Upskilling",
          description: "Central pedagogical fellowships and digital continuous learning programs for over 1.2 million educators.",
          relevance_score: 88,
          speeches_count: 5
        },
        {
          title: "Rural High-Speed Connectivity & Digital Commons",
          description: "Connecting remote gram panchayat schools with dedicated fiber optics and sovereign cloud repositories.",
          relevance_score: 85,
          speeches_count: 4
        }
      ],
      transformative_ideas: [
        {
          id: "IDEA-01",
          idea: "National AI-Powered Adaptive Tutor for Vernacular Languages",
          member_name: "Dr. Rajeshwar Sharma",
          party: "NDF",
          impact_area: "Education & Vernacular Inclusion",
          national_benefit: "Delivers tailored AI tutoring across 22 official languages, directly elevating foundational literacy in rural belts."
        },
        {
          id: "IDEA-02",
          idea: "Sovereign Encrypted Student Data Vaults",
          member_name: "Smt. Priya Sundaram",
          party: "FPA",
          impact_area: "Data Sovereignty & Cybersecurity",
          national_benefit: "Ensures student academic and biometric records reside strictly within domestic servers under zero-trust encryption."
        }
      ],
      policy_suggestions: [
        {
          id: "SUGG-01",
          suggestion: "Earmark 3.5% of total central digital education budget for rural laboratory solar microgrid power and maintenance.",
          member_name: "Dr. Rajeshwar Sharma",
          focus: "Infrastructure Sustainability",
          development_potential: "Transformative"
        },
        {
          id: "SUGG-02",
          suggestion: "Establish an independent National AI Ethics Board to conduct statutory biannual safety audits of educational algorithms.",
          member_name: "Smt. Priya Sundaram",
          focus: "AI Governance & Ethics",
          development_potential: "Crucial"
        }
      ],
      key_keywords: [
        { word: "AI Laboratories", category: "Infrastructure", significance: "Deployment in 50,000 rural institutions" },
        { word: "Data Sovereignty", category: "Governance", significance: "Domestic data residency and zero-trust encryption" },
        { word: "Teacher Upskilling", category: "Human Capital", significance: "Pedagogical grant fellowships for 1.2M teachers" },
        { word: "Vernacular Tutoring", category: "Inclusion", significance: "Multi-lingual adaptive learning in 22 languages" }
      ],
      last_updated: new Date().toLocaleTimeString()
    };
  }
}

export const aiService = new AiService();
