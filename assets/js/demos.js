/* Case study demos. Each one only runs if its root element is on the page. All data is invented. */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const initials = name => name.replace(/^From |\(.*\)/g, '').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

/* ─────────────────────────────────────────────────────────
   The Dial board (ren-dial.html)
   ───────────────────────────────────────────────────────── */
(function dialDemo() {
  const root = document.getElementById('dial-demo');
  if (!root) return;

  const STAGES = [
    { id: 'mention', name: 'Mention', prompt: 'Name it once, lightly.' },
    { id: 'invitation', name: 'Invitation', prompt: 'Ask them to talk about it.' },
    { id: 'conversation', name: 'Conversation', prompt: 'Sit down and work it through.' },
    { id: 'boundary', name: 'Boundary', prompt: 'Say what has to change.' },
    { id: 'limit', name: 'Limit', prompt: 'Say what happens if it does not.' },
    { id: 'closed', name: 'Closed', prompt: 'Drop here when it’s done. Letting go counts.' },
  ];
  const stageName = id => STAGES.find(s => s.id === id).name;

  const fresh = () => ({
    by: [
      { id: 'leah', who: 'Leah Moreno', what: 'Covered the release notes twice without being asked. You haven’t said anything yet.', age: '2d', signals: 2, stage: 'mention', praise: true },
      { id: 'omar', who: 'Omar Haddad', what: 'Late to standup three times since you first mentioned it.', age: '4d', signals: 3, stage: 'mention',
        suggest: { to: 'invitation', why: 'You mentioned it once and it happened twice more. A mention alone hasn’t moved it.' } },
      { id: 'grace', who: 'Grace Kim', what: 'You asked about the Q3 scope in August and never got an answer.', age: '12d quiet', signals: 2, stage: 'invitation' },
      { id: 'ben', who: 'Ben Archer', what: 'The Friday review has slipped three times. It still lands on Tess.', age: '6d quiet', signals: 3, stage: 'conversation' },
    ],
    for: [
      { id: 'dev', who: 'From Dev (your manager)', what: 'Your update in the planning review was the clearest one in the room.', age: '1d', signals: 1, stage: 'mention', praise: true },
      { id: 'sam', who: 'From Sam (a peer)', what: 'Handoff notes keep arriving after the deadline.', age: '5d', signals: 2, stage: 'invitation' },
    ],
    log: [{ t: 'Today', text: 'Ren suggested moving Omar Haddad to Invitation · 3 signals', ren: true }],
  });

  let state = fresh();
  const board = $('.dd-board', root);
  const status = $('.dd-status', root);
  const logEl = $('.dd-log ol', root);

  const cards = () => state[root.dataset.mode === 'private' ? 'by' : root.dataset.side];

  function render(focusId, focusDir) {
    const list = cards();
    const isFor = root.dataset.side === 'for' && root.dataset.mode !== 'private';
    board.innerHTML = STAGES.map(stage => {
      const here = list.filter(c => c.stage === stage.id);
      const count = here.length;
      const body = here.map(c => cardHTML(c, stage, isFor)).join('') || (stage.id === 'closed' ? '' :
        `<li class="dd-empty">${stage.id === 'boundary' || stage.id === 'limit' ? 'Nothing here, which is the normal state.' : 'Nothing here.'}</li>`);
      return `
        <div class="dd-col" role="listitem" data-stage="${stage.id}" aria-label="${stage.name}, ${count} cards">
          <div class="dd-col-head"><div class="n"><span>${stage.name}</span><span>${count || ''}</span></div><p>${stage.prompt}</p></div>
          <ul>${body}</ul>
        </div>`;
    }).join('');

    const open = list.filter(c => c.stage !== 'closed').length;
    const waiting = list.filter(c => c.suggest).length;
    if (root.dataset.mode === 'private') {
      status.innerHTML = `<span class="lock">Only you can see this board</span><span>${open} open. Nobody raises cards for or about you here.</span>`;
    } else if (isFor) {
      status.innerHTML = `<span>${open} raised for you by others. You decide what to do with each.</span>`;
    } else {
      status.innerHTML = `<span>${open} open.${waiting ? ` ${waiting === 1 ? 'One has' : waiting + ' have'} a suggestion from Ren waiting.` : ' Nothing waiting on Ren.'}</span>`;
    }

    logEl.innerHTML = state.log.map((l, i) => `<li class="${l.ren ? 'ren' : ''} ${i === 0 && l.fresh ? 'new' : ''}"><span class="t">${l.t}</span><span>${esc(l.text)}</span></li>`).join('');
    state.log.forEach(l => { l.fresh = false; });

    if (focusId) {
      const btn = $(`.dd-card[data-id="${focusId}"] [data-dir="${focusDir}"]`, board) || $(`.dd-card[data-id="${focusId}"] button`, board);
      btn && btn.focus();
      const el = $(`.dd-card[data-id="${focusId}"]`, board);
      el && el.classList.add('just-moved');
    }
  }

  function cardHTML(c, stage, isFor) {
    const i = STAGES.findIndex(s => s.id === stage.id);
    if (stage.id === 'closed') {
      return `<li class="dd-closed" data-id="${c.id}"><b>${esc(c.who)}</b><span>${esc(c.closedNote)}</span></li>`;
    }
    const first = c.who.replace(/^From /, '').split(' ')[0];
    return `
      <li class="dd-card ${c.suggest ? 'has-suggestion' : ''}" data-id="${c.id}" aria-label="${esc(c.who)}, ${stage.name}">
        <div class="dd-who"><span class="dd-av" aria-hidden="true">${initials(c.who)}</span>${esc(c.who)}</div>
        <p class="dd-what">${esc(c.what)}</p>
        <div class="dd-meta">
          <span>${c.age} · ${c.signals} signal${c.signals > 1 ? 's' : ''}${c.praise ? ' · <span class="praise">praise</span>' : ''}</span>
          <span class="dd-move">
            <button type="button" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move ${esc(first)} back to ${i > 0 ? STAGES[i - 1].name : ''}">‹</button>
            <button type="button" data-dir="1" aria-label="Move ${esc(first)} to ${STAGES[i + 1].name}">›</button>
          </span>
        </div>
        ${c.suggest ? `
        <div class="dd-sugg">
          <span class="tag">Ren suggests ${stageName(c.suggest.to)}</span>
          <p>${esc(c.suggest.why)}</p>
          <div class="row"><button type="button" class="btn small" data-accept>Accept</button><button type="button" class="btn ghost small" data-dismiss>Dismiss</button></div>
        </div>` : ''}
      </li>`;
  }

  function addLog(text, ren = false) {
    state.log.unshift({ t: 'Just now', text, ren, fresh: true });
    state.log.slice(1).forEach(l => { if (l.t === 'Just now') l.t = 'Earlier'; });
  }

  function move(id, to, how = 'moved') {
    const c = cards().find(x => x.id === id);
    if (!c || c.stage === to) return;
    const from = c.stage;
    c.stage = to;
    const who = c.who.replace(/^From /, '').replace(/ \(.*\)/, '');
    if (to === 'closed') {
      c.closedNote = from === 'mention' ? 'Said at Mention, and it landed' : `Reached ${stageName(from)}, then resolved`;
      addLog(`You closed ${who} at ${stageName(from)}`);
    } else if (how === 'accepted') {
      addLog(`You accepted Ren’s suggestion: ${who} → ${stageName(to)}`);
    } else {
      addLog(`You moved ${who} from ${stageName(from)} to ${stageName(to)}`);
    }
    if (c.suggest && how !== 'accepted') {
      if (c.suggest.to === to) addLog(`That matches what Ren suggested, so the suggestion is marked as taken`, true);
      delete c.suggest;
    } else if (how === 'accepted') delete c.suggest;
  }

  board.addEventListener('click', e => {
    const card = e.target.closest('.dd-card');
    if (!card) return;
    const id = card.dataset.id;
    const c = cards().find(x => x.id === id);
    if (e.target.closest('[data-accept]')) { move(id, c.suggest.to, 'accepted'); render(id, 1); return; }
    if (e.target.closest('[data-dismiss]')) {
      addLog(`You dismissed Ren’s suggestion for ${c.who}. It stays at ${stageName(c.stage)}`);
      delete c.suggest; render(id, 1); return;
    }
    const dirBtn = e.target.closest('[data-dir]');
    if (dirBtn) {
      const dir = +dirBtn.dataset.dir;
      const i = STAGES.findIndex(s => s.id === c.stage) + dir;
      if (i >= 0 && i < STAGES.length) { move(id, STAGES[i].id); render(STAGES[i].id === 'closed' ? null : id, dir); }
    }
  });

  /* Pointer drag: works for mouse, pen and touch */
  let drag = null;
  board.addEventListener('pointerdown', e => {
    const card = e.target.closest('.dd-card');
    if (!card || e.target.closest('button') || e.button > 0) return;
    drag = { id: card.dataset.id, card, x: e.clientX, y: e.clientY, started: false };
    card.setPointerCapture(e.pointerId);
  });
  board.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!drag.started) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 6) return;
      drag.started = true;
      drag.ghost = drag.card.cloneNode(true);
      drag.ghost.classList.add('dd-ghost');
      document.body.appendChild(drag.ghost);
      drag.card.classList.add('dragging');
    }
    drag.ghost.style.left = `${e.clientX - 90}px`;
    drag.ghost.style.top = `${e.clientY - 24}px`;
    const col = colAt(e.clientX, e.clientY);
    $$('.dd-col', board).forEach(c => c.classList.toggle('over', c === col));
  });
  const endDrag = e => {
    if (!drag) return;
    if (drag.started) {
      const col = colAt(e.clientX, e.clientY);
      drag.ghost.remove();
      drag.card.classList.remove('dragging');
      $$('.dd-col', board).forEach(c => c.classList.remove('over'));
      if (col) { move(drag.id, col.dataset.stage); render(); const el = $(`.dd-card[data-id="${drag.id}"]`, board); el && el.classList.add('just-moved'); }
    }
    drag = null;
  };
  board.addEventListener('pointerup', endDrag);
  board.addEventListener('pointercancel', endDrag);
  function colAt(x, y) {
    const el = document.elementFromPoint(x, y);
    return el && el.closest('.dd-col');
  }

  /* Controls */
  $$('[data-mode]', $('.demo-head', root)).forEach(b => b.addEventListener('click', () => {
    root.dataset.mode = b.dataset.mode;
    $$('[data-mode]', $('.demo-head', root)).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    if (b.dataset.mode === 'private') {
      root.dataset.side = 'by';
      $$('[data-side]', root).forEach(x => x.setAttribute('aria-selected', x.dataset.side === 'by' ? 'true' : 'false'));
    }
    render();
  }));
  $$('[data-side]', $('.demo-head', root)).forEach(b => b.addEventListener('click', () => {
    root.dataset.side = b.dataset.side;
    $$('[data-side]', root).forEach(x => x.setAttribute('aria-selected', x === b ? 'true' : 'false'));
    render();
  }));
  $('[data-reset]', root).addEventListener('click', () => { state = fresh(); render(); });

  render();
})();

