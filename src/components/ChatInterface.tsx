'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, BrainCircuit } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatInterfaceProps {
    onNewMemory: () => void;
    onHighlightNodes: (nodeIds: string[]) => void;
}

export default function ChatInterface({ onNewMemory, onHighlightNodes }: ChatInterfaceProps) {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'ingest' | 'query'>('ingest');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            if (mode === 'ingest') {
                const res = await fetch('/api/ingest-memory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: userMsg }),
                });
                const data = await res.json();
                if (data.success) {
                    setMessages(prev => [...prev, { role: 'assistant', content: `Memory ingested! Created ${data.nodes} nodes and ${data.edges} edges.` }]);
                    onNewMemory();
                } else {
                    setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to ingest memory.' }]);
                }
            } else {
                const res = await fetch('/api/query-brain', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question: userMsg }),
                });
                const data = await res.json();
                if (data.answer) {
                    setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
                    if (data.sourceNodeIds) {
                        onHighlightNodes(data.sourceNodeIds);
                    }
                } else {
                    setMessages(prev => [...prev, { role: 'assistant', content: 'I could not find an answer.' }]);
                }
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'An error occurred.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full h-full flex flex-col border-none shadow-none bg-transparent">
            <CardHeader className="px-4 py-2 border-b">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5" />
                        Cognito-Map
                    </CardTitle>
                    <div className="flex gap-2 text-xs">
                        <Button
                            variant={mode === 'ingest' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setMode('ingest')}
                        >
                            Ingest
                        </Button>
                        <Button
                            variant={mode === 'query' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setMode('query')}
                        >
                            Query
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${m.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                    }`}>
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        {loading && <div className="text-xs text-muted-foreground text-center">Thinking...</div>}
                    </div>
                </ScrollArea>
                <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={mode === 'ingest' ? "Type a memory..." : "Ask a question..."}
                        disabled={loading}
                    />
                    <Button type="submit" size="icon" disabled={loading}>
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
