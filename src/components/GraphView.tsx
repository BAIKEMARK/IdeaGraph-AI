import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphStructure, GraphNode, GraphEdge } from '@/types/types';
import { GraphData, Level1GraphData, Level2GraphData, IdeaNode, EntityNode, SimilarityEdge, RelationEdge } from '@/utils/graphLevelManager';
import { ArrowLeft } from 'lucide-react';

interface GraphViewProps {
  data?: GraphStructure; // Legacy support for Level 2 direct data
  level?: 1 | 2;
  graphData?: GraphData;
  onNodeClick?: (nodeId: string) => void;
  onBackToLevel1?: () => void;
}

// Internal types for D3 Simulation - Level 1
interface D3IdeaNode extends d3.SimulationNodeDatum, IdeaNode {
  x?: number;
  y?: number;
}

interface D3SimilarityLink extends d3.SimulationLinkDatum<D3IdeaNode> {
  source: D3IdeaNode | string | number;
  target: D3IdeaNode | string | number;
  similarity: number;
  type: 'similarity';
}

// Internal types for D3 Simulation - Level 2
interface D3EntityNode extends d3.SimulationNodeDatum, EntityNode {
  x?: number;
  y?: number;
}

interface D3RelationLink extends d3.SimulationLinkDatum<D3EntityNode> {
  source: D3EntityNode | string | number;
  target: D3EntityNode | string | number;
  relation: string;
  desc?: string;
}

// Legacy D3 types for backward compatibility
interface D3Node extends d3.SimulationNodeDatum, GraphNode {
  x?: number;
  y?: number;
}
interface D3Link extends d3.SimulationLinkDatum<D3Node>, Omit<GraphEdge, 'source' | 'target'> {
  source: D3Node | string | number;
  target: D3Node | string | number;
}

