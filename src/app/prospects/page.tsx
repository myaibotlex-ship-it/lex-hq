'use client';

import { useState, useEffect } from 'react';

interface Contact {
  id: string;
  full_name: string;
  title: string;
  email: string;
  phone: string;
  linkedin_url: string;
  source: string;
  notes: string;
}

interface Prospect {
  id: string;
  company_name: string;
  website: string;
  current_provider: string;
  provider_type: string;
  confidence: string;
  source: string;
  evidence: string;
  employee_count: string;
  industry: string;
  headquarters: string;
  revenue_range: string;
  linkedin_url: string;
  signal_type: string;
  signal_date: string;
  notes: string;
  status: string;
  created_at: string;
  prospect_contacts: Contact[];
}

const PROVIDERS = ['RingCentral', '8x8', 'Vonage', 'Dialpad', 'GoTo', 'Nextiva', 'Webex', 'Five9', 'Genesys', 'NICE CXone', 'Talkdesk', 'Twilio Flex', 'Amazon Connect'];
const PROVIDER_TYPES = ['UCaaS', 'CCaaS', 'Both', 'Unknown'];
const CONFIDENCE_LEVELS = ['High', 'Medium', 'Low'];
const STATUSES = ['new', 'contacted', 'qualified', 'opportunity', 'closed'];

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    provider: '',
    providerType: '',
    confidence: '',
    status: '',
    search: '',
  });
  const [showAddContact, setShowAddContact] = useState<string | null>(null);
  const [newContact, setNewContact] = useState({
    full_name: '',
    title: '',
    email: '',
    phone: '',
    linkedin_url: '',
    source: '',
    notes: '',
  });

  useEffect(() => {
    fetchProspects();
  }, [filters]);

  const fetchProspects = async () => {
    const params = new URLSearchParams();
    if (filters.provider) params.set('provider', filters.provider);
    if (filters.providerType) params.set('providerType', filters.providerType);
    if (filters.confidence) params.set('confidence', filters.confidence);
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);

    const res = await fetch(`/api/prospects?${params}`);
    const data = await res.json();
    setProspects(data);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchProspects();
  };

  const addContact = async (prospectId: string) => {
    await fetch(`/api/prospects/${prospectId}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newContact),
    });
    setNewContact({ full_name: '', title: '', email: '', phone: '', linkedin_url: '', source: '', notes: '' });
    setShowAddContact(null);
    fetchProspects();
  };

  const stats = {
    total: prospects.length,
    ucaas: prospects.filter(p => p.provider_type === 'UCaaS').length,
    ccaas: prospects.filter(p => p.provider_type === 'CCaaS').length,
    newThisWeek: prospects.filter(p => {
      const created = new Date(p.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return created > weekAgo;
    }).length,
    byProvider: PROVIDERS.reduce((acc, p) => {
      acc[p] = prospects.filter(pr => pr.current_provider === p).length;
      return acc;
    }, {} as Record<string, number>),
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'UCaaS': return 'bg-blue-100 text-blue-800';
      case 'CCaaS': return 'bg-purple-100 text-purple-800';
      case 'Both': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (conf: string) => {
    switch (conf) {
      case 'High': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500';
      case 'contacted': return 'bg-yellow-500';
      case 'qualified': return 'bg-green-500';
      case 'opportunity': return 'bg-purple-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">📡 CLD Prospect Intelligence</h1>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Prospects</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.ucaas}</div>
            <div className="text-sm text-gray-500">UCaaS</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.ccaas}</div>
            <div className="text-sm text-gray-500">CCaaS</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{stats.newThisWeek}</div>
            <div className="text-sm text-gray-500">New This Week</div>
          </div>
        </div>

        {/* Provider Breakdown */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-semibold text-gray-700 mb-2">By Platform</h3>
          <div className="flex flex-wrap gap-2">
            {PROVIDERS.filter(p => stats.byProvider[p] > 0).map(provider => (
              <span key={provider} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                {provider}: <strong>{stats.byProvider[provider]}</strong>
              </span>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search company..."
              className="border rounded-lg px-3 py-2"
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
            />
            <select
              className="border rounded-lg px-3 py-2"
              value={filters.provider}
              onChange={e => setFilters({ ...filters, provider: e.target.value })}
            >
              <option value="">All Providers</option>
              {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select
              className="border rounded-lg px-3 py-2"
              value={filters.providerType}
              onChange={e => setFilters({ ...filters, providerType: e.target.value })}
            >
              <option value="">All Types</option>
              {PROVIDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              className="border rounded-lg px-3 py-2"
              value={filters.confidence}
              onChange={e => setFilters({ ...filters, confidence: e.target.value })}
            >
              <option value="">All Confidence</option>
              {CONFIDENCE_LEVELS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              className="border rounded-lg px-3 py-2"
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Prospects List */}
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : prospects.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
            No prospects found. Signal hunting will populate this list automatically.
          </div>
        ) : (
          <div className="space-y-4">
            {prospects.map(prospect => (
              <div key={prospect.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(expandedId === prospect.id ? null : prospect.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-10 rounded ${getStatusColor(prospect.status)}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg">{prospect.company_name}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getBadgeColor(prospect.provider_type)}`}>
                            {prospect.provider_type}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-3">
                          <span>🎯 {prospect.current_provider}</span>
                          <span className={getConfidenceColor(prospect.confidence)}>
                            ● {prospect.confidence} confidence
                          </span>
                          {prospect.employee_count && <span>👥 {prospect.employee_count}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {prospect.prospect_contacts?.length > 0 && (
                        <span className="text-sm text-gray-500">
                          {prospect.prospect_contacts.length} contact{prospect.prospect_contacts.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      <span className="text-gray-400">{expandedId === prospect.id ? '▼' : '▶'}</span>
                    </div>
                  </div>
                </div>

                {expandedId === prospect.id && (
                  <div className="border-t p-4 bg-gray-50">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Company Details */}
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Company Profile</h4>
                        <div className="space-y-1 text-sm">
                          {prospect.website && (
                            <div><span className="text-gray-500">Website:</span> <a href={prospect.website} target="_blank" className="text-blue-600 hover:underline">{prospect.website}</a></div>
                          )}
                          {prospect.industry && <div><span className="text-gray-500">Industry:</span> {prospect.industry}</div>}
                          {prospect.headquarters && <div><span className="text-gray-500">HQ:</span> {prospect.headquarters}</div>}
                          {prospect.revenue_range && <div><span className="text-gray-500">Revenue:</span> {prospect.revenue_range}</div>}
                          {prospect.linkedin_url && (
                            <div><span className="text-gray-500">LinkedIn:</span> <a href={prospect.linkedin_url} target="_blank" className="text-blue-600 hover:underline">View Profile</a></div>
                          )}
                        </div>

                        <h4 className="font-semibold text-gray-700 mt-4 mb-2">Signal</h4>
                        <div className="text-sm bg-white p-3 rounded border">
                          <div className="text-gray-500 text-xs mb-1">Source: {prospect.source}</div>
                          <div className="italic">"{prospect.evidence}"</div>
                        </div>

                        <div className="mt-4">
                          <span className="text-sm text-gray-500 mr-2">Status:</span>
                          <select
                            className="border rounded px-2 py-1 text-sm"
                            value={prospect.status || 'new'}
                            onChange={e => updateStatus(prospect.id, e.target.value)}
                          >
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Contacts */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-700">Contacts</h4>
                          <button
                            onClick={() => setShowAddContact(showAddContact === prospect.id ? null : prospect.id)}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            + Add Contact
                          </button>
                        </div>

                        {showAddContact === prospect.id && (
                          <div className="bg-white p-3 rounded border mb-3 space-y-2">
                            <input placeholder="Full Name" className="w-full border rounded px-2 py-1 text-sm" value={newContact.full_name} onChange={e => setNewContact({ ...newContact, full_name: e.target.value })} />
                            <input placeholder="Title" className="w-full border rounded px-2 py-1 text-sm" value={newContact.title} onChange={e => setNewContact({ ...newContact, title: e.target.value })} />
                            <input placeholder="Email" className="w-full border rounded px-2 py-1 text-sm" value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} />
                            <input placeholder="Phone" className="w-full border rounded px-2 py-1 text-sm" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} />
                            <input placeholder="LinkedIn URL" className="w-full border rounded px-2 py-1 text-sm" value={newContact.linkedin_url} onChange={e => setNewContact({ ...newContact, linkedin_url: e.target.value })} />
                            <button onClick={() => addContact(prospect.id)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Save Contact</button>
                          </div>
                        )}

                        {prospect.prospect_contacts?.length > 0 ? (
                          <div className="space-y-2">
                            {prospect.prospect_contacts.map(contact => (
                              <div key={contact.id} className="bg-white p-3 rounded border">
                                <div className="font-medium">{contact.full_name}</div>
                                <div className="text-sm text-gray-500">{contact.title}</div>
                                <div className="text-sm space-x-3 mt-1">
                                  {contact.email && <a href={`mailto:${contact.email}`} className="text-blue-600">📧 {contact.email}</a>}
                                  {contact.phone && <span>📞 {contact.phone}</span>}
                                  {contact.linkedin_url && <a href={contact.linkedin_url} target="_blank" className="text-blue-600">LinkedIn</a>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 italic">No contacts yet</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
