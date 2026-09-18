import React from 'react';
import { AgendaTopic } from '../../../../shared/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/common/Card';
import { Button } from '../../../../components/common/Button';
import { Badge } from '../../../../components/common/Badge';
import { Calendar, Plus, Edit2, Trash2, Clock } from 'lucide-react';

interface AgendaTopicsTabProps {
  topics: AgendaTopic[];
  onAddTopic: () => void;
  onEditTopic: (topic: AgendaTopic) => void;
  onDeleteTopic: (topicId: string) => void;
}

export const AgendaTopicsTab: React.FC<AgendaTopicsTabProps> = ({
  topics,
  onAddTopic,
  onEditTopic,
  onDeleteTopic
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <span>2. Agenda & Topic Order of Business</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure the sequence of legislative clauses and discussion topics with allocated time windows.
          </p>
        </div>
        <Button
          id="admin-add-topic-btn"
          variant="gold"
          size="sm"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={onAddTopic}
        >
          Add Agenda Topic
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {topics.map((topic) => (
          <Card
            key={topic.topic_id}
            className="flex flex-col justify-between hover:border-slate-700 transition-all bg-slate-900/80"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <Badge variant="neutral" className="font-mono">
                  {topic.topic_id}
                </Badge>
                <Badge
                  variant={
                    topic.priority === "HIGH"
                      ? "danger"
                      : topic.priority === "MEDIUM"
                      ? "warning"
                      : "neutral"
                  }
                >
                  {topic.priority} Priority
                </Badge>
              </div>
              <CardTitle className="text-xs line-clamp-2 leading-snug">
                {topic.title}
              </CardTitle>
              <CardDescription className="line-clamp-2 mt-1">
                {topic.description || "No specific sub-clauses provided."}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {topic.start_time} - {topic.end_time}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditTopic(topic)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  title="Edit Topic"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteTopic(topic.topic_id)}
                  className="p-1 rounded bg-slate-800 hover:bg-rose-900/50 text-rose-400 transition-colors cursor-pointer"
                  title="Delete Topic"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
