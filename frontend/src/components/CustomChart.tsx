import React, { useState } from 'react';

interface ChartDataPoint {
  name: string;
  latency: number; // in ms
  cost: number;    // per 1M tokens in USD
  parity: number;  // score 0 - 100
}

interface CustomChartProps {
  data: ChartDataPoint[];
  metric: 'latency' | 'cost' | 'parity';
}

export const CustomChart: React.FC<CustomChartProps> = ({ data, metric }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No benchmark data available. Run the benchmark to populate charts.
      </div>
    );
  }

  // Find max value for scaling
  const values = data.map(d => d[metric]);
  const maxValue = Math.max(...values) * 1.15 || 10;
  const minValue = 0;

  // Chart dimension constants
  const width = 600;
  const height = 265;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 75;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Coordinates helper
  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (value: number) => {
    const scale = (value - minValue) / (maxValue - minValue);
    return paddingTop + chartHeight - scale * chartHeight;
  };

  // Color selection based on metric
  const gradientColorStart = metric === 'latency' ? '#06b6d4' : metric === 'cost' ? '#f43f5e' : '#10b981';
  const gradientColorEnd = metric === 'latency' ? '#3b82f6' : metric === 'cost' ? '#ec4899' : '#059669';
  const unit = metric === 'latency' ? ' ms' : metric === 'cost' ? ' $' : '%';
  const label = metric === 'latency' ? 'Latency' : metric === 'cost' ? 'Cost / 1M Tx' : 'Quality Parity';

  // Generate Area SVG Path
  const points = data.map((d, i) => `${getX(i)},${getY(d[metric])}`);
  const linePath = points.length > 0 ? `M ${points.join(' L ')}` : '';
  const areaPath = points.length > 0 
    ? `${linePath} L ${getX(data.length - 1)},${paddingTop + chartHeight} L ${getX(0)},${paddingTop + chartHeight} Z`
    : '';

  // Grid lines (4 horizontal divisions)
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`grad-${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientColorStart} stopOpacity="0.4" />
            <stop offset="100%" stopColor={gradientColorEnd} stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id={`stroke-${metric}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={gradientColorStart} />
            <stop offset="100%" stopColor={gradientColorEnd} />
          </linearGradient>
          <filter id={`glow-${metric}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Horizontal grid lines and Y-axis labels */}
        {gridLines.map((ratio, i) => {
          const val = maxValue - ratio * (maxValue - minValue);
          const y = paddingTop + ratio * chartHeight;
          return (
            <g key={i}>
              <line 
                x1={paddingLeft} 
                y1={y} 
                x2={width - paddingRight} 
                y2={y} 
                stroke="rgba(255, 255, 255, 0.05)" 
                strokeDasharray="4 4" 
              />
              <text 
                x={paddingLeft - 8} 
                y={y + 4} 
                fill="var(--text-muted)" 
                fontSize="10" 
                textAnchor="end"
                fontFamily="var(--mono-font)"
              >
                {metric === 'cost' ? `$${val.toFixed(2)}` : val.toFixed(0)}{unit}
              </text>
            </g>
          );
        })}

        {/* Vertical category lines & labels */}
        {data.map((d, i) => {
          const x = getX(i);
          const yPos = paddingTop + chartHeight + 12;
          return (
            <g key={i}>
              <line 
                x1={x} 
                y1={paddingTop} 
                x2={x} 
                y2={paddingTop + chartHeight} 
                stroke="rgba(255, 255, 255, 0.02)" 
              />
              <text 
                x={x} 
                y={yPos} 
                fill="var(--text-secondary)" 
                fontSize="8" 
                textAnchor="start"
                fontWeight="500"
                transform={`rotate(75, ${x}, ${yPos})`}
              >
                {d.name}
              </text>
            </g>
          );
        })}

        {/* Shaded Area */}
        {areaPath && (
          <path d={areaPath} fill={`url(#grad-${metric})`} />
        )}

        {/* Glow Line */}
        {linePath && (
          <path 
            d={linePath} 
            fill="none" 
            stroke={`url(#stroke-${metric})`} 
            strokeWidth="2.5" 
            filter={`url(#glow-${metric})`}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Interactive Circles */}
        {data.map((d, i) => {
          const x = getX(i);
          const y = getY(d[metric]);
          const isHovered = hoveredIdx === i;

          return (
            <g key={i} onMouseEnter={() => setHoveredIdx(i)} onMouseLeave={() => setHoveredIdx(null)}>
              {/* Invisible larger hover trigger area */}
              <circle cx={x} cy={y} r="14" fill="transparent" style={{ cursor: 'pointer' }} />
              
              {/* Display circle */}
              <circle 
                cx={x} 
                cy={y} 
                r={isHovered ? 6 : 4} 
                fill={isHovered ? '#fff' : gradientColorStart} 
                stroke={gradientColorEnd}
                strokeWidth={isHovered ? 3 : 1.5}
                style={{ transition: 'all 0.1s ease', cursor: 'pointer' }}
              />
            </g>
          );
        })}
      </svg>

      {/* HTML Tooltip on hover */}
      {hoveredIdx !== null && data[hoveredIdx] && (
        <div 
          className="glass-panel"
          style={{
            position: 'absolute',
            left: `${getX(hoveredIdx) + 10}px`,
            top: `${getY(data[hoveredIdx][metric]) - 50}px`,
            padding: '8px 12px',
            pointerEvents: 'none',
            fontSize: '0.8rem',
            zIndex: 10,
            border: '1px solid rgba(255, 255, 255, 0.15)',
            transform: 'translateY(-50%)',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            whiteSpace: 'nowrap'
          }}
        >
          <div style={{ fontWeight: 600, color: '#fff', marginBottom: '2px' }}>{data[hoveredIdx].name}</div>
          <div style={{ color: gradientColorStart }}>
            {label}: <span style={{ fontFamily: 'var(--mono-font)', fontWeight: 'bold' }}>
              {metric === 'cost' ? `$${data[hoveredIdx][metric].toFixed(3)}` : data[hoveredIdx][metric].toFixed(1)}{unit}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