/* Small helper: a segmented control whose buttons carry data-value */
function segment(seg, onChange, initial) {
  const buttons = $$('button', seg);
  const attr = seg.getAttribute('role') === 'tablist' ? 'aria-selected' : 'aria-pressed';
  const pick = v => {
    buttons.forEach(b => b.setAttribute(attr, b.dataset.value === v ? 'true' : 'false'));
    onChange(v);
  };
  buttons.forEach(b => b.addEventListener('click', () => pick(b.dataset.value)));
  pick(initial || buttons[0].dataset.value);
  return pick;
}
function buildSeg(seg, items, attr = 'aria-pressed') {
  seg.innerHTML = items.map(([v, label]) =>
    `<button type="button" data-value="${v}" ${attr === 'aria-selected' ? 'role="tab"' : ''} ${attr}="false">${label}</button>`).join('');
}

/* ─────────────────────────────────────────────────────────
   Phone: swipe cards and voice mode (ren-mobile.html)
   ───────────────────────────────────────────────────────── */
(function phoneDemo() {
  const root = document.getElementById('phone-demo');
  if (!root) return;
  const wrap = root.closest('.phone-wrap');
  const log = $('.pz-log', wrap);
  const CARDS = [
    { who: 'Leah Moreno', stage: 'Mention', read: 'Leah covered the release notes twice last month. Nobody has said so yet.', say: 'Leah, you covered the release notes twice before anyone asked. That’s why we shipped on time.', src: 'Picked up from Slack' },
    { who: 'Omar Haddad', stage: 'Invitation', read: 'Late to standup twice more since you mentioned it.', say: 'Omar, can we talk about mornings? I’d like to understand what’s getting in the way.', src: 'Picked up from your calendar' },
    { who: 'Grace Kim', stage: 'Invitation', read: 'Your Q3 scope question has been open for 12 days.', say: 'Grace, the scope question is still open on my side. Got 15 minutes this week?', src: 'Picked up from Slack' },
  ];
  let i = 0;
  const deck = $('.pz-deck', root);
  const render = () => {
    $('.pz-count', root).textContent = i < CARDS.length ? `${i + 1} of ${CARDS.length}` : '';
    deck.innerHTML = i < CARDS.length ? CARDS.slice(i, i + 2).reverse().map((c, k, arr) => `
      <div class="pz-card ${k === arr.length - 1 ? 'top' : 'under'}">
        <div class="pz-who"><span class="dd-av">${initials(c.who)}</span><b>${c.who}</b><span class="pz-stage">${c.stage}</span></div>
        <span class="k">Ren’s read</span><p>${c.read}</p>
        <span class="k">You could say</span><p class="pz-say">“${c.say}”</p>
        <span class="pz-src">${c.src}</span>
      </div>`).join('') : `<div class="pz-done"><b>All clear.</b><span>Nothing else waiting. <button type="button" class="linkish" data-act="again">See them again</button></span></div>`;
    $('.pz-actions', root).hidden = i >= CARDS.length;
  };
  const act = (kind) => {
    const top = $('.pz-card.top', deck);
    if (!top) return;
    const c = CARDS[i];
    top.classList.add(kind === 'snooze' ? 'out-left' : 'out-right');
    log.textContent = kind === 'snooze' ? `Snoozed ${c.who.split(' ')[0]} until Monday.` : `Opening ${c.who.split(' ')[0]}’s card to review the draft.`;
    setTimeout(() => { i++; render(); }, 260);
  };
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const a = b.dataset.act;
    if (a === 'snooze' || a === 'review') act(a);
    if (a === 'again') { i = 0; render(); log.textContent = 'Swipe the top card left to snooze it or right to review it.'; }
    if (a === 'talk') {
      const on = root.classList.toggle('listening');
      $('.pz-talk-label', root).textContent = on ? 'Go ahead, I’m listening · 0:07' : 'Tap to talk to Ren';
      log.textContent = on ? 'Recording. Tap again when you’re done.' : 'Ren keeps the part worth coming back to.';
    }
    if (a === 'listen') readAll();
  });

  /* swipe */
  let sx = null, dx = 0;
  deck.addEventListener('pointerdown', e => { const t = e.target.closest('.pz-card.top'); if (!t) return; sx = e.clientX; dx = 0; t.setPointerCapture(e.pointerId); t.style.transition = 'none'; });
  deck.addEventListener('pointermove', e => {
    if (sx === null) return;
    dx = e.clientX - sx;
    const t = $('.pz-card.top', deck);
    t.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
    t.dataset.hint = dx < -30 ? 'snooze' : dx > 30 ? 'review' : '';
  });
  const end = () => {
    if (sx === null) return;
    const t = $('.pz-card.top', deck);
    t.style.transition = ''; t.style.transform = '';
    if (Math.abs(dx) > 70) act(dx < 0 ? 'snooze' : 'review'); else t.dataset.hint = '';
    sx = null;
  };
  deck.addEventListener('pointerup', end);
  deck.addEventListener('pointercancel', end);

  /* voice: read the queue out one by one */
  const queue = $('.pz-queue', root);
  const items = [['Leah Moreno', 'Mention', 'She covered the release notes twice.'], ['Omar Haddad', 'Invitation', 'Ren suggests reaching out before Friday.'], ['Grace Kim', 'Invitation', 'The scope question is still open.'], ['Ben Archer', 'Boundary', 'Worth naming before it repeats again.']];
  queue.innerHTML = items.map(([w, s, t]) => `<li><span class="dd-av">${initials(w)}</span><span><b>${w}</b> <small>${s}</small>${t}</span></li>`).join('');
  let timer = null;
  function readAll() {
    clearInterval(timer);
    const lis = $$('li', queue);
    let k = 0;
    root.classList.add('reading');
    const step = () => {
      lis.forEach((li, n) => li.classList.toggle('now', n === k));
      if (k < lis.length) log.textContent = `Ren is reading ${items[k][0].split(' ')[0]}’s card out loud.`;
      if (k++ >= lis.length) { clearInterval(timer); root.classList.remove('reading'); log.textContent = 'That’s all four. Say “send it”, “I’ll say it”, or “that’s not what happened”.'; }
    };
    step();
    timer = setInterval(step, 1300);
  }

  segment($('[data-group="mode"]', wrap), v => {
    root.dataset.mode = v;
    clearInterval(timer); root.classList.remove('reading', 'listening');
    $$('li', queue).forEach(li => li.classList.remove('now'));
    log.textContent = v === 'voice' ? 'Tap the circle to talk, or listen to what’s waiting.' : 'Swipe the top card left to snooze it or right to review it.';
  });
  render();
})();

