import { useEffect, useRef } from "react";
import { ArrowLeft, BrainCircuit, Heart, Music2, PencilLine, Sparkles } from "lucide-react";

type TributePerson = "mahima" | "striver" | "saumya";

function SuperstarWebGL() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, powerPreference: "low-power" });
    if (!gl) {
      canvas.dataset.webgl = "unavailable";
      return;
    }

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) {
        console.error("Could not create the Striver tribute WebGL shader.");
        return null;
      }
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Could not compile the Striver tribute WebGL shader.", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(gl.VERTEX_SHADER, `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform vec2 u_resolution;
      uniform float u_time;
      varying vec2 v_uv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      void main() {
        vec2 point = (v_uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
        float radius = length(point);
        float angle = atan(point.y, point.x);
        float falloff = 1.0 - smoothstep(0.04, 0.72, radius);
        float rays = pow(max(0.0, cos(angle * 13.0 - u_time * 0.12)), 26.0) * falloff;
        float glow = exp(-radius * 4.8) * (0.11 + 0.08 * sin(u_time * 1.4));

        vec2 grid = floor(v_uv * u_resolution / 15.0);
        vec2 cell = fract(v_uv * u_resolution / 15.0) - 0.5;
        float seed = hash(grid);
        float star = step(0.987, seed) * (1.0 - smoothstep(0.0, 0.09, length(cell)));
        star *= 0.3 + 0.7 * abs(sin(u_time * 1.8 + seed * 12.0));

        vec3 gold = vec3(1.0, 0.58, 0.19);
        vec3 ember = vec3(0.95, 0.16, 0.08);
        vec3 color = gold * (glow + rays * 0.23 + star * 0.3) + ember * exp(-radius * 7.0) * 0.16;
        float alpha = clamp(glow + rays * 0.42 + star * 0.55, 0.0, 0.36);
        gl_FragColor = vec4(color, alpha);
      }
    `);

    if (!vertexShader || !fragmentShader) {
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      canvas.dataset.webgl = "unavailable";
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      console.error("Could not create the Striver tribute WebGL program.");
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      canvas.dataset.webgl = "unavailable";
      return;
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Could not link the Striver tribute WebGL program.", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      canvas.dataset.webgl = "unavailable";
      return;
    }

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const buffer = gl.createBuffer();
    if (positionLocation < 0 || !timeLocation || !resolutionLocation || !buffer) {
      console.error("The Striver tribute WebGL program is missing required shader inputs.");
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      canvas.dataset.webgl = "unavailable";
      return;
    }

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const draw = (time: number) => {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(timeLocation, reduceMotion.matches ? 0 : time * 0.001);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const resizeObserver = new ResizeObserver(() => {
      const bounds = canvas.getBoundingClientRect();
      const scale = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(bounds.width * scale));
      const height = Math.max(1, Math.round(bounds.height * scale));
      if (canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      if (reduceMotion.matches) draw(0);
    });
    resizeObserver.observe(canvas);

    let frame = 0;
    if (reduceMotion.matches) {
      draw(0);
    } else {
      const animate = (time: number) => {
        if (!document.hidden) draw(time);
        frame = window.requestAnimationFrame(animate);
      };
      frame = window.requestAnimationFrame(animate);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return <canvas ref={canvasRef} className="tribute-page-webgl" aria-hidden="true" />;
}

const tributeCopy: Record<TributePerson, {
  name: string;
  heading?: string;
  comparison: string;
  paragraphs: string[];
  image?: string;
  imageAlt: string;
  closing?: string;
  songUrl?: string;
  footer: string;
}> = {
  mahima: {
    name: "Mahima Ma’am",
    heading: "Thank you, Mahima Ma’am 🙏",
    comparison: "A mentor who helped shape the person and teacher I am today.",
    paragraphs: [
      "For me, you are more than a mentor. You’re the reason I became who I am today.",
      "I started out as a learner, and with your guidance I’m now a DSA expert on Topmate, helping others with the same things you taught me. Every student I guide carries a bit of your teaching, and I’m proud to call myself your mentee.",
      "You made hard concepts feel easy and gave me the confidence to believe I could do this. Not everyone gets a teacher who changes their path. I did, and I’ll never forget it.",
      "Thank you for everything, Ma’am. I’m forever grateful. 🙏",
    ],
    image: "/mahima-sketch.jpg",
    imageAlt: "Sketch-style portrait of Mahima Ma’am",
    closing: "With love and respect,",
    footer: "",
  },
  saumya: {
    name: "Saumya Singh Ma’am",
    heading: "Thank you, Saumya Ma’am 🙏",
    comparison: "A mentor who changed what felt possible.",
    paragraphs: [
      "Some people don’t just teach you a skill, they change the way you see what’s possible. You did that for me.",
      "Before I learned from you, AI and vibe coding felt like a big, confusing world. You made it feel simple, exciting and doable. Your guidance, your patience and the way you explain things helped me go from just curious to actually building.",
      "Whatever I’m creating today, and whatever I’ll build in the future, a part of it comes from what I learned from you. Thank you for sharing your knowledge so generously and for believing in learners like me.",
      "I’m truly grateful to have you as my mentor.",
    ],
    image: "/saumya-sketch.jpg",
    imageAlt: "Sketch-style portrait of Saumya Singh Ma’am",
    closing: "With respect and gratitude,",
    footer: "",
  },
  striver: {
    name: "Striver Bhaiya",
    heading: "Thank you, Striver Bhaiya 🙏",
    comparison: "Fearless energy. A larger-than-life presence.",
    paragraphs: [
      "In Gunday, the cop never lets go of the case until it’s solved. That’s how I think of you in DSA. No problem can hide from you, and no doubt stays unsolved.",
      "You turned the most intimidating topics, like DP, graphs and recursion, into something I could crack step by step. You never gave shortcuts, but you gave a clear path. Because of that, I now have the confidence to take on any problem and help others do the same.",
      "Thank you for making DSA free, clear and accessible for so many of us. Your teaching has changed a lot of careers, mine included.",
    ],
    image: "/striver-sketch.jpg",
    imageAlt: "Sketch-style portrait of Striver",
    closing: "Respect and gratitude always. 🙏",
    songUrl: "https://www.youtube.com/watch?v=kQBtlb9gl5s&list=RDkQBtlb9gl5s&start_radio=1",
    footer: "",
  },
};

export default function TributePage({ person }: { person: TributePerson }) {
  const tribute = tributeCopy[person];
  const isStriver = person === "striver";
  const pageTheme = `tribute-page-${person}`;

  return (
    <main className={`tribute-page ${pageTheme}`} aria-labelledby="tribute-title">
      <div className="tribute-page-shell">
        <header className="tribute-page-nav">
          <a href="/" className="tribute-page-brand">CodexSheet</a>
          <span><Heart size={14} /> A note of gratitude</span>
        </header>

        <section className="tribute-page-hero">
          <div className="tribute-page-copy">
            <p className="tribute-page-eyebrow">
              <Sparkles size={15} /> {isStriver ? "The DSA superstar makes an entrance" : "For someone who makes learning unforgettable"}
            </p>
            {isStriver && <p className="tribute-page-superstar">S U P E R S T A R</p>}
            <h1 id="tribute-title">{isStriver ? tribute.name.toUpperCase() : tribute.heading ?? `To ${tribute.name}`}</h1>
            <p className="tribute-page-lede">{tribute.comparison}</p>
            <div className="tribute-page-note">
              <span className="tribute-page-note-mark" aria-hidden="true">“</span>
              {tribute.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <p className="tribute-page-signoff">
                {tribute.closing ?? "Thank you for inspiring us to learn, grow, and give our best."}
                {tribute.footer && <><br /><strong>{tribute.footer}</strong></>}
              </p>
            </div>
            <a className="tribute-page-back" href="/"><ArrowLeft size={16} /> Back to CodexSheet</a>
            {tribute.songUrl && (
              <a className="tribute-page-music" href={tribute.songUrl} target="_blank" rel="noreferrer">
                <Music2 size={16} /> Listen to the Gunday track
              </a>
            )}
          </div>

          <figure className="tribute-page-art">
            {isStriver && <SuperstarWebGL />}
            <div className="tribute-page-orbit tribute-page-orbit-one" />
            <div className="tribute-page-orbit tribute-page-orbit-two" />
            {tribute.image
              ? <img className="tribute-page-portrait" src={tribute.image} alt={tribute.imageAlt} />
              : <div className="tribute-page-illustration" role="img" aria-label={tribute.imageAlt}>
                  <BrainCircuit size={82} strokeWidth={1.2} />
                  <span>AI · IDEAS · POSSIBILITY</span>
                  <strong>Keep asking<br />what’s next.</strong>
                </div>}
            {tribute.image && <div className="tribute-page-pencil-track" aria-hidden="true"><PencilLine size={17} /></div>}
            <figcaption>{tribute.name} · A tribute in gratitude</figcaption>
            <span className="tribute-page-spark tribute-page-spark-one" aria-hidden="true">✳</span>
            <span className="tribute-page-spark tribute-page-spark-two" aria-hidden="true">✦</span>
          </figure>
        </section>

        <footer className="tribute-page-footer">
          <span>Made with appreciation</span>
          <Heart size={14} />
          <span>For {tribute.name}</span>
        </footer>
      </div>
    </main>
  );
}
