import React, { useMemo } from 'react';
import './HealthMetricsChart.css';

function HealthMetricsChart({ metrics }) {
  // Group metrics by category
  const metricsByCategory = useMemo(() => {
    const grouped = {};

    metrics.forEach(metric => {
      if (!grouped[metric.category]) {
        grouped[metric.category] = [];
      }
      grouped[metric.category].push({
        ...metric,
        timestamp: new Date(metric.timestamp),
        value: parseFloat(metric.value)
      });
    });

    // Sort each category by timestamp
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => a.timestamp - b.timestamp);
    });

    return grouped;
  }, [metrics]);

  // Get vital sign categories for quick view
  const vitalCategories = ['blood_pressure', 'heart_rate', 'temperature', 'weight', 'bmi'];

  const renderSimpleChart = (data) => {
    if (data.length === 0) return null;

    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;

    return (
      <div className="simple-chart">
        <div className="chart-line">
          {data.map((point, idx) => {
            const height = range > 0 ? ((point.value - minValue) / range) * 100 : 50;

            return (
              <div
                key={idx}
                className="chart-point"
                style={{
                  left: `${(idx / (data.length - 1)) * 100}%`,
                  bottom: `${height}%`
                }}
                title={`${point.value} ${point.unit} on ${point.timestamp.toLocaleDateString()}`}
              >
                <div className="point-dot"></div>
                {idx === data.length - 1 && (
                  <div className="point-label">
                    {point.value} {point.unit}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="health-metrics-chart">
      <h3>Health Trends</h3>

      <div className="charts-grid">
        {Object.entries(metricsByCategory)
          .filter(([category]) => vitalCategories.includes(category))
          .map(([category, data]) => (
            <div key={category} className="chart-card">
              <div className="chart-header">
                <h4>{category.replace(/_/g, ' ').toUpperCase()}</h4>
                <span className="data-points">{data.length} readings</span>
              </div>

              <div className="chart-container">
                {renderSimpleChart(data)}
              </div>

              <div className="chart-stats">
                <div className="stat">
                  <span className="stat-label">Latest:</span>
                  <span className="stat-value">
                    {data[data.length - 1]?.value} {data[data.length - 1]?.unit}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Average:</span>
                  <span className="stat-value">
                    {(data.reduce((sum, d) => sum + d.value, 0) / data.length).toFixed(1)}{' '}
                    {data[0]?.unit}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Range:</span>
                  <span className="stat-value">
                    {Math.min(...data.map(d => d.value)).toFixed(1)} -{' '}
                    {Math.max(...data.map(d => d.value)).toFixed(1)}
                  </span>
                </div>
              </div>

              <div className="chart-timeline">
                <span>{data[0]?.timestamp.toLocaleDateString()}</span>
                <span>{data[data.length - 1]?.timestamp.toLocaleDateString()}</span>
              </div>
            </div>
          ))}
      </div>

      {Object.keys(metricsByCategory).length === 0 && (
        <div className="empty-chart">
          <p>No health metrics to display</p>
        </div>
      )}
    </div>
  );
}

export default HealthMetricsChart;
