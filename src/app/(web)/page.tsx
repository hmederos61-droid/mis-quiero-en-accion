// src/app/(web)/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

type ScreenKey = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type Quote = {
  id: string;
  text: string;
  author: string;
  emphasis?: boolean;
  x: string; // CSS length/percent
  y: string; // CSS length/percent
  d: string; // animation delay (s)
};

/**
 * ✅ TABLA CANÓNICA EDITABLE — 7 pantallas
 * ÚNICO lugar donde se ajusta:
 * - img: imagen de fondo por pantalla
 * - blur: blur del fondo global (pantalla completa)
 * - overlay: película blanca sutil
 * - dim: oscurecimiento global de pantalla (0..1)
 * - cardDim: oscurecimiento interno de card (0..1)  ✅ (por pantalla)
 */
const SCREEN_STEPS: ReadonlyArray<{
  img: string;
  overlay: number;
  blur: number;
  dim: number;
  cardDim: number;
}> = [
  { img: "/webwelcome.png", overlay: 0.8, blur: 0.5, dim: 0.7, cardDim: 0.5 }, // 0
  { img: "/webwelcome.png", overlay: 0.6, blur: 0.4, dim: 0.6, cardDim: 0.45 }, // 1
  { img: "/webwelcome.png", overlay: 0.4, blur: 0.3, dim: 0.4, cardDim: 0.4 }, // 2
  { img: "/webwelcome.png", overlay: 0.3, blur: 0.2, dim: 0.3, cardDim: 0.4 }, // 3
  { img: "/webwelcome.png", overlay: 0.2, blur: 0.1, dim: 0.2, cardDim: 0.4 }, // 4
  { img: "/webwelcome.png", overlay: 0.1, blur: 0.5, dim: 0.1, cardDim: 0.5 }, // 5
  { img: "/webwelcome.png", overlay: 0.0, blur: 0.0, dim: 0.0, cardDim: 0.6 }, // 6
];

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function QrIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3h8v8H3V3Zm2 2v4h4V5H5ZM13 3h8v8h-8V3Zm2 2v4h4V5h-4ZM3 13h8v8H3v-8Zm2 2v4h4v-4H5Zm10 0h2v2h-2v-2Zm2 2h2v2h-2v-2Zm-2 2h2v2h-2v-2Zm4 0h2v2h-2v-2Zm0-6h2v2h-2v-2Zm-2 0h2v2h-2v-2Zm4 2h2v2h-2v-2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function WhatsappIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.5 11.9c0 4.74-3.86 8.6-8.6 8.6-1.5 0-2.95-.39-4.23-1.12L3 21l1.67-4.48A8.54 8.54 0 0 1 3.3 11.9c0-4.74 3.86-8.6 8.6-8.6s8.6 3.86 8.6 8.6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 8.7c.25-.55.5-.56.73-.57.2 0 .45 0 .68 0 .22 0 .57-.08.87.67.3.74 1.02 2.56 1.11 2.75.1.19.16.41.03.66-.12.25-.19.41-.37.63-.19.22-.39.5-.56.67-.19.19-.38.39-.17.76.22.37.96 1.57 2.06 2.54 1.42 1.26 2.62 1.65 2.99 1.83.37.19.58.16.8-.09.22-.25.92-1.08 1.17-1.45.25-.37.5-.31.84-.19.34.12 2.16 1.02 2.53 1.2.37.19.62.28.71.44.09.16.09.93-.22 1.83-.31.9-1.82 1.77-2.5 1.88-.68.11-1.55.16-2.53-.16-.6-.19-1.38-.45-2.38-.89-4.2-1.81-6.94-6.23-7.15-6.54-.22-.31-1.71-2.28-1.71-4.35 0-2.07 1.08-3.08 1.46-3.49Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function MailIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M5.3 7.2 12 12.2l6.7-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GlobeIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.8 12h16.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M12 3c2.4 2.5 3.7 5.7 3.7 9s-1.3 6.5-3.7 9c-2.4-2.5-3.7-5.7-3.7-9s1.3-6.5 3.7-9Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function WebPublicCoachingPersonal() {
  const [mounted, setMounted] = useState(false);
  const [screen, setScreen] = useState<ScreenKey>(0);

  // respuestas (se acumulan y se muestran en pantallas siguientes)
  const [a1, setA1] = useState("");
  const [a2, setA2] = useState("");
  const [a3, setA3] = useState("");
  const [a4, setA4] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 40);
    return () => window.clearTimeout(t);
  }, []);

  const ivory = "#F5F1E8";

  const orbitQuotes: Quote[] = useMemo(
    () => [
      {
        id: "jung",
        text: "Hasta que lo inconsciente no se haga consciente, dirigirá tu vida y lo llamarás destino.",
        author: "Carl Gustav Jung",
        emphasis: true,
        x: "32%",
        y: "13%",
        d: "0.18s",
      },
      {
        id: "heidegger",
        text: "El lenguaje es la casa del ser.",
        author: "Martin Heidegger",
        x: "68%",
        y: "13%",
        d: "0.18s",
      },
      {
        id: "frankl",
        text: "Entre el estímulo y la respuesta hay un espacio. En ese espacio está nuestro poder para elegir.",
        author: "Viktor Frankl",
        x: "22%",
        y: "33%",
        d: "0.34s",
      },
      {
        id: "echeverria",
        text: "No sabemos cómo son las cosas. Solo sabemos cómo las interpretamos.",
        author: "Rafael Echeverría",
        x: "78%",
        y: "33%",
        d: "0.34s",
      },
      {
        id: "freire",
        text: "La educación no cambia el mundo; cambia a las personas que van a cambiar el mundo.",
        author: "Paulo Freire",
        x: "20%",
        y: "62%",
        d: "0.52s",
      },
      {
        id: "cortazar",
        text: "Andábamos sin buscarnos pero sabiendo que andábamos para encontrarnos.",
        author: "Julio Cortázar",
        x: "80%",
        y: "62%",
        d: "0.52s",
      },
      {
        id: "sabato",
        text: "La vida no es lo que uno vivió, sino lo que recuerda y cómo lo recuerda para contarla.",
        author: "Ernesto Sábato",
        x: "32%",
        y: "83%",
        d: "0.70s",
      },
      {
        id: "realidad-accion",
        text: "Realidad y acción para el cambio.",
        author: "—",
        emphasis: true,
        x: "68%",
        y: "83%",
        d: "0.70s",
      },
    ],
    []
  );

  const screens = useMemo(
    () => [
      {
        k: 0 as ScreenKey,
        eyebrow: "COACHING PERSONAL",
        title: "Coaching Ontológico Individual",
        lead:
          "Un espacio profesional de conversación\npara observar cómo estás interpretando tu realidad\ny descubrir nuevas posibilidades de acción.",
        hint: "Si algo de esto resuena con vos,\nseguí el recorrido.",
      },
      {
        k: 1 as ScreenKey,
        eyebrow: "",
        title: "Voces que iluminan el camino",
        lead: "El coaching ontológico se nutre de diversas corrientes del pensamiento humano.",
        hint: "",
      },
      {
        k: 2 as ScreenKey,
        eyebrow: "",
        title: "¿Qué te trae hasta aquí?",
        lead: "Primera parada del viaje",
        hint: "",
      },
      {
        k: 3 as ScreenKey,
        eyebrow: "",
        title: "¿Qué quisieras que fuera diferente?",
        lead: "Imaginando posibilidades",
        hint: "",
      },
      {
        k: 4 as ScreenKey,
        eyebrow: "",
        title: "¿Qué está en tus manos cambiar?",
        lead: "Espacio de decisión",
        hint: "",
      },
      {
        k: 5 as ScreenKey,
        eyebrow: "",
        title: "¿Qué primer paso podrías dar?",
        lead: "Momento de elección",
        hint: "",
      },
      {
        k: 6 as ScreenKey,
        eyebrow: "",
        title: "Esto es lo que estás viendo hoy",
        lead:
          "Si lo que escribiste tiene sentido para vos, quizá sea momento de conversarlo.\n\nUna primera charla breve, clara, sin presión. Con intención.",
        hint: "",
      },
    ],
    []
  );

  function clampScreen(n: number): ScreenKey {
    if (n <= 0) return 0;
    if (n >= 6) return 6;
    return n as ScreenKey;
  }

  function next() {
    setScreen((s) => clampScreen(s + 1));
  }
  function prev() {
    setScreen((s) => clampScreen(s - 1));
  }
  function go(i: ScreenKey) {
    setScreen(i);
  }

  const trackStyle: React.CSSProperties = {
    transform: `translateX(-${screen * 100}vw)`,
  };

  const step = useMemo(() => SCREEN_STEPS[screen] ?? SCREEN_STEPS[0], [screen]);
  const blurLevel = step.blur;
  const overlayLevel = step.overlay;
  const dimLevel = step.dim;
  const cardDim = step.cardDim;

  const edgeDim = useMemo(() => clamp01(0.18 + cardDim * 0.55), [cardDim]);

  const canGoNext = useMemo(() => {
    const t = (v: string) => v.trim().length >= 3;
    if (screen === 2) return t(a1);
    if (screen === 3) return t(a2);
    if (screen === 4) return t(a3);
    if (screen === 5) return t(a4);
    return true;
  }, [screen, a1, a2, a3, a4]);

  function onNext() {
    if (screen >= 2 && screen <= 5 && !canGoNext) return;
    next();
  }

  const showLeft = screen > 0;
  const showRight = screen < 6;

  // ✅ ancho card por pantalla (pantalla 6 expandida)
  const cardWidth = screen === 0 ? "75vw" : screen === 6 ? "82vw" : "45vw";
  const cardHeight = screen === 0 ? "75vh" : "auto";

  // ✅ Tamaño QR (solo se usa para el QR local de WhatsApp)
  const qrSize = 56;

  return (
    <main className="page" data-screen={screen}>
      <div
        className="bg"
        aria-hidden="true"
        style={{
          backgroundImage: `url("${step.img}")`,
          filter: `saturate(1.06) contrast(1.02) brightness(1.03) blur(${blurLevel}px)`,
          transform: "scale(1.06)",
        }}
      />

      <div
        className="overlay"
        aria-hidden="true"
        style={{
          background: `
            radial-gradient(1200px 650px at 55% 35%,
              rgba(255,255,255,${Math.min(0.14, overlayLevel * 0.55)}),
              rgba(255,255,255,0) 62%),
            linear-gradient(180deg,
              rgba(255,255,255,${Math.min(0.12, overlayLevel * 0.45)}),
              rgba(255,255,255,0.02) 58%,
              rgba(0,0,0,${Math.max(0, overlayLevel * 0.55)}) ),
            linear-gradient(180deg,
              rgba(0,0,0,${Math.max(0, dimLevel)}),
              rgba(0,0,0,${Math.max(0, dimLevel)}) )
          `,
        }}
      />

      {screen === 1 && (
        <section className="orbit" aria-label="Voces orbitales">
          <div className="orbitInner" aria-hidden="true">
            {orbitQuotes.map((q) => (
              <figure
                key={q.id}
                className={`orbCard ${mounted ? "in" : ""} ${q.emphasis ? "em" : ""}`}
                style={{
                  left: q.x,
                  top: q.y,
                  ["--d" as any]: q.d,
                }}
              >
                <blockquote className="orbText">“{q.text}”</blockquote>
                <figcaption className="orbAuth">— {q.author}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="viewport" aria-label="Coaching Personal">
        <div className="track" style={trackStyle}>
          {screens.map((s) => {
            const isZero = s.k === 0;
            const isOne = s.k === 1;
            const isQBlock = s.k >= 2 && s.k <= 6;

            return (
              <article key={s.k} className={`screen ${s.k === 6 ? "screen6" : ""}`} aria-label={`Pantalla ${s.k + 1}`}>
                <div
                  className={`card ${isZero ? "screen0" : ""} ${s.k === 6 ? "card6" : ""} ${mounted ? "in" : ""}`}
                  style={{
                    width: cardWidth,
                    height: cardHeight,
                    maxWidth: isZero ? "none" : s.k === 6 ? 1180 : 720,
                    ["--cardDim" as any]: cardDim,
                  }}
                >
                  {isZero ? (
                    <div className="s0">
                      <div className="s0Title">{s.title}</div>

                      <div className="s0Lead">
                        {s.lead.split("\n").map((line, idx) => (
                          <React.Fragment key={idx}>
                            {line}
                            <br />
                          </React.Fragment>
                        ))}
                      </div>

                      <div className="s0Lead2">
                        {"No se trata de convencerte.\nSe trata de mirarte con precisión\ny desde ahí elegir mejor."
                          .split("\n")
                          .map((line, idx) => (
                            <React.Fragment key={idx}>
                              {line}
                              <br />
                            </React.Fragment>
                          ))}
                      </div>

                      <div className="s0Hint">
                        {s.hint.split("\n").map((line, idx) => (
                          <React.Fragment key={idx}>
                            {line}
                            <br />
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ) : isOne ? (
                    <div className="s1Center">
                      <h1 className="h1 s1Title">{s.title}</h1>
                      <p className="lead s1Lead">{s.lead}</p>
                    </div>
                  ) : (
                    <>
                      {s.eyebrow ? <div className="eyebrow">{s.eyebrow}</div> : null}
                      <h1 className={`h1 ${isQBlock ? "h1Center" : ""}`}>{s.title}</h1>

                      <p className="lead">
                        {s.lead.split("\n").map((line, idx) => (
                          <React.Fragment key={idx}>
                            {line}
                            <br />
                          </React.Fragment>
                        ))}
                      </p>

                      {s.hint ? <p className="hint">{s.hint}</p> : null}
                    </>
                  )}

                  {s.k === 2 && (
                    <div className="qa">
                      <textarea
                        className="ta"
                        value={a1}
                        onChange={(e) => setA1(e.target.value)}
                        placeholder="Compartí lo que está pasando en tu vida ahora…"
                        rows={7}
                      />
                    </div>
                  )}

                  {s.k === 3 && (
                    <div className="qa">
                      <div className="prev">
                        <div className="prevTitle">Tu reflexión anterior</div>
                        <div className="prevText">{a1.trim() ? a1.trim() : "—"}</div>
                      </div>
                      <textarea
                        className="ta"
                        value={a2}
                        onChange={(e) => setA2(e.target.value)}
                        placeholder="Si algo pudiera ordenarse, fortalecerse o transformarse, ¿qué sería?…"
                        rows={7}
                      />
                    </div>
                  )}

                  {s.k === 4 && (
                    <div className="qa">
                      <div className="prev">
                        <div className="prevTitle">Lo que hoy estás viviendo</div>
                        <div className="prevText">{a1.trim() ? a1.trim() : "—"}</div>
                        <div className="prevSpacer" />
                        <div className="prevTitle">Lo que quisieras que fuera diferente</div>
                        <div className="prevText">{a2.trim() ? a2.trim() : "—"}</div>
                      </div>
                      <textarea
                        className="ta"
                        value={a3}
                        onChange={(e) => setA3(e.target.value)}
                        placeholder="¿Qué depende de vos, más allá de las circunstancias?…"
                        rows={7}
                      />
                    </div>
                  )}

                  {s.k === 5 && (
                    <div className="qa">
                      <div className="prev">
                        <div className="prevTitle">Lo que hoy estás viviendo</div>
                        <div className="prevText">{a1.trim() ? a1.trim() : "—"}</div>
                        <div className="prevSpacer" />
                        <div className="prevTitle">Lo que quisieras que fuera diferente</div>
                        <div className="prevText">{a2.trim() ? a2.trim() : "—"}</div>
                        <div className="prevSpacer" />
                        <div className="prevTitle">Lo que está en tus manos cambiar</div>
                        <div className="prevText">{a3.trim() ? a3.trim() : "—"}</div>
                      </div>
                      <textarea
                        className="ta"
                        value={a4}
                        onChange={(e) => setA4(e.target.value)}
                        placeholder="Un primer paso posible, simple y realista…"
                        rows={7}
                      />
                    </div>
                  )}

                  {s.k === 6 && (
                    <div className="summary">
                      {/* ✅ 4 mini-cards en UNA línea */}
                      <div className="sumGrid sumGrid4">
                        <div className="sumItem">
                          <div className="sumK">¿Qué te trae hasta aquí?</div>
                          <div className="sumV">{a1.trim() ? a1.trim() : "—"}</div>
                        </div>
                        <div className="sumItem">
                          <div className="sumK">¿Qué quisieras que fuera diferente?</div>
                          <div className="sumV">{a2.trim() ? a2.trim() : "—"}</div>
                        </div>
                        <div className="sumItem">
                          <div className="sumK">¿Qué está en tus manos cambiar?</div>
                          <div className="sumV">{a3.trim() ? a3.trim() : "—"}</div>
                        </div>
                        <div className="sumItem">
                          <div className="sumK">¿Qué primer paso podrías dar?</div>
                          <div className="sumV">{a4.trim() ? a4.trim() : "—"}</div>
                        </div>
                      </div>

                      {/* ✅ frase brillante 1 renglón */}
                      <div className="finalLine">
                        Esto puede quedar como un ejercicio personal. O puede convertirse en una conversación.
                      </div>

                      {/* ✅ fila contacto (UNA línea) — QR SOLO en WhatsApp */}
                      <div className="contactRow" aria-label="Contacto">
                        <div className="cItem">
                          <div className="cMain">
                            <div className="cTop">
                              <span className="cIco">
                                <WhatsappIcon />
                              </span>
                              <span className="cLabel">WhatsApp</span>
                            </div>
                            <div className="cBottom">
                              <span className="cText">+54 9 11 4412-5789</span>
                              <span className="cQrIco" title="QR">
                                <QrIcon size={14} />
                              </span>
                            </div>
                          </div>
                          <img className="qr" src="/whatsapp/WhatsApp.jpeg" alt="QR WhatsApp" />
                        </div>

                        <div className="cItem">
                          <div className="cMain">
                            <div className="cTop">
                              <span className="cIco">
                                <MailIcon />
                              </span>
                              <span className="cLabel">Mail</span>
                            </div>
                            <div className="cBottom cBottom2">
                              <span className="cText">hmederos61@gmail.com</span>
                              <span className="cText">misquieroenaccion@gmail.com</span>
                            </div>
                          </div>
                          {/* SIN QR */}
                        </div>

                        <div className="cItem">
                          <div className="cMain">
                            <div className="cTop">
                              <span className="cIco">
                                <GlobeIcon />
                              </span>
                              <span className="cLabel">Aplicación</span>
                            </div>
                            <div className="cBottom cBottom2">
                              <span className="cText">www.misquieroenaccion.com/login</span>
                              <span className="cText">www.misquieroenaccion.com</span>
                            </div>
                          </div>
                          {/* SIN QR */}
                        </div>

                        {/* ✅ microtexto (zona dedicada) */}
                        <div className="microText" aria-label="Mensaje final">
                          Me contactaré con vos en breve. Las herramientas para el cambio están más cerca.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {showLeft && (
        <button className="edgeNav left" onClick={prev} aria-label="Anterior" style={{ ["--edgeDim" as any]: edgeDim }}>
          <svg className="chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <polyline points="15 6 9 12 15 18" />
          </svg>
        </button>
      )}

      {showRight && (
        <button
          className="edgeNav right"
          onClick={onNext}
          disabled={!canGoNext}
          aria-label="Siguiente"
          style={{ ["--edgeDim" as any]: edgeDim }}
        >
          <svg className="chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>
      )}

      {/* ✅ dots fuera de la card (sin tocar) */}
      <div className="edgeDots" aria-label="Paginación">
        {([0, 1, 2, 3, 4, 5, 6] as ScreenKey[]).map((i) => (
          <button
            key={i}
            className={`dot ${screen === i ? "on" : ""}`}
            onClick={() => go(i)}
            aria-label={`Ir a pantalla ${i + 1}`}
          />
        ))}
      </div>

      <style jsx>{`
        .page {
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          position: relative;
          background: #0a0a0a;
          font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        }

        /* ✅ BLINDAJE GLOBAL: fuerza quiebre de texto aun sin espacios (todas las pantallas) */
        .page,
        .page * {
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          will-change: filter, transform;
        }

        .overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .viewport {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 20;
        }
        .track {
          height: 100%;
          width: 700vw;
          display: flex;
          transition: transform 520ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .screen {
          width: 100vw;
          height: 100vh;
          flex: 0 0 100vw;
          display: grid;
          place-items: center;
          padding: 18px 18px 22px;
        }

        /* Pantalla 6 */
        .screen6 {
          align-items: start;
          justify-items: center;
          padding-top: 7.5vh;
        }

        .card {
          border-radius: 34px;
          padding: 28px 28px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(46px) saturate(1.08);
          -webkit-backdrop-filter: blur(46px) saturate(1.08);
          box-shadow: 0 38px 120px rgba(0, 0, 0, 0.34);
          color: ${ivory};
          position: relative;
          opacity: 0;
          transform: translateY(10px);
        }
        .card::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: rgba(0, 0, 0, var(--cardDim, 0.26));
          pointer-events: none;
        }
        .card > * {
          position: relative;
          z-index: 1;
        }
        .card.in {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 750ms ease 120ms, transform 750ms ease 120ms;
        }

        /* ✅ SOLUCIÓN: scroll interno SOLO en la card de Pantalla 6 */
        .card6 {
          max-height: calc(100vh - 18px - 22px - 7.5vh);
          overflow-y: auto;
          overscroll-behavior: contain;
          padding-bottom: 18px;
        }

        @media (max-width: 900px) {
          .card {
            width: min(92vw, 980px) !important;
            max-width: 980px !important;
            padding: 22px 18px;
          }
          .screen6 {
            padding-top: 5.5vh;
          }
          .card6 {
            max-height: calc(100vh - 18px - 22px - 5.5vh);
          }
        }

        .eyebrow {
          font-size: 12px;
          letter-spacing: 0.6px;
          text-transform: none;
          opacity: 0.78;
          margin-bottom: 10px;
          font-weight: 500;
        }
        .h1 {
          margin: 0;
          font-size: clamp(28px, 3.1vw, 46px);
          line-height: 1.1;
          font-weight: 560;
          color: rgba(245, 241, 232, 0.96);
          text-shadow: 0 10px 26px rgba(0, 0, 0, 0.26);
        }
        .h1Center {
          text-align: center;
          width: 100%;
        }

        .lead {
          margin: 12px 0 0;
          font-size: clamp(14px, 1.35vw, 17px);
          line-height: 1.55;
          opacity: 0.92;
          max-width: 900px;
          white-space: pre-wrap;
          color: rgba(245, 241, 232, 0.88);
          font-weight: 500;
        }
        .hint {
          margin: 12px 0 0;
          font-size: 14px;
          opacity: 0.75;
          font-style: italic;
          color: rgba(245, 241, 232, 0.78);
          font-weight: 500;
        }

        /* Pantalla 0 */
        .card.screen0 {
          padding: 46px 70px;
          display: flex;
          align-items: stretch;
          justify-content: center;
          text-align: center;
        }
        .s0 {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding-top: 5vh;
          gap: 22px;
        }
        .s0Title {
          font-size: clamp(44px, 4vw, 64px);
          line-height: 1.05;
          font-weight: 520;
          letter-spacing: 0.2px;
          color: rgba(245, 241, 232, 0.98);
          text-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);
          text-wrap: balance;
        }
        .s0Lead {
          font-size: clamp(22px, 2.05vw, 28px);
          line-height: 1.62;
          opacity: 0.94;
          color: rgba(245, 241, 232, 0.92);
          text-shadow: 0 12px 30px rgba(0, 0, 0, 0.22);
          max-width: min(920px, 74%);
          text-wrap: balance;
          font-weight: 500;
        }
        .s0Lead2 {
          font-size: clamp(21px, 1.95vw, 27px);
          line-height: 1.62;
          opacity: 0.92;
          color: rgba(245, 241, 232, 0.9);
          text-shadow: 0 12px 30px rgba(0, 0, 0, 0.22);
          max-width: min(880px, 70%);
          text-wrap: balance;
          font-weight: 500;
        }
        .s0Hint {
          margin-top: auto;
          padding-bottom: 4.5vh;
          font-size: clamp(21px, 1.9vw, 26px);
          line-height: 1.5;
          opacity: 0.95;
          color: rgba(245, 241, 232, 0.94);
          text-shadow: 0 12px 30px rgba(0, 0, 0, 0.24);
          max-width: min(820px, 68%);
          text-wrap: balance;
          font-weight: 500;
        }

        @media (max-width: 900px) {
          .card.screen0 {
            padding: 32px 22px;
          }
          .s0 {
            padding-top: 3.5vh;
            gap: 16px;
          }
          .s0Lead,
          .s0Lead2,
          .s0Hint {
            max-width: 92%;
          }
        }

        /* Pantalla 1 */
        .s1Center {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          text-align: center;
          gap: 10px;
          padding: 4px 6px;
        }
        .s1Title {
          text-wrap: balance;
        }
        .s1Lead {
          margin-top: 0;
          max-width: 36ch;
          opacity: 0.9;
        }

        /* Órbita */
        .orbit {
          position: absolute;
          inset: 0;
          z-index: 24;
          pointer-events: none;
        }
        .orbitInner {
          position: absolute;
          inset: 0;
        }
        .orbCard {
          position: absolute;
          transform: translate(-50%, -50%);
          width: min(320px, 24vw);
          border-radius: 16px;
          padding: 14px 14px;
          background: rgba(255, 248, 241, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.62);
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.14);
          opacity: 0;
          filter: blur(0px);
        }
        .orbCard.em {
          background: rgba(255, 246, 236, 0.94);
        }
        .orbCard.in {
          animation: orbIn 700ms cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: var(--d, 0.25s);
        }
        @keyframes orbIn {
          from {
            opacity: 0;
            transform: translate(-50%, calc(-50% + 10px));
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
        .orbText {
          margin: 0;
          font-family: ui-serif, Georgia, "Times New Roman", serif;
          font-style: italic;
          line-height: 1.35;
          color: rgba(18, 16, 12, 0.9);
          font-weight: 500;
        }
        .orbAuth {
          margin-top: 8px;
          font-size: 13px;
          opacity: 0.78;
          color: rgba(18, 16, 12, 0.78);
          font-weight: 500;
        }

        /* Flechas */
        .edgeNav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 80;
          width: 54px;
          height: 54px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          cursor: pointer;
          user-select: none;
          box-shadow: 0 22px 70px rgba(0, 0, 0, 0.22);
        }
        .edgeNav::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: rgba(0, 0, 0, var(--edgeDim, 0.34));
          pointer-events: none;
        }
        .edgeNav::after {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          pointer-events: none;
          background: radial-gradient(
            54px 54px at 30% 25%,
            rgba(255, 255, 255, 0.62),
            rgba(255, 255, 255, 0) 62%
          );
          opacity: 0.95;
        }
        .edgeNav:hover {
          transform: translateY(-50%) scale(1.04);
          border-color: rgba(255, 255, 255, 0.82);
          background: rgba(255, 255, 255, 0.14);
        }
        .edgeNav:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .edgeNav.left {
          left: 24px;
        }
        .edgeNav.right {
          right: 24px;
        }
        .chev {
          position: relative;
          z-index: 1;
          width: 84%;
          height: 84%;
          stroke: rgba(245, 241, 232, 0.96);
          stroke-width: 3.9;
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: drop-shadow(0 10px 22px rgba(0, 0, 0, 0.28));
        }

        /* Dots */
        .edgeDots {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          bottom: 22px;
          z-index: 80;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.14);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          border: 0;
          cursor: pointer;
          background: rgba(245, 241, 232, 0.35);
          box-shadow: 0 10px 22px rgba(0, 0, 0, 0.18);
        }
        .dot.on {
          background: rgba(245, 241, 232, 0.92);
        }

        .qa {
          margin-top: 18px;
          display: grid;
          gap: 12px;
        }

        /* Contraste interno */
        .prev {
          padding: 12px 14px;
          border-radius: 18px;
          background: rgba(0, 0, 0, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .prevTitle {
          font-size: 12px;
          text-transform: none;
          letter-spacing: 0.25px;
          opacity: 0.86;
          color: rgba(245, 241, 232, 0.9);
          font-weight: 520;
        }
        .prevText {
          margin-top: 6px;
          font-size: 14px;
          line-height: 1.45;
          opacity: 1;
          white-space: pre-wrap;
          color: rgba(245, 241, 232, 0.98);
          font-weight: 560;
          text-shadow: 0 10px 22px rgba(0, 0, 0, 0.22);
        }
        .prevSpacer {
          height: 10px;
        }

        .ta {
          width: 100%;
          resize: vertical;
          border-radius: 18px;
          padding: 14px 16px;
          border: 1px solid rgba(255, 255, 255, 0.26);
          background: rgba(0, 0, 0, 0.16);
          outline: none;
          font-size: 15px;
          line-height: 1.5;
          color: rgba(245, 241, 232, 0.98);
          text-shadow: 0 10px 22px rgba(0, 0, 0, 0.22);
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.22);
          font-weight: 560;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .ta::placeholder {
          color: rgba(245, 241, 232, 0.62);
          text-shadow: none;
          opacity: 0.95;
        }
        .ta:focus {
          border-color: rgba(255, 255, 255, 0.38);
          background: rgba(0, 0, 0, 0.18);
        }

        .summary {
          margin-top: 16px;
          display: grid;
          gap: 14px;
        }

        .sumGrid {
          display: grid;
          gap: 10px;
        }

        /* ✅ Pantalla 6: 4 columnas 1 fila */
        .sumGrid4 {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .sumItem {
          padding: 12px 14px;
          border-radius: 18px;
          background: rgba(0, 0, 0, 0.18);
          border: 1px solid rgba(255, 255, 255, 0.18);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          min-height: 112px;
          display: flex;
          flex-direction: column;
        }
        .sumK {
          font-size: 12px;
          text-transform: none;
          letter-spacing: 0.25px;
          opacity: 0.88;
          color: rgba(245, 241, 232, 0.9);
          font-weight: 520;
        }

        /* ✅ SOLUCIÓN: el texto NO empuja la pantalla; scrollea dentro de la mini-card */
        .sumV {
          margin-top: 6px;
          font-size: 14px;
          line-height: 1.45;
          opacity: 1;
          white-space: pre-wrap;
          color: rgba(245, 241, 232, 0.98);
          font-weight: 560;
          text-shadow: 0 10px 22px rgba(0, 0, 0, 0.22);
          max-height: 148px;
          overflow: auto;
          padding-right: 6px;
        }

        /* ✅ frase brillante 1 línea */
        .finalLine {
          margin-top: 2px;
          padding: 10px 12px;
          border-radius: 14px;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: rgba(245, 241, 232, 0.995);
          font-weight: 620;
          text-shadow: 0 14px 30px rgba(0, 0, 0, 0.34);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        /* ✅ fila de contacto dentro de la misma card */
        .contactRow {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-top: 2px;
        }

        /* ✅ Relevancia de contacto: más color + menos traslúcidas (sin quemar)
           ✅ Tipografía más grande SOLO en contacto */
        .cItem {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 20px 20px;
          border-radius: 22px;
          border: none;
          min-height: 110px;
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.35);
          background: rgba(0, 0, 0, 0.14); /* ✅ menos traslúcida pero suave */
          backdrop-filter: blur(14px) saturate(1.08); /* ✅ vidrio más nítido */
          -webkit-backdrop-filter: blur(14px) saturate(1.08);
        }

        /* capa de “tinte” (más presente, no cegador) */
        .cItem::before {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          pointer-events: none;
          opacity: 0.78; /* ✅ más color, sin exagerar */
          filter: blur(0px);
        }

        /* glow suave (más controlado) */
        .cItem::after {
          content: "";
          position: absolute;
          inset: -18px;
          border-radius: inherit;
          pointer-events: none;
          opacity: 0.32; /* ✅ menos “neón” */
          filter: blur(18px);
        }

        /* ✅ WhatsApp (verde) */
        .contactRow .cItem:nth-child(1) {
          border-color: rgba(0, 255, 153, 0.32);
        }
        .contactRow .cItem:nth-child(1)::before {
          background: radial-gradient(520px 210px at 18% 30%, rgba(0, 255, 153, 0.24), rgba(0, 0, 0, 0) 64%),
            linear-gradient(135deg, rgba(0, 255, 153, 0.14), rgba(0, 0, 0, 0.26) 64%);
        }
        .contactRow .cItem:nth-child(1)::after {
          background: radial-gradient(680px 300px at 22% 40%, rgba(0, 255, 153, 0.16), rgba(0, 0, 0, 0) 72%);
        }

        /* ✅ Mail (azul) */
        .contactRow .cItem:nth-child(2) {
          border-color: rgba(64, 140, 255, 0.32);
        }
        .contactRow .cItem:nth-child(2)::before {
          background: radial-gradient(520px 210px at 18% 30%, rgba(64, 140, 255, 0.24), rgba(0, 0, 0, 0) 64%),
            linear-gradient(135deg, rgba(64, 140, 255, 0.14), rgba(0, 0, 0, 0.26) 64%);
        }
        .contactRow .cItem:nth-child(2)::after {
          background: radial-gradient(680px 300px at 22% 40%, rgba(64, 140, 255, 0.16), rgba(0, 0, 0, 0) 72%);
        }

        /* ✅ Web (violeta) */
        .contactRow .cItem:nth-child(3) {
          border-color: rgba(176, 120, 255, 0.32);
        }
        .contactRow .cItem:nth-child(3)::before {
          background: radial-gradient(520px 210px at 18% 30%, rgba(176, 120, 255, 0.24), rgba(0, 0, 0, 0) 64%),
            linear-gradient(135deg, rgba(176, 120, 255, 0.14), rgba(0, 0, 0, 0.26) 64%);
        }
        .contactRow .cItem:nth-child(3)::after {
          background: radial-gradient(680px 300px at 22% 40%, rgba(176, 120, 255, 0.16), rgba(0, 0, 0, 0) 72%);
        }

        .cMain {
          position: relative;
          z-index: 1;
          display: grid;
          gap: 6px;
          min-width: 0;
        }

        .cTop {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cIco {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          opacity: 0.98;
          filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.22));
        }

        .cLabel {
          font-size: 13px; /* ✅ antes 12px */
          letter-spacing: 0.25px;
          opacity: 0.95;
          font-weight: 760; /* ✅ un toque más de jerarquía */
          color: rgba(245, 241, 232, 0.99);
          text-shadow: 0 10px 22px rgba(0, 0, 0, 0.22));
        }

        .cBottom {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .cBottom2 {
          display: grid;
          gap: 3px;
          align-items: start;
        }

        .cText {
          font-size: 15px; /* ✅ antes 13px */
          line-height: 1.25;
          color: rgba(245, 241, 232, 0.98);
          font-weight: 700; /* ✅ más legible */
          text-shadow: 0 10px 22px rgba(0, 0, 0, 0.22);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 44ch; /* ✅ antes 34ch */
        }

        .cQrIco {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          opacity: 0.9;
        }

        .qr {
          position: relative;
          z-index: 1;
          width: ${qrSize}px;
          height: ${qrSize}px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.94);
          padding: 6px;
          box-shadow: 0 14px 44px rgba(0, 0, 0, 0.26);
          flex: 0 0 auto;
          object-fit: cover;
        }

        /* ✅ microtexto: queda dentro de CONTACTO, no toca dots */
        .microText {
          grid-column: 1 / -1;
          margin-top: 2px;
          padding: 10px 12px;
          border-radius: 14px;
          text-align: center;
          color: rgba(245, 241, 232, 0.96);
          font-weight: 640;
          text-shadow: 0 14px 30px rgba(0, 0, 0, 0.34);
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        /* ✅ responsivo */
        @media (max-width: 1100px) {
          .sumGrid4 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .finalLine {
            white-space: normal;
          }
          .contactRow {
            grid-template-columns: 1fr;
          }
          .cText {
            max-width: 46ch;
          }
          .sumV {
            max-height: 170px;
          }
        }

        @media (max-width: 900px) {
          .orbit {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .track {
            transition: none !important;
          }
          .card {
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
          .orbCard.in {
            animation: none !important;
            opacity: 1 !important;
            transform: translate(-50%, -50%) !important;
          }
        }
      `}</style>
    </main>
  );
}
