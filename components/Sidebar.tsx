import React, { useState } from 'react';
import { Guide } from '../types';
import { HistoryIcon, XIcon, ArrowRightIcon, SearchIcon, PlusIcon } from './Icons';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: Guide[];
  onSelectGuide: (guide: Guide) => void;
  onGoHome: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, history, onSelectGuide, onGoHome }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = history.filter(guide => 
    guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Panel */}
      <div className={`fixed inset-y-0 left-0 w-80 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          {/* Header Section */}
          <div className="p-4 border-b border-gray-100 bg-gray-50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-900 font-bold">
                <HistoryIcon className="w-5 h-5 text-brand-600" />
                <span>Library</span>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-500 lg:hidden">
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => {
                onGoHome();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-lg font-medium transition-colors shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
              New Guide
            </button>

            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search history..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {history.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p>No guides yet.</p>
                <p className="text-xs mt-2">Generate your first guide to see it here.</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p>No guides found.</p>
                <p className="text-xs mt-2">Try a different search term.</p>
              </div>
            ) : (
              filteredHistory.map((guide) => (
                <button 
                  key={guide.id}
                  onClick={() => {
                    onSelectGuide(guide);
                    onClose();
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-100 hover:border-brand-200 transition-all group relative overflow-hidden"
                >
                  {guide.playlistId && (
                     <div className="absolute top-0 right-0 bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                       PLAYLIST
                     </div>
                  )}
                  <div className="flex items-start gap-3">
                    <img 
                      src={`https://img.youtube.com/vi/${guide.videoId}/default.jpg`} 
                      alt="Thumbnail" 
                      className="w-16 h-12 object-cover rounded bg-gray-200"
                    />
                    <div className="flex-1 min-w-0 pt-1">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug group-hover:text-brand-700">
                        {guide.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                        <span>{new Date(guide.createdAt).toLocaleDateString()}</span>
                        <ArrowRightIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-brand-500" />
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          
          <div className="p-4 border-t border-gray-100 text-xs text-gray-400 text-center">
            TubeStep v1.0 • Powered by Gemini
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;