/* ─────────────────────────────────────────────────────────
   Local: how a request gets read (local.html)
   ───────────────────────────────────────────────────────── */
(function intentDemo() {
  const root = document.getElementById('intent-demo');
  if (!root) return;
  const ASKS = {
    date: ['“Somewhere quiet in Silver Lake for a first date, not too expensive”',
      [['Occasion', 'Date night'], ['Where', 'Silver Lake'], ['Feel', 'Quiet, can talk'], ['Budget', '$$']],
      'Enough to search. Look for reviews and posts that talk about noise level and date nights in that area.'],
    group: ['“Dinner for 8 tomorrow in K-town, one vegetarian, somewhere fun”',
      [['Occasion', 'With friends'], ['Where', 'K-town'], ['Party', '8 people'], ['Diet', 'One vegetarian'], ['Feel', 'Lively']],
      'A group ask, so everyone’s diet counts. Look for places that work for the whole table, then rank by Local Score.'],
    dish: ['“Where do people actually go for dumplings near me?”',
      [['Looking for', 'A specific dish'], ['Dish', 'Dumplings'], ['Area', 'Near me'], ['Signal', 'What locals and creators recommend']],
      'Search for places where the dish itself keeps coming up in critics, Reddit and creator posts, not just high ratings overall.'],
  };
  const seg = $('.seg', root);
  buildSeg(seg, [['date', 'First date'], ['group', 'Group of 8'], ['dish', 'Just dumplings']]);
  segment(seg, v => {
    const [q, fields, next] = ASKS[v];
    $('.id-body', root).innerHTML = `
      <p class="id-q">${q}</p>
      <div class="id-fields">${fields.map(([k, x]) => `<div><span class="k">${k}</span>${x}</div>`).join('')}</div>
      <div class="id-next"><span class="k">Next step</span>${next}</div>`;
  });
})();

