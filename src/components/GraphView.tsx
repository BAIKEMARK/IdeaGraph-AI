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
    
    // Optimize SVG for better rendering performance
    svg.attr("shape-rendering", "geometricPrecision")
       .attr("text-rendering", "geometricPrecision");

    const width = dimensions.width;
    const height = dimensions.height;

    // Deep copy data for D3 mutation
    const nodes: D3IdeaNode[] = level1Data.nodes.map(d => ({ ...d }));
    
    // Validate and filter links to ensure all referenced nodes exist
    const nodeIds = new Set(nodes.map(n => n.id));
    const validLinks = level1Data.edges.filter(edge => {
      const sourceExists = nodeIds.has(edge.source);
      const targetExists = nodeIds.has(edge.target);
      
      if (!sourceExists || !targetExists) {
        console.warn(`Invalid similarity edge found: ${edge.source} -> ${edge.target}. Source exists: ${sourceExists}, Target exists: ${targetExists}`);
        return false;
      }
      return true;
    });
    
    const links: D3SimilarityLink[] = validLinks.map(d => ({ 
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

    // Add defs for filters and gradients
    const defs = svg.select("defs").empty() ? svg.append("defs") : svg.select("defs");

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

    // Draw Links with similarity-based styling and modern effects
    const link = g.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#64748b")
      .attr("stroke-width", d => thicknessScale(d.similarity))
      .attr("stroke-opacity", d => opacityScale(d.similarity) * 0.6)
      .attr("stroke-linecap", "round")
      .style("cursor", "pointer")
      .on("mouseenter", function(event, d) {
        // Highlight connection on hover
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke", "#8b5cf6")
          .attr("stroke-opacity", 0.8)
          .attr("stroke-width", Math.max(thicknessScale(d.similarity), 3));
      })
      .on("mouseleave", function(event, d) {
        // Remove highlight
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke", "#64748b")
          .attr("stroke-opacity", opacityScale(d.similarity) * 0.6)
          .attr("stroke-width", thicknessScale(d.similarity));
      });

    // Tooltip for edges showing similarity score
    link.append("title")
      .text(d => `Similarity: ${(d.similarity * 100).toFixed(1)}%`);

    // Add glow filter definition
    const glowFilter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    
    glowFilter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "coloredBlur");
    
    const feMerge = glowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Draw Nodes (Idea nodes) with modern styling
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        if (onNodeClick) {
          onNodeClick(d.id);
        }
      })
      .on("mouseenter", function(event, d) {
        // Highlight effect on hover
        d3.select(this).select("circle")
          .transition()
          .duration(200)
          .attr("r", 25)
          .attr("filter", "url(#glow)");
      })
      .on("mouseleave", function(event, d) {
        // Remove highlight
        d3.select(this).select("circle")
          .transition()
          .duration(200)
          .attr("r", 20)
          .attr("filter", null);
      });

    // Add gradient for nodes
    const gradient = defs.append("radialGradient")
      .attr("id", "nodeGradient")
      .attr("cx", "30%")
      .attr("cy", "30%");
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#8b5cf6");
    
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#6366f1");

    // Main node circle
    node.append("circle")
      .attr("r", 20)
      .attr("fill", "url(#nodeGradient)")
      .attr("stroke", "#a855f7")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.8)
      // Drag behavior
      .call(d3.drag<SVGCircleElement, D3IdeaNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
          // Add dragging class to reduce visual effects during drag
          d3.select(event.sourceEvent.target).classed("dragging", true);
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
          // Remove dragging class
          d3.select(event.sourceEvent.target).classed("dragging", false);
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
        .attr("transform", d => `translate(${d.x!},${d.y!})`);

      label
        .attr("x", d => d.x!)
        .attr("y", d => d.y!);
    });

    // Add smooth transition animation
    node.select("circle")
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
    
    // Optimize SVG for better rendering performance
    svg.attr("shape-rendering", "geometricPrecision")
       .attr("text-rendering", "geometricPrecision");

    const width = dimensions.width;
    const height = dimensions.height;

    // Deep copy data for D3 mutation
    const nodes: D3EntityNode[] = level2Data.nodes.map(d => ({ ...d }));
    
    // Validate and filter links to ensure all referenced nodes exist
    const nodeIds = new Set(nodes.map(n => n.id));
    const validLinks = level2Data.edges.filter(edge => {
      const sourceExists = nodeIds.has(edge.source);
      const targetExists = nodeIds.has(edge.target);
      
      if (!sourceExists || !targetExists) {
        console.warn(`Invalid edge found: ${edge.source} -> ${edge.target}. Source exists: ${sourceExists}, Target exists: ${targetExists}`);
        return false;
      }
      return true;
    });
    
    const links: D3RelationLink[] = validLinks.map(d => ({ ...d }));

    // Add defs for filters and gradients
    const defs = svg.select("defs").empty() ? svg.append("defs") : svg.select("defs");

    // Modern color palette for entity types with gradients
    const colorMap: Record<string, string> = {
      'Concept': '#8b5cf6',     // Purple
      'Tool': '#06b6d4',        // Cyan  
      'Person': '#f59e0b',      // Amber
      'Problem': '#ef4444',     // Red
      'Solution': '#10b981',    // Emerald
      'Methodology': '#3b82f6', // Blue
      'Metric': '#ec4899',      // Pink
    };

    // Create gradients for each entity type
    Object.entries(colorMap).forEach(([type, color]) => {
      const gradient = defs.append("radialGradient")
        .attr("id", `gradient-${type}`)
        .attr("cx", "30%")
        .attr("cy", "30%");
      
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d3.color(color)?.brighter(0.5)?.toString() || color);
      
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", color);
    });

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

    // Add glow filter for Level 2 nodes
    const glowFilter2 = defs.append("filter")
      .attr("id", "glow2")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    
    glowFilter2.append("feGaussianBlur")
      .attr("stdDeviation", "2")
      .attr("result", "coloredBlur");
    
    const feMerge2 = glowFilter2.append("feMerge");
    feMerge2.append("feMergeNode").attr("in", "coloredBlur");
    feMerge2.append("feMergeNode").attr("in", "SourceGraphic");

    // Draw Nodes with modern styling
    const node = g.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("mouseenter", function(event, d) {
        // Highlight effect on hover
        d3.select(this).select("circle")
          .transition()
          .duration(200)
          .attr("r", 18)
          .attr("filter", "url(#glow2)");
      })
      .on("mouseleave", function(event, d) {
        // Remove highlight
        d3.select(this).select("circle")
          .transition()
          .duration(200)
          .attr("r", 15)
          .attr("filter", null);
      });

    // Main node circles with gradients
    node.append("circle")
      .attr("r", 15)
      .attr("fill", d => `url(#gradient-${d.type})`)
      .attr("stroke", d => d3.color(colorMap[d.type] || '#6366f1')?.brighter(0.3)?.toString() || '#a855f7')
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.8)
      // Drag behavior
      .call(d3.drag<SVGCircleElement, D3EntityNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
          // Add dragging class to reduce visual effects during drag
          d3.select(event.sourceEvent.target).classed("dragging", true);
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
          // Remove dragging class
          d3.select(event.sourceEvent.target).classed("dragging", false);
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
        .attr("transform", d => `translate(${d.x!},${d.y!})`);

      label
        .attr("x", d => d.x!)
        .attr("y", d => d.y!);

      linkLabel
        .attr("x", d => ((d.source as D3EntityNode).x! + (d.target as D3EntityNode).x!) / 2)
        .attr("y", d => ((d.source as D3EntityNode).y! + (d.target as D3EntityNode).y!) / 2);
    });

    // Add smooth transition animation
    node.select("circle")
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
    
    // Optimize SVG for better rendering performance
    svg.attr("shape-rendering", "geometricPrecision")
       .attr("text-rendering", "geometricPrecision");

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
          // Add dragging class to reduce visual effects during drag
          d3.select(event.sourceEvent.target).classed("dragging", true);
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
          // Remove dragging class
          d3.select(event.sourceEvent.target).classed("dragging", false);
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
    <div ref={containerRef} className="w-full h-full bg-gradient-to-br from-zinc-950 via-slate-950 to-zinc-900 overflow-hidden relative">
      {/* Subtle dot grid background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(148, 163, 184, 0.1) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />
      
      <svg 
        ref={svgRef} 
        className="w-full h-full block relative z-10" 
        style={{
          shapeRendering: 'geometricPrecision',
          textRendering: 'geometricPrecision',
          // Additional optimizations to reduce ghosting
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)', // Force hardware acceleration
          willChange: 'transform' // Hint to browser for optimization
        }}
      />
      
      {/* Back to Level 1 button when in Level 2 */}
      {renderingMode === 2 && graphData && onBackToLevel1 && (
        <button
          onClick={onBackToLevel1}
          className="absolute top-4 left-4 flex items-center space-x-2 px-4 py-2.5 bg-zinc-900/80 hover:bg-zinc-800/90 text-zinc-200 rounded-xl text-sm font-medium transition-all backdrop-blur-md border border-white/10 shadow-lg hover:shadow-xl active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>
      )}
    </div>
  );
};
