'use client';

import { useCallback, useEffect } from 'react';
import { ReactFlow, Background, Controls, useNodesState, useEdgesState, useReactFlow, ReactFlowProvider, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface KnowledgeGraphProps {
    refreshTrigger: number;
    highlightNodeIds: string[];
}

function KnowledgeGraphContent({ refreshTrigger, highlightNodeIds }: KnowledgeGraphProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const { fitView, setCenter } = useReactFlow();

    const fetchGraph = useCallback(async () => {
        try {
            const res = await fetch('/api/graph-data');
            const data = await res.json();
            setNodes(data.nodes || []);
            setEdges(data.edges || []);
        } catch (error) {
            console.error("Failed to fetch graph", error);
        }
    }, [setNodes, setEdges]);

    useEffect(() => {
        fetchGraph();
    }, [fetchGraph, refreshTrigger]);

    useEffect(() => {
        if (highlightNodeIds.length > 0 && nodes.length > 0) {
            const targetNode = nodes.find(n => highlightNodeIds.includes(n.id));
            if (targetNode) {
                setCenter(targetNode.position.x, targetNode.position.y, { zoom: 2, duration: 1000 });
                setNodes((nds) =>
                    nds.map((node) => {
                        if (highlightNodeIds.includes(node.id)) {
                            return { ...node, style: { border: '2px solid #ff0072', boxShadow: '0 0 10px #ff0072' } };
                        }
                        return { ...node, style: {} };
                    })
                );
            }
        }
    }, [highlightNodeIds, nodes, setCenter, setNodes]);

    return (
        <div className="w-full h-full">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                attributionPosition="bottom-right"
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
}

export default function KnowledgeGraph(props: KnowledgeGraphProps) {
    return (
        <ReactFlowProvider>
            <KnowledgeGraphContent {...props} />
        </ReactFlowProvider>
    );
}
