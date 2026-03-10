import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { state, editorState } from './state.js';
import {
  linkKey,
  parseNodeId,
  makeSnapshot,
  hasConceptRelation,
  hasWorkConceptRelation,
} from './utils.js';
import { loadData } from './data.js';

const SUPABASE_URL = 'https://rowvcuuqebamsxndzhxn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_LBTefqV0J1vkvYXriS5gUA_AychNVUb';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let isRefreshing = false;
let lastSnapshot = '';


// REMOVE this orphan block (causes "c is not defined"):
// state.concepts = c ?? [];
// state.relations = r ?? [];
// state.works = w ?? [];
// state.workConcepts = wc ?? [];

function buildDerivedData() {
  const desired = [
    ...state.concepts.map((c) => ({ id: `c-${c.id}`, name: c.name, type: c.type })),
    ...state.works.map((w) => ({
      id: `w-${w.id}`,
      name: w.title ?? '',
      type: 'work',
      media_path: w.media_path,
    })),
  ];

  const prevById = new Map(simulation.nodes().map((n) => [n.id, n]));
  state.nodes = desired.map((n) => {
    const prev = prevById.get(n.id);
    if (prev) {
      prev.name = n.name;
      prev.type = n.type;
      prev.media_path = n.media_path;
      return prev;
    }
    return n;
  });

  const conceptLinks = state.relations.map((r) => ({
    source: `c-${r.from_concept}`,
    target: `c-${r.to_concept}`,
  }));
  const workLinks = state.workConcepts.map((r) => ({
    source: `w-${r.work}`,
    target: `c-${r.concept}`,
  }));
  state.links = [...conceptLinks, ...workLinks];
}

const svg = d3.select('svg');
const width = window.innerWidth;
const height = window.innerHeight;

const container = svg.append('g');

const zoom = d3
  .zoom()
  .scaleExtent([0.5, 2])
  .on('zoom', (event) => {
    container.attr('transform', event.transform);
  });

svg.call(zoom).call(zoom.transform, d3.zoomIdentity.scale(0.8));
svg.on('dblclick.zoom', null); // allow dblclick on links for delete in edit mode

const simulation = d3
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

// replace old one-time node/link creation with layers + dynamic selections
const linkLayer = container.append('g'); // visible links
const linkHitLayer = container.append('g'); // invisible hitboxes (above links, below nodes)
const nodeLayer = container.append('g');

let link = linkLayer.selectAll('line');
let linkHit = linkHitLayer.selectAll('line');
let node = nodeLayer.selectAll('foreignObject');
let nodeDiv = node.selectAll('div');

function bindEditHandlers() {
  node.on('click', async (event, d) => {
    if (!editorState.enabled) return;
    event.preventDefault();
    event.stopPropagation();

    if (!editorState.selectedNode) {
      editorState.selectedNode = d;
      paintSelectedNode();
      return;
    }

    if (editorState.selectedNode.id === d.id) {
      editorState.selectedNode = null;
      paintSelectedNode();
      return;
    }

    const first = editorState.selectedNode;
    editorState.selectedNode = null;
    paintSelectedNode();
    await addConnection(first, d);
  });

  // bind link interactions to hitbox lines (easier clicking)
  linkHit.on('click', (event, d) => {
    if (!editorState.enabled) return;
    event.preventDefault();
    event.stopPropagation();

    const k = linkKey(d);
    editorState.selectedLinkKey = editorState.selectedLinkKey === k ? null : k;
    paintSelectedLink();
  });

  linkHit.on('dblclick', async (event, d) => {
    if (!editorState.enabled) return;
    event.preventDefault();
    event.stopPropagation();
    await removeConnection(d);
  });
}

