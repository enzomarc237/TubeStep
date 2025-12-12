import React, { useState, useEffect } from 'react';
import { Guide, AppStatus, LoadingState } from './types';
import { generateGuideFromVideo, extractVideoId, extractPlaylistId, getVideosFromPlaylist } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import LoadingOverlay from './components/LoadingOverlay';
import GuideView from './components/GuideView';
import Sidebar from './components/Sidebar';
import AuthModal from './components/AuthModal';
import { MenuIcon, ArrowRightIcon, PlayIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, UserIcon, LogOutIcon } from './components/Icons';

const App: React.FC = () => {
  // State
  const [urlInput, setUrlInput] = useState('');
  const [currentGuide, setCurrentGuide] = useState<Guide | null>(null);
  const [history, setHistory] = useState<Guide[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [loadingState, setLoadingState] = useState<LoadingState>({
    status: AppStatus.IDLE,
    message: '',
    progress: 0
  });

  // Auth Status Check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchSupabaseHistory(session.user.id);
      else loadLocalHistory();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
         // Clear local history from state to avoid confusion, fetch DB history
         fetchSupabaseHistory(newUser.id);
      } else {
         // Fallback to local
         loadLocalHistory();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadLocalHistory = () => {
    const savedHistory = localStorage.getItem('tubestep_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse local history", e);
      }
    }
  };

  const fetchSupabaseHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('guides')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map DB snake_case to CamelCase Guide interface if needed
      // Assuming DB columns match keys but strictly snake_case vs camelCase needs attention if mismatched.
      // Based on the SQL provided, we used snake_case for DB columns.
      // We need to map them.
      const mappedGuides: Guide[] = (data || []).map((row: any) => ({
        id: row.id,
        videoUrl: row.video_url,
        videoId: row.video_id,
        playlistId: row.playlist_id,
        title: row.title,
        summary: row.summary,
        estimatedTime: row.estimated_time,
        difficulty: row.difficulty,
        prerequisites: row.prerequisites || [],
        tools: row.tools || [],
        steps: row.steps || [],
        sources: row.sources || [],
        createdAt: new Date(row.created_at).getTime()
      }));

      setHistory(mappedGuides);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  const saveGuideToHistory = async (guide: Guide) => {
    // Optimistic Update
    setHistory(prev => [guide, ...prev]);

    if (user) {
      // Save to Supabase
      try {
        const { error } = await supabase.from('guides').insert({
          user_id: user.id,
          video_url: guide.videoUrl,
          video_id: guide.videoId,
          playlist_id: guide.playlistId,
          title: guide.title,
          summary: guide.summary,
          estimated_time: guide.estimatedTime,
          difficulty: guide.difficulty,
          prerequisites: guide.prerequisites,
          tools: guide.tools,
          steps: guide.steps,
          sources: guide.sources
        });
        if (error) console.error("Failed to save to Supabase:", error);
        // Refresh to get real ID if needed, but for now ID is generated
      } catch (err) {
        console.error("Supabase insert error", err);
      }
    } else {
      // Save to LocalStorage
      const newHistory = [guide, ...history];
      localStorage.setItem('tubestep_history', JSON.stringify(newHistory));
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentGuide(null);
  };

  const processSingleVideo = async (url: string, playlistId?: string) => {
    const videoId = extractVideoId(url);
    if (!videoId) return null;

    // Call Gemini
    const { guide: partialGuide, sources } = await generateGuideFromVideo(url);
    
    // Create Guide object
    return {
      id: crypto.randomUUID(),
      videoUrl: url,
      videoId: videoId,
      playlistId: playlistId,
      title: partialGuide.title || "Untitled Guide",
      summary: partialGuide.summary || "No summary available.",
      estimatedTime: partialGuide.estimatedTime || "Unknown",
      difficulty: partialGuide.difficulty || "Beginner",
      prerequisites: partialGuide.prerequisites || [],
      tools: partialGuide.tools || [],
      steps: partialGuide.steps || [],
      createdAt: Date.now(),
      sources: sources
    } as Guide;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    // Check for Playlist
    const playlistId = extractPlaylistId(urlInput);
    const isPlaylist = !!playlistId;

    // Reset current view if it's a new request
    setCurrentGuide(null);

    try {
      if (isPlaylist && playlistId) {
        setLoadingState({ status: AppStatus.FETCHING_TRANSCRIPT, message: 'Found Playlist. Analyzing...', progress: 5 });
        const videos = await getVideosFromPlaylist(playlistId);
        
        if (videos.length === 0) {
           throw new Error("Could not retrieve videos from this playlist.");
        }

        const newGuides: Guide[] = [];
        
        // Process sequentially to show progress
        for (let i = 0; i < videos.length; i++) {
          const videoUrl = videos[i];
          const progressStep = 100 / videos.length;
          setLoadingState({ 
            status: AppStatus.GENERATING, 
            message: `Processing video ${i + 1} of ${videos.length}`, 
            progress: Math.round((i * progressStep)) 
          });

          const guide = await processSingleVideo(videoUrl, playlistId);
          if (guide) {
            newGuides.push(guide);
            await saveGuideToHistory(guide);
          }
        }

        if (newGuides.length > 0) {
          setCurrentGuide(newGuides[0]); // Show first one
        }

      } else {
        // Single Video
        const videoId = extractVideoId(urlInput);
        if (!videoId) {
          alert("Invalid YouTube URL.");
          return;
        }

        setLoadingState({ status: AppStatus.FETCHING_TRANSCRIPT, message: 'Connecting to video source', progress: 10 });
        await new Promise(r => setTimeout(r, 1000)); // UX delay
        
        setLoadingState({ status: AppStatus.ANALYZING, message: 'Analyzing video structure', progress: 40 });
        const guide = await processSingleVideo(urlInput);
        
        if (guide) {
          setLoadingState({ status: AppStatus.GENERATING, message: 'Finalizing guide...', progress: 90 });
          await saveGuideToHistory(guide);
          setCurrentGuide(guide);
        }
      }

      setUrlInput('');
      setLoadingState({ status: AppStatus.COMPLETE, message: 'Done!', progress: 100 });
      setTimeout(() => {
        setLoadingState({ status: AppStatus.IDLE, message: '', progress: 0 });
      }, 500);

    } catch (error) {
      console.error(error);
      setLoadingState({ status: AppStatus.ERROR, message: 'Failed to generate guide', progress: 0 });
      alert("Something went wrong. Please check your URL and try again.");
      setLoadingState({ status: AppStatus.IDLE, message: '', progress: 0 });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* Auth Modal */}
      {isAuthModalOpen && <AuthModal onClose={() => setIsAuthModalOpen(false)} />}

      {/* Sidebar - Now handles its own width in Sidebar.tsx via className props */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        history={history}
        onSelectGuide={setCurrentGuide}
        onGoHome={() => setCurrentGuide(null)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0 transition-all duration-300">
        
        {/* Navigation Bar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-6 z-30 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Toggle */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600 focus:outline-none"
            >
              <MenuIcon />
            </button>
            
            {/* Desktop Toggle */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:block p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 focus:outline-none"
              title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {isSidebarOpen ? <PanelLeftCloseIcon /> : <PanelLeftOpenIcon />}
            </button>

            <div 
              className="flex items-center gap-2 cursor-pointer ml-2" 
              onClick={() => setCurrentGuide(null)}
            >
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                T
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900 hidden sm:block">TubeStep</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             {user ? (
               <div className="flex items-center gap-3">
                 <div className="text-xs text-gray-500 hidden sm:block">
                   {user.email}
                 </div>
                 <button 
                   onClick={handleSignOut}
                   className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                   title="Sign Out"
                 >
                   <LogOutIcon className="w-5 h-5" />
                 </button>
               </div>
             ) : (
               <button
                 onClick={() => setIsAuthModalOpen(true)}
                 className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-600 bg-gray-50 hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors border border-gray-200 hover:border-brand-200"
               >
                 <UserIcon className="w-4 h-4" />
                 <span>Sign In</span>
               </button>
             )}
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
                      placeholder="Paste YouTube URL or Playlist here..."
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
                    ✓ Playlists Support
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