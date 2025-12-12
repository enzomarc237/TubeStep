import React from 'react';
import { Guide } from '../types';
import { HistoryIcon, XIcon, ArrowRightIcon } from './Icons';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: Guide[];
  onSelectGuide: (guide: Guide) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, history, onSelectGuide }) => {
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
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2 text-gray-900 font-bold">
              <HistoryIcon className="w-5 h-5 text-brand-600" />
              <span>Library</span>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-500">
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {history.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p>No guides yet.</p>
                <p className="text-xs mt-2">Generate your first guide to see it here.</p>
              </div>
            ) : (
              history.map((guide) => (
                <button 
                  key={guide.id}
                  onClick={() => {
                    onSelectGuide(guide);
                    onClose();
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-100 hover:border-brand-200 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <img 
                      src={`https://img.youtube.com/vi/${guide.videoId}/default.jpg`} 
                      alt="Thumbnail" 
                      className="w-16 h-12 object-cover rounded bg-gray-200"
                    />
                    <div className="flex-1 min-w-0">
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