import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Award, 
  Code2, 
  HelpCircle, 
  Smile, 
  Compass, 
  BookMarked 
} from 'lucide-react';
import { Chapter } from '../types';
import { CHAPTERS } from '../data';

interface StoryPanelProps {
  currentChapter: Chapter;
  onNextChapter: () => void;
  onPrevChapter: () => void;
  isFirst: boolean;
  isLast: boolean;
  unlockedBadges: string[];
  totalChapters: number;
}

export default function StoryPanel({
  currentChapter,
  onNextChapter,
  onPrevChapter,
  isFirst,
  isLast,
  unlockedBadges,
  totalChapters
}: StoryPanelProps) {
  const [showCodeDetails, setShowCodeDetails] = useState(false);

  // Checks if the badge of the current chapter is unlocked
  const isBadgeUnlocked = unlockedBadges.includes(currentChapter.interactiveChallenge.badgeName);

  return (
    <div className="flex min-h-0 flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Chapter Index Tracker */}
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookMarked className="w-4 h-4 text-slate-500" />
          <span className="font-mono text-xs font-semibold text-slate-500 tracking-wider uppercase">
            Chapter {currentChapter.id} of {totalChapters}
          </span>
        </div>

        {/* Badge Progress Ticker */}
        <div className="flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-500" />
          <span className="font-mono text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded px-2 py-0.5 font-bold uppercase">
            {unlockedBadges.length} / {totalChapters} Achievements
          </span>
        </div>
      </div>

      {/* Main Content Reading Area */}
      <div className="flex-1 min-h-0 p-6 md:p-8 overflow-visible xl:overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentChapter.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="space-y-6"
          >
            {/* Header Title */}
            <div>
              <span className="text-xs font-mono text-amber-600 font-bold uppercase tracking-widest">{currentChapter.labyrinthPhase.replace('_', ' ')}</span>
              <h1 className="font-display font-bold text-3xl md:text-4xl text-slate-900 tracking-tight mt-1">
                {currentChapter.title}
              </h1>
            </div>

            {/* Structured Paragraph Sections */}
            <div className="space-y-4 text-slate-700 leading-relaxed font-sans text-[15px] md:text-[16px]">
              {currentChapter.sections.map((section, idx) => (
                <div key={idx} className="space-y-3">
                  {section.heading && (
                    <h2 className="font-display font-semibold text-lg text-slate-800 pt-4 first:pt-0">
                      {section.heading}
                    </h2>
                  )}
                  {section.text && (
                    <p className="whitespace-pre-line leading-relaxed text-slate-600">
                      {section.text}
                    </p>
                  )}
                  {section.quote && (
                    <blockquote className="border-l-4 border-amber-500 bg-amber-500/5 px-4 py-3 rounded-r-lg italic text-slate-800 font-medium">
                      {section.quote}
                    </blockquote>
                  )}
                </div>
              ))}
            </div>

            {/* Code Comparative Visualizer */}
            {currentChapter.codeExample && (
              <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-indigo-500" />
                    <span className="font-mono text-xs font-bold text-slate-500 uppercase">{currentChapter.codeExample.filename}</span>
                  </div>
                  
                  <button
                    onClick={() => setShowCodeDetails(!showCodeDetails)}
                    className="text-xs font-mono text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold hover:underline"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {showCodeDetails ? 'Hide analysis' : 'Analyze code'}
                  </button>
                </div>

                <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
                  {/* Fake IDE Header Bar */}
                  <div className="px-4 py-2 bg-slate-900 flex items-center justify-between border-b border-slate-800/80">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                      <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">readonly state</span>
                  </div>
                  
                  {/* Code Snippet in Mono */}
                  <pre className="p-4 text-xs font-mono text-indigo-200 overflow-x-auto leading-relaxed select-all">
                    <code>{currentChapter.codeExample.code}</code>
                  </pre>
                </div>

                <AnimatePresence>
                  {showCodeDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-600 leading-relaxed font-sans"
                    >
                      <strong className="text-slate-800 block mb-1">Architectural Analysis</strong>
                      {currentChapter.codeExample.explanation}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Achievement / Task Card Indicator */}
            <div className="mt-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-3.5">
              <div className={`p-2 rounded-lg shrink-0 ${isBadgeUnlocked ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-amber-100 text-amber-600 border border-amber-200'}`}>
                <Award className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600">Challenge Reward</span>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  Unlock Badge: <span className="font-mono text-xs px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-bold">{currentChapter.interactiveChallenge.badgeName}</span>
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  <strong>Activity:</strong> {currentChapter.interactiveChallenge.instruction}
                </p>

                {isBadgeUnlocked ? (
                  <div className="mt-2 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <Smile className="w-4 h-4" /> Challenge completed! Badge proudly pinned to your profile.
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-400 italic">
                    Task pending. Explore the labyrinth grid to unlock this badge.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <button
          onClick={onPrevChapter}
          disabled={isFirst}
          className={`px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed rounded-lg font-semibold text-xs text-slate-700 flex items-center gap-1.5 transition-all active:scale-95`}
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        <div className="hidden sm:flex gap-1">
          {Array.from({ length: totalChapters }).map((_, idx) => (
            <div 
              key={idx} 
              className={`w-2.5 h-1.5 rounded transition-all ${
                idx === currentChapter.id - 1 
                  ? 'bg-amber-500 w-5' 
                  : unlockedBadges.includes(CHAPTERS[idx].interactiveChallenge.badgeName)
                  ? 'bg-emerald-500' 
                  : 'bg-slate-200'
              }`} 
            />
          ))}
        </div>

        <button
          onClick={onNextChapter}
          className={`px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95`}
        >
          Next Chapter <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
export { CHAPTERS };
