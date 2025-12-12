import React, { useState, useRef } from 'react';
import { Guide } from '../types';
import { ClockIcon, ToolIcon, CopyIcon, CheckIcon, PlayIcon } from './Icons';

interface GuideViewProps {
  guide: Guide;
}

const GuideView: React.FC<GuideViewProps> = ({ guide }) => {
  const [copied, setCopied] = useState(false);
  const [videoKey, setVideoKey] = useState(0); // Used to force iframe refresh for seek
  const [seekTime, setSeekTime] = useState(0);

  const copyToClipboard = () => {
    let text = `# ${guide.title}\n\n${guide.summary}\n\n`;
    text += `**Difficulty:** ${guide.difficulty} | **Time:** ${guide.estimatedTime}\n\n`;
    text += `## Prerequisites\n${guide.prerequisites.map(p => `- ${p}`).join('\n')}\n\n`;
    text += `## Steps\n`;
    guide.steps.forEach(step => {
      text += `### ${step.stepNumber}. ${step.title}`;
      if (step.estimatedTime) text += ` (${step.estimatedTime})`;
      text += `\n${step.description}\n`;
      if (step.codeSnippet) text += `\`\`\`\n${step.codeSnippet}\n\`\`\`\n`;
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTimestampClick = (timestamp: string) => {
    const parts = timestamp.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
    if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    
    setSeekTime(seconds);
    setVideoKey(prev => prev + 1); // Force re-render of iframe with new start time
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-32">
      {/* Header */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
          <span className={`px-3 py-1 rounded-full ${
            guide.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
            guide.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {guide.difficulty}
          </span>
          <span className="flex items-center text-gray-500">
            <ClockIcon className="w-4 h-4 mr-1" />
            {guide.estimatedTime}
          </span>
          {guide.playlistId && (
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
               <span className="w-2 h-2 rounded-full bg-purple-500"></span>
               Playlist
            </span>
          )}
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 font-serif leading-tight">
          {guide.title}
        </h1>
        
        <p className="text-xl text-gray-600 leading-relaxed">
          {guide.summary}
        </p>

        <button 
          onClick={copyToClipboard}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
        >
          {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
          {copied ? 'Copied Markdown' : 'Copy Guide'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Prerequisites */}
          <div className="bg-brand-50 rounded-xl p-6 border border-brand-100">
            <h3 className="text-lg font-bold text-brand-900 mb-4 flex items-center gap-2">
              <ToolIcon className="w-5 h-5" />
              Before you start
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs uppercase tracking-wide text-brand-700 font-bold mb-2">Prerequisites</h4>
                <ul className="space-y-1">
                  {guide.prerequisites.map((item, idx) => (
                    <li key={idx} className="text-sm text-brand-900 flex items-start">
                      <span className="mr-2">•</span>{item}
                    </li>
                  ))}
                  {guide.prerequisites.length === 0 && <li className="text-sm text-gray-500 italic">None</li>}
                </ul>
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-wide text-brand-700 font-bold mb-2">Tools Needed</h4>
                <ul className="space-y-1">
                  {guide.tools.map((item, idx) => (
                    <li key={idx} className="text-sm text-brand-900 flex items-start">
                      <span className="mr-2">•</span>{item}
                    </li>
                  ))}
                  {guide.tools.length === 0 && <li className="text-sm text-gray-500 italic">None</li>}
                </ul>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-8">
            {guide.steps.map((step) => (
              <div key={step.stepNumber} className="relative pl-8 md:pl-12 group">
                {/* Step Number Line */}
                <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 group-last:bg-transparent"></div>
                <div className="absolute left-0 top-0 -translate-x-1/2 w-8 h-8 rounded-full bg-white border-2 border-brand-500 text-brand-600 font-bold flex items-center justify-center text-sm z-10">
                  {step.stepNumber}
                </div>

                <div className="pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {step.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      {step.estimatedTime && (
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {step.estimatedTime}
                        </span>
                      )}
                      {step.timestamp && (
                        <button 
                          onClick={() => handleTimestampClick(step.timestamp!)}
                          className="text-xs font-medium text-brand-600 bg-brand-50 border border-brand-200 hover:bg-brand-100 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                          title="Jump to video section"
                        >
                          <PlayIcon className="w-3 h-3" />
                          {step.timestamp}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="prose prose-gray max-w-none text-gray-600 leading-relaxed whitespace-pre-line">
                    {step.description}
                  </div>
                  {step.codeSnippet && (
                    <div className="mt-4 bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-gray-100 font-mono">
                        <code>{step.codeSnippet}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Sidebar (Video Context) */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
            <div className="rounded-xl overflow-hidden shadow-lg bg-black aspect-video">
              <iframe 
                key={videoKey}
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${guide.videoId}?start=${seekTime}&autoplay=1`}
                title="YouTube video player" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-500 mb-2">Source Video</p>
              <a 
                href={guide.videoUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-brand-600 font-medium hover:underline line-clamp-2"
              >
                {guide.title} (Original)
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default GuideView;