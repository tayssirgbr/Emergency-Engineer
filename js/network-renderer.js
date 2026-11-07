// Emergency Engineer — SVG hydraulic network renderer.
// Native SVG only, no external libraries, no dependency on the other
// project files (so it stays reusable/testable on its own).
//
// Usage:
//   const renderer = new NetworkRenderer(containerEl, stage.network);
//   renderer.addEventListener('elementSelected', (e) => { ... e.detail ... });
//   renderer.setPipeStatus('main', 'broken');   // 'normal' | 'broken' | 'closed'
//   renderer.setFlowReversed('main', true);
//   renderer.clearSelection();
//
// stage.network is expected as:
//   { nodes: [{ nodeId, kind, elevationMeters, x?, y? }],
//     pipes: [{ pipeId, fromNodeId, toNodeId, lengthMeters, diameterMm, roughnessMm }] }
// x/y are optional 0-1 layout hints; when absent, position is derived from
// elevation (vertical axis) and array order (horizontal axis).
//
// Responsive: the SVG uses viewBox + preserveAspectRatio and is styled at
// width:100%/height:100% (see css/stage.css) — no resize JS needed, the
// browser scales it whenever its container (.stage-network) changes size.

import { t } from './i18n.js';
import { playSelectSound } from './audio-manager.js';
const SVG_NS = 'http://www.w3.org/2000/svg';
const VIEWBOX_W = 800;
const VIEWBOX_H = 480;
const MARGIN = 70;
const NODE_RADIUS = 22;

export class NetworkRenderer extends EventTarget {
  /**
   * @param {HTMLElement} container
   * @param {{nodes: any[], pipes: any[]}} network
   */
  constructor(container, network) {
    super();
    this.container = container;
    this.network = network ?? { nodes: [], pipes: [] };

    this._pipeStatus = new Map();   // pipeId -> 'normal' | 'broken' | 'closed'
    this._pipeReversed = new Map(); // pipeId -> boolean
    this._selected = null;          // { type: 'node'|'pipe', id, data } | null

    this._nodePositions = new Map(); // nodeId -> { x, y }
    this._pipeEls = new Map();       // pipeId -> { group, line, from, to }
    this._nodeEls = new Map();       // nodeId -> { group, shape }
    this._view = { x: 0, y: 0, scale: 1 };
    this._drag = null;
    this._didPan = false;

    this._computeLayout();
    this._buildSvg();
  }

  // -- Public API -----------------------------------------------------------

  /** @param {string} pipeId @param {'normal'|'broken'|'closed'} status */
  setPipeStatus(pipeId, status) {
    this._pipeStatus.set(pipeId, status);
    this._applyPipeStatus(pipeId);
  }

  getPipeStatus(pipeId) {
    return this._pipeStatus.get(pipeId) ?? 'normal';
  }

  /** @param {string} pipeId @param {boolean} reversed */
  setFlowReversed(pipeId, reversed) {
    this._pipeReversed.set(pipeId, !!reversed);
    this._applyPipeDirection(pipeId);
  }

  clearSelection() {
    this._setSelected(null);
  }

  zoomIn() { this._zoom(1.18); }
  zoomOut() { this._zoom(1 / 1.18); }
  resetView() { this._view = { x: 0, y: 0, scale: 1 }; this._applyView(); }

  /** Removes the SVG. Call before discarding this renderer. */
  destroy() {
    this.container.innerHTML = '';
  }

  // -- Layout -----------------------------------------------------------------

  _computeLayout() {
    const nodes = this.network.nodes ?? [];
    if (nodes.length === 0) return;

    const elevations = nodes.map((n) => n.elevationMeters ?? 0);
    const minEl = Math.min(...elevations);
    const maxEl = Math.max(...elevations);
    const range = maxEl - minEl || 1;

    const drawW = VIEWBOX_W - MARGIN * 2;
    const drawH = VIEWBOX_H - MARGIN * 2;

    nodes.forEach((node, i) => {
      const xFrac =
        typeof node.x === 'number' ? node.x : nodes.length > 1 ? i / (nodes.length - 1) : 0.5;
      const elevation = node.elevationMeters ?? 0;
      // Higher elevation -> smaller SVG y -> higher on screen.
      const yFrac = typeof node.y === 'number' ? node.y : 1 - (elevation - minEl) / range;

      this._nodePositions.set(node.nodeId, {
        x: MARGIN + xFrac * drawW,
        y: MARGIN + yFrac * drawH,
      });
    });
  }

  // -- SVG construction ---------------------------------------------------------

