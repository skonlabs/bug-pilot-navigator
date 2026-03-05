import { useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { mockServices, mockIncidents } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { Search, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import type { ServiceNode } from '@/types/bugpilot';

// Dependency edges: [source, target]
const EDGES: [string, string][] = [
  ['api-gateway', 'auth-service'],
  ['api-gateway', 'checkout-api'],
  ['api-gateway', 'user-profile-service'],
  ['api-gateway', 'search-indexer'],
  ['checkout-api', 'payment-service'],
  ['checkout-api', 'order-service'],
  ['checkout-api', 'inventory-service'],
  ['payment-service', 'stripe-gateway'],
  ['order-service', 'inventory-service'],
  ['order-service', 'notification-worker'],
  ['notification-worker', 'email-service'],
  ['user-profile-service', 'auth-service'],
  ['checkout-api', 'cdn-edge'],
];

const HEALTH_CONFIG = {
  healthy: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: '#10b98150' },
  degraded: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: '#f59e0b50' },
  incident: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: '#ef444450' },
  unknown: { color: '#71717a', bg: 'rgba(113,113,122,0.08)', border: '#71717a50' },
};

// Static layout positions (x, y) for services
const SERVICE_POSITIONS: Record<string, { x: number; y: number }> = {
  'api-gateway': { x: 330, y: 30 },
  'auth-service': { x: 570, y: 130 },
  'checkout-api': { x: 180, y: 155 },
  'user-profile-service': { x: 450, y: 155 },
  'search-indexer': { x: 660, y: 270 },
  'payment-service': { x: 55, y: 295 },
  'order-service': { x: 255, y: 300 },
  'inventory-service': { x: 390, y: 425 },
  'stripe-gateway': { x: 50, y: 435 },
  'notification-worker': { x: 240, y: 455 },
  'cdn-edge': { x: 570, y: 390 },
  'email-service': { x: 235, y: 570 },
};

const NODE_W = 148;
const NODE_H = 54;

