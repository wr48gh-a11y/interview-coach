// Game Plan — her workbook as an in-app reference. North star, what she must
// prove, the conversion trap, her story bank, Gemini POV, STAR timing, and the
// 7-day plan with progress ticked off as she practices. Read-only, no LLM.

import { el, esc } from '../ui.js';
import { navigate } from '../app.js';
import { getSessions } from '../store.js';
import { PROFILE, STORIES, STAR_TIMING, PLAN, ATTRIBUTES } from '../hannah.js';

export async function render(root) {
  const sessions = await getSessions();
  const done = sessions.length;

  const v = el(`<div class="stack screen-enter" style="max-width:760px;margin:0 auto">
    <div class="row between" style="padding:0 4px">
      <h1>Game plan</h1>
      <button class="btn quiet small" id="home">Done</button>
    </div>

    <div class="glass card gp-northstar">
      <div class="label">Your north star — open and close on this</div>
      <p class="gp-ns-text">“${esc(PROFILE.northStar)}”</p>
    </div>

    <div class="grid2">
      <div class="glass card">
        <h3>Prove these five things</h3>
        <div class="gp-list">
          ${PROFILE.mustProve.map(m => `<div class="gp-item"><span class="gp-dot good"></span>${esc(m)}</div>`).join('')}
        </div>
      </div>
      <div class="glass card gp-trap">
        <h3>⚠︎ The conversion trap</h3>
        <p class="muted" style="font-size:13.5px;margin-top:8px">${esc(PROFILE.conversionTrap)}</p>
      </div>
    </div>

    <div class="glass card">
      <h3>Your story bank</h3>
      <p class="tiny" style="margin-bottom:6px">One story per theme. Tap <b>Drill</b> to rehearse one against a real question.</p>
      <div class="gp-stories">
        ${STORIES.map(s => `<div class="gp-story">
          <div class="gp-story-head">
            <span class="gp-story-title">${esc(s.title)}</span>
            <span class="tiny">${esc(s.company)}</span>
          </div>
          <div class="gp-metric">${esc(s.metric)}</div>
          <div class="gp-bestfor">${esc(s.bestFor)}</div>
          <button class="gp-drill" data-drill="${esc(s.id)}">⚡️ Drill this story</button>
        </div>`).join('')}
      </div>
    </div>

    <div class="grid2">
      <div class="glass card">
        <h3>STAR timing</h3>
        <div class="gp-timing">
          ${STAR_TIMING.map(t => `<div class="gp-trow">
            <span class="gp-tpart">${esc(t.part)}</span>
            <span class="gp-tsecs">${esc(t.secs)}</span>
            <span class="gp-tsay">${esc(t.say)}</span>
          </div>`).join('')}
        </div>
      </div>
      <div class="glass card">
        <h3>Your Gemini POV</h3>
        <div class="gp-list">
          ${PROFILE.geminiPOV.map(p => `<div class="gp-item"><span class="gp-dot accent"></span>${esc(p)}</div>`).join('')}
        </div>
      </div>
    </div>

    <div class="glass card">
      <div class="row between">
        <h3>7-day plan</h3>
        <span class="tiny">${done} session${done === 1 ? '' : 's'} logged</span>
      </div>
      <div class="gp-plan">
        ${PLAN.map((d, i) => {
          const complete = done > i;
          return `<div class="gp-day ${complete ? 'done' : ''}">
            <span class="gp-daynum">${complete ? '✓' : d.day}</span>
            <div>
              <div class="gp-focus">${esc(d.focus)}</div>
              <div class="tiny">→ ${esc(d.output)}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>`);

  v.querySelector('#home').onclick = () => navigate('dashboard');
  v.querySelectorAll('.gp-drill').forEach(b => {
    b.onclick = () => navigate('session', { targetStoryId: b.dataset.drill });
  });
  void ATTRIBUTES;
  root.innerHTML = '';
  root.appendChild(v);
}