/* ─────────────────────────────────────────────────────────
   Account switching (caught-before-launch.html)
   ───────────────────────────────────────────────────────── */
(function switchDemo() {
  const root = document.getElementById('switch-demo');
  if (!root) return;
  const screen = $('.sw-screen', root);
  const count = $('.sw-count', root);
  const FLOWS = {
    before: [
      ['Signed in to <b>Client A</b>', 'Log out'],
      ['Signed out', 'Log in'],
      ['Enter email and password', 'Sign in'],
      ['Pick an account', 'Client B'],
    ],
    after: [
      ['Signed in to <b>Client A</b>', 'Switch account ▾'],
      ['Client A · <b>Client B</b> · Client C', 'Client B'],
    ],
  };
  let step = 0, flow = 'before';
  const render = () => {
    const steps = FLOWS[flow];
    if (step >= steps.length) {
      screen.innerHTML = `<div class="sw-done">Signed in to <b>Client B</b></div><button type="button" class="btn ghost small" data-restart>Try again</button>`;
      count.textContent = `${steps.length} step${steps.length > 1 ? 's' : ''}${flow === 'before' ? ', and a full sign-in, every time you switch.' : ', without leaving the page.'}`;
      return;
    }
    const [what, action] = steps[step];
    screen.innerHTML = `<div class="sw-state">${what}</div><button type="button" class="btn small" data-next>${action}</button><span class="sw-step">Step ${step + 1} of ${steps.length}</span>`;
    count.textContent = '';
  };
  screen.addEventListener('click', e => {
    if (e.target.closest('[data-next]')) { step++; render(); $('button', screen) && $('button', screen).focus(); }
    if (e.target.closest('[data-restart]')) { step = 0; render(); }
  });
  root.addEventListener('statechange', e => { flow = e.detail; step = 0; render(); });
  flow = root.dataset.state || 'before';
  render();
})();

