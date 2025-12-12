import React, { useState, useEffect } from 'react';
import { Guide, AppStatus, LoadingState } from './types';
import { generateGuideFromVideo, extractVideoId } from './services/geminiService';
import LoadingOverlay from './components/LoadingOverlay';
import GuideView from './components/GuideView';
import Sidebar from './components/Sidebar';
import { MenuIcon, ArrowRightIcon, PlayIcon } from './components/Icons';

const App: React.FC = () => {
  // State
  const [urlInput, setUrlInput] = useState('');
  const [currentGuide, setCurrentGuide] = useState<Guide | null>(null);
  const [history, setHistory] = useState<Guide[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [loadingState, setLoadingState] = useState<LoadingState>({
    status: AppStatus.IDLE,
    message: '',
    progress: 0
  });

  // Load history from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('tubestep_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history when it changes
  useEffect(() => {
    localStorage.setItem('tubestep_history', JSON.stringify(history));
  }, [history]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const videoId = extractVideoId(urlInput);
    if (!videoId) {
      alert("Invalid YouTube URL. Please use a standard URL (e.g., youtube.com/watch?v=...)");
      return;
    }

    // Reset current view
    setCurrentGuide(null);

    // Simulation of stages for UX
    setLoadingState({ status: AppStatus.FETCHING_TRANSCRIPT, message: 'Connecting to video source', progress: 10 });
    
    try {
      // Stage 1: Simulated Fetch (Wait 1.5s)
      await new Promise(r => setTimeout(r, 1500));
      setLoadingState({ status: AppStatus.ANALYZING, message: 'Analyzing video structure', progress: 40 });

      // Stage 2: Call Gemini
      const partialGuide = await generateGuideFromVideo(urlInput);
      
      setLoadingState({ status: AppStatus.GENERATING, message: 'Writing step-by-step instructions', progress: 80 });
      
      // Stage 3: Finalize
      await new Promise(r => setTimeout(r, 800)); // Smooth transition

      const newGuide: Guide = {
        id: crypto.randomUUID(),
        videoUrl: urlInput,
        videoId: videoId,
        title: partialGuide.title || "Untitled Guide",
        summary: partialGuide.summary || "No summary available.",
        estimatedTime: partialGuide.estimatedTime || "Unknown",
        difficulty: partialGuide.difficulty || "Beginner",
        prerequisites: partialGuide.prerequisites || [],
        tools: partialGuide.tools || [],
        steps: partialGuide.steps || [],
        createdAt: Date.now()
      };

      setHistory(prev => [newGuide, ...prev]);
      setCurrentGuide(newGuide);
      setUrlInput('');
      setLoadingState({ status: AppStatus.COMPLETE, message: 'Done!', progress: 100 });
      
      // Reset loading state after a moment
      setTimeout(() => {
        setLoadingState({ status: AppStatus.IDLE, message: '', progress: 0 });
      }, 500);

    } catch (error) {
      console.error(error);
      setLoadingState({ status: AppStatus.ERROR, message: 'Failed to generate guide', progress: 0 });
      alert("Something went wrong. Please check your API key or try a different video.");
      setLoadingState({ status: AppStatus.IDLE, message: '', progress: 0 });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 flex-col md:flex-row">
      
      {/* Sidebar for Desktop / Mobile Drawer */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        history={history}
        onSelectGuide={setCurrentGuide}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Navigation Bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-8 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <MenuIcon />
            </button>
            <div 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => setCurrentGuide(null)}
            >
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                T
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900 hidden sm:block">TubeStep</span>
            </div>
          </div>

          <div className="flex items-center">
             {/* If we had user auth, profile would go here */}
             <span className="text-xs font-medium text-gray-400 border border-gray-200 px-2 py-1 rounded">Beta</span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth no-scrollbar">
          
          {loadingState.status !== AppStatus.IDLE && (
            <LoadingOverlay loadingState={loadingState} />
          )}

          {!currentGuide ? (
            // Hero / Empty State
            <div className="min-h-full flex flex-col items-center justify-center px-4 py-12 md:pb-32">
              <div className="text-center max-w-2xl space-y-6">
                <div className="inline-flex items-center justify-center p-3 bg-brand-100 rounded-full mb-4">
                  <PlayIcon className="w-8 h-8 text-brand-600 ml-1" />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight font-serif">
                  Turn Videos into <br className="hidden md:block" />
                  <span className="text-brand-600">Actionable Guides</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-500 max-w-lg mx-auto leading-relaxed">
                  Stop pausing and rewinding. Paste a YouTube tutorial link and get a structured, step-by-step written guide instantly.
                </p>
                
                <form onSubmit={handleGenerate} className="w-full max-w-lg mx-auto relative mt-8 group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-brand-400 to-green-300 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                  <div className="relative flex items-center bg-white rounded-xl shadow-xl overflow-hidden p-2 ring-1 ring-gray-900/5 focus-within:ring-2 focus-within:ring-brand-500">
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="Paste YouTube URL here..."
                      className="flex-1 px-4 py-3 text-gray-700 outline-none placeholder-gray-400 bg-transparent text-lg w-full"
                    />
                    <button 
                      type="submit"
                      disabled={!urlInput.trim() || loadingState.status !== AppStatus.IDLE}
                      className="bg-brand-600 hover:bg-brand-700 text-white p-3 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowRightIcon className="w-6 h-6" />
                    </button>
                  </div>
                </form>

                <div className="pt-8 flex flex-wrap justify-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    ✓ Powered by Gemini 2.5
                  </span>
                  <span className="flex items-center gap-1">
                    ✓ Export to Markdown
                  </span>
                  <span className="flex items-center gap-1">
                    ✓ Free for Beta
                  </span>
                </div>
              </div>
            </div>
          ) : (
            // Guide View
            <GuideView guide={currentGuide} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;