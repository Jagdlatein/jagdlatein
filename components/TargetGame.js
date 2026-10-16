"use client";

import { useEffect, useId, useReducer, useRef, useState } from "react";
import {
  TARGET_SHOTS, TARGET_RINGS, coordinateToGamePoint, createTargetGame,
  targetGameReducer, targetGameToken,
} from "../lib/target-game";
import AppIcon from "./AppIcon";
import styles from "../styles/TargetGame.module.css";

const WIDTH = 1000;
const HEIGHT = 600;
const MODES = { ruhig: "Ruhige Scheibe", wechsel: "Wechselnde Position" };

function Tree({ x, y, scale = 1 }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><path d="M-5 0h10v-82H-5Z" fill="#73694b" /><path d="m0-188-50 76h24l-43 70H69l-43-70h24Z" fill="#456b56" /><path d="m0-188-34 76h18l-28 70H0Z" fill="#527c62" /></g>;
}

export default function TargetGame() {
  const [state, dispatch] = useReducer(targetGameReducer, undefined, createTargetGame);
  const [selectedMode, setSelectedMode] = useState("ruhig");
  const [aim, setAim] = useState({ x: .5, y: .5 });
  const [keyboardAim, setKeyboardAim] = useState(false);
  const aimRef = useRef(aim);
  const boardRef = useRef(null);
  const svgRef = useRef(null);
  const gestureRef = useRef(null);
  const inputRef = useRef(0);
  const aliveRef = useRef(true);
  const stateRef = useRef(state);
  stateRef.current = state;
  const focusOnStart = useRef(false);
  const id = useId().replace(/:/g, "");
  const playing = state.status === "playing";
  const finished = state.status === "finished";
  const target = state.target;
  const lastShot = state.shots[state.shots.length - 1];
  const hits = state.shots.filter(shot => shot.score > 0).length;
  const remaining = TARGET_SHOTS - state.shots.length;
  const headingId = `scheiben-title-${id}`;
  const instructionId = `scheiben-help-${id}`;

  useEffect(() => {
    aliveRef.current = true;
    return () => { aliveRef.current = false; };
  }, []);
  useEffect(() => {
    if (playing && focusOnStart.current) {
      focusOnStart.current = false;
      boardRef.current?.focus({ preventScroll: true });
    }
  }, [state.generation, playing]);

  function start() {
    if (!aliveRef.current || stateRef.current !== state || playing) return;
    gestureRef.current = null;
    aimRef.current = { x: .5, y: .5 };
    setAim(aimRef.current);
    setKeyboardAim(false);
    focusOnStart.current = true;
    dispatch({ type: state.status === "ready" ? "start" : "restart", generation: state.generation,
      mode: selectedMode, seed: (Date.now() + ++inputRef.current) >>> 0 });
  }

  function shoot(point) {
    if (!aliveRef.current || stateRef.current !== state || !playing || !point) return;
    dispatch({ type: "shot", ...targetGameToken(state), ...point,
      inputId: `input-${state.generation}-${++inputRef.current}` });
  }

  function onClick(event) {
    if (!aliveRef.current || stateRef.current !== state || !playing || event.detail > 1) return;
    if (event.detail === 0) {
      gestureRef.current = null;
      setKeyboardAim(true);
      shoot(aimRef.current);
      return;
    }
    if (gestureRef.current?.moved || gestureRef.current?.cancelled) return;
    setKeyboardAim(false);
    const point = coordinateToGamePoint(event, svgRef.current?.getBoundingClientRect());
    shoot(point);
  }

  function onKeyDown(event) {
    if (!aliveRef.current || stateRef.current !== state || !playing || event.target !== event.currentTarget) return;
    const directions = { ArrowLeft: [-.015, 0], ArrowRight: [.015, 0], ArrowUp: [0, -.025], ArrowDown: [0, .025] };
    const movement = directions[event.key];
    if (movement) {
      event.preventDefault();
      gestureRef.current = null;
      const next = { x: Math.max(0, Math.min(1, aimRef.current.x + movement[0])),
        y: Math.max(0, Math.min(1, aimRef.current.y + movement[1])) };
      aimRef.current = next;
      setAim(next);
      setKeyboardAim(true);
    } else if ([" ", "Spacebar", "Enter"].includes(event.key)) {
      event.preventDefault();
      if (event.repeat) return;
      gestureRef.current = null;
      setKeyboardAim(true);
      shoot(aimRef.current);
    }
  }

  return <section id="scheiben-minispiel" className={styles.game} aria-labelledby={headingId}>
    <div className={styles.heading}><div className={styles.headingIcon}><AppIcon name="target" size={30} /></div><div><p className={styles.kicker}>Deine kleine Spielrunde</p><h2 id={headingId}>Zehn Schüsse. Deine Scheibenrunde.</h2></div></div>
    <div className={styles.toolbar}>
      <label className={styles.mode}>Spielart<select aria-label="Spielart" value={selectedMode} disabled={playing} onChange={event => setSelectedMode(event.target.value)}><option value="ruhig">Ruhige Scheibe</option><option value="wechsel">Wechselnde Position</option></select></label>
      <div className={styles.counters} aria-label="Rundenstand"><div><strong>{state.score}<span> / {TARGET_SHOTS * 10}</span></strong><span>Punkte</span></div><div><strong>{state.shots.length}<span> / {TARGET_SHOTS}</span></strong><span>Schüsse</span></div></div>
      {!playing && <button type="button" className={styles.primary} onClick={start}>{finished ? "Neue Runde" : "Runde starten"}<span aria-hidden="true"> →</span></button>}
    </div>

    <div ref={boardRef} className={`${styles.board}${playing ? ` ${styles.playing}` : ""}`} role="button" tabIndex={playing ? 0 : -1}
      aria-label={playing ? `Spielfeld. Schuss ${state.shots.length + 1} von ${TARGET_SHOTS}. ${state.score} Punkte.` : finished ? "Spielfeld. Die Runde ist abgeschlossen." : "Spielfeld. Starte zuerst eine Runde."}
      aria-describedby={instructionId} aria-disabled={!playing} onClick={onClick} onKeyDown={onKeyDown}
      onPointerDown={event => { gestureRef.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId, moved: false }; }}
      onPointerMove={event => { const gesture = gestureRef.current; if (gesture && gesture.pointerId === event.pointerId && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 10) gesture.moved = true; }}
      onPointerCancel={() => { gestureRef.current = { cancelled: true }; }}>
      <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" className={styles.scene}>
        <defs><linearGradient id={`sky-${id}`} x2="0" y2="1"><stop stopColor="#e7f1e6" /><stop offset="1" stopColor="#fcf5df" /></linearGradient><linearGradient id={`ground-${id}`} x2="0" y2="1"><stop stopColor="#c6d6a7" /><stop offset="1" stopColor="#aec394" /></linearGradient></defs>
        <rect width={WIDTH} height={HEIGHT} fill={`url(#sky-${id})`} />
        <circle cx="820" cy="100" r="47" fill="#ead29a" opacity=".7" />
        <path d="M0 350Q150 185 360 325T1000 267V600H0Z" fill="#b6c8a7" />
        <path d="M0 408Q235 257 490 388T1000 350V600H0Z" fill="#8fa987" />
        <path d="M0 460Q310 349 560 435T1000 395V600H0Z" fill={`url(#ground-${id})`} />
        <Tree x={69} y={446} scale={1.45} /><Tree x={150} y={431} scale={.8} /><Tree x={927} y={449} scale={1.26} /><Tree x={865} y={428} scale={.75} />
        <path d="M390 600 500 477 614 600Z" fill="#ded3ad" opacity=".48" />
        <g transform={`translate(${target.x * WIDTH} ${target.y * HEIGHT})`} data-game-target="true" data-x={target.x} data-y={target.y}>
          <ellipse cy={target.radius * HEIGHT + 27} rx={target.radius * HEIGHT * .88} ry="15" fill="#456b56" opacity=".14" />
          <path d={`M-26 ${target.radius * HEIGHT - 8}v36M26 ${target.radius * HEIGHT - 8}v36`} fill="none" stroke="#8e7952" strokeWidth="12" strokeLinecap="round" />
          {TARGET_RINGS.map((ring, index) => <circle key={ring.score} r={target.radius * HEIGHT * ring.radius} fill={["#fffaf0", "#527760", "#e6c879", "#faf2d1"][index]} stroke={["#315f49", "#f7f3df", "#f7f3df", "#315f49"][index]} strokeWidth={index === 0 ? 7 : 2} />)}
          <circle r="3" fill="#315f49" />
        </g>
        {state.shots.map(shot => <g key={shot.inputId} transform={`translate(${shot.x * WIDTH} ${shot.y * HEIGHT})`}><circle r="7" fill="#fffdf7" stroke="#244c3c" strokeWidth="2" /><path d="m-4-4 8 8m-8 0 8-8" stroke="#244c3c" strokeWidth="2" /></g>)}
        {keyboardAim && playing && <g transform={`translate(${aim.x * WIDTH} ${aim.y * HEIGHT})`} fill="none" stroke="#fff" strokeWidth="3"><circle r="15" stroke="#273f32" strokeWidth="5" /><path d="M-25 0h15m20 0h15M0-25v15m0 20v15" stroke="#273f32" strokeWidth="5" /><circle r="15" /><path d="M-25 0h15m20 0h15M0-25v15m0 20v15" /></g>}
      </svg>
      {!playing && <span className={styles.boardBadge}>{finished ? "Runde abgeschlossen" : "Bereit für deine Runde?"}</span>}
      <span className={styles.graphicLabel}>Spielgrafik</span>
    </div>

    <div className={styles.belowBoard}>
      <p id={instructionId} className={styles.instructions}>{playing ? "Tippe oder klicke auf die Scheibe." : "10 Schüsse, ohne Zeitdruck."} <span>Mit Tastatur: Spielfeld wählen, Pfeiltasten zum Bewegen, Leertaste oder Enter zum Schießen.</span>{(playing ? state.mode : selectedMode) === "wechsel" && <span>Die Position wechselt erst nach jedem Schuss.</span>}</p>
      <div className={styles.rings} aria-label="Spielpunkte von innen nach außen">{[...TARGET_RINGS].reverse().map(ring => <span key={ring.score}><i aria-hidden="true" className={styles[`ring${ring.score}`]} />{ring.score} Punkte</span>)}</div>
    </div>
    <div className={`${styles.feedback}${finished ? ` ${styles.finished}` : ""}`} role="status" aria-live="polite" aria-atomic="true">
      {finished ? <><strong>{state.score} von {TARGET_SHOTS * 10} Punkten</strong><span>{hits} von {TARGET_SHOTS} Schüssen haben die Scheibe getroffen. Deine Runde ist abgeschlossen.</span></> : lastShot ? <><strong>{lastShot.score ? `+${lastShot.score} Punkte` : "Außerhalb der Scheibe"}</strong><span>{lastShot.score ? "Treffer markiert." : "Dieser Schuss zählt ohne Punkte."} Noch {remaining} {remaining === 1 ? "Schuss" : "Schüsse"}.</span></> : <><strong>{playing ? "Deine Runde läuft" : "Wähle deine Spielart und starte."}</strong><span>{playing ? `${MODES[state.mode]} · Du bestimmst das Tempo.` : "Triff die Ringe und sammle bis zu 100 Spielpunkte."}</span></>}
    </div>
    <p className={styles.notice}>Bildschirmspiel auf abstrakten Scheiben; Punkte sind Spielwerte. Deine Runde wird nicht gespeichert.</p>
  </section>;
}
