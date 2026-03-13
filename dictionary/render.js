import { linkKey } from './utils.js';

export function createRenderer({
  container,
  simulation,
  state,
  editorState,
  dragBehavior,
  onConnect,
  onRemoveConnection,
}) {
  const linkLayer = container.append('g');
  const linkHitLayer = container.append('g');
  const nodeLayer = container.append('g');

  let link = linkLayer.selectAll('line');
  let linkHit = linkHitLayer.selectAll('line');
  let node = nodeLayer.selectAll('foreignObject');
  let nodeDiv = node.selectAll('div');

  const workModal = document.getElementById('work-modal');
  const workModalPanel = document.getElementById('work-modal-panel');
  const workModalImage = document.getElementById('work-modal-image');
  const workModalTitle = document.getElementById('work-modal-title');
  const workModalAuthor = document.getElementById('work-modal-author');
  const workModalYear = document.getElementById('work-modal-year');
  const workModalSource = document.getElementById('work-modal-source');

  function closeWorkModal() {
    if (!workModal) return;
    workModal.classList.remove('is-open');
    workModal.setAttribute('aria-hidden', 'true');
  }

  function openWorkModal(workNode) {
    if (
      !workModal ||
      !workModalImage ||
      !workModalTitle ||
      !workModalAuthor ||
      !workModalYear ||
      !workModalSource
    ) {
      return;
    }

    const title = workNode?.name?.trim() || 'Untitled';
    const author = workNode?.author?.trim() || 'Unknown author';
    const year =
      workNode?.year != null && String(workNode.year).trim() !== ''
        ? String(workNode.year)
        : 'Unknown year';
    const sourceUrl = workNode?.source_url?.trim() || '';

    workModalImage.src = workNode?.media_path || '';
    workModalImage.alt = title;
    workModalTitle.textContent = title;
    workModalAuthor.textContent = author;
    workModalYear.textContent = year;

    if (sourceUrl) {
      workModalSource.href = sourceUrl;
      workModalSource.textContent = sourceUrl;
      workModalSource.classList.remove('is-disabled');
      workModalSource.removeAttribute('aria-disabled');
      workModalSource.tabIndex = 0;
    } else {
      workModalSource.removeAttribute('href');
      workModalSource.textContent = 'No source available';
      workModalSource.classList.add('is-disabled');
      workModalSource.setAttribute('aria-disabled', 'true');
      workModalSource.tabIndex = -1;
    }

    workModal.classList.add('is-open');
    workModal.setAttribute('aria-hidden', 'false');
  }

  if (workModal && workModalPanel) {
    workModal.addEventListener('click', closeWorkModal);
    workModalPanel.addEventListener('click', (event) => {
      event.stopPropagation();
    });
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeWorkModal();
    });
  }

  function readCssPxVar(name, fallback) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) ? n : fallback;
  }

  function getWorkStyleConfig() {
    const targetArea = readCssPxVar('--work-img-target-area', 8000);
    const pad = readCssPxVar('--work-node-padding', 6);
    return { targetArea, padTotal: pad * 2 };
  }

  function fitWorkImageSize(img, { targetArea, padTotal }) {
    const nw = img?.naturalWidth || 0;
    const nh = img?.naturalHeight || 0;
    if (!nw || !nh) {
      const side = Math.ceil(Math.sqrt(targetArea));
      return { imgW: side, imgH: side, w: side + padTotal, h: side + padTotal };
    }

    const scale = Math.sqrt(targetArea / (nw * nh));
    const imgW = Math.ceil(nw * scale);
    const imgH = Math.ceil(nh * scale);

    return {
      imgW,
      imgH,
      w: imgW + padTotal,
      h: imgH + padTotal,
    };
  }

  function waitForImageReady(img) {
    if (!img) return Promise.resolve();
    if (img.complete) return Promise.resolve();

    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };

      img.addEventListener('load', finish, { once: true });
      img.addEventListener('error', finish, { once: true });
      img
        .decode?.()
        .then(finish)
        .catch(() => {});
    });
  }

  function buildDerivedData() {
    const desired = [
      ...state.concepts.map((c) => ({ id: `c-${c.id}`, name: c.name, type: c.type })),
      ...state.works.map((w) => ({
        id: `w-${w.id}`,
        name: w.title ?? '',
        type: 'work',
        media_path: w.media_path,
        author: w.author,
        year: w.year,
        source_url: w.source_url,
      })),
    ];

    const prevById = new Map(simulation.nodes().map((n) => [n.id, n]));
    state.nodes = desired.map((n) => {
      const prev = prevById.get(n.id);
      if (!prev) return n;
      prev.name = n.name;
      prev.type = n.type;
      prev.media_path = n.media_path;
      prev.author = n.author;
      prev.year = n.year;
      prev.source_url = n.source_url;
      return prev;
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

  function paintSelectedNode() {
    nodeDiv.classed('selected', (d) => editorState.selectedNode?.id === d.id);
  }

  function paintSelectedLink() {
    link
      .classed('selected', (d) => editorState.selectedLinkKey === linkKey(d))
      .classed('added', (d) => editorState.addedLinkKeys.has(linkKey(d)))
      .classed('removed', (d) => editorState.removedLinkKeys.has(linkKey(d)));
  }

  function bindEditHandlers() {
    node.on('click', async (event, d) => {
      if (!editorState.enabled) {
        if (d.type !== 'work') return;
        event.preventDefault();
        event.stopPropagation();
        openWorkModal(d);
        return;
      }

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
      await onConnect(first, d);
    });

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
      await onRemoveConnection(d);
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
        (enter) => enter.append('foreignObject').call(dragBehavior),
        (update) => update,
        (exit) => exit.remove(),
      );

    nodeDiv = node
      .selectAll('div')
      .data((d) => [d])
      .join('xhtml:div')
      .attr('class', (d) => `node ${d.type}`)
      .classed('media-pending', (d) => d.type === 'work')
      .classed('media-ready', (d) => d.type !== 'work')
      .html((d) =>
        d.type === 'work'
          ? `<img class="node-img" src="${d.media_path}" alt="${d.name}">`
          : `<span class="node-text">${d.name.split(' ').join('<br>')}</span>`,
      );

    node.sort((a, b) => (b.type === 'work') - (a.type === 'work'));
    paintSelectedNode();
    paintSelectedLink();
    bindEditHandlers();
  }

  function measureNodes() {
    const workStyle = getWorkStyleConfig();

    function measureRenderedContent(el) {
      const rect = el.getBoundingClientRect();
      const width = Math.max(
        el.offsetWidth || 0,
        el.clientWidth || 0,
        el.scrollWidth || 0,
        rect.width || 0,
      );
      const height = Math.max(
        el.offsetHeight || 0,
        el.clientHeight || 0,
        el.scrollHeight || 0,
        rect.height || 0,
      );

      return {
        w: Math.ceil(width),
        h: Math.ceil(height),
      };
    }

    node.each(function (d) {
      const div = d3.select(this).select('div').node();
      if (!div) return;

      let w = 0;
      let h = 0;

      if (d.type === 'work') {
        const img = div.querySelector('img');
        if (img?.naturalWidth > 0 && img?.naturalHeight > 0) {
          const size = fitWorkImageSize(img, workStyle);
          img.style.width = `${size.imgW}px`;
          img.style.height = `${size.imgH}px`;
          w = size.w;
          h = size.h;
        } else {
          const side = Math.ceil(Math.sqrt(workStyle.targetArea));
          w = Math.max(d.w || 0, side + workStyle.padTotal);
          h = Math.max(d.h || 0, side + workStyle.padTotal);
        }
      } else {
        const size = measureRenderedContent(div);
        w = size.w;
        h = size.h;
      }

      d.w = w;
      d.h = h;
      d3.select(this).attr('width', w).attr('height', h);
    });

    simulation.force(
      'collision',
      d3.forceCollide().radius((d) => Math.max(d.w || 0, d.h || 0) / 2 + 8),
    );
  }

  async function waitForImages({ staggerMs = 60 } = {}) {
    const workDivs = nodeDiv.filter((d) => d.type === 'work').nodes();
    if (!workDivs.length) {
      await new Promise((res) => requestAnimationFrame(() => res()));
      return;
    }

    let revealCount = 0;
    let revealChain = Promise.resolve();

    const enqueueReveal = (div) => {
      const delay = revealCount === 0 ? 0 : staggerMs;
      revealCount += 1;

      revealChain = revealChain
        .then(() => new Promise((res) => setTimeout(res, delay)))
        .then(() => {
          div.classList.remove('media-pending');
          div.classList.add('media-ready');
          measureNodes();
          simulation.alpha(0.12).restart();
        });

      return revealChain;
    };

    const jobs = workDivs.map(async (div) => {
      const img = div.querySelector('img');
      await waitForImageReady(img);
      await enqueueReveal(div);
    });

    await Promise.allSettled(jobs);
    await revealChain;
    await new Promise((res) => requestAnimationFrame(() => res()));
  }

  function getSelections() {
    return { link, linkHit, node };
  }

  return {
    renderGraph,
    paintSelectedNode,
    paintSelectedLink,
    measureNodes,
    waitForImages,
    getSelections,
  };
}
