import React from 'react';
import { useParliament } from '../../../infrastructure/context/ParliamentContext';
import { usePostSessionViewModel } from '../viewmodel/usePostSessionViewModel';
import { Tabs, TabItem } from '../../../components/common/Tabs';
import { Button } from '../../../components/common/Button';
import { LoadingState } from '../../../components/common/FeedbackStates';
import { ExecutiveOverviewTab } from './postsession/ExecutiveOverviewTab';
import { LegislativeSummaryNotesTab } from './postsession/LegislativeSummaryNotesTab';
import { MemberScorecardsTab } from './postsession/MemberScorecardsTab';
import { TopicAnalysisTab } from './postsession/TopicAnalysisTab';
import {
  FileText,
  Download,
  Printer,
  PlusCircle,
  BarChart3,
  BookOpen,
  Users,
  Calendar,
  Award
} from 'lucide-react';

interface PostSessionSummaryProps {
  onStartNewConfig: () => void;
}

export function PostSessionSummary({ onStartNewConfig }: PostSessionSummaryProps) {
  const { openScorecard, openReport } = useParliament();
  const vm = usePostSessionViewModel();

  if (vm.isLoading || !vm.summaryData) {
    return <LoadingState message="Synthesizing Post-Session Parliamentary Analytics & Scorecards..." />;
  }

  const { session_information, member_wise_summary, topic_wise_summary } = vm.summaryData;

  const tabs: TabItem[] = [
    {
      id: "overview",
      label: "Executive Analytics & Violations",
      icon: <BarChart3 className="w-3.5 h-3.5" />
    },
    {
      id: "summary_points",
      label: "Executive Summary Notes",
      icon: <BookOpen className="w-3.5 h-3.5" />,
      badge: 20
    },
    {
      id: "members",
      label: "Member Scorecards & Roster",
      icon: <Users className="w-3.5 h-3.5" />,
      badge: member_wise_summary.length
    },
    {
      id: "topics",
      label: "Topic-Wise Analysis",
      icon: <Calendar className="w-3.5 h-3.5" />,
      badge: topic_wise_summary.length
    }
  ];

  return (
    <div id="post-session-summary-view" className="h-full flex flex-col gap-2 min-h-0 overflow-hidden text-slate-200">
      {/* Top Header Actions Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
              Official Post-Session Summary & Scorecard Engine
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-400 font-mono font-bold">
                {session_information.session_id}
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">
              Concluded on {session_information.date} • {session_information.house_chamber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            id="post-session-open-full-report-btn"
            variant="secondary"
            size="sm"
            onClick={openReport}
            icon={<FileText className="w-3.5 h-3.5 text-amber-400" />}
          >
            Official Report
          </Button>

          <Button
            id="post-session-export-json-btn"
            variant="secondary"
            size="sm"
            onClick={vm.handleExportJSON}
            icon={<Download className="w-3.5 h-3.5 text-blue-400" />}
          >
            Export JSON
          </Button>

          <Button
            id="post-session-print-btn"
            variant="secondary"
            size="sm"
            onClick={vm.handlePrint}
            icon={<Printer className="w-3.5 h-3.5 text-emerald-400" />}
          >
            Print
          </Button>

          <Button
            id="post-session-new-config-btn"
            variant="gold"
            size="sm"
            onClick={onStartNewConfig}
            icon={<PlusCircle className="w-3.5 h-3.5" />}
          >
            New Pre-Session
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 flex-shrink-0">
        <Tabs
          tabs={tabs}
          activeTab={vm.activeSection}
          onChange={(id) => vm.setActiveSection(id as any)}
          className="border-b-0"
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 overflow-y-auto">
        {vm.activeSection === "overview" && (
          <ExecutiveOverviewTab summary={vm.summaryData} />
        )}

        {vm.activeSection === "summary_points" && (
          <LegislativeSummaryNotesTab
            subTopics={vm.filteredSubTopics}
            searchQuery={vm.pointSearchQuery}
            onSearchChange={vm.setPointSearchQuery}
            activeCategory={vm.pointCategoryFilter}
            onCategoryChange={vm.setPointCategoryFilter}
          />
        )}

        {vm.activeSection === "members" && (
          <MemberScorecardsTab
            members={vm.filteredMembers}
            filterText={vm.memberFilter}
            onFilterChange={vm.setMemberFilter}
            onOpenScorecard={openScorecard}
          />
        )}

        {vm.activeSection === "topics" && (
          <TopicAnalysisTab topics={vm.summaryData.topic_wise_summary} />
        )}
      </div>
    </div>
  );
}
