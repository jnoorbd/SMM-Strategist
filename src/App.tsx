/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Calendar, 
  Layout, 
  Target, 
  Share2, 
  Sparkles, 
  Loader2, 
  ChevronRight, 
  ChevronDown,
  Hash,
  Quote,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Download,
  BarChart3,
  BookOpen,
  Plus,
  ArrowRight,
  PieChart as PieChartIcon,
  Search,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Legend
} from 'recharts';

// --- Types ---

type ActiveTab = 'calendar' | 'analytics' | 'templates';

enum ContentPillar {
  EDUCATIONAL = "Educational",
  PROMOTIONAL = "Promotional",
  PERSONAL = "Personal/Behind-the-scenes",
  ENGAGEMENT = "Engagement/Poll",
  TRENDING = "Trending"
}

interface SocialPost {
  day: number;
  pillar: ContentPillar;
  topic: string;
  visualIdea: string;
  platform: string;
  hook: string;
  hashtags: string[];
}

interface CalendarData {
  posts: SocialPost[];
}

// --- Constants ---

const PLATFORMS = ["Instagram", "Facebook", "LinkedIn", "Twitter/X", "TikTok", "Pinterest"];

const TEMPLATES = [
  {
    name: "Eco-Friendly Skincare",
    niche: "Eco-friendly, organic skincare for sensitive skin",
    audience: "Gen Z and Millennial women interested in sustainability",
    platforms: ["Instagram", "TikTok", "Pinterest"]
  },
  {
    name: "SaaS for HR",
    niche: "AI-powered HR management software for remote teams",
    audience: "HR Managers and Founders of mid-sized tech companies",
    platforms: ["LinkedIn", "Twitter/X"]
  },
  {
    name: "Personal Fitness Coach",
    niche: "Online weight loss coaching and meal planning",
    audience: "Busy professionals aged 30-45 looking to get fit",
    platforms: ["Instagram", "Facebook", "TikTok"]
  },
  {
    name: "Local Coffee Shop",
    niche: "Specialty coffee roastery and community space",
    audience: "Local residents, students, and remote workers",
    platforms: ["Instagram", "Facebook"]
  },
  {
    name: "Real Estate Agent",
    niche: "Luxury residential real estate in urban areas",
    audience: "High-net-worth individuals and first-time luxury buyers",
    platforms: ["Instagram", "Facebook", "LinkedIn"]
  },
  {
    name: "Tech Gadget Reviewer",
    niche: "Unboxing and deep-dive reviews of latest consumer tech",
    audience: "Tech enthusiasts and early adopters aged 18-35",
    platforms: ["YouTube", "Twitter/X", "TikTok"]
  },
  {
    name: "Online Course Creator",
    niche: "Digital marketing and entrepreneurship courses",
    audience: "Aspiring entrepreneurs and side-hustlers",
    platforms: ["LinkedIn", "Instagram", "Facebook"]
  },
  {
    name: "Pet Grooming Service",
    niche: "Mobile pet grooming and organic pet treats",
    audience: "Pet owners who prioritize convenience and pet health",
    platforms: ["Facebook", "Instagram"]
  }
];

