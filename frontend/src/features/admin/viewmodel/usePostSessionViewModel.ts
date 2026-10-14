import { useState, useEffect, useCallback, useMemo } from 'react';
import { CompleteSessionSummary } from '../../../shared/types';
import { fetchCompleteSessionSummary, fetchSessionReport } from '../../../infrastructure/api/api';

export type PostSessionSection = 'overview' | 'summary_points' | 'members' | 'topics';

export interface SubTopicItem {
  id: string;
  title: string;
  category: string;
  key_points: string[];
}

export const SUB_TOPICS_STATIC_DATA: SubTopicItem[] = [
  {
    id: "Sub-Topic 1",
    title: "Digital Classrooms & Rural Optical Fiber Infrastructure",
    category: "Digital Infrastructure",
    key_points: [
      "Broadband Grid Integration: Mandates high-speed optic fiber connectivity across all district secondary schools within the upcoming fiscal cycle.",
      "STEM Laboratory Grants: Establishes 70:30 central-state matching grants to fund interactive digital computing and science laboratories in 50,000 rural institutions.",
      "Vernacular Learning Repositories: Directs national academic councils to deploy unified digital curricular repositories accessible in 22 official regional languages.",
      "Renewable Power Backups: Mandates dedicated solar micro-grid installations with battery storage for schools with unstable regional electrical grids."
    ]
  },
  {
    id: "Sub-Topic 2",
    title: "Student Data Sovereignty, Biometric Privacy & AI Ethics",
    category: "Data Privacy & AI",
    key_points: [
      "Domestic Sovereign Cloud Storage: Enforces strict domestic data residency with zero-trust cryptographic encryption for all educational repositories.",
      "Independent Algorithmic Audits: Establishes a statutory ethics panel to conduct mandatory biannual safety and bias audits on automated tutoring systems.",
      "Prohibition on Commercial Profiling: Bars commercial EdTech providers from collecting, monetizing, or profiling student psychometric and behavioral data.",
      "Parental Consent Architecture: Mandates granular parental consent workflows and verified one-click student data erasure rights across digital tools."
    ]
  },
  {
    id: "Sub-Topic 3",
    title: "Teacher Training Grants, Pedagogical Upskilling & EdTech Fellowships",
    category: "Teacher Capacity",
    key_points: [
      "National Digital Pedagogical Fellowship: Institutes a continuous professional development framework for 1.2 million public school educators.",
      "Quarterly Educator Stipends: Allocates dedicated pedagogical grants for teachers completing accredited digital classroom leadership modules.",
      "District Technical Support Pods: Deploys mobile technical support teams to assist teachers with hardware maintenance and software troubleshooting.",
      "Peer-Led Courseware Libraries: Establishes state-level repositories where certified teachers can publish and peer-review interactive digital lesson plans."
    ]
  },
  {
    id: "Sub-Topic 4",
    title: "Domestic Hardware Manufacturing & Localized Maintenance Hubs",
    category: "Hardware Manufacturing",
    key_points: [
      "Production-Linked Incentives (PLI): Introduces targeted tariff exemptions to incentivize domestic fabrication of durable, low-power classroom tablets.",
      "Rapid District Maintenance Consortia: Establishes regional repair hubs ensuring guaranteed 48-hour hardware replacement and zero classroom downtime.",
      "Mandatory 5-Year Hardware Lifecycles: Enforces binding 5-year comprehensive hardware warranties and localized spare battery replacement guarantees.",
      "Apprenticeship Vocational Partnerships: Partners with regional polytechnic institutes to train vocational apprentices in classroom device maintenance."
    ]
  },
  {
    id: "Sub-Topic 5",
    title: "Fiscal Allocations, Transparent Auditing & Milestone Disbursals",
    category: "Fiscal Oversight",
    key_points: [
      "Direct Treasury Fund Disbursals: Directs digital treasury transfers to bypass administrative bottlenecks, expediting district project funding.",
      "Real-Time Public Expenditure Dashboard: Mandates an open online portal tracking school-by-school capital expenditures against scheduled milestones.",
      "Statutory Parliamentary Tranche Audits: Requires joint legislative committee clearance of expenditure reports prior to releasing subsequent funding tranches.",
      "Unspent Fund Recovery Mechanisms: Institutes automatic clawback provisions for municipal allocations unused after 12 consecutive months."
    ]
  }
];

export const POINT_CATEGORIES = [
  "ALL",
  "Digital Infrastructure",
  "Data Privacy & AI",
  "Teacher Capacity",
  "Hardware Manufacturing",
  "Fiscal Oversight"
];

