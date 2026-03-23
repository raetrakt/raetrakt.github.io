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
import { createRenderer } from './render.js';
import { createGraphSimulation, bindSimulationTick, createDrag } from './simulation.js';

const SUPABASE_URL = 'https://rowvcuuqebamsxndzhxn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_LBTefqV0J1vkvYXriS5gUA_AychNVUb';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let isRefreshing = false;
let lastSnapshot = '';

const svg = d3.select('svg');
const width = window.innerWidth;
const height = window.innerHeight;

const isSafari =
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
  (/AppleWebKit/i.test(navigator.userAgent) && !/Chrome|Chromium|CriOS|FxiOS|Edg|OPR/i.test(navigator.userAgent));

if (isSafari) {
  document.body.classList.add('is-safari');
}

const container = svg.append('g');

const zoom = d3
  .zoom()
  .scaleExtent([0.5, 2])
  .on('zoom', (event) => {
    container.attr('transform', event.transform);
  });

svg.call(zoom);
if (!isSafari) {
  svg.call(zoom.transform, d3.zoomIdentity.scale(0.8));
}
svg.on('dblclick.zoom', null); // allow dblclick on links for delete in edit mode

const simulation = createGraphSimulation({ width, height });
if (isSafari) {
  simulation.alphaDecay(0.03).velocityDecay(0.4);
}
const dragBehavior = createDrag(simulation);

const renderer = createRenderer({
  container,
  simulation,
  state,
  editorState,
  dragBehavior,
  onConnect: addConnection,
  onRemoveConnection: removeConnection,
});

bindSimulationTick(simulation, {
  state,
  getSelections: renderer.getSelections,
});

async function refreshDataAndRender({ force = false } = {}) {
  if (isRefreshing) return;
  isRefreshing = true;
  try {
    const ok = await loadData(supabase, state);
    if (!ok) return;

    const next = makeSnapshot(state);
    if (!force && next === lastSnapshot) return;
    lastSnapshot = next;

    renderer.renderGraph();
    await renderer.waitForImages({ staggerMs: 60 });
    renderer.measureNodes();
    simulation.alpha(1).restart();
  } finally {
    isRefreshing = false;
  }
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

  renderer.renderGraph();
  await renderer.waitForImages({ staggerMs: 60 });
  renderer.measureNodes();
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
  renderer.paintSelectedLink();
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
  renderer.paintSelectedNode();
  renderer.paintSelectedLink();
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