/* ─────────────────────────────────────────────────────────
   Data separation (caught-before-launch.html)
   ───────────────────────────────────────────────────────── */
(function apiDemo() {
  const root = document.getElementById('api-demo');
  if (!root) return;
  const result = $('.api-result', root);
  const run = route => {
    const fixed = root.dataset.state === 'after';
    root.classList.remove('route-app', 'route-api', 'blocked-ui', 'blocked-srv', 'leaked');
    void root.offsetWidth;
    root.classList.add(`route-${route}`);
    if (route === 'app') {
      root.classList.add('blocked-ui');
      result.innerHTML = '<b class="ok">Blocked.</b> The app never shows Firm B’s clients, so this looks safe from the screen.';
    } else if (!fixed) {
      root.classList.add('leaked');
      result.innerHTML = '<b class="bad">Firm B’s records came back.</b> The interface was the only thing keeping firms apart, and a direct API request skips it.';
    } else {
      root.classList.add('blocked-srv');
      result.innerHTML = '<b class="ok">Blocked by the server.</b> The API now checks which firm you belong to on every request, whatever sent it.';
    }
  };
  $$('[data-route]', root).forEach(b => b.addEventListener('click', () => run(b.dataset.route)));
  root.addEventListener('statechange', e => {
    $('.srv-note', root).textContent = e.detail === 'after' ? 'checks the firm' : 'no check';
    root.classList.remove('route-app', 'route-api', 'blocked-ui', 'blocked-srv', 'leaked');
    result.textContent = 'Pick a route.';
  });
})();

