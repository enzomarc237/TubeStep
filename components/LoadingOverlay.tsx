import React, { useEffect, useState } from 'react';
import { AppStatus, LoadingState } from '../types';
import { LoaderIcon } from './Icons';

interface LoadingOverlayProps {
  loadingState: LoadingState;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ loadingState }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length < 3 ? prev + '.' : '');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (loadingState.status === AppStatus.IDLE || loadingState.status === AppStatus.COMPLETE) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
          <div 
            className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin"
            style={{ animationDuration: '1.5s' }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <span className="text-xl font-bold text-brand-600">{loadingState.progress}%</span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">
            {loadingState.message}{dots}
          </h2>
          <p className="text-gray-500">
            {loadingState.status === AppStatus.FETCHING_TRANSCRIPT && "Retrieving video data..."}
            {loadingState.status === AppStatus.ANALYZING && "Understanding the workflow..."}
            {loadingState.status === AppStatus.GENERATING && "Crafting your step-by-step guide..."}
          </p>
        </div>

        {/* Progress Bar Visual */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-brand-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${loadingState.progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;