// --- Main Component ---

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('calendar');
  const [niche, setNiche] = useState('');
  const [audience, setAudience] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [calendar, setCalendar] = useState<SocialPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTemplates, setUserTemplates] = useState<typeof TEMPLATES>([]);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform) 
        : [...prev, platform]
    );
  };

  const generateCalendar = async () => {
    if (!niche || !audience || selectedPlatforms.length === 0) {
      setError("Please fill in all fields and select at least one platform.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCalendar(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const prompt = `
        As an expert Social Media Marketing (SMM) Specialist and Content Strategist, generate a comprehensive 30-day social media content schedule.
        
        Business Niche: ${niche}
        Target Audience: ${audience}
        Platforms: ${selectedPlatforms.join(", ")}
        
        Requirements:
        1. Mix: 40% Educational, 30% Engagement, 20% Promotional, 10% Personal/Trending.
        2. Tone: Professional yet conversational and results-driven.
        3. Each post must have a creative headline (topic), a visual idea, a hook (first line of caption), and 3-5 viral hashtags.
        4. Distribute posts across the selected platforms effectively.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              posts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.INTEGER },
                    pillar: { type: Type.STRING, enum: Object.values(ContentPillar) },
                    topic: { type: Type.STRING },
                    visualIdea: { type: Type.STRING },
                    platform: { type: Type.STRING },
                    hook: { type: Type.STRING },
                    hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["day", "pillar", "topic", "visualIdea", "platform", "hook", "hashtags"]
                }
              }
            },
            required: ["posts"]
          }
        }
      });

      const data = JSON.parse(response.text) as CalendarData;
      setCalendar(data.posts.sort((a, b) => a.day - b.day));
    } catch (err) {
      console.error(err);
      setError("Failed to generate calendar. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToCSV = () => {
    if (!calendar) return;

    const headers = ["Day", "Content Pillar", "Post Topic", "Visual Idea", "Platform", "Hook", "Hashtags"];
    const rows = calendar.map(post => [
      post.day,
      post.pillar,
      `"${post.topic.replace(/"/g, '""')}"`,
      `"${post.visualIdea.replace(/"/g, '""')}"`,
      post.platform,
      `"${post.hook.replace(/"/g, '""')}"`,
      `"${post.hashtags.join(', ')}"`
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `smm_calendar_${niche.replace(/\s+/g, '_').toLowerCase()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const analyticsData = useMemo(() => {
    if (!calendar) return null;

    const pillarCounts: Record<string, number> = {};
    const platformCounts: Record<string, number> = {};

    calendar.forEach(post => {
      pillarCounts[post.pillar] = (pillarCounts[post.pillar] || 0) + 1;
      platformCounts[post.platform] = (platformCounts[post.platform] || 0) + 1;
    });

    const pillarData = Object.entries(pillarCounts).map(([name, value]) => ({ name, value }));
    const platformData = Object.entries(platformCounts).map(([name, value]) => ({ name, value }));

    // Strategy Score Calculation
    // Ideal: 40% Edu, 30% Eng, 20% Pro, 10% Per/Trend
    const total = calendar.length;
    const eduScore = Math.max(0, 1 - Math.abs((pillarCounts[ContentPillar.EDUCATIONAL] || 0) / total - 0.4) * 2);
    const engScore = Math.max(0, 1 - Math.abs((pillarCounts[ContentPillar.ENGAGEMENT] || 0) / total - 0.3) * 2);
    const proScore = Math.max(0, 1 - Math.abs((pillarCounts[ContentPillar.PROMOTIONAL] || 0) / total - 0.2) * 2);
    const perScore = Math.max(0, 1 - Math.abs(((pillarCounts[ContentPillar.PERSONAL] || 0) + (pillarCounts[ContentPillar.TRENDING] || 0)) / total - 0.1) * 2);
    
    const strategyScore = Math.round((eduScore + engScore + proScore + perScore) / 4 * 100);

    return { pillarData, platformData, strategyScore };
  }, [calendar]);

  const saveAsTemplate = () => {
    if (!niche || !audience || selectedPlatforms.length === 0) return;
    const newTemplate = {
      name: `Custom: ${niche.slice(0, 20)}...`,
      niche,
      audience,
      platforms: selectedPlatforms
    };
    setUserTemplates(prev => [newTemplate, ...prev]);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const filteredTemplates = useMemo(() => {
    const allTemplates = [...userTemplates, ...TEMPLATES];
    if (!searchTerm) return allTemplates;
    return allTemplates.filter(t => 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.niche.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, userTemplates]);

  const PILLAR_COLORS: Record<string, string> = {
    [ContentPillar.EDUCATIONAL]: '#10b981',
    [ContentPillar.PROMOTIONAL]: '#f59e0b',
    [ContentPillar.ENGAGEMENT]: '#8b5cf6',
    [ContentPillar.PERSONAL]: '#3b82f6',
    [ContentPillar.TRENDING]: '#f43f5e',
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">SMM Strategist</h1>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <button 
              onClick={() => setActiveTab('calendar')}
              className={`${activeTab === 'calendar' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-gray-700'} h-16 flex items-center transition-all`}
            >
              Calendar Generator
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`${activeTab === 'analytics' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-gray-700'} h-16 flex items-center transition-all`}
            >
              Analytics
            </button>
            <button 
              onClick={() => setActiveTab('templates')}
              className={`${activeTab === 'templates' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-gray-700'} h-16 flex items-center transition-all`}
            >
              Templates
            </button>
          </div>
          {/* Mobile Nav Toggle (Simplified) */}
          <div className="md:hidden flex items-center gap-2">
             <button onClick={() => setActiveTab('calendar')} className={`p-2 rounded-lg ${activeTab === 'calendar' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}><Calendar className="w-5 h-5" /></button>
             <button onClick={() => setActiveTab('analytics')} className={`p-2 rounded-lg ${activeTab === 'analytics' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}><BarChart3 className="w-5 h-5" /></button>
             <button onClick={() => setActiveTab('templates')} className={`p-2 rounded-lg ${activeTab === 'templates' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}><BookOpen className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'calendar' && (
            <motion.div 
              key="calendar"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Sidebar Inputs */}
              <aside className="lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Layout className="w-4 h-4 text-blue-500" />
                      Business Niche
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Eco-friendly Skincare, SaaS for HR"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      value={niche}
                      onChange={(e) => setNiche(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      Target Audience
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Gen Z eco-conscious women"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-blue-500" />
                      Platforms
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {PLATFORMS.map(platform => (
                        <button
                          key={platform}
                          onClick={() => togglePlatform(platform)}
                          className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                            selectedPlatforms.includes(platform)
                              ? 'bg-blue-50 border-blue-200 text-blue-700'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {platform}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={generateCalendar}
                    disabled={isGenerating}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Strategy...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate 30-Day Plan
                      </>
                    )}
                  </button>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}
                </div>

                <div className="bg-blue-600 p-6 rounded-2xl text-white space-y-4 relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="font-bold text-lg">Pro Tip</h3>
                    <p className="text-blue-100 text-sm leading-relaxed">
                      Consistency is key. Use this AI-generated plan as a foundation, but don't forget to engage with your comments daily!
                    </p>
                  </div>
                  <Sparkles className="absolute -right-4 -bottom-4 w-24 h-24 text-blue-500 opacity-50" />
                </div>
              </aside>

              {/* Main Content Area */}
              <div className="lg:col-span-8">
                {!calendar && !isGenerating && (
                  <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-4 bg-white rounded-2xl border border-dashed border-gray-300 p-12">
                    <div className="bg-gray-50 p-4 rounded-full">
                      <Calendar className="w-12 h-12 text-gray-300" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">No Strategy Generated Yet</h2>
                      <p className="text-gray-500 max-w-sm mx-auto mt-2">
                        Enter your business details on the left to generate a high-converting 30-day content calendar.
                      </p>
                    </div>
                  </div>
                )}

                {isGenerating && (
                  <div className="space-y-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 animate-pulse flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-100 rounded w-1/4" />
                          <div className="h-3 bg-gray-50 rounded w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {calendar && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h2 className="text-xl sm:text-2xl font-bold flex flex-wrap items-center gap-2">
                        30-Day Content Roadmap
                        <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                          {niche}
                        </span>
                      </h2>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button 
                          onClick={exportToCSV}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                        >
                          <Download className="w-4 h-4" />
                          Export CSV
                        </button>
                        <button 
                          onClick={saveAsTemplate}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-100 transition-all shadow-sm active:scale-95 relative"
                        >
                          <Plus className="w-4 h-4" />
                          Save Template
                          <AnimatePresence>
                            {showSaveSuccess && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: -40 }}
                                exit={{ opacity: 0 }}
                                className="absolute left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap"
                              >
                                Saved to Templates!
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </button>
                        <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-xl border border-gray-200 sm:border-none transition-colors">
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Mobile View: Card List */}
                    <div className="md:hidden space-y-4">
                      {calendar.map((post) => (
                        <div 
                          key={post.day}
                          className={`bg-white rounded-2xl border transition-all overflow-hidden ${expandedDay === post.day ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200'}`}
                        >
                          <div 
                            className="p-4 flex items-center justify-between cursor-pointer active:bg-gray-50"
                            onClick={() => setExpandedDay(expandedDay === post.day ? null : post.day)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold">
                                #{post.day}
                              </div>
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md border ${getPillarStyles(post.pillar)}`}>
                                    {post.pillar.split('/')[0]}
                                  </span>
                                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                    {getPlatformIcon(post.platform)}
                                    {post.platform}
                                  </span>
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{post.topic}</h3>
                              </div>
                            </div>
                            {expandedDay === post.day ? <ChevronDown className="w-5 h-5 text-blue-500" /> : <ChevronRight className="w-5 h-5 text-gray-300" />}
                          </div>

                          <AnimatePresence>
                            {expandedDay === post.day && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="px-4 pb-5 space-y-4 border-t border-gray-50 pt-4"
                              >
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase">Visual Concept</h4>
                                    <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl">
                                      {post.visualIdea}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase">The Hook</h4>
                                    <p className="text-sm font-medium text-gray-800 italic border-l-2 border-blue-500 pl-3 py-1">
                                      {post.hook}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {post.hashtags.map(tag => (
                                      <span key={tag} className="text-[10px] text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-md">
                                        #{tag.replace('#', '')}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <button className="w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Mark as Scheduled
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>

                    {/* Desktop View: Table */}
                    <div className="hidden md:block bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-20">Day</th>
                              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Content Strategy</th>
                              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Platform</th>
                              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-16"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {calendar.map((post) => (
                              <React.Fragment key={post.day}>
                                <tr 
                                  className={`group hover:bg-blue-50/30 transition-colors cursor-pointer ${expandedDay === post.day ? 'bg-blue-50/50' : ''}`}
                                  onClick={() => setExpandedDay(expandedDay === post.day ? null : post.day)}
                                >
                                  <td className="px-6 py-4">
                                    <span className="text-lg font-bold text-blue-600">#{post.day}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getPillarStyles(post.pillar)}`}>
                                          {post.pillar}
                                        </span>
                                      </div>
                                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                        {post.topic}
                                      </h3>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                      {getPlatformIcon(post.platform)}
                                      {post.platform}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    {expandedDay === post.day ? <ChevronDown className="w-5 h-5 text-blue-500" /> : <ChevronRight className="w-5 h-5 text-gray-300" />}
                                  </td>
                                </tr>
                                <AnimatePresence>
                                  {expandedDay === post.day && (
                                    <tr>
                                      <td colSpan={4} className="px-6 py-0">
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="py-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-blue-100">
                                            <div className="space-y-4">
                                              <div className="space-y-2">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                                                  <ImageIcon className="w-3 h-3" />
                                                  Visual Concept
                                                </h4>
                                                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                  {post.visualIdea}
                                                </p>
                                              </div>
                                              <div className="space-y-2">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                                                  <Hash className="w-3 h-3" />
                                                  Hashtags
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                  {post.hashtags.map(tag => (
                                                    <span key={tag} className="text-xs text-blue-600 font-medium hover:underline cursor-pointer">
                                                      #{tag.replace('#', '')}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            </div>
                                            <div className="space-y-4">
                                              <div className="space-y-2">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                                                  <Quote className="w-3 h-3" />
                                                  The Hook
                                                </h4>
                                                <div className="relative">
                                                  <div className="absolute -left-2 top-0 text-blue-200">
                                                    <Quote className="w-8 h-8 rotate-180" />
                                                  </div>
                                                  <p className="text-base font-medium text-gray-800 italic pl-6 py-2">
                                                    {post.hook}
                                                  </p>
                                                </div>
                                              </div>
                                              <div className="pt-4">
                                                <button className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors">
                                                  <CheckCircle2 className="w-4 h-4" />
                                                  Mark as Scheduled
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        </motion.div>
                                      </td>
                                    </tr>
                                  )}
                                </AnimatePresence>
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-2xl">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Strategy Analytics</h2>
                    <p className="text-gray-500 text-sm">Visual breakdown of your 30-day content distribution.</p>
                  </div>
                </div>
                {calendar && (
                  <div className="bg-white px-6 py-3 rounded-2xl border border-gray-200 flex items-center gap-4 shadow-sm">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Strategy Score</p>
                      <p className="text-2xl font-black text-blue-600">{analyticsData?.strategyScore}%</p>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-blue-100 flex items-center justify-center relative">
                      <div 
                        className="absolute inset-0 rounded-full border-4 border-blue-600" 
                        style={{ clipPath: `inset(${100 - (analyticsData?.strategyScore || 0)}% 0 0 0)` }}
                      />
                      <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                )}
              </div>

              {!calendar ? (
                <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-300 text-center space-y-4">
                  <PieChartIcon className="w-12 h-12 text-gray-300 mx-auto" />
                  <p className="text-gray-500">Generate a calendar first to see your strategy analytics.</p>
                  <button 
                    onClick={() => setActiveTab('calendar')}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Go to Generator
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Layout className="w-5 h-5 text-blue-500" />
                      Content Pillar Distribution
                    </h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData?.pillarData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {analyticsData?.pillarData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PILLAR_COLORS[entry.name as ContentPillar] || '#8884d8'} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-blue-500" />
                      Platform Distribution
                    </h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData?.platformData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} />
                          <YAxis axisLine={false} tickLine={false} />
                          <Tooltip cursor={{fill: '#f3f4f6'}} />
                          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'templates' && (
            <motion.div 
              key="templates"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-2xl">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Industry Templates</h2>
                    <p className="text-gray-500 text-sm">Quick-start your strategy with pre-defined industry niches.</p>
                  </div>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Search templates..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template, idx) => (
                  <div 
                    key={`${template.name}-${idx}`}
                    className="group bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                    onClick={() => {
                      setNiche(template.niche);
                      setAudience(template.audience);
                      setSelectedPlatforms(template.platforms);
                      setActiveTab('calendar');
                    }}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="bg-blue-50 p-2 rounded-xl">
                          <Plus className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${template.name.startsWith('Custom:') ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'}`}>
                          {template.name.startsWith('Custom:') ? 'My Template' : 'Industry'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{template.name}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.niche}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {template.platforms.map(p => (
                          <span key={p} className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{p}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between text-blue-600 font-bold text-sm">
                      Use Template
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Helpers ---

import React from 'react';

function getPillarStyles(pillar: ContentPillar) {
  switch (pillar) {
    case ContentPillar.EDUCATIONAL:
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case ContentPillar.PROMOTIONAL:
      return "bg-amber-50 text-amber-700 border-amber-100";
    case ContentPillar.ENGAGEMENT:
      return "bg-purple-50 text-purple-700 border-purple-100";
    case ContentPillar.PERSONAL:
      return "bg-blue-50 text-blue-700 border-blue-100";
    case ContentPillar.TRENDING:
      return "bg-rose-50 text-rose-700 border-rose-100";
    default:
      return "bg-gray-50 text-gray-700 border-gray-100";
  }
}

function getPlatformIcon(platform: string) {
  const p = platform.toLowerCase();
  if (p.includes('instagram')) return <span className="w-2 h-2 rounded-full bg-pink-500" />;
  if (p.includes('facebook')) return <span className="w-2 h-2 rounded-full bg-blue-600" />;
  if (p.includes('linkedin')) return <span className="w-2 h-2 rounded-full bg-blue-800" />;
  if (p.includes('twitter') || p.includes('x')) return <span className="w-2 h-2 rounded-full bg-black" />;
  if (p.includes('tiktok')) return <span className="w-2 h-2 rounded-full bg-cyan-400" />;
  if (p.includes('pinterest')) return <span className="w-2 h-2 rounded-full bg-red-600" />;
  return <span className="w-2 h-2 rounded-full bg-gray-400" />;
}