/* ─────────────────────────────────────────────────────────
   The first day (ren-today.html). Copy from the First Run prototype.
   ───────────────────────────────────────────────────────── */
(function firstDayDemo() {
  const root = document.getElementById('firstday-demo');
  if (!root) return;
  const chat = $('.fd-chat', root);
  const SETUPS = {
    team: {
      label: 'Connected, team on Ren',
      lines: ['Hi Jordan, I’m Ren. I’m listening to Slack, Zoom and your calendar now.', 'Your first morning brief lands here tomorrow at 7:30. Until then, who’s on your mind this week?'],
      faces: ['Maya Fenton', 'Marcus Kelley', 'Kai Okafor', 'Dana Liu'],
      reply: who => `Let’s start with ${who.split(' ')[0]}. What happened this week?`,
    },
    noteam: {
      label: 'Connected, no team yet',
      lines: ['Hi Jordan, I’m Ren. I’m listening to Slack, Zoom and your calendar now.', 'Your first morning brief lands here tomorrow at 7:30. Your team isn’t on Ren yet, and in Slack you talk most with Maya, Marcus and Kai. Want to bring them in?'],
      actions: [['Invite all three', 'Done, I sent three invites. They’ll show up under Your team when they join.'], ['Someone else', 'Who should I invite? Type a name or an email.']],
    },
    none: {
      label: 'Nothing connected',
      lines: ['Hi Jordan, I’m Ren. I can’t see your week yet, because nothing’s connected.', 'Connect Slack or Teams and I’ll start noticing the moments worth saying something about. Your first brief lands the morning after.'],
      actions: [['Connect Slack', 'Opening Slack. Come back here when it’s done and I’ll take it from there.', true], ['Connect Teams', 'Opening Microsoft Teams. Come back here when it’s done and I’ll take it from there.'], ['Paste or drop something instead', 'Got it. In this #product thread, Dana answered the question nobody else would, and nobody thanked her. Want to say something?']],
    },
    admin: {
      label: 'Not an admin',
      lines: ['Hi Jordan, I’m Ren. I can’t see your Slack or Teams yet, and connecting them is up to your admin.', 'You don’t need to wait. Paste a Slack thread, drop in a screenshot, or add a meeting’s notes, and I’ll find what’s worth saying.'],
      actions: [['Paste or drop something', 'Got it. In this #product thread, Dana answered the question nobody else would, and nobody thanked her. Want to say something?', true], ['Ask Priya to connect Slack', 'Done. I asked Priya Raman, your admin, to connect Slack. Until then, anything you paste works the same way.']],
    },
  };
  let timers = [];
  const bubble = (text, cls = 'ren') => `<p class="fd-msg ${cls}">${esc(text)}</p>`;
  function show(key) {
    timers.forEach(clearTimeout); timers = [];
    const s = SETUPS[key];
    chat.innerHTML = '';
    s.lines.forEach((l, i) => timers.push(setTimeout(() => chat.insertAdjacentHTML('beforeend', bubble(l)), i * 450)));
    timers.push(setTimeout(() => {
      const opts = s.faces
        ? `<div class="fd-faces">${s.faces.map(f => `<button type="button" data-face="${esc(f)}"><span class="dd-av">${initials(f)}</span>${esc(f.split(' ')[0])}</button>`).join('')}</div>`
        : `<div class="fd-actions">${s.actions.map(([t, , primary], i) => `<button type="button" class="btn small ${primary ? '' : 'ghost'}" data-i="${i}">${esc(t)}</button>`).join('')}</div>`;
      chat.insertAdjacentHTML('beforeend', opts);
    }, s.lines.length * 450));
    chat.onclick = e => {
      if (e.target.closest('.fd-again')) { show(key); return; }
      const face = e.target.closest('[data-face]');
      const act = e.target.closest('[data-i]');
      if (!face && !act) return;
      const you = face ? face.dataset.face : s.actions[+act.dataset.i][0];
      const ren = face ? s.reply(face.dataset.face) : s.actions[+act.dataset.i][1];
      $('.fd-faces, .fd-actions', chat).remove();
      chat.insertAdjacentHTML('beforeend', bubble(you, 'you'));
      timers.push(setTimeout(() => chat.insertAdjacentHTML('beforeend', bubble(ren) + '<button type="button" class="linkish fd-again">Start over</button>'), 400));
    };
  }
  const seg = $('.seg', root);
  buildSeg(seg, Object.entries(SETUPS).map(([k, v]) => [k, v.label]));
  segment(seg, show);
})();

