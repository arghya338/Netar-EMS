import { AlertTriangle, Server } from 'lucide-react';
import { activeFunctionSummary, alarmSummary, healthScore, sliceStatus } from '../../data/overviewData';
import { Sparkline } from '../charts/Sparkline';

export function SummaryCards() {
  const scoreAngle = `${healthScore.score * 3.6}deg`;
  const sliceGradient = `conic-gradient(${sliceStatus
    .map((slice, index) => {
      const start = sliceStatus.slice(0, index).reduce((sum, item) => sum + item.percent, 0) * 3.6;
      const end = start + slice.percent * 3.6;
      return `var(--${slice.accent}) ${start}deg ${end}deg`;
    })
    .join(', ')})`;

  return (
    <section className="summary-grid" aria-label="5G core network summary">
      <article className="summary-card health-score-card">
        <h2>Network Health Score</h2>
        <div className="health-score-body">
          <div className="score-ring" style={{ background: `conic-gradient(var(--orange) ${scoreAngle}, #edf0f4 0deg)` }}>
            <strong>{healthScore.score}</strong>
            <span>/100</span>
          </div>
          <div className="health-score-copy">
            <span className="status-pair">
              <i className="status-dot green" />
              {healthScore.label}
            </span>
            <small>{healthScore.caption}</small>
            <Sparkline data={healthScore.trend} accent="orange" width={104} height={32} muted />
          </div>
        </div>
      </article>

      <article className="summary-card alarm-summary-card">
        <div className="panel-title-row">
          <h2>Alarm Summary</h2>
          <button type="button">View all alarms</button>
        </div>
        <div className="alarm-summary-grid">
          {alarmSummary.map((item) => (
            <div className="alarm-summary-item" key={item.label}>
              <span className={`alarm-icon accent-${item.accent}`}>
                <AlertTriangle size={14} />
              </span>
              <small>{item.label}</small>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </article>

      <article className="summary-card active-functions-card">
        <h2>Active Network Functions</h2>
        <div className="active-functions-body">
          <span className="function-ring">
            <Server size={17} />
          </span>
          <div>
            <strong>{activeFunctionSummary.online}</strong>
            <span>/ {activeFunctionSummary.total}</span>
            <small>{activeFunctionSummary.caption}</small>
          </div>
        </div>
      </article>

      <article className="summary-card slice-status-card">
        <div className="panel-title-row">
          <h2>Slice Status</h2>
          <button type="button">View all</button>
        </div>
        <div className="slice-status-body">
          <div className="mini-donut" style={{ background: sliceGradient }}>
            <span />
          </div>
          <div className="slice-status-list">
            {sliceStatus.map((slice) => (
              <div className="slice-status-row" key={slice.name}>
                <span>
                  <i className={`status-dot ${slice.accent}`} />
                  {slice.name}
                </span>
                <b>{slice.count}</b>
                <small>{slice.percent}%</small>
              </div>
            ))}
          </div>
        </div>
      </article>
    </section>
  );
}
