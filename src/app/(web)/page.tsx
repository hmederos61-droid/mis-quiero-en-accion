// src/app/(web)/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

type ScreenKey = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

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
 * ✅ TABLA CANÓNICA EDITABLE — 8 pantallas (0..7)
 * ÚNICO lugar donde se ajusta:
 * - img: imagen de fondo por pantalla
 * - blur: blur del fondo global (pantalla completa)
 * - overlay: película blanca sutil
 * - dim: oscurecimiento global de pantalla (0..1)
 * - cardDim: oscurecimiento interno de card (0..1) ✅ (por pantalla)
 *
 * ✅ NUEVO:
 * - Pantalla 0 usa /portada.png (solo CTA "Iniciar recorrido")
 * - Pantallas 1..7: más nítidas y menos oscuras, en degradé luminoso hacia la 7
 */
const SCREEN_STEPS: ReadonlyArray<{
  img: string;
  overlay: number;
  blur: number;
  dim: number;
  cardDim: number;
}> = [
  // 0 (Portada)
  { img: "/portada.png", overlay: 0.0, blur: 0.0, dim: 0.0, cardDim: 0.12 }, // 0

  // 1..7 (Web)
  { img: "/webwelcome.png", overlay: 0.1, blur: 0.22, dim: 0.22, cardDim: 0.56 }, // 1
  { img: "/webwelcome.png", overlay: 0.1, blur: 0.2, dim: 0.22, cardDim: 0.56 }, // 2
  { img: "/webwelcome.png", overlay: 0.1, blur: 0.2, dim: 0.22, cardDim: 0.56 }, // 3
  { img: "/webwelcome.png", overlay: 0.1, blur: 0.2, dim: 0.22, cardDim: 0.56 }, // 4
  { img: "/webwelcome.png", overlay: 0.1, blur: 0.2, dim: 0.22, cardDim: 0.56 }, // 5
  { img: "/webwelcome.png", overlay: 0.1, blur: 0.2, dim: 0.22, cardDim: 0.56 }, // 6
  { img: "/webwelcome.png", overlay: 0.1, blur: 0.2, dim: 0.22, cardDim: 0.56 }, // 7
];

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

/**
 * ✅ LOGO GLOBAL PARAMETRIZABLE (fuera de la card)
 * - fijo al viewport
 * - arriba-derecha
 * - NO clickeable
 * - NO visible en Pantalla 0
 */
const LOGO_CFG = {
  enabled: true,
  src: "/logo.png",
  alt: "Hugo Mederos",
  hideOnScreens: [0 as ScreenKey],

  top: "30px",
  right: "40px",

  width: "clamp(90px, 9vw, 120px)",
  opacity: 0.95,
  zIndex: 90,

  plate: {
    enabled: true,
    padding: "10px 12px",
    radius: "16px",
    bg: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.22)",
    blur: "10px",
    shadow: "0 10px 26px rgba(0,0,0,0.18)",
  },

  logoShadow: "0 6px 18px rgba(0,0,0,0.22)",

  mobile: {
    top: "18px",
    right: "18px",
    width: "clamp(78px, 22vw, 100px)",
    padding: "8px 10px",
    radius: "14px",
  },
} as const;

/**
 * ✅ PORTADA CTA (Pantalla 0)
 */