function renderGraph() {
  buildDerivedData();

  simulation.nodes(state.nodes);
  simulation.force('link').links(state.links);

  link = linkLayer
    .selectAll('line')
    .data(state.links, (d) => linkKey(d))
    .join(
      (enter) => enter.append('line').attr('class', 'link'),
      (update) => update,
      (exit) => exit.remove(),
    );

  linkHit = linkHitLayer
    .selectAll('line')
    .data(state.links, (d) => linkKey(d))
    .join(
      (enter) => enter.append('line').attr('class', 'link-hit'),
      (update) => update,
      (exit) => exit.remove(),
    );

  node = nodeLayer
    .selectAll('foreignObject')
    .data(state.nodes, (d) => d.id)
    .join(
      (enter) =>
        enter
          .append('foreignObject')
          .call(d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended)),
      (update) => update,
      (exit) => exit.remove(),
    );

  nodeDiv = node
    .selectAll('div')
    .data((d) => [d])
    .join('xhtml:div')
    .attr('class', (d) => `node ${d.type}`)
    .html((d) =>
      d.type === 'work'
        ? `<img src="${d.media_path}" alt="${d.name}">`
        : `<span class="node-text">${d.name.split(' ').join('<br>')}</span>`,
    );

  node.sort((a, b) => (b.type === 'work') - (a.type === 'work'));
  paintSelectedNode();
  paintSelectedLink();
  bindEditHandlers();
}

function paintSelectedNode() {
  nodeDiv.classed('selected', (d) => editorState.selectedNode?.id === d.id);
}

function paintSelectedLink() {
  // highlight the VISIBLE line; the hitbox stays invisible
  link
    .classed('selected', (d) => editorState.selectedLinkKey === linkKey(d))
    .classed('added', (d) => editorState.addedLinkKeys.has(linkKey(d)))
    .classed('removed', (d) => editorState.removedLinkKeys.has(linkKey(d)));
}

// ADD: required by refreshDataAndRender()
function measureNodes() {
  node.each(function (d) {
    const div = d3.select(this).select('div').node();
    if (!div) return;
    const rect = div.getBoundingClientRect();
    const w = Math.ceil(rect.width) + 6;
    const h = Math.ceil(rect.height) + 6;
    d.w = w;
    d.h = h;
    d3.select(this).attr('width', w).attr('height', h);
  });
  simulation.force(
    'collision',
    d3.forceCollide().radius((d) => Math.max(d.w || 0, d.h || 0) / 2 + 8),
  );
}

async function waitForImages() {
  const imgs = Array.from(document.querySelectorAll('.node.work img'));
  await Promise.all(
    imgs.map(
      (img) =>
        img.decode?.().catch(
          () =>
            new Promise((res) => {
              img.onload = img.onerror = res;
            }),
        ) ?? Promise.resolve(),
    ),
  );
}

async function refreshDataAndRender({ force = false } = {}) {
  if (isRefreshing) return;
  isRefreshing = true;
  try {
    const ok = await loadData(supabase, state);
    if (!ok) return;

    const next = makeSnapshot(state);
    if (!force && next === lastSnapshot) return;
    lastSnapshot = next;

    renderGraph();
    await waitForImages();
    measureNodes();
    simulation.alpha(1).restart();
  } finally {
    isRefreshing = false;
  }
}

const collisionPadding = 30;

