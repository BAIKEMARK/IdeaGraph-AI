import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GraphStructure, GraphNode, GraphEdge } from '../types';

interface GraphViewProps {
  data: GraphStructure;
}

// Internal types for D3 Simulation
interface D3Node extends d3.SimulationNodeDatum, GraphNode {
  x?: number;
  y?: number;
}
interface D3Link extends d3.SimulationLinkDatum<D3Node>, Omit<GraphEdge, 'source' | 'target'> {
  source: D3Node | string | number;
  target: D3Node | string | number;
}

export const GraphView: React.FC<GraphViewProps> = ({ data }) => {
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

  // Initialize D3 Graph
  useEffect(() => {
    if (!dimensions.width || !dimensions.height || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const width = dimensions.width;
    const height = dimensions.height;

    // Deep copy data for D3 mutation
    const nodes: D3Node[] = data.nodes.map(d => ({ ...d }));
    const links: D3Link[] = data.edges.map(d => ({ ...d }));

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
      .attr("refX", 25) // Offset for node radius
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", "#64748b") // Slate 500
      .attr("d", "M0,-5L10,0L0,5");

    // Draw Links
    const link = g.append("g")
      .attr("stroke", "#475569") // Slate 600
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
      .attr("stroke", "#1e293b") // Slate 900
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
      .attr("fill", "#e2e8f0") // Slate 200
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
  }, [data, dimensions]);

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-950 overflow-hidden">
      <svg ref={svgRef} className="w-full h-full block" />
    </div>
  );
};