/* ─────────────────────────────────────────────────────────
   Who sees what (ren-team.html). From the Team prototype's matrix.
   ───────────────────────────────────────────────────────── */
(function whoDemo() {
  const root = document.getElementById('who-demo');
  if (!root) return;
  const ROWS = {
    direct: { label: 'You → your direct', who: 'Jordan viewing Maya',
      plan: [true, 'You set it with Ren and can change it. It shows on their page.'],
      one: [true, 'You prep your side and log it after.'],
      dial: [true, 'Full'] },
    manager: { label: 'Direct → their manager', who: 'Maya viewing Jordan',
      plan: [true, 'Their plan lives on their Profile. They can talk to Ren about it, but can’t change it.'],
      one: [true, 'They prep their side. The manager never sees it.'],
      dial: [true, 'Full'] },
    teammate: { label: 'Teammate → teammate', who: 'Maya viewing Dana',
      plan: [false, 'Hidden'], one: [false, 'None'], dial: [true, 'Full. The only thing they can do.'] },
    peer: { label: 'You → your peer', who: 'Jordan viewing Rachel',
      plan: [false, 'Hidden'], one: [false, 'None'], dial: [true, 'Full'] },
  };
  const cell = (title, sub, [on, text]) => `
    <div class="who-cell ${on ? 'on' : 'off'}">
      <span class="who-k">${title}<small>${sub}</small></span>
      <span class="who-state">${on ? 'Yes' : 'No'}</span>
      <p>${text}</p>
    </div>`;
  const seg = $('.seg', root);
  buildSeg(seg, Object.entries(ROWS).map(([k, v]) => [k, v.label]));
  segment(seg, k => {
    const r = ROWS[k];
    $('.who-body', root).innerHTML = `<p class="who-who">${r.who}</p>
      <div class="who-grid">${cell('Plan', 'each quarter', r.plan)}${cell('1:1', 'each month', r.one)}${cell('Dial', 'any time', r.dial)}</div>`;
  });
})();

