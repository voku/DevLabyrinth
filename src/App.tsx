import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  HelpCircle, 
  BookOpen, 
  Layers, 
  ChevronRight, 
  ChevronLeft,
  RefreshCw, 
  Cpu, 
  Sparkles,
  Lock,
  GitMerge,
  BookMarked
} from 'lucide-react';
import { CHAPTERS } from './components/StoryPanel';
import StoryPanel from './components/StoryPanel';
import LabyrinthGame from './components/LabyrinthGame';
import { Chapter, LabyrinthPhase } from './types';

export default function App() {
  // Navigation & Chapters state
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [showFinishOverlay, setShowFinishOverlay] = useState<boolean>(false);
  
  const currentChapter = CHAPTERS[currentChapterIndex];

  // Callback from Labyrinth game when a challenge is mastered
  const handleActionComplete = (badgeName: string) => {
    if (!unlockedBadges.includes(badgeName)) {
      setUnlockedBadges(prev => [...prev, badgeName]);
    }
  };

  // Synchronize story progression & finish checkpoints
  const handleNextChapter = () => {
    if (currentChapterIndex < CHAPTERS.length - 1) {
      setCurrentChapterIndex(prev => prev + 1);
    } else {
      // Reached conclusion
      setShowFinishOverlay(true);
    }
  };

  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapterIndex(prev => prev - 1);
    }
  };

  const handleResetProgress = () => {
    setUnlockedBadges([]);
    setCurrentChapterIndex(0);
    setShowFinishOverlay(false);
  };

  // Check if all badges are unlocked
  const isMasterArchitect = unlockedBadges.length === CHAPTERS.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between overflow-x-hidden pb-16 xl:pb-0">
      {/* Dynamic Header */}
      <header className="bg-slate-900 text-white py-6 border-b border-slate-800 shadow-sm relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-radial-at-t from-amber-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2.5">
              <span className="text-[10px] font-mono font-extrabold uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded tracking-widest animate-pulse-slow">
                Interactive Essay Game
              </span>
            </div>
            
            <h1 className="text-2xl md:text-3xl font-display font-medium tracking-tight text-white flex items-center gap-2 justify-center sm:justify-start">
              <span>The Singleton Labyrinth</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono tracking-tight">
              A physical translation of the global state rot. Walk the shortcuts, debug the folklore, and isolate the thread.
            </p>
          </div>

          {/* Top Quick Badges Progress Indicator */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-950/80 border border-slate-800 p-2.5 px-4 rounded-xl flex items-center gap-3">
              <div className="bg-amber-500/10 p-1.5 rounded-lg text-amber-400 border border-amber-500/20">
                <Trophy className="w-4 h-4" />
              </div>
              <div className="text-left font-mono">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Labyrinth Rank</div>
                <div className="text-xs font-semibold text-slate-200">
                  {unlockedBadges.length === 0 ? 'Novice Wanderer' : 
                   unlockedBadges.length < 3 ? 'Folklore Apprentice' : 
                   unlockedBadges.length < 6 ? 'Senior Archaeologist' : '🏆 Master Architect'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col xl:flex-row gap-6 items-stretch justify-start xl:h-[min(840px,calc(100vh-15rem))] xl:h-[min(840px,calc(100dvh-15rem))] h-auto">
        
        {/* LEFT COLUMN: INTERACTIVE LABYRINTH BOARD MODULE */}
        <div className="flex-[4] flex min-h-0 flex-col justify-stretch xl:h-full">
          <LabyrinthGame 
            phase={currentChapter.labyrinthPhase} 
            onActionComplete={handleActionComplete} 
          />
        </div>

        {/* RIGHT COLUMN: BOOK STORIES & TEXT PANELS */}
        <div className="flex-[5] flex min-h-0 flex-col justify-stretch xl:h-full">
          <StoryPanel
            currentChapter={currentChapter}
            totalChapters={CHAPTERS.length}
            onNextChapter={handleNextChapter}
            onPrevChapter={handlePrevChapter}
            isFirst={currentChapterIndex === 0}
            isLast={currentChapterIndex === CHAPTERS.length - 1}
            unlockedBadges={unlockedBadges}
          />
        </div>
      </main>

      {/* LOWER DASHBOARD: TROPHY COLLECTION & LESSONS MAP */}
      <section className="bg-slate-900 text-slate-200 py-6 border-t border-slate-800 xl:max-h-[220px] xl:overflow-y-auto shrink-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-medium text-xs tracking-wider text-slate-400 uppercase flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Architectural Achievements Portfolio
            </h3>
            <button 
              onClick={handleResetProgress}
              className="text-[10px] font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1 hover:underline transition-all"
            >
              <RefreshCw className="w-3 h-3" /> Reset Walkthrough
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {CHAPTERS.map((chap) => {
              const bName = chap.interactiveChallenge.badgeName;
              const isUnlocked = unlockedBadges.includes(bName);
              const isActive = chap.id === currentChapter.id;

              return (
                <div 
                  key={chap.id}
                  onClick={() => setCurrentChapterIndex(chap.id - 1)}
                  className={`
                    p-3 rounded-xl border text-center transition-all cursor-pointer relative group select-none
                    ${isUnlocked 
                      ? 'bg-slate-950/80 border-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-950/20' 
                      : isActive 
                      ? 'bg-slate-800 border-amber-500/40 text-amber-400 ring-1 ring-amber-500/10' 
                      : 'bg-slate-950/30 border-slate-800/80 text-slate-500 hover:border-slate-800'}
                  `}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    {isUnlocked ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-110 transition-transform">
                        <Trophy className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-800/30 text-slate-600 flex items-center justify-center border border-slate-800 group-hover:bg-slate-800 transition-colors">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    )}
                    
                    <div className="font-mono text-[9px] font-bold uppercase truncate max-w-full">
                      {bName}
                    </div>

                    <div className="text-[8px] text-slate-500 font-sans tracking-tight leading-tight truncate w-full">
                      Ch.{chap.id}: {chap.title}
                    </div>
                  </div>

                  {/* Little indicator of progress */}
                  {isActive && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ESSAY QUOTES STRIP LOG - Architectural Honesty */}
      <footer className="bg-slate-950 text-slate-500 py-3 text-center border-t border-slate-900 select-none shrink-0">
        <p className="text-[10px] font-mono max-w-3xl mx-auto px-4 italic leading-relaxed text-slate-600">
          "Locality is what lets developers understand, test, and change code without holding the whole system in their head like some underpaid wizard."
        </p>
      </footer>

      {/* Floating Sticky Mobile Navigation Bar */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-white p-3 z-40 flex items-center justify-between shadow-2xl px-4 select-none">
        <button
          onClick={handlePrevChapter}
          disabled={currentChapterIndex === 0}
          className="p-2 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>
        
        <div className="flex flex-col items-center text-center px-1 min-w-0">
          <span className="text-[9px] font-mono uppercase text-amber-500 font-extrabold tracking-wider leading-none">
            Chapter {currentChapter.id} / {CHAPTERS.length}
          </span>
          <span className="text-xs font-bold text-slate-200 truncate max-w-[130px] sm:max-w-xs mt-1 leading-none">
            {currentChapter.title}
          </span>
        </div>

        <button
          onClick={handleNextChapter}
          className={`p-2 px-4 rounded-lg text-xs font-mono font-extrabold flex items-center gap-1 transition-all active:scale-95 ${
            unlockedBadges.includes(currentChapter.interactiveChallenge.badgeName)
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 animate-pulse font-black'
              : 'bg-slate-800 text-slate-300 font-bold'
          }`}
        >
          {currentChapterIndex === CHAPTERS.length - 1 ? 'Finish' : 'Next'} <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* SUCCESS OVERLAY TRIGGER */}
      <AnimatePresence>
        {showFinishOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-8 text-center space-y-6 shadow-2xl text-slate-100"
            >
              <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto animate-bounce">
                <Trophy className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="font-display font-bold text-2xl tracking-tight">The Labyrinth is Deconstructed</h2>
                <p className="text-xs text-slate-400 font-mono">
                  YOU HAVE EARNED THE STATUS: MASTER ARCHITECT
                </p>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                No new trapdoors. No magical shortcuts running through subterranean tunnels. No state leakage requiring boilerplate resets in target suites. You chose the explicit corridors of Dependency Injection. 
              </p>

              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-left space-y-2 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-500">Achievements unlocked:</span>
                  <span className="text-emerald-400 font-bold">{unlockedBadges.length} / {CHAPTERS.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Architecture state:</span>
                  <span className="text-emerald-400 font-bold">100% EXPLICIT (SAFE)</span>
                </div>
              </div>

              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={handleResetProgress}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold rounded-lg transition-colors active:scale-95"
                >
                  START WALKTHROUGH AGAIN
                </button>
                <button
                  onClick={() => setShowFinishOverlay(false)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-mono font-bold rounded-lg transition-colors active:scale-95"
                >
                  CONTINUE SANDBOX
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export { App };