const PORTADA_CTA_CFG = {
  topDesktop: "18%",
  topMobile: "16%",
  plate: {
    padding: "14px 16px",
    radius: "22px",
    bg: "rgba(0,0,0,0.28)",
    border: "1px solid rgba(255,255,255,0.18)",
    blur: "14px",
    shadow: "0 26px 80px rgba(0,0,0,0.36)",
  },
} as const;

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
        eyebrow: "",
        title: "",
        lead: "",
        hint: "",
      },
      {
        k: 1 as ScreenKey,
        eyebrow: "COACHING PERSONAL",
        title: "Coaching ontológico individual",
        lead:
          "Un espacio profesional que te brinde las herramientas necesarias\npara que puedas descubrir\ntus propias posibilidades de cambio.",
        hint: "Si algo de esto resuena en vos, te invito a seguir el recorrido.",
      },
      {
        k: 2 as ScreenKey,
        eyebrow: "",
        title: "Voces que iluminan el camino",
        lead: "El coaching ontológico se nutre de diversas corrientes del pensamiento humano.",
        hint: "",
      },
      {
        k: 3 as ScreenKey,
        eyebrow: "",
        title: "¿Qué te trae hasta aquí?",
        lead: "Primera parada del viaje",
        hint: "",
      },
      {
        k: 4 as ScreenKey,
        eyebrow: "",
        title: "¿Qué quisieras que fuera diferente?",
        lead: "Imaginando posibilidades",
        hint: "",
      },
      {
        k: 5 as ScreenKey,
        eyebrow: "",
        title: "¿Qué está en tus manos cambiar?",
        lead: "Espacio de decisión",
        hint: "",
      },
      {
        k: 6 as ScreenKey,
        eyebrow: "",
        title: "¿Qué primer paso podrías dar?",
        lead: "Momento de elección",
        hint: "",
      },
      {
        k: 7 as ScreenKey,
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
    if (n >= 7) return 7;
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

    if (screen === 3) return t(a1);
    if (screen === 4) return t(a2);
    if (screen === 5) return t(a3);
    if (screen === 6) return t(a4);
    return true;
  }, [screen, a1, a2, a3, a4]);

  function onNext() {
    if (screen >= 3 && screen <= 6 && !canGoNext) return;
    next();
  }

  const showLeft = screen > 0;
  const showRight = screen < 7;

  const cardWidth = screen === 1 ? "75vw" : screen === 7 ? "82vw" : "45vw";
  const cardHeight = screen === 1 ? "75vh" : "auto";

  const qrSize = 56;

  const showLogo = useMemo(() => {
    if (!LOGO_CFG.enabled) return false;
    return !LOGO_CFG.hideOnScreens.includes(screen);
  }, [screen]);

  const isPortadaGlobal = screen === 0;

  return (
    <main className="page" data-screen={screen}>
      {!isPortadaGlobal && (
        <>
          <div
            className="bg"
            aria-hidden="true"
            style={{
              backgroundImage: `url("${step.img}")`,
              filter: `saturate(1.06) contrast(1.02) brightness(1.06) blur(${blurLevel}px)`,
              transform: "scale(1.06)",
            }}
          />

          <div
            className="overlay"
            aria-hidden="true"
            style={{
              background: `
                radial-gradient(1200px 650px at 55% 35%,
                  rgba(255,255,255,${Math.min(0.16, overlayLevel * 0.62)}),
                  rgba(255,255,255,0) 62%),
                linear-gradient(180deg,
                  rgba(255,255,255,${Math.min(0.14, overlayLevel * 0.52)}),
                  rgba(255,255,255,0.02) 58%,
                  rgba(0,0,0,${Math.max(0, overlayLevel * 0.5)}) ),
                linear-gradient(180deg,
                  rgba(0,0,0,${Math.max(0, dimLevel)}),
                  rgba(0,0,0,${Math.max(0, dimLevel)}) )
              `,
            }}
          />
        </>
      )}

      {showLogo && (
        <div className={`brandFixed ${mounted ? "in" : ""}`} aria-hidden="true">
          <div className="brandPlate">
            <img className="brandImg" src={LOGO_CFG.src} alt={LOGO_CFG.alt} draggable={false} />
          </div>
        </div>
      )}

      {screen === 2 && (
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
            const isPortada = s.k === 0;
            const isHero = s.k === 1;
            const isOne = s.k === 2;
            const isQBlock = s.k >= 3 && s.k <= 7;

            return (
              <article
                key={s.k}
                className={`screen ${isPortada ? "screenPortada" : ""} ${s.k === 7 ? "screen7" : ""}`}
                aria-label={`Pantalla ${s.k + 1}`}
              >
                {isPortada ? (
                  <div className={`portadaStage ${mounted ? "in" : ""}`} aria-label="Portada">
                    <img className="portadaImg" src="/portada.png" alt="Portada Hugo Mederos" draggable={false} />
                    <div className="portadaCTA">
                      <div className="portadaPlate">
                        <button className="cta" onClick={next} aria-label="Iniciar recorrido">
                          Iniciar recorrido
                        </button>
                        <div className="ctaHint">Una conversación puede empezar con un paso simple.</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`card ${isHero ? "screen1" : ""} ${s.k === 7 ? "card7" : ""} ${mounted ? "in" : ""}`}
                    style={{
                      width: cardWidth,
                      height: cardHeight,
                      maxWidth: isHero ? "none" : s.k === 7 ? 1180 : 720,
                      ["--cardDim" as any]: cardDim,
                    }}
                  >
                    {isHero ? (
                      <div className="s1">
                        <div className="s1Title">{s.title}</div>

                        <div className="s1Body">
                          <div className="s1Lead">
                            {s.lead.split("\n").map((line, idx) => (
                              <React.Fragment key={idx}>
                                {line}
                                <br />
                              </React.Fragment>
                            ))}
                          </div>

                          <div className="s1Lead2">
                            {`El foco está puesto en que puedas observar 
cómo estás interpretando lo que hoy te pasa, y desde ahi, 
descubrir nuevas posibilidades para ponerte en acción.`
                              .split("\n")
                              .map((line, idx) => (
                                <React.Fragment key={idx}>
                                  {line}
                                  <br />
                                </React.Fragment>
                              ))}
                          </div>
                        </div>

                        <div className="s1Hint">
                          {s.hint.split("\n").map((line, idx) => (
                            <React.Fragment key={idx}>
                              {line}
                              <br />
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ) : isOne ? (
                      <div className="s2Center">
                        <h1 className="h1 s2Title">{s.title}</h1>
                        <p className="lead s2Lead">{s.lead}</p>
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

                    {s.k === 3 && (
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

                    {s.k === 4 && (
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

                    {s.k === 5 && (
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

                    {s.k === 6 && (
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

                    {s.k === 7 && (
                      <div className="summary">
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

                        <div className="finalLine">
                          Esto puede quedar como un ejercicio personal. O puede convertirse en una conversación.
                        </div>

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
                            <img className="qr" src="/whatsapp.jpeg" alt="QR WhatsApp" />
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
                          </div>

                          <div className="microText" aria-label="Mensaje final">
                            Me contactaré con vos en breve. Las herramientas para el cambio están más cerca.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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

      <div className="edgeDots" aria-label="Paginación">
        {([0, 1, 2, 3, 4, 5, 6, 7] as ScreenKey[]).map((i) => (
          <button key={i} className={`dot ${screen === i ? "on" : ""}`} onClick={() => go(i)} aria-label={`Ir a pantalla ${i + 1}`} />
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
          width: 800vw;
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

        .screenPortada {
          padding: 0;
        }

        .screen7 {
          align-items: start;
          justify-items: center;
          padding-top: 7.5vh;
        }

        .portadaStage {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          opacity: 0;
          transform: translateY(10px);
          display: grid;
          place-items: center;
        }

        .portadaStage.in {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 750ms ease 120ms, transform 750ms ease 120ms;
        }

        .portadaImg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center center;
          user-select: none;
          pointer-events: none;
          filter: none;
        }

        .portadaCTA {
          position: absolute;
          left: 50%;
          top: ${PORTADA_CTA_CFG.topDesktop};
          transform: translateX(-50%);
          z-index: 6;
          display: grid;
          gap: 10px;
          place-items: center;
          text-align: center;
          padding: 0 14px;
        }

        .portadaPlate {
          display: grid;
          gap: 10px;
          place-items: center;
          padding: ${PORTADA_CTA_CFG.plate.padding};
          border-radius: ${PORTADA_CTA_CFG.plate.radius};
          background: ${PORTADA_CTA_CFG.plate.bg};
          border: ${PORTADA_CTA_CFG.plate.border};
          box-shadow: ${PORTADA_CTA_CFG.plate.shadow};
          backdrop-filter: blur(${PORTADA_CTA_CFG.plate.blur}) saturate(1.08);
          -webkit-backdrop-filter: blur(${PORTADA_CTA_CFG.plate.blur}) saturate(1.08);
        }

        .cta {
          border: 1px solid rgba(255, 255, 255, 0.26);
          background: rgba(0, 0, 0, 0.26);
          color: rgba(245, 241, 232, 0.99);
          padding: 14px 22px;
          border-radius: 999px;
          font-size: 18px;
          font-weight: 760;
          letter-spacing: 0.2px;
          cursor: pointer;
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.32);
          text-shadow: 0 12px 30px rgba(0, 0, 0, 0.32);
        }

        .cta:hover {
          transform: scale(1.02);
          border-color: rgba(255, 255, 255, 0.34);
          background: rgba(0, 0, 0, 0.22);
        }

        .ctaHint {
          color: rgba(245, 241, 232, 0.94);
          font-weight: 620;
          font-size: 16px;
          text-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);
          padding: 0 10px;
          text-align: center;
        }

        .brandFixed {
          position: fixed;
          top: ${LOGO_CFG.top};
          right: ${LOGO_CFG.right};
          z-index: ${LOGO_CFG.zIndex};
          opacity: 0;
          transform: translateY(-6px);
          pointer-events: none;
          user-select: none;
        }

        .brandFixed.in {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 520ms ease 120ms, transform 520ms ease 120ms;
        }

        .brandPlate {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: ${LOGO_CFG.plate.enabled ? LOGO_CFG.plate.padding : "0"};
          border-radius: ${LOGO_CFG.plate.enabled ? LOGO_CFG.plate.radius : "0"};
          background: ${LOGO_CFG.plate.enabled ? LOGO_CFG.plate.bg : "transparent"};
          border: ${LOGO_CFG.plate.enabled ? LOGO_CFG.plate.border : "none"};
          box-shadow: ${LOGO_CFG.plate.enabled ? LOGO_CFG.plate.shadow : "none"};
          backdrop-filter: ${LOGO_CFG.plate.enabled ? `blur(${LOGO_CFG.plate.blur})` : "none"};
          -webkit-backdrop-filter: ${LOGO_CFG.plate.enabled ? `blur(${LOGO_CFG.plate.blur})` : "none"};
        }

        .brandImg {
          width: ${LOGO_CFG.width};
          height: auto;
          opacity: ${LOGO_CFG.opacity};
          filter: drop-shadow(${LOGO_CFG.logoShadow});
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

        .card7 {
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

          .screen7 {
            padding-top: 5.5vh;
          }

          .card7 {
            max-height: calc(100vh - 18px - 22px - 5.5vh);
          }

          .portadaCTA {
            top: ${PORTADA_CTA_CFG.topMobile};
          }

          .brandFixed {
            top: ${LOGO_CFG.mobile.top};
            right: ${LOGO_CFG.mobile.right};
          }

          .brandPlate {
            padding: ${LOGO_CFG.mobile.padding};
            border-radius: ${LOGO_CFG.mobile.radius};
          }

          .brandImg {
            width: ${LOGO_CFG.mobile.width};
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

        .card.screen1 {
          padding: 42px 70px;
          display: flex;
          align-items: stretch;
          justify-content: center;
          text-align: center;
        }

        .s1 {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding-top: 2.5vh;
          padding-bottom: 2.5vh;
          gap: 18px;
        }

        .s1Title {
          font-size: clamp(44px, 4vw, 64px);
          line-height: 1.05;
          font-weight: 520;
          letter-spacing: 0.2px;
          color: rgba(245, 241, 232, 0.98);
          text-shadow: 0 12px 30px rgba(0, 0, 0, 0.28);
          text-wrap: balance;
          max-width: min(1120px, 92%);
        }

        .s1Body {
          flex: 1;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 34px;
        }

        .s1Lead {
          font-size: clamp(22px, 2.05vw, 28px);
          line-height: 1.56;
          opacity: 0.94;
          color: rgba(245, 241, 232, 0.92);
          text-shadow: 0 12px 30px rgba(0, 0, 0, 0.22);
          max-width: min(1100px, 82%);
          text-wrap: balance;
          font-weight: 500;
        }

        .s1Lead2 {
          font-size: clamp(21px, 1.95vw, 27px);
          line-height: 1.56;
          opacity: 0.92;
          color: rgba(245, 241, 232, 0.9);
          text-shadow: 0 12px 30px rgba(0, 0, 0, 0.22);
          max-width: min(900px, 72%);
          text-wrap: balance;
          font-weight: 500;
        }

        .s1Hint {
          font-size: clamp(21px, 1.9vw, 26px);
          line-height: 1.48;
          opacity: 0.95;
          color: rgba(245, 241, 232, 0.94);
          text-shadow: 0 12px 30px rgba(0, 0, 0, 0.24);
          max-width: min(820px, 68%);
          text-wrap: balance;
          font-weight: 500;
          margin-top: 0;
        }

        @media (max-width: 900px) {
          .card.screen1 {
            padding: 32px 22px;
          }

          .s1 {
            padding-top: 2vh;
            padding-bottom: 2vh;
            gap: 14px;
          }

          .s1Body {
            gap: 22px;
          }

          .s1Lead,
          .s1Lead2,
          .s1Hint {
            max-width: 92%;
          }
        }

        .s2Center {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          text-align: center;
          gap: 10px;
          padding: 4px 6px;
        }

        .s2Title {
          text-wrap: balance;
        }

        .s2Lead {
          margin-top: 0;
          max-width: 36ch;
          opacity: 0.9;
        }

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
          background: radial-gradient(54px 54px at 30% 25%, rgba(255, 255, 255, 0.62), rgba(255, 255, 255, 0) 62%);
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

        .contactRow {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-top: 2px;
        }

        .cItem {
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 20px 20px;
          border-radius: 22px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.14);
          min-height: 110px;
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(14px) saturate(1.08);
          -webkit-backdrop-filter: blur(14px) saturate(1.08);
        }

        .cItem::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background: radial-gradient(800px 260px at 25% 20%, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0) 60%);
          opacity: 0.85;
        }

        .cItem::after {
          content: "";
          position: absolute;
          inset: -22px;
          border-radius: inherit;
          pointer-events: none;
          filter: blur(18px);
          opacity: 0.55;
        }

        .cItem:nth-child(1) {
          background: linear-gradient(135deg, rgba(78, 190, 125, 0.88), rgba(120, 170, 70, 0.78));
        }

        .cItem:nth-child(1)::after {
          background: radial-gradient(700px 260px at 20% 45%, rgba(78, 190, 125, 0.45), rgba(0, 0, 0, 0) 70%);
        }

        .cItem:nth-child(2) {
          background: linear-gradient(135deg, rgba(90, 120, 190, 0.88), rgba(150, 120, 210, 0.78));
        }

        .cItem:nth-child(2)::after {
          background: radial-gradient(700px 260px at 20% 45%, rgba(120, 140, 255, 0.45), rgba(0, 0, 0, 0) 70%);
        }

        .cItem:nth-child(3) {
          background: linear-gradient(135deg, rgba(205, 150, 60, 0.92), rgba(230, 180, 95, 0.82));
        }

        .cItem:nth-child(3)::after {
          background: radial-gradient(700px 260px at 20% 45%, rgba(230, 180, 95, 0.45), rgba(0, 0, 0, 0) 70%);
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
          font-size: 13px;
          letter-spacing: 0.25px;
          opacity: 0.98;
          font-weight: 760;
          color: rgba(245, 241, 232, 1);
          text-shadow: 0 12px 26px rgba(0, 0, 0, 0.3);
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
          font-size: 15px;
          line-height: 1.25;
          color: rgba(245, 241, 232, 1);
          font-weight: 700;
          text-shadow: 0 12px 26px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 44ch;
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

          .portadaStage {
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }

          .orbCard.in {
            animation: none !important;
            opacity: 1 !important;
            transform: translate(-50%, -50%) !important;
          }

          .brandFixed.in {
            transition: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </main>
  );
}