  _buildSvg() {
    this.container.innerHTML = '';
    this.container.classList.add('network-renderer');

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${VIEWBOX_W} ${VIEWBOX_H}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.classList.add('network-svg');

    svg.appendChild(this._buildDefs());

    // Clicking empty space clears the current selection.
    const bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('x', '0');
    bg.setAttribute('y', '0');
    bg.setAttribute('width', String(VIEWBOX_W));
    bg.setAttribute('height', String(VIEWBOX_H));
    bg.setAttribute('class', 'network-bg');
    bg.addEventListener('click', () => this.clearSelection());
    svg.appendChild(bg);

    this._viewport = document.createElementNS(SVG_NS, 'g');
    this._viewport.setAttribute('class', 'network-viewport');
    const pipesLayer = document.createElementNS(SVG_NS, 'g');
    const nodesLayer = document.createElementNS(SVG_NS, 'g');
    this._viewport.append(pipesLayer, nodesLayer); // nodes drawn after pipes so they sit visually on top
    svg.appendChild(this._viewport);

    (this.network.pipes ?? []).forEach((pipe) => this._buildPipe(pipe, pipesLayer));
    (this.network.nodes ?? []).forEach((node) => this._buildNode(node, nodesLayer));

    this.container.appendChild(svg);
    this._buildControls();
    svg.addEventListener('wheel', (event) => {
      event.preventDefault();
      this._zoom(event.deltaY < 0 ? 1.12 : 1 / 1.12);
    }, { passive: false });
    svg.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      this._drag = { pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, x: this._view.x, y: this._view.y };
      this._didPan = false;
      svg.setPointerCapture(event.pointerId);
    });
    svg.addEventListener('pointermove', (event) => {
      if (!this._drag || this._drag.pointerId !== event.pointerId) return;
      const dx = event.clientX - this._drag.clientX;
      const dy = event.clientY - this._drag.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 5) this._didPan = true;
      if (this._didPan) {
        const rect = svg.getBoundingClientRect();
        this._view.x = this._drag.x + dx * VIEWBOX_W / Math.max(rect.width, 1);
        this._view.y = this._drag.y + dy * VIEWBOX_H / Math.max(rect.height, 1);
        this._applyView();
      }
    });
    const endDrag = (event) => {
      if (this._drag?.pointerId !== event.pointerId) return;
      this._drag = null;
      if (this._didPan) window.setTimeout(() => { this._didPan = false; }, 0);
    };
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);
  }

  _buildControls() {
    const controls = document.createElement('div');
    controls.className = 'map-controls';
    controls.innerHTML = `<button type="button" data-map="in" aria-label="${t('zoomIn')}" title="${t('zoomIn')}">+</button><button type="button" data-map="out" aria-label="${t('zoomOut')}" title="${t('zoomOut')}">−</button><button type="button" data-map="reset" aria-label="${t('resetMap')}" title="${t('resetMap')}">⌂</button>`;
    controls.querySelector('[data-map="in"]').addEventListener('click', () => this.zoomIn());
    controls.querySelector('[data-map="out"]').addEventListener('click', () => this.zoomOut());
    controls.querySelector('[data-map="reset"]').addEventListener('click', () => this.resetView());
    this.container.appendChild(controls);
  }

  _zoom(factor) {
    const next = Math.min(2.8, Math.max(0.75, this._view.scale * factor));
    const ratio = next / this._view.scale;
    this._view.x = VIEWBOX_W / 2 - (VIEWBOX_W / 2 - this._view.x) * ratio;
    this._view.y = VIEWBOX_H / 2 - (VIEWBOX_H / 2 - this._view.y) * ratio;
    this._view.scale = next;
    this._applyView();
  }

  _applyView() {
    this._viewport?.setAttribute('transform', `translate(${this._view.x} ${this._view.y}) scale(${this._view.scale})`);
  }

  _buildDefs() {
    const defs = document.createElementNS(SVG_NS, 'defs');
    const marker = document.createElementNS(SVG_NS, 'marker');
    marker.setAttribute('id', 'flow-arrow');
    marker.setAttribute('markerWidth', '8');
    marker.setAttribute('markerHeight', '8');
    marker.setAttribute('refX', '5');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    marker.setAttribute('markerUnits', 'strokeWidth');
    const arrow = document.createElementNS(SVG_NS, 'path');
    arrow.setAttribute('d', 'M0,0 L6,3 L0,6 Z');
    arrow.setAttribute('class', 'flow-arrow-head');
    marker.appendChild(arrow);
    defs.appendChild(marker);
    return defs;
  }

  _buildPipe(pipe, layer) {
    const from = this._nodePositions.get(pipe.fromNodeId);
    const to = this._nodePositions.get(pipe.toNodeId);
    if (!from || !to) {
      console.warn(`[network-renderer] pipe '${pipe.pipeId}' references a missing node.`);
      return;
    }

    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('class', 'pipe');
    group.setAttribute('tabindex', '0');
    group.setAttribute('role', 'button');
    group.setAttribute('aria-label', `أنبوب ${pipe.pipeId}`);

    // Wide, invisible line for a comfortable click target — stays static
    // regardless of flow direction so hit-testing never moves around.
    const hit = document.createElementNS(SVG_NS, 'line');
    hit.setAttribute('class', 'pipe-hit');
    hit.setAttribute('x1', from.x);
    hit.setAttribute('y1', from.y);
    hit.setAttribute('x2', to.x);
    hit.setAttribute('y2', to.y);

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('marker-end', 'url(#flow-arrow)');

    const title = document.createElementNS(SVG_NS, 'title');
    title.textContent = `${pipe.pipeId} — ${pipe.lengthMeters} m، Ø${pipe.diameterMm} mm`;

    group.append(hit, line, title);

    const select = () => { if (!this._didPan) this._setSelected({ type: 'pipe', id: pipe.pipeId, data: pipe }); };
    group.addEventListener('click', select);
    group.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        select();
      }
    });

    layer.appendChild(group);
    this._pipeEls.set(pipe.pipeId, { group, line, from, to });
    this._applyPipeStatus(pipe.pipeId);
    this._applyPipeDirection(pipe.pipeId);
  }

  _buildNode(node, layer) {
    const pos = this._nodePositions.get(node.nodeId);
    if (!pos) return;

    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('class', `node node--${node.kind}`);
    group.setAttribute('transform', `translate(${pos.x}, ${pos.y})`);
    group.setAttribute('tabindex', '0');
    group.setAttribute('role', 'button');
    group.setAttribute('aria-label', node.nodeId);

    const shape = document.createElementNS(SVG_NS, 'circle');
    shape.setAttribute('class', 'node-shape');
    shape.setAttribute('r', String(NODE_RADIUS));

    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('class', 'node-label');
    label.setAttribute('y', String(NODE_RADIUS + 16));
    label.textContent = node.nodeId;

    const icon = document.createElementNS(SVG_NS, 'text');
    icon.setAttribute('class', 'node-icon');
    icon.setAttribute('text-anchor', 'middle');
    icon.setAttribute('y', '5');
    icon.textContent = ({ reservoir: '≋', tank: '▱', pumpStation: '◉', junction: '•', consumer: '⌂' })[node.kind] ?? '●';

    const elevationLabel = document.createElementNS(SVG_NS, 'text');
    elevationLabel.setAttribute('class', 'node-elevation');
    elevationLabel.setAttribute('y', '4');
    elevationLabel.textContent = node.elevationMeters !== undefined ? `${node.elevationMeters}m` : '';

    const title = document.createElementNS(SVG_NS, 'title');
    title.textContent = `${node.nodeId} (${node.kind}) — ${node.elevationMeters} m`;

    group.append(shape, icon, label, elevationLabel, title);

    const select = () => { if (!this._didPan) this._setSelected({ type: 'node', id: node.nodeId, data: node }); };
    group.addEventListener('click', select);
    group.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        select();
      }
    });

    layer.appendChild(group);
    this._nodeEls.set(node.nodeId, { group, shape });
  }

  // -- Live state updates ---------------------------------------------------------

  _applyPipeStatus(pipeId) {
    const el = this._pipeEls.get(pipeId);
    if (!el) return;
    const status = this.getPipeStatus(pipeId);
    el.line.setAttribute('class', `pipe-line pipe-line--${status}`);
  }

  _applyPipeDirection(pipeId) {
    const el = this._pipeEls.get(pipeId);
    if (!el) return;
    const reversed = this._pipeReversed.get(pipeId) ?? false;
    const { from, to } = el;
    const [x1, y1, x2, y2] = reversed ? [to.x, to.y, from.x, from.y] : [from.x, from.y, to.x, to.y];
    el.line.setAttribute('x1', x1);
    el.line.setAttribute('y1', y1);
    el.line.setAttribute('x2', x2);
    el.line.setAttribute('y2', y2);
  }

  _setSelected(selection) {
    if (this._selected) {
      const prev =
        this._selected.type === 'pipe'
          ? this._pipeEls.get(this._selected.id)?.group
          : this._nodeEls.get(this._selected.id)?.group;
      prev?.classList.remove('is-selected');
    }
    this._selected = selection;
    if (selection) playSelectSound();
    if (selection) {
      const cur =
        selection.type === 'pipe'
          ? this._pipeEls.get(selection.id)?.group
          : this._nodeEls.get(selection.id)?.group;
      cur?.classList.add('is-selected');
    }
    this.dispatchEvent(new CustomEvent('elementSelected', { detail: selection }));
  }
}