export default function TopologyPage() {
  const [searchParams] = useSearchParams();
  const incidentId = searchParams.get('incident');
  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<ServiceNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 20, y: 20 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const incident = incidentId ? mockIncidents.find(i => i.id === incidentId) : null;
  const causalPath = incident?.affected_services || [];

  const filteredNames = new Set(
    mockServices
      .filter(s => {
        const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.team.toLowerCase().includes(search.toLowerCase());
        const matchHealth = healthFilter === 'all' || s.health === healthFilter;
        return matchSearch && matchHealth;
      })
      .map(s => s.name)
  );

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as Element).closest('.node-group')) return;
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setPan(p => ({ x: p.x + (e.clientX - lastPos.current.x), y: p.y + (e.clientY - lastPos.current.y) }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const handleMouseUp = () => { isDragging.current = false; };
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.3, Math.min(2.5, z * (e.deltaY > 0 ? 0.9 : 1.1))));
  };
  const resetView = () => { setZoom(1); setPan({ x: 20, y: 20 }); };

  return (
    <div className="flex h-[calc(100vh-7rem)] -m-6 gap-0">
      {/* Graph Canvas */}
      <div className="flex-1 relative bg-background overflow-hidden">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search services..." className="pl-8 h-8 text-xs bg-background/95 backdrop-blur-sm" />
          </div>
          <div className="flex items-center bg-background/95 backdrop-blur-sm rounded-lg border border-border/80 p-0.5 gap-0.5">
            {['all', 'healthy', 'degraded', 'incident', 'unknown'].map(h => (
              <button key={h} onClick={() => setHealthFilter(h)}
                className={cn('px-2.5 py-1 rounded-md text-[11px] font-medium transition-all capitalize', healthFilter === h ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground')}>
                {h}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-background/95 backdrop-blur-sm rounded-lg border border-border/80 p-1">
            <button onClick={() => setZoom(z => Math.min(2.5, z * 1.2))} className="p-1 hover:text-foreground text-muted-foreground transition-colors"><ZoomIn className="h-3.5 w-3.5" /></button>
            <span className="text-[10px] font-mono text-muted-foreground w-8 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.max(0.3, z * 0.8))} className="p-1 hover:text-foreground text-muted-foreground transition-colors"><ZoomOut className="h-3.5 w-3.5" /></button>
            <div className="w-px h-4 bg-border mx-1" />
            <button onClick={resetView} className="p-1 hover:text-foreground text-muted-foreground transition-colors"><Maximize2 className="h-3.5 w-3.5" /></button>
          </div>
          {incident && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-severity-p0/10 border border-severity-p0/30 rounded-lg text-xs text-severity-p0">
              <div className="h-2 w-2 rounded-full bg-severity-p0 animate-pulse" />
              Causal path for {incident.short_id}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2">
          {Object.entries(HEALTH_CONFIG).map(([status, cfg]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
              <span className="text-[10px] text-muted-foreground capitalize">{status}</span>
            </div>
          ))}
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5">
            <div className="h-px w-6 border-t-2 border-dashed border-zinc-600" />
            <span className="text-[10px] text-muted-foreground">Dependency</span>
          </div>
        </div>

        {/* SVG */}
        <svg
          className="w-full h-full"
          style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#52525b" />
            </marker>
            <marker id="arrowhead-causal" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
            </marker>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Edges */}
            {EDGES.map(([from, to]) => {
              const fp = SERVICE_POSITIONS[from];
              const tp = SERVICE_POSITIONS[to];
              if (!fp || !tp) return null;
              const fv = filteredNames.has(from);
              const tv = filteredNames.has(to);
              const isCausal = causalPath.includes(from) && causalPath.includes(to);
              const opacity = (!fv || !tv) ? 0 : incident && !isCausal ? 0.12 : 1;
              return (
                <line key={`${from}-${to}`}
                  x1={fp.x + NODE_W / 2} y1={fp.y + NODE_H}
                  x2={tp.x + NODE_W / 2} y2={tp.y}
                  stroke={isCausal ? '#ef4444' : '#52525b'}
                  strokeWidth={isCausal ? 2.5 : 1.5}
                  strokeDasharray={isCausal ? undefined : '5,4'}
                  markerEnd={`url(#arrowhead${isCausal ? '-causal' : ''})`}
                  opacity={opacity}
                  style={{ transition: 'opacity 0.3s' }}
                />
              );
            })}

            {/* Nodes */}
            {mockServices.map(service => {
              const pos = SERVICE_POSITIONS[service.name];
              if (!pos) return null;
              const health = HEALTH_CONFIG[service.health];
              const visible = filteredNames.has(service.name);
              const isCausal = causalPath.includes(service.name);
              const isSelected = selectedService?.id === service.id;
              const dimmed = incident && !isCausal;

              return (
                <g key={service.id}
                  className="node-group"
                  transform={`translate(${pos.x}, ${pos.y})`}
                  opacity={!visible ? 0.05 : dimmed ? 0.15 : 1}
                  style={{ cursor: 'pointer', transition: 'opacity 0.3s' }}
                  onClick={() => setSelectedService(s => s?.id === service.id ? null : service)}
                >
                  {/* Pulse ring for incident */}
                  {service.health === 'incident' && visible && (
                    <rect x={-6} y={-6} width={NODE_W + 12} height={NODE_H + 12} rx={16}
                      fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.4">
                      <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
                    </rect>
                  )}
                  {/* Node background */}
                  <rect x={0} y={0} width={NODE_W} height={NODE_H} rx={12}
                    fill={isSelected ? health.bg : '#0f0f0f'}
                    stroke={isCausal ? '#ef4444' : isSelected ? health.color : health.border}
                    strokeWidth={isCausal || isSelected ? 2 : 1}
                  />
                  {/* Health dot */}
                  <circle cx={14} cy={NODE_H / 2} r={4.5} fill={health.color}>
                    {service.health === 'incident' && (
                      <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
                    )}
                  </circle>
                  {/* Service name */}
                  <text x={26} y={NODE_H / 2 - 6} fontSize={10.5} fill="#d4d4d8" fontFamily="'DM Mono', monospace" fontWeight="600">
                    {service.name.length > 15 ? service.name.substring(0, 14) + '…' : service.name}
                  </text>
                  {/* Team + readiness */}
                  <text x={26} y={NODE_H / 2 + 9} fontSize={9} fill="#71717a" fontFamily="sans-serif">
                    {service.team} · {service.readiness_score}%
                  </text>
                  {/* Incident badge */}
                  {service.active_incidents > 0 && (
                    <g transform={`translate(${NODE_W - 14}, 6)`}>
                      <circle r={7} fill="#ef4444">
                        <animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                      <text x={-2.5} y={3.5} fontSize={8.5} fill="white" fontWeight="bold" fontFamily="monospace">
                        {service.active_incidents}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Right Sidebar */}
      <div className={cn('border-l border-border bg-background/95 transition-all duration-300 overflow-y-auto scrollbar-thin', selectedService ? 'w-68 shrink-0' : 'w-0 overflow-hidden')}>
        {selectedService && (
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="p-5 space-y-4 w-64">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold font-mono text-foreground leading-tight">{selectedService.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedService.team} Team</p>
              </div>
              <button onClick={() => setSelectedService(null)} className="text-muted-foreground hover:text-foreground text-sm leading-none mt-0.5">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-secondary/50 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">Health</p>
                <div className="flex items-center justify-center gap-1.5">
                  <div className={cn('h-2 w-2 rounded-full',
                    selectedService.health === 'healthy' ? 'bg-emerald-400' :
                    selectedService.health === 'degraded' ? 'bg-amber-400' :
                    selectedService.health === 'incident' ? 'bg-severity-p0 animate-pulse' : 'bg-muted-foreground'
                  )} />
                  <span className="text-xs font-medium text-foreground capitalize">{selectedService.health}</span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/50 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">Readiness</p>
                <p className={cn('text-sm font-bold font-mono',
                  selectedService.readiness_score >= 80 ? 'text-emerald-400' :
                  selectedService.readiness_score >= 50 ? 'text-amber-400' : 'text-severity-p0'
                )}>{selectedService.readiness_score}%</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { label: 'Criticality', value: selectedService.criticality },
                { label: 'Language', value: selectedService.language || '—' },
                { label: 'Last Deploy', value: selectedService.last_deploy || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground capitalize">{value}</span>
                </div>
              ))}
            </div>

            {selectedService.active_incidents > 0 && (
              <div className="p-2.5 rounded-lg bg-severity-p0/5 border border-severity-p0/20">
                <p className="text-[11px] text-severity-p0 font-medium mb-1">
                  {selectedService.active_incidents} active incident{selectedService.active_incidents > 1 ? 's' : ''}
                </p>
                {mockIncidents
                  .filter(i => i.affected_services.includes(selectedService.name) && !['resolved', 'closed', 'postmortem'].includes(i.status))
                  .map(inc => (
                    <Link key={inc.id} to={`/incidents/${inc.id}`}
                      className="text-[11px] text-primary hover:underline block truncate">
                      {inc.short_id}: {inc.title.substring(0, 28)}…
                    </Link>
                  ))}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <Link to={`/readiness/${selectedService.id}`}>
                <Button size="sm" variant="outline" className="w-full h-7 text-xs">View Readiness</Button>
              </Link>
              <Link to={`/topology?incident=${mockIncidents.find(i => i.affected_services.includes(selectedService.name))?.id || ''}`}>
                <Button size="sm" variant="ghost" className="w-full h-7 text-xs">Highlight Causal Path</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