/* ─────────────────────────────────────────────────────────
   Jordan's Tuesday (ren-next.html). From the Oct to Jan prototype.
   ───────────────────────────────────────────────────────── */
(function tuesdayDemo() {
  const root = document.getElementById('tue-demo');
  if (!root) return;
  const DATES = [['now', 'Today'], ['nov', 'Nov 1'], ['dec', 'Dec 1'], ['jan', 'Jan 1']];
  const M = {
    brief: { label: '7:30 · Morning brief', steps: {
      now: ['The brief waits for Jordan to find it', 'The morning brief is good, but it only exists inside the app.', 'In the app, on Today'],
      nov: ['The brief lands in Slack', 'Same brief, delivered where Jordan already is at 7:30, and still at the top of Today.', 'Slack DM'],
      dec: ['The brief is a push you can listen to', 'On the phone, Jordan can play the brief like a 60-second voice note on the way in.', 'Ren app, push'],
      jan: ['The brief reports what Ren already handled', '“Kai is out Wednesday, so I moved your 1:1 to Thursday at 11 and kept the prep. OK?” A one-tap OK instead of a decision.', 'Push, keep or undo'] } },
    before: { label: '9:50 · Before the 1:1', steps: {
      now: ['The 1:1 starts cold', 'Ren can prep a great 1:1, but only when asked, and only if it knows the meeting is happening.', 'Only if Jordan asks'],
      nov: ['A nudge 10 minutes before', 'Ren knows the 1:1 because it booked it, and sends the one thing to open with.', 'Slack DM'],
      dec: ['Prep you can talk through on the walk over', 'Ren remembers Maya across months, and Jordan can talk the prep through out loud or just read it.', 'Push, two-minute voice prep'],
      jan: ['The prep is already in the invite', 'Ren wrote the prep into Jordan’s copy of the calendar event. Nothing to do but walk in.', 'Calendar invite'] } },
    after: { label: '10:40 · After the 1:1', steps: {
      now: ['Most 1:1s are never logged', 'Without a Zoom Pro recording, nothing about the 1:1 reaches Ren, and the month stays Due.', 'Log it by hand, if you remember'],
      nov: ['Ren asks how it went', 'Right after the meeting ends, Ren asks once. A one-line reply logs the 1:1.', 'Slack DM'],
      dec: ['Tell Ren in 30 seconds', 'The phone buzzes once when the meeting ends. Jordan holds to talk on the walk back, and Ren writes it up.', 'Push that opens to voice'],
      jan: ['Ren drafts the follow-up', 'Ren pulls out what they agreed and drafts the follow-up to Maya. It goes out on Jordan’s yes.', 'Push with a draft'] } },
    moment: { label: '2:15 · A moment worth saying', steps: {
      now: ['The moment passes', 'Ren spots the moment and makes a card, but Jordan sees it hours or days later.', 'A card in the app'],
      nov: ['Ren pings with a draft', 'Ren sees Dana share the readout in Slack and sends Jordan a thank-you to send right away.', 'Slack DM with a draft'],
      dec: ['Send it from the notification', 'One tap from the lock screen posts it in Slack as Jordan.', 'Push with Send'],
      jan: ['Ren times it, and closes the loop', 'Ren waits for the readout to end, sends on Jordan’s yes, then shows Dana’s reply.', 'Push, then the reply'] } },
  };
  let moment = 'brief', date = 'now';
  const card = $('.tue-card', root);
  const render = () => {
    const [t, x, where] = M[moment].steps[date];
    card.innerHTML = `<span class="k">${M[moment].label} · ${DATES.find(d => d[0] === date)[1]}</span><h3>${t}</h3><p>${x}</p><span class="tue-where">${where}</span>`;
    card.classList.toggle('is-now', date === 'now');
  };
  const ms = $('.tue-moments', root), ds = $('.tue-dates', root);
  buildSeg(ms, Object.entries(M).map(([k, v]) => [k, v.label]));
  buildSeg(ds, DATES);
  segment(ms, v => { moment = v; render(); });
  segment(ds, v => { date = v; render(); });
})();
