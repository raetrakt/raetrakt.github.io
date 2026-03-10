export function createGraphSimulation({ width, height }) {
  return d3
    .forceSimulation([])
    .force(
      'link',
      d3
        .forceLink([])
        .id((d) => d.id)
        .distance(120),
    )
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(60))
    .alphaDecay(0.02)
    .velocityDecay(0.3);
}

function applyBoxCollision(nodes, padding = 30) {
  const qt = d3.quadtree(
    nodes,
    (d) => d.x,
    (d) => d.y,
  );

  nodes.forEach((d) => {
    const dw = d.w ?? 80;
    const dh = d.h ?? 40;

    const nx1 = d.x - dw / 2 - padding;
    const nx2 = d.x + dw / 2 + padding;
    const ny1 = d.y - dh / 2 - padding;
    const ny2 = d.y + dh / 2 + padding;

    qt.visit((q, x1, y1, x2, y2) => {
      const o = q.data;
      if (!o || o === d) return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;

      const ow = o.w ?? 80;
      const oh = o.h ?? 40;
      const dx = d.x - o.x || Math.random() - 0.5;
      const dy = d.y - o.y || Math.random() - 0.5;
      const overlapX = dw / 2 + ow / 2 + padding - Math.abs(dx);
      const overlapY = dh / 2 + oh / 2 + padding - Math.abs(dy);

      if (overlapX > 0 && overlapY > 0) {
        if (overlapX < overlapY) {
          const shift = overlapX * Math.sign(dx) * 0.5;
          d.x += shift;
          o.x -= shift;
        } else {
          const shift = overlapY * Math.sign(dy) * 0.5;
          d.y += shift;
          o.y -= shift;
        }
      }

      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    });
  });
}

export function bindSimulationTick(simulation, { state, getSelections, collisionPadding = 30 }) {
  simulation.on('tick', () => {
    applyBoxCollision(state.nodes, collisionPadding);

    const { link, linkHit, node } = getSelections();

    link
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y);

    linkHit
      .attr('x1', (d) => d.source.x)
      .attr('y1', (d) => d.source.y)
      .attr('x2', (d) => d.target.x)
      .attr('y2', (d) => d.target.y);

    node.attr('x', (d) => d.x - (d.w ?? 80) / 2).attr('y', (d) => d.y - (d.h ?? 40) / 2);
  });
}

export function createDrag(simulation) {
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  return d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended);
}
