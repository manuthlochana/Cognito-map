'use client';

import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import KnowledgeGraph from '@/components/KnowledgeGraph';

export default function Home() {
  const [refreshGraph, setRefreshGraph] = useState(0);
  const [highlightNodes, setHighlightNodes] = useState<string[]>([]);

  const handleNewMemory = () => {
    setRefreshGraph(prev => prev + 1);
  };

  const handleHighlight = (nodeIds: string[]) => {
    setHighlightNodes(nodeIds);
  };

  return (
    <main className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar / Chat Area */}
      <div className="w-[400px] border-r bg-card z-10 shadow-xl">
        <ChatInterface onNewMemory={handleNewMemory} onHighlightNodes={handleHighlight} />
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative bg-slate-50 dark:bg-slate-950">
        <KnowledgeGraph refreshTrigger={refreshGraph} highlightNodeIds={highlightNodes} />
      </div>
    </main>
  );
}
