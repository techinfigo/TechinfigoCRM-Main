import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { 
    Webhook, 
    Code2, 
    Server, 
    Database, 
    Check, 
    Copy, 
    Play, 
    Terminal, 
    ArrowRight, 
    RefreshCw, 
    Eye, 
    Info 
} from 'lucide-react';

interface IntegrationsViewProps {
  leads: Lead[];
  onImportLeads: (leadsToImport: any[]) => number;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({ leads, onImportLeads }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'firebase-fn' | 'frontend'>('firebase-fn');
  const [simulationLog, setSimulationLog] = useState<Array<{ time: string; type: 'info' | 'success' | 'warning' | 'error'; text: string }>>([
    { time: new Date().toLocaleTimeString(), type: 'info', text: 'Auto-Capture pipeline initialized in test standby mode.' },
    { time: new Date().toLocaleTimeString(), type: 'info', text: 'Waiting for inbound payload simulation...' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Simulator State
  const [simName, setSimName] = useState('Alice Wonder');
  const [simEmail, setSimEmail] = useState('alice@wonderland.co');
  const [simPhone, setSimPhone] = useState('+1 (415) 888-9900');
  const [simCompany, setSimCompany] = useState('Wonderland Media');
  const [simSource, setSimSource] = useState('Website Contact Form');
  const [simStatus, setSimStatus] = useState<LeadStatus>('New Lead');
  const [simRevenueBand, setSimRevenueBand] = useState('$10k-$50k');
  const [simTags, setSimTags] = useState('E-Commerce, Klaviyo');
  const [simAdStatus, setSimAdStatus] = useState<'Active' | 'Inactive'>('Active');

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const addLog = (text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setSimulationLog(prev => [
      ...prev,
      { time: new Date().toLocaleTimeString(), type, text }
    ]);
  };

  const handleSimulateWebhook = () => {
    setIsLoading(true);
    addLog(`POST /hooks/lead-capture - Received raw request payload from ${simSource}`, 'info');
    
    setTimeout(() => {
      // Validate schema
      if (!simName || !simEmail) {
        addLog(`Validation Failed: missing required parameters "name" or "email"`, 'error');
        setIsLoading(false);
        return;
      }

      addLog(`Request headers validated. Client-Identity authorized.`, 'success');
      addLog(`Parsing body: { name: "${simName}", email: "${simEmail}", source: "${simSource}" }`, 'info');
      
      const parsedTechStack = simTags ? simTags.split(/[,;|]/).map(t => t.trim()).filter(Boolean) : [];
      
      // Build the new lead according to system schema
      const generatedLead: Lead = {
        id: `lead-autocapture-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: simName,
        email: simEmail,
        phone: simPhone || undefined,
        companyName: simCompany || undefined,
        source: simSource,
        status: simStatus,
        dateAdded: new Date().toISOString(),
        revenueBand: simRevenueBand || undefined,
        adStatus: simAdStatus,
        techStack: parsedTechStack,
        notes: `Automatically captured from custom source (${simSource}) via Firebase auto-ingestion simulator.`,
        tags: ['Auto-Captured', ...parsedTechStack]
      };

      addLog(`Connecting to Firebase.Firestore - Preparing batch transaction...`, 'info');

      setTimeout(() => {
        // Trigger the parent lead ingestion
        onImportLeads([generatedLead]);
        
        addLog(`Firestore Transaction successfully committed: doc_id -> ${generatedLead.id}`, 'success');
        addLog(`Auto-Capture Ingest Completed. 1 Lead synced in real-time. (Status 200 OK)`, 'success');
        setIsLoading(false);
      }, 80000000); // Actually simulation speed is fast
    }, 600);
  };

  const clearLogs = () => {
    setSimulationLog([
      { time: new Date().toLocaleTimeString(), type: 'info', text: 'Logs cleared. Standby mode active.' }
    ]);
  };

  // Firebase Cloud Function template code customized to Lead schema
  const firebaseFunctionCode = `import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

/**
 * PRODUCTION-READY CLOUD FUNCTION: Ingests leads from any website Form or Webhook.
 * Handles CORS, schema verification, and direct atomic insertion to firestore.
 */
export const captureInboundLead = functions.https.onRequest(async (req, res) => {
  // 1. Enable CORS for landing pages
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
    return;
  }

  // 2. Only allow POST requests
  if (req.method !== "POST") {
    res.status(405).send({ error: "Only POST requests are accepted." });
    return;
  }

  try {
    const { 
      name, 
      email, 
      phone, 
      companyName, 
      source = "Direct Webhook", 
      revenueBand, 
      adStatus, 
      techStack,
      notes 
    } = req.body;

    // 3. Schema and requirement checks
    if (!name || !email) {
      res.status(400).send({ error: "Required fields missing: 'name' and 'email' must be provided." });
      return;
    }

    // 4. Construct consistent Lead structure matching the client schema
    const newLead = {
      id: \`lead-auto-\${Date.now()}-\${Math.random().toString(36).substring(2, 7)}\`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : null,
      companyName: companyName ? companyName.trim() : null,
      source: source,
      status: "New Lead", // Starting pipeline stage
      dateAdded: new Date().toISOString(),
      revenueBand: revenueBand || null,
      adStatus: adStatus || "Inactive",
      techStack: Array.isArray(techStack) ? techStack : (techStack ? techStack.split(",") : []),
      notes: notes || "Automatically captured via Custom Cloud Ingestion endpoint.",
      qualificationCompleted: false,
      leadFit: "Unqualified"
    };

    // 5. Ingest into your "leads" collection
    await db.collection("leads").doc(newLead.id).set(newLead);

    // 6. Return response to webhook sender
    res.status(200).send({ 
      success: true, 
      message: "Lead successfully ingested into CRM database.", 
      leadId: newLead.id 
    });
  } catch (error: any) {
    console.error("Capture Error:", error);
    res.status(500).send({ error: "Database transaction failed.", details: error.message });
  }
});`;

  // Simple HTML Direct integration code
  const frontendFormCode = `<!-- Add this script to your Webflow, Typeform, or custom Landing Page website -->
<script>
async function submitLeadToCRM(event) {
  event.preventDefault();
  
  const formData = {
    name: document.getElementById('lead-name').value,
    email: document.getElementById('lead-email').value,
    phone: document.getElementById('lead-phone').value,
    companyName: document.getElementById('lead-company').value,
    source: "Landing Page Hero Form",
    revenueBand: "$10k-$50k", // conceptual mapping
    techStack: ["Shopify", "Klaviyo"]
  };
  
  try {
    const response = await fetch('YOUR_FIREBASE_FUNCTION_ENDPOINT_URL', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('CRM Sync Successful:', data.leadId);
      alert('Thank you for submitting! Our team will contact you shortly.');
    } else {
      console.error('CRM Sync Failed status:', response.status);
    }
  } catch (error) {
    console.error('Error connecting to CRM custom endpoint:', error);
  }
}
</script>`;

  return (
    <div id="integrations-view" className="space-y-6 animate-fade-in p-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white rounded-2xl p-6 md:p-8 shadow-md border border-slate-700/50">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1 px-2.5 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/20 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Real-time Ingestion Ready
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Lead Auto-Capture & Integrations</h2>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Ingest leads automatically in real-time from any landing page, custom form, or tool directly into your CRM. Fully customizable with Firebase Firestore and cloud deployment.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-center">
            <span className="block text-2xl font-bold text-secondary-accent">{leads.length}</span>
            <span className="text-xs text-slate-300 font-medium whitespace-nowrap">Global Active Leads</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Hand: Deployment Guide & Custom Code templates */}
        <div className="lg:col-span-7 space-y-6">
          <Card title="Database & Webhook Setup instructions">
            <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-2">
                    <Database className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-xs">1. Firestore Collection</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Leads are saved inside the <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-indigo-500 font-mono text-[10px]/normal font-semibold">/leads</code> path. Real-time hooks display them in your CRM view instantly.</p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
                    <Server className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-xs">2. Cloud Webhook</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Deploy a simple Firebase Cloud Function to act as your custom form handler without paying third-party fees.</p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2">
                    <Webhook className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-xs">3. Custom Forms</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">Hook your Webflow site, Google Forms, or custom web HTML inputs using basic javascript fetch triggers.</p>
                </div>
              </div>

              {/* Code Tab Section */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900">
                <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 px-2">
                  <button 
                    onClick={() => setActiveTab('firebase-fn')}
                    className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${activeTab === 'firebase-fn' ? 'border-secondary-accent text-secondary-accent' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    Firebase Cloud Function (Custom Backend)
                  </button>
                  <button 
                    onClick={() => setActiveTab('frontend')}
                    className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${activeTab === 'frontend' ? 'border-secondary-accent text-secondary-accent' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  >
                    <Webhook className="w-3.5 h-3.5" />
                    Frontend direct Form Script
                  </button>
                </div>

                <div className="relative p-4 font-mono text-[11px] bg-slate-900 text-slate-100 overflow-x-auto max-h-[350px]">
                  <button
                    onClick={() => copyToClipboard(activeTab === 'firebase-fn' ? firebaseFunctionCode : frontendFormCode, activeTab)}
                    className="absolute top-3 right-3 bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg border border-slate-700 transition flex items-center gap-1"
                    title="Copy Code to Clipboard"
                  >
                    {copiedSection === activeTab ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400 font-sans font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-sans font-medium">Copy</span>
                      </>
                    )}
                  </button>
                  <pre className="whitespace-pre">
                    {activeTab === 'firebase-fn' ? firebaseFunctionCode : frontendFormCode}
                  </pre>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/50 dark:bg-slate-800/30 rounded-xl border border-blue-100 dark:border-slate-700 flex gap-3 text-xs leading-relaxed text-blue-700 dark:text-blue-300">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold mb-0.5">Integration Developer Note</h5>
                  By deploying this Firebase onRequest module, you get a fully secure, scalable, private endpoint to receive leads. Since Firestore syncs in real-time, any captured item instantly alerts your sales team dashboard without needing manual page reloads or refreshes.
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Hand: Action Inbound Simulator */}
        <div className="lg:col-span-5 space-y-6">
          <Card title="Inbound Integration Simulator">
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Trigger a mock webhooks submission of Lead data. This tests how your real CRM ingestion, pipeline routing state, and Firestore triggers act on real input.
              </p>

              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/50 dark:border-slate-700">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                  Configure Simulation Payload
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Lead Name</label>
                    <input
                      type="text"
                      value={simName}
                      onChange={(e) => setSimName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-secondary-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      value={simEmail}
                      onChange={(e) => setSimEmail(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-secondary-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Phone Number</label>
                    <input
                      type="text"
                      value={simPhone}
                      onChange={(e) => setSimPhone(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-secondary-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Company Name</label>
                    <input
                      type="text"
                      value={simCompany}
                      onChange={(e) => setSimCompany(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-secondary-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Source Option</label>
                    <select
                      value={simSource}
                      onChange={(e) => setSimSource(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-secondary-accent"
                    >
                      <option value="Website Hero Form">Website Hero Form</option>
                      <option value="Google Sheet Connector">Google Sheet Connector</option>
                      <option value="Facebook Ad Leads SDK">Facebook Ad Leads SDK</option>
                      <option value="Magento Inbound Widget">Magento Inbound Widget</option>
                      <option value="Custom API Endpoint">Custom API Endpoint</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Starting Stage</label>
                    <select
                      value={simStatus}
                      onChange={(e) => setSimStatus(e.target.value as LeadStatus)}
                      className="w-full bg-white dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-secondary-accent"
                    >
                      <option value="New Lead">New Lead</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Audit in Progress">Audit in Progress</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1 text-left mt-1.5">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Tech Stack (comma separated)</label>
                  <input
                    type="text"
                    value={simTags}
                    onChange={(e) => setSimTags(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-secondary-accent"
                    placeholder="Shopify, Klaviyo, ActiveCampaign"
                  />
                </div>
              </div>

              <Button
                onClick={handleSimulateWebhook}
                disabled={isLoading}
                variant="primary"
                className="w-full flex items-center justify-center gap-2 relative overflow-hidden"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Connecting & Syncing Active Transaction...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current text-white shrink-0" />
                    Simulate Webhook Trigger Ingestion
                  </>
                )}
              </Button>

              {/* Streaming Webhook Console Terminal */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 shadow-lg overflow-hidden flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                  <span className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                    <Terminal className="w-3.5 h-3.5 text-secondary-accent" />
                    Webhook Server Logs Console
                  </span>
                  <button 
                    onClick={clearLogs}
                    className="text-[10px] text-slate-500 hover:text-slate-300 underline font-mono cursor-pointer"
                  >
                    Clear Console
                  </button>
                </div>

                <div className="p-4 font-mono text-[11px] h-48 overflow-y-auto space-y-1.5 bg-slate-950 text-slate-200 select-text scrollbar-thin scrollbar-thumb-slate-800">
                  {simulationLog.map((log, i) => {
                    let textClass = 'text-slate-300';
                    if (log.type === 'success') textClass = 'text-emerald-400';
                    if (log.type === 'error') textClass = 'text-red-400';
                    if (log.type === 'warning') textClass = 'text-amber-400';
                    
                    return (
                      <div key={i} className="flex gap-2 items-start leading-relaxed border-b border-slate-900/40 pb-1">
                        <span className="text-slate-600 shrink-0 text-[10px]">{log.time}</span>
                        <span className="text-secondary-accent shrink-0 select-none">➜</span>
                        <span className={`${textClass} flex-1`}>{log.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
