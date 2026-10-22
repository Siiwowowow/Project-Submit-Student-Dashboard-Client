import { Brand } from "@/components/brand";
import { AuthForm } from "./auth-form";
import { ArrowDown, ArrowUpRight, Check, Code2, FolderGit2, MessageSquareText } from "lucide-react";

export function AuthScreen({ mode, expired = false }: { mode: "login" | "register"; expired?: boolean }) {
  const registering = mode === "register";
  return <main className="auth-page">
    <header className="auth-header"><Brand /><span className="auth-tagline">Good work deserves to be seen.</span></header>
    <div className="auth-grid">
      <section className="auth-story" aria-label="About Hand-in">
        <div className="eyebrow"><span className="pink-dot" /> A LITTLE PROGRESS, SHARED</div>
        <h1>You built it.<br /> Now make it<br /><em>count.</em></h1>
        <p>A home for your projects. A fresh pair of eyes.<br className="desktop-break" /> And a little direction for what comes next.</p>
        <div className="project-illustration" aria-hidden="true">
          <div className="paper-card paper-back"><span /><span /><span /></div>
          <div className="paper-card paper-front">
            <div className="paper-heading"><span className="project-icon"><FolderGit2 size={23} /></span><span className="mini-label">YOUR NEXT BIG THING</span><ArrowUpRight size={17} /></div>
            <h3>Something worth sharing.</h3>
            <p>Built with curiosity. Ready for feedback.</p>
            <div className="paper-line"><span /><span /><span /></div>
            <div className="paper-footer"><Code2 size={15} /><span>From your editor to the world.</span><span className="avatar-stack"><b>S</b><b>M</b></span></div>
          </div>
          <div className="floating-feedback"><span><Check size={16} /></span>One step forward.<ArrowUpRight size={15} /></div>
          <div className="floating-note"><MessageSquareText size={17} /><span>Feedback that helps you grow.</span></div>
        </div>
        <div className="auth-story-footer"><span className="step-number">01</span><span>Build something.<br /><strong>Share what you learned.</strong></span><ArrowDown size={17} /></div>
      </section>
      <section className="auth-form-panel">
        <div className="auth-form-inner">
          <span className="section-kicker">{registering ? "A FRESH START" : "YOUR WORKSPACE AWAITS"}</span>
          <h2>{registering ? "Make room for" : "Welcome"}<br /><span>{registering ? "your next idea." : "back."}</span></h2>
          <p className="auth-description">{registering ? "Create your student account. Start with something you’re proud of." : "Pick up where you left off. Your next step is right here."}</p>
          <AuthForm mode={mode} expired={expired} />
        </div>
        <p className="auth-bottom-note"><span className="tiny-square" /> Built for the work in progress.</p>
      </section>
    </div>
    <footer className="auth-footer"><span>Hand-in · A thoughtful project workspace</span><span>Build. Share. Grow.</span></footer>
  </main>;
}