export const GraphView: React.FC<GraphViewProps> = ({ 
  data, 
  level = 2, 
  graphData, 
  onNodeClick,
  onBackToLevel1 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine which rendering mode to use
  const renderingMode = graphData ? graphData.level : (data ? 2 : null);

  // Initialize D3 Graph
  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;
    if (!graphData && !data) return;

    let cleanup: (() => void) | undefined;

    // Route to appropriate renderer
    if (renderingMode === 1 && graphData) {
      cleanup = renderLevel1Graph(graphData as Level1GraphData);
    } else if (renderingMode === 2) {
      if (graphData) {
        cleanup = renderLevel2Graph(graphData as Level2GraphData);
      } else if (data) {
        cleanup = renderLegacyGraph(data);
      }
    }

    return () => {
      if (cleanup) cleanup();
    };
  }, [graphData, data, dimensions, renderingMode]);

  // Render Level 1 Graph (Macro view with idea nodes)
  const renderLevel1Graph = (level1Data: Level1GraphData): (() => void) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const width = dimensions.width;
    const height = dimensions.height;

    // Deep copy data for D3 mutation
    const nodes: D3IdeaNode[] = level1Data.nodes.map(d => ({ ...d }));
    const links: D3SimilarityLink[] = level1Data.edges.map(d => ({ 
      ...d,
      similarity: d.similarity 
    }));

    // Zoom behavior
    const g = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom as any);

    // Simulation
    const simulation = d3.forceSimulation<D3IdeaNode>(nodes)
      .force("link", d3.forceLink<D3IdeaNode, D3SimilarityLink>(links).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(50));

    // Scale for edge thickness and opacity based on similarity
    const thicknessScale = d3.scaleLinear()
      .domain([level1Data.metadata.similarityThreshold, 1])
      .range([1, 4]);
    
    const opacityScale = d3.scaleLinear()
      .domain([level1Data.metadata.similarityThreshold, 1])
      .range([0.3, 0.9]);

    // Draw Links with similarity-based styling
    const link = g.append("g")
      .attr("stroke", "#475569")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", d => thicknessScale(d.similarity))
      .attr("stroke-opacity", d => opacityScale(d.similarity))
      .style("cursor", "pointer");

    // Tooltip for edges showing similarity score
    link.append("title")
      .text(d => `Similarity: ${(d.similarity * 100).toFixed(1)}%`);

    // Draw Nodes (Idea nodes)
    const node = g.append("g")
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 2)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 20)
      .attr("fill", "#6366f1") // Indigo for idea nodes
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        if (onNodeClick) {
          onNodeClick(d.id);
        }
      })
      // Drag behavior
      .call(d3.drag<SVGCircleElement, D3IdeaNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any);
    
    // Tooltip for nodes
    node.append("title")
      .text(d => `${d.label}\nTags: ${d.tags.join(', ')}`);

    // Node Labels
    const label = g.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("dx", 25)
      .attr("dy", 4)
      .text(d => d.label.length > 40 ? d.label.substring(0, 40) + '...' : d.label)
      .attr("fill", "#e2e8f0")
      .attr("font-size", "13px")
      .attr("font-weight", "500")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 4px #000");

    // Simulation Tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as D3IdeaNode).x!)
        .attr("y1", d => (d.source as D3IdeaNode).y!)
        .attr("x2", d => (d.target as D3IdeaNode).x!)
        .attr("y2", d => (d.target as D3IdeaNode).y!);

      node
        .attr("cx", d => d.x!)
        .attr("cy", d => d.y!);

      label
        .attr("x", d => d.x!)
        .attr("y", d => d.y!);
    });

    // Add smooth transition animation
    node
      .attr("r", 0)
      .transition()
      .duration(500)
      .attr("r", 20);

    link
      .attr("stroke-opacity", 0)
      .transition()
      .duration(500)
      .attr("stroke-opacity", d => opacityScale(d.similarity));

    return () => {
      simulation.stop();
    };
  };

  // Render Level 2 Graph (Micro view with entity nodes)
  const renderLevel2Graph = (level2Data: Level2GraphData): (() => void) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const width = dimensions.width;
    const height = dimensions.height;

    // Deep copy data for D3 mutation
    const nodes: D3EntityNode[] = level2Data.nodes.map(d => ({ ...d }));
    const links: D3RelationLink[] = level2Data.edges.map(d => ({ ...d }));

    // Color Scale based on entity type
    const colorMap: Record<string, string> = {
      'Concept': '#8b5cf6',     // Purple
      'Tool': '#3b82f6',        // Blue
      'Person': '#f59e0b',      // Amber
      'Problem': '#ef4444',     // Red
      'Solution': '#10b981',    // Green
      'Methodology': '#06b6d4', // Cyan
      'Metric': '#ec4899',      // Pink
    };

    // Zoom behavior
    const g = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom as any);

    // Simulation
    const simulation = d3.forceSimulation<D3EntityNode>(nodes)
      .force("link", d3.forceLink<D3EntityNode, D3RelationLink>(links).id(d => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(40));

    // Define Arrow markers
    svg.append("defs").selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "#64748b")
      .attr("d", "M0,-5L10,0L0,5");

    // Draw Links
    const link = g.append("g")
      .attr("stroke", "#475569")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");

    // Link Labels
    const linkLabel = g.append("g")
        .attr("class", "link-labels")
        .selectAll("text")
        .data(links)
        .enter().append("text")
        .attr("class", "link-label")
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#94a3b8")
        .text(d => d.relation);

    // Draw Nodes
    const node = g.append("g")
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 15)
      .attr("fill", d => colorMap[d.type] || '#6366f1')
      .attr("cursor", "pointer")
      // Drag behavior
      .call(d3.drag<SVGCircleElement, D3EntityNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any);
    
    // Tooltip behavior for nodes
    node.append("title")
        .text(d => `${d.label}\nType: ${d.type}\n${d.desc}`);

    // Node Labels
    const label = g.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("dx", 18)
      .attr("dy", 4)
      .text(d => d.label)
      .attr("fill", "#e2e8f0")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 4px #000");

    // Simulation Tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as D3EntityNode).x!)
        .attr("y1", d => (d.source as D3EntityNode).y!)
        .attr("x2", d => (d.target as D3EntityNode).x!)
        .attr("y2", d => (d.target as D3EntityNode).y!);

      node
        .attr("cx", d => d.x!)
        .attr("cy", d => d.y!);

      label
        .attr("x", d => d.x!)
        .attr("y", d => d.y!);

      linkLabel
        .attr("x", d => ((d.source as D3EntityNode).x! + (d.target as D3EntityNode).x!) / 2)
        .attr("y", d => ((d.source as D3EntityNode).y! + (d.target as D3EntityNode).y!) / 2);
    });

    // Add smooth transition animation
    node
      .attr("r", 0)
      .transition()
      .duration(500)
      .attr("r", 15);

    link
      .attr("stroke-opacity", 0)
      .transition()
      .duration(500)
      .attr("stroke-opacity", 0.6);

    return () => {
      simulation.stop();
    };
  };

  // Legacy renderer for backward compatibility
  const renderLegacyGraph = (graphStructure: GraphStructure): (() => void) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const width = dimensions.width;
    const height = dimensions.height;

    // Deep copy data for D3 mutation
    const nodes: D3Node[] = graphStructure.nodes.map(d => ({ ...d }));
    const links: D3Link[] = graphStructure.edges.map(d => ({ ...d }));

    // Color Scale
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    // Zoom behavior
    const g = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom as any);

    // Simulation
    const simulation = d3.forceSimulation<D3Node>(nodes)
      .force("link", d3.forceLink<D3Node, D3Link>(links).id(d => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(40));

    // Define Arrow markers
    svg.append("defs").selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "#64748b")
      .attr("d", "M0,-5L10,0L0,5");

    // Draw Links
    const link = g.append("g")
      .attr("stroke", "#475569")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");

    // Link Labels
    const linkLabel = g.append("g")
        .attr("class", "link-labels")
        .selectAll("text")
        .data(links)
        .enter().append("text")
        .attr("class", "link-label")
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("fill", "#94a3b8")
        .text(d => d.relation);

    // Draw Nodes
    const node = g.append("g")
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 15)
      .attr("fill", d => color(d.type))
      .attr("cursor", "pointer")
      // Drag behavior
      .call(d3.drag<SVGCircleElement, D3Node>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any);
    
    // Tooltip behavior for nodes
    node.append("title")
        .text(d => `${d.name}\nType: ${d.type}\n${d.desc}`);

    // Node Labels
    const label = g.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("dx", 18)
      .attr("dy", 4)
      .text(d => d.name)
      .attr("fill", "#e2e8f0")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 4px #000");

    // Simulation Tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as D3Node).x!)
        .attr("y1", d => (d.source as D3Node).y!)
        .attr("x2", d => (d.target as D3Node).x!)
        .attr("y2", d => (d.target as D3Node).y!);

      node
        .attr("cx", d => d.x!)
        .attr("cy", d => d.y!);

      label
        .attr("x", d => d.x!)
        .attr("y", d => d.y!);

      linkLabel
        .attr("x", d => ((d.source as D3Node).x! + (d.target as D3Node).x!) / 2)
        .attr("y", d => ((d.source as D3Node).y! + (d.target as D3Node).y!) / 2);
    });

    return () => {
      simulation.stop();
    };
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-950 overflow-hidden relative">
      <svg ref={svgRef} className="w-full h-full block" />
      
      {/* Back to Level 1 button when in Level 2 */}
      {renderingMode === 2 && graphData && onBackToLevel1 && (
        <button
          onClick={onBackToLevel1}
          className="absolute top-4 left-4 flex items-center space-x-2 px-3 py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-md text-sm font-medium transition-colors backdrop-blur border border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>
      )}
    </div>
  );
};
