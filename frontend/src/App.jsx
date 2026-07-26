import { useState, useEffect } from 'react';
import { ShieldAlert, Activity, Server, AlertTriangle, Zap, User, Shield, Download, Search, Filter } from 'lucide-react';
import { LineChart, Line, Tooltip, ResponsiveContainer } from 'recharts';

function App() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterRisk, setFilterRisk] = useState('All');

  const fetchAlerts = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/alerts?limit=75');
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
    const interval = setInterval(fetchAlerts, 2000);
    return () => clearInterval(interval);
  }, []);

  const startSimulation = async () => {
    setIsSimulating(true);
    try {
      await fetch('http://127.0.0.1:8000/api/simulate');
      // Keep the tactical scanning animation up for exactly 3 seconds for dramatic effect
      setTimeout(() => setIsSimulating(false), 3000); 
    } catch (error) {
      console.error("Simulation error:", error);
      setIsSimulating(false);
    }
  };

  // Enterprise Feature: Export to CSV
  const exportToCSV = () => {
    const headers = "Timestamp,Entity,IP,Resource,Classification,Risk Score,AI Analysis\n";
    const rows = alerts.map(a => 
      `"${new Date(a.timestamp).toLocaleString()}","${a.entity_type}","${a.source_ip}","${a.resource_accessed}","${a.anomaly_type.toUpperCase()}","${a.risk_score}","${a.explanation}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SOC_Threat_Report_${new Date().getTime()}.csv`;
    a.click();
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          alert.source_ip.includes(searchTerm);
    const matchesType = filterType === 'All' || alert.anomaly_type === filterType;
    const matchesRisk = filterRisk === 'All' ? true :
                        filterRisk === 'Critical' ? alert.risk_score >= 80 :
                        filterRisk === 'Elevated' ? alert.risk_score >= 50 && alert.risk_score < 80 :
                        alert.risk_score < 50;
    return matchesSearch && matchesType && matchesRisk;
  });
  const chartData = alerts.map(alert => ({
    time: new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    risk: alert.risk_score
  })).reverse();

  return (
    <div className="min-h-screen p-6 relative">
      
      {/* MINIMALIST CYBER RADAR OVERLAY */}
      {isSimulating && (
        <div className="absolute inset-0 z-50 bg-[#070b14]/10 backdrop-blur-sm flex flex-col items-center justify-center p-6 transition-all duration-300">
          
          {/* Radar Container */}
          <div className="relative w-56 h-56 mb-8 rounded-full border border-sky-900/40 bg-[#020617] shadow-[0_0_60px_rgba(14,165,233,0.15)] overflow-hidden flex items-center justify-center">
            
            {/* Radar Sweep Effect (Tailwind conic gradient) */}
            <div className="absolute inset-0 rounded-full animate-[spin_2s_linear_infinite]" 
                 style={{ background: 'conic-gradient(from 0deg, transparent 75%, rgba(56, 189, 248, 0.6) 100%)' }}>
            </div>
            
            {/* Crosshairs */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_49.5%,rgba(14,165,233,0.2)_50%,transparent_50.5%),linear-gradient(90deg,transparent_49.5%,rgba(14,165,233,0.2)_50%,transparent_50.5%)]"></div>

            {/* Concentric Rings */}
            <div className="absolute w-3/4 h-3/4 border border-sky-900/30 rounded-full"></div>
            <div className="absolute w-2/4 h-2/4 border border-sky-900/30 rounded-full"></div>

            {/* Inner Shield */}
            <div className="relative z-10 bg-[#070b14] p-5 rounded-full border border-sky-500/30 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
               <ShieldAlert className="w-10 h-10 text-sky-400 animate-pulse drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]" />
            </div>
          </div>

          {/* Minimal Typography */}
          <div className="flex flex-col items-center">
            <h2 className="text-sky-400 text-lg font-mono tracking-[0.4em] uppercase animate-pulse drop-shadow-md">
              Intercepting Traffic
            </h2>
            
            {/* Sleek Loading Dots */}
            <div className="mt-5 flex items-center gap-3">
              <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-ping"></div>
              <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-[ping_1s_cubic-bezier(0,0,0.2,1)_infinite_0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-[ping_1s_cubic-bezier(0,0,0.2,1)_infinite_0.4s]"></div>
            </div>
          </div>
          
        </div>
      )}

      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 border-b border-gray-700 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-soc-accent w-8 h-8" />
          <h1 className="text-2xl font-bold text-white tracking-wide">SOC Sentinel <span className="text-gray-500 font-light">| Enterprise AI Engine</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={exportToCSV}
            className="px-4 py-2 rounded font-medium text-sm transition-all flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 shadow-lg"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>

          <button 
            onClick={startSimulation}
            disabled={isSimulating}
            className="px-4 py-2 rounded font-medium text-sm transition-all flex items-center gap-2 bg-soc-accent hover:bg-sky-400 text-gray-900 shadow-lg shadow-sky-900/20"
          >
            <Zap className="w-4 h-4" />
            Simulate Live Traffic
          </button>
          
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-800/80 px-4 py-1.5 rounded-full border border-gray-700">
            <Activity className="w-4 h-4 text-soc-success animate-pulse" />
            Engine Online
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-soc-card p-6 rounded-lg border border-gray-700 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 font-medium text-sm uppercase tracking-wider">Total Events</h3>
            <Server className="w-5 h-5 text-soc-accent" />
          </div>
          <p className="text-4xl font-bold text-white mt-4">{alerts.length}</p>
        </div>
        
        <div className="bg-soc-card p-6 rounded-lg border border-red-900/50 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full"></div>
          <div className="flex items-center justify-between">
            <h3 className="text-red-400 font-medium text-sm uppercase tracking-wider">Critical Threats</h3>
            <AlertTriangle className="w-5 h-5 text-soc-danger" />
          </div>
          <p className="text-4xl font-bold text-white mt-4">
            {alerts.filter(a => a.risk_score >= 80).length}
          </p>
        </div>

        <div className="bg-soc-card p-4 rounded-lg border border-gray-700 shadow-xl col-span-1 md:col-span-2 h-36 flex flex-col justify-center">
             <h3 className="text-gray-400 font-medium mb-2 text-xs uppercase tracking-wider">Risk Score Volatility</h3>
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line type="monotone" dataKey="risk" stroke="#38bdf8" strokeWidth={2} dot={{ r: 2, fill: '#0f172a' }} activeDot={{ r: 5 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                    itemStyle={{ color: '#38bdf8' }}
                  />
                </LineChart>
             </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-soc-card rounded-lg border border-gray-700 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-gray-700 bg-gray-800/40 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white tracking-wide">Threat Detection Queue</h2>
        </div>
        {/* NEW: Search and Filter Bar */}
        <div className="bg-gray-800/20 p-4 border-b border-gray-700/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search IP or Entity..." 
              className="w-full bg-gray-900/50 border border-gray-700 text-white text-sm rounded-md pl-9 pr-4 py-2 focus:outline-none focus:border-sky-500 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-500" />
            <select 
              className="bg-gray-900/50 border border-gray-700 text-gray-300 text-sm rounded-md px-3 py-2 focus:outline-none focus:border-sky-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="All">All Threats</option>
              <option value="brute_force">Brute Force</option>
              <option value="lateral_movement">Lateral Movement</option>
              <option value="impossible_travel">Impossible Travel</option>
              <option value="normal">Normal</option>
            </select>
            <select 
              className="bg-gray-900/50 border border-gray-700 text-gray-300 text-sm rounded-md px-3 py-2 focus:outline-none focus:border-sky-500"
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
            >
              <option value="All">Any Risk</option>
              <option value="Critical">Critical (&ge;80)</option>
              <option value="Elevated">Elevated (50-79)</option>
              <option value="Low">Low (&lt;50)</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
          <table className="w-full text-left text-sm relative">
            <thead className="bg-gray-900/90 text-gray-400 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Detection Time</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Target Entity</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Vector</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Classification</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Risk</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Engine Analysis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Initializing ML Engine...</td></tr>
              ) : alerts.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Awaiting stream telemetry...</td></tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-800/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400 font-mono text-xs">
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md ${alert.entity_type === 'Admin' ? 'bg-purple-500/10' : 'bg-blue-500/10'}`}>
                          {alert.entity_type === 'Admin' ? <Shield className="w-4 h-4 text-purple-400" /> : <User className="w-4 h-4 text-blue-400" />}
                        </div>
                        <div>
                          <div className={`font-semibold ${alert.entity_type === 'Admin' ? 'text-purple-300' : 'text-blue-300'}`}>{alert.entity_type}</div>
                          <div className="text-xs text-gray-500 font-mono">{alert.source_ip}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300 font-medium">{alert.resource_accessed.replace('_', ' ')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wider border ${
                        alert.anomaly_type === 'brute_force' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        alert.anomaly_type === 'lateral_movement' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        alert.anomaly_type === 'impossible_travel' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                        {alert.anomaly_type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-sm font-bold shadow-sm ${
                         alert.risk_score >= 90 ? 'bg-red-500 text-white shadow-red-500/20' :
                         alert.risk_score >= 75 ? 'bg-orange-500 text-white shadow-orange-500/20' :
                         'bg-emerald-500 text-white shadow-emerald-500/20'
                      }`}>
                        {alert.risk_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs max-w-sm">
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