function applyBoxCollision() {
  const padding = collisionPadding;
  const qt = d3.quadtree(
    state.nodes,
    (d) => d.x,
    (d) => d.y,
  );

  state.nodes.forEach((d) => {
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

simulation.on('tick', () => {
  applyBoxCollision();

  link
    .attr('x1', (d) => d.source.x)
    .attr('y1', (d) => d.source.y)
    .attr('x2', (d) => d.target.x)
    .attr('y2', (d) => d.target.y);

  // keep hitboxes in sync with visible lines
  linkHit
    .attr('x1', (d) => d.source.x)
    .attr('y1', (d) => d.source.y)
    .attr('x2', (d) => d.target.x)
    .attr('y2', (d) => d.target.y);

  node.attr('x', (d) => d.x - d.w / 2).attr('y', (d) => d.y - d.h / 2);
});

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

// ADD: restore missing functions used by bindEditHandlers()

async function addConnection(a, b) {
  const A = parseNodeId(a.id);
  const B = parseNodeId(b.id);

  let srcId = null;
  let dstId = null;
  let insert = null;
  let localApply = null;
  let alreadyExists = false;

  if (A.kind === 'c' && B.kind === 'c') {
    srcId = `c-${A.raw}`;
    dstId = `c-${B.raw}`;
    alreadyExists = hasConceptRelation(state, A.raw, B.raw);
    insert = () =>
      supabase.from('concept_relations').insert({ from_concept: A.raw, to_concept: B.raw });
    localApply = () => state.relations.push({ from_concept: A.raw, to_concept: B.raw });
  } else if (A.kind === 'w' && B.kind === 'c') {
    srcId = `w-${A.raw}`;
    dstId = `c-${B.raw}`;
    alreadyExists = hasWorkConceptRelation(state, A.raw, B.raw);
    insert = () => supabase.from('work_concept_relations').insert({ work: A.raw, concept: B.raw });
    localApply = () => state.workConcepts.push({ work: A.raw, concept: B.raw });
  } else if (A.kind === 'c' && B.kind === 'w') {
    srcId = `w-${B.raw}`;
    dstId = `c-${A.raw}`;
    alreadyExists = hasWorkConceptRelation(state, B.raw, A.raw);
    insert = () => supabase.from('work_concept_relations').insert({ work: B.raw, concept: A.raw });
    localApply = () => state.workConcepts.push({ work: B.raw, concept: A.raw });
  } else {
    alert('Unsupported connection type.');
    return;
  }

  const k = `${srcId}->${dstId}`;
  const isPreviouslyRemoved = editorState.removedLinkKeys.has(k);

  if (alreadyExists && !isPreviouslyRemoved) return;

  const { error } = await insert();
  if (error) return alert(error.message);

  editorState.removedLinkKeys.delete(k);
  editorState.addedLinkKeys.add(k);

  if (!alreadyExists) localApply();

  renderGraph();
  await waitForImages();
  measureNodes();
  simulation.alpha(0.6).restart();
}

async function removeConnection(d) {
  const k = linkKey(d);
  if (editorState.removedLinkKeys.has(k)) return;

  const s = parseNodeId(d.source.id);
  const t = parseNodeId(d.target.id);
  let q = null;

  if (s.kind === 'c' && t.kind === 'c') {
    q = supabase
      .from('concept_relations')
      .delete()
      .eq('from_concept', s.raw)
      .eq('to_concept', t.raw);
  } else if (s.kind === 'w' && t.kind === 'c') {
    q = supabase.from('work_concept_relations').delete().eq('work', s.raw).eq('concept', t.raw);
  } else if (s.kind === 'c' && t.kind === 'w') {
    q = supabase.from('work_concept_relations').delete().eq('work', t.raw).eq('concept', s.raw);
  }

  if (!q) return alert('Unsupported connection type.');
  const { error } = await q;
  if (error) return alert(error.message);

  editorState.addedLinkKeys.delete(k);
  editorState.removedLinkKeys.add(k);
  paintSelectedLink();
}

async function ensureSignedIn() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user) return true;

  const email = prompt('Admin email:');
  if (!email) return false;
  const password = prompt('Admin password:');
  if (!password) return false;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    alert(`Login failed: ${error.message}`);
    return false;
  }
  return true;
}

async function toggleEditing() {
  if (!editorState.enabled) {
    const ok = await ensureSignedIn();
    if (!ok) return;
  }
  editorState.enabled = !editorState.enabled;
  editorState.selectedNode = null;
  editorState.selectedLinkKey = null;
  paintSelectedNode();
  paintSelectedLink();
  document.body.classList.toggle('editing-mode', editorState.enabled);
}

// ADD: non-reserved shortcuts for edit mode
// Ctrl+Shift+E (Windows/Linux), Cmd+Shift+E (macOS), or F2 (fallback)
window.addEventListener('keydown', async (event) => {
  const key = event.key?.toLowerCase?.() ?? '';
  const isCmdOrCtrl = event.metaKey || event.ctrlKey;

  const toggleByChord = isCmdOrCtrl && event.shiftKey && key === 'e';
  const toggleByF2 = event.key === 'F2';

  if (toggleByChord || toggleByF2) {
    event.preventDefault();
    await toggleEditing();
  }
});

await document.fonts.ready;
await refreshDataAndRender({ force: true });
