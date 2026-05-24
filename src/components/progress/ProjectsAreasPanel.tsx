import { useQuery } from '@tanstack/react-query';
import { Panel, PanelSection, SummaryPill } from './Panel';
import { ProgressRow } from '../charts/ProgressRow';
import { InsightCard } from '../charts/InsightCard';
import { listAreas, listProjects } from '../../api/structure';
import { projectTaskCounts } from '../../api/tasks';
import type { Area, Project } from '../../types/db';

export function ProjectsAreasPanel() {
  const areasQ = useQuery({ queryKey: ['areas'], queryFn: listAreas });
  const projectsQ = useQuery({ queryKey: ['projects'], queryFn: listProjects });
  const countsQ = useQuery({ queryKey: ['project-counts'], queryFn: projectTaskCounts });

  const areas = (areasQ.data ?? []) as Area[];
  const projects = (projectsQ.data ?? []) as Project[];
  const counts = countsQ.data ?? new Map<string, { done: number; total: number }>();

  // Per-area aggregate from linked projects
  const areaScores = areas.map((a) => {
    const areaProjects = projects.filter((p) => p.area_id === a.id);
    let done = 0;
    let total = 0;
    areaProjects.forEach((p) => {
      const c = counts.get(p.id);
      if (c) { done += c.done; total += c.total; }
    });
    return { area: a, done, total, projects: areaProjects.length };
  }).sort((a, b) => (b.total === 0 ? 0 : b.done / b.total) - (a.total === 0 ? 0 : a.done / a.total));

  const strongest = areaScores.find((a) => a.total > 0);
  const activeProjects = projects.filter((p) => p.status === 'active');
  const completed = projects.filter((p) => p.status === 'completed');

  const noData = areas.length === 0 && projects.length === 0;

  return (
    <Panel
      emoji="🗂️"
      title="Projects &amp; Areas"
      summary={activeProjects.length > 0 ? <SummaryPill value={`${activeProjects.length} active`} color="accent" /> : undefined}
    >
      {noData ? (
        <div className="text-hint text-[13px] text-center py-3">Create an area or project to start structuring your goals.</div>
      ) : (
        <>
          {areas.length > 0 && (
            <PanelSection title="Life areas">
              {areaScores.map(({ area, done, total, projects: pCount }) => (
                <ProgressRow
                  key={area.id}
                  label={`${area.name}${pCount > 0 ? ` · ${pCount} project${pCount === 1 ? '' : 's'}` : ''}`}
                  emoji={area.emoji}
                  value={total === 0 ? 0 : done / total}
                  rightText={total === 0 ? '—' : `${done} / ${total}`}
                  color={total > 0 && done / total >= 0.7 ? 'success' : 'accent'}
                />
              ))}
            </PanelSection>
          )}

          {activeProjects.length > 0 && (
            <PanelSection title={`Projects · ${activeProjects.length} active${completed.length > 0 ? ` · ${completed.length} done` : ''}`}>
              {activeProjects.map((p) => {
                const c = counts.get(p.id) ?? { done: 0, total: 0 };
                const linkedArea = areas.find((a) => a.id === p.area_id);
                return (
                  <ProgressRow
                    key={p.id}
                    label={linkedArea ? `${p.name}  ·  in ${linkedArea.name}` : p.name}
                    emoji={p.emoji}
                    value={c.total === 0 ? 0 : c.done / c.total}
                    rightText={`${c.done} / ${c.total}`}
                    color="accent"
                  />
                );
              })}
            </PanelSection>
          )}

          {strongest && strongest.total >= 3 && (
            <InsightCard>{strongest.area.emoji} <strong>{strongest.area.name}</strong> is your strongest area right now — great momentum.</InsightCard>
          )}
        </>
      )}
    </Panel>
  );
}