export function usePostSessionViewModel() {
  const [summaryData, setSummaryData] = useState<CompleteSessionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [memberFilter, setMemberFilter] = useState("");
  const [activeSection, setActiveSection] = useState<PostSessionSection>("overview");
  const [pointCategoryFilter, setPointCategoryFilter] = useState("ALL");
  const [pointSearchQuery, setPointSearchQuery] = useState("");

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchCompleteSessionSummary();
      setSummaryData(data);
    } catch (err) {
      console.warn("Direct fetchCompleteSessionSummary failed, falling back to report:", err);
      try {
        const report = await fetchSessionReport();
        const fallbackSummary: CompleteSessionSummary = {
          session_information: {
            session_id: report.session_information?.session_id || "PARL-2026-8002",
            date: report.session_information?.date || new Date().toLocaleDateString(),
            start_time: report.session_information?.start_time || "10:00 AM",
            end_time: report.session_information?.end_time || new Date().toLocaleTimeString(),
            total_duration: report.session_information?.duration || "45m",
            session_type: "Regular Legislative Sitting",
            house_chamber: "Lok Sabha Chamber",
            number_of_members: report.session_statistics?.total_members_registered || 12,
            number_of_topics: 1
          },
          session_activity: {
            total_speeches: report.member_scorecards?.reduce((sum, m) => sum + (m.statistics?.speaking_turns || 0), 0) || 5,
            total_speaking_time_formatted: `${report.session_statistics?.total_speaking_time_minutes || 42}m`,
            total_speaking_time_seconds: (report.session_statistics?.total_speaking_time_minutes || 42) * 60,
            average_speaking_time_formatted: "45s",
            number_of_active_members: report.session_statistics?.total_active_speakers || 5,
            number_of_members_present: report.session_statistics?.total_members_present || 12
          },
          violation_summary: {
            total_violations: report.session_statistics?.total_alerts_issued || 0,
            low_violations: 0,
            medium_violations: 0,
            high_violations: report.session_statistics?.high_severity_alerts || 0,
            critical_violations: report.session_statistics?.critical_violations || 0,
            types_breakdown: {
              "Speaking Time Overage": report.session_statistics?.off_topic_incidents || 0,
              "Off-Topic Speech": report.session_statistics?.off_topic_incidents || 0,
              "Unparliamentary Language": report.session_statistics?.offensive_language_incidents || 0,
              "Disruptive Movement": report.session_statistics?.unauthorized_movement_incidents || 0,
              "Cross-Talk & Interruptions": 0,
              "Excessive Decibel / Noise": 0,
              "Emergency Button Activations": report.session_statistics?.emergency_activations || 0,
              "General Decorum Advisories": 0
            }
          },
          topic_wise_summary: [
            {
              topic_id: "TOPIC-01",
              title: report.session_information?.agenda_bill || "Digital Education & AI Governance Bill 2026",
              description: "Deliberation on national educational infrastructure and digital sovereignty.",
              start_time: report.session_information?.start_time || "10:00 AM",
              end_time: report.session_information?.end_time || "11:00 AM"
            }
          ],
          member_wise_summary: (report.member_scorecards || []).map((sc: any) => ({
            member_id: sc.member_id,
            name: sc.name,
            seat_id: sc.seat_id,
            mic_id: sc.mic_id || `MIC-${sc.seat_id}`,
            role: sc.role || "Member of Parliament",
            party: sc.party || "NDF",
            presence: "Present",
            speaking_time_formatted: `${Math.floor((sc.statistics?.speaking_time_seconds || 150) / 60)}:${String((sc.statistics?.speaking_time_seconds || 150) % 60).padStart(2, "0")}`,
            speaking_time_seconds: sc.statistics?.speaking_time_seconds || 150,
            speeches_count: sc.statistics?.speaking_turns || 1,
            agenda_relevance_pct: sc.categories?.agenda_relevance || 85,
            violations_count: sc.statistics?.time_violations || 0,
            warnings_count: sc.statistics?.time_violations || 0,
            seat_compliance_pct: sc.categories?.seat_compliance || 95,
            behavior_emotion: "Constructive & Calm",
            positive_marks: sc.positive_marks,
            negative_deductions: sc.negative_deductions,
            member_summary: sc.member_summary,
            speaking_score: sc.categories?.speaking_discipline || 90,
            agenda_score: sc.categories?.agenda_relevance || 85,
            discipline_score: sc.categories?.decorum_discipline || 95,
            seat_score: sc.categories?.seat_compliance || 95,
            violations_score: 95,
            final_score: sc.overall_score || 90,
            grade: sc.grade || "A (High Constructive Record)"
          })),
          member_scorecards: report.member_scorecards || [],
          timeline: [],
          generated_at: report.generated_at || new Date().toISOString()
        };
        setSummaryData(fallbackSummary);
      } catch (fallbackErr) {
        console.error("Failed to build fallback post session summary:", fallbackErr);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleExportJSON = () => {
    if (!summaryData) return;
    const blob = new Blob([JSON.stringify(summaryData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PARLIAMENTARY_REPORT_${summaryData.session_information.session_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredMembers = useMemo(() => {
    if (!summaryData) return [];
    return summaryData.member_wise_summary.filter((m) =>
      m.name.toLowerCase().includes(memberFilter.toLowerCase()) ||
      m.seat_id.toLowerCase().includes(memberFilter.toLowerCase()) ||
      m.member_id.toLowerCase().includes(memberFilter.toLowerCase()) ||
      (m.member_summary?.discussion_summary &&
        m.member_summary.discussion_summary.toLowerCase().includes(memberFilter.toLowerCase())) ||
      (m.member_summary?.policy_keywords &&
        m.member_summary.policy_keywords.some((k) => k.toLowerCase().includes(memberFilter.toLowerCase())))
    );
  }, [summaryData, memberFilter]);

  const filteredSubTopics = useMemo(() => {
    return SUB_TOPICS_STATIC_DATA.filter((item) => {
      const matchesCat = pointCategoryFilter === "ALL" || item.category === pointCategoryFilter;
      const matchesQuery =
        pointSearchQuery === "" ||
        item.title.toLowerCase().includes(pointSearchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(pointSearchQuery.toLowerCase()) ||
        item.key_points.some((p) => p.toLowerCase().includes(pointSearchQuery.toLowerCase()));
      return matchesCat && matchesQuery;
    });
  }, [pointCategoryFilter, pointSearchQuery]);

  return {
    summaryData,
    isLoading,
    memberFilter,
    setMemberFilter,
    activeSection,
    setActiveSection,
    pointCategoryFilter,
    setPointCategoryFilter,
    pointSearchQuery,
    setPointSearchQuery,
    filteredMembers,
    filteredSubTopics,
    loadSummary,
    handleExportJSON,
    handlePrint
  };
}

export type PostSessionViewModel = ReturnType<typeof usePostSessionViewModel>;
