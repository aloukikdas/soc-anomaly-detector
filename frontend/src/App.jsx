import { useState, useEffect } from 'react';
import { ShieldAlert, Activity, Server, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function App() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/alerts?limit=50');
      const data = await response.json();
      setAlerts(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const getRiskColor = (score) => {
    if (score >= 80) return 'bg-soc-danger text-white';
    if (score >= 50) return 'bg-soc-warning text-gray-900';
    return 'bg-soc-success text-white';
  };

  // Process data for the Recharts timeline
  const chartData = alerts.map(alert => ({
    time: new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    risk: alert.risk_score
  })).reverse(); // Reverse so oldest is on the left

  return (
    <div className="min-h-screen p-6">
      <header className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-soc-accent w-8 h-8" />
          <h1 className="text-2xl font-bold text-white">SOC Sentinel | AI Anomaly Detection</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Activity className="w-4 h-4 text-soc-success animate-pulse" />
          System Active
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-soc-card p-6 rounded-lg border border-gray-700 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 font-medium">Total Alerts (Active)</h3>
            <Server className="w-5 h-5 text-soc-accent" />
          </div>
          <p className="text-3xl font-bold text-white mt-2">{alerts.length}</p>
        </div>
        
        <div className="bg-soc-card p-6 rounded-lg border border-gray-700 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 font-medium">Critical Threats</h3>
            <AlertTriangle className="w-5 h-5 text-soc-danger" />
          </div>
          <p className="text-3xl font-bold text-white mt-2">
            {alerts.filter(a => a.risk_score >= 80).length}
          </p>
        </div>

        {/* Chart Section */}
        <div className="bg-soc-card p-4 rounded-lg border border-gray-700 shadow-lg col-span-1 md:col-span-3 lg:col-span-1 h-32 flex flex-col justify-center">
             <h3 className="text-gray-400 font-medium mb-2 text-sm">Risk Score Trend</h3>
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '4px', color: '#fff' }}
                    itemStyle={{ color: '#ef4444' }}
                  />
                </LineChart>
             </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-soc-card rounded-lg border border-gray-700 shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700 bg-gray-800/50">
          <h2 className="text-lg font-semibold text-white">Recent Security Events</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900/50 text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Entity</th>
                <th className="px-6 py-4 font-medium">Resource</th>
                <th className="px-6 py-4 font-medium">AI Classification</th>
                <th className="px-6 py-4 font-medium">Risk Score</th>
                <th className="px-6 py-4 font-medium">AI Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">Loading alerts...</td></tr>
              ) : alerts.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No anomalies detected.</td></tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {new Date(alert.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{alert.entity_type}</div>
                      <div className="text-xs text-gray-500">{alert.source_ip}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{alert.resource_accessed}</td>
                    <td className="px-6 py-4 capitalize">
                      {alert.anomaly_type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getRiskColor(alert.risk_score)}`}>
                        {alert.risk_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs max-w-xs truncate">
                      {alert.explanation}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;