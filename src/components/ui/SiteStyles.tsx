// Same fonts, colors and form styles as the homepage's <GlobalStyles/>.
// Use <SiteStyles /> on any page that isn't the homepage.
export default function SiteStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,800;1,400&family=JetBrains+Mono:wght@300;400;700&family=Inter:wght@300;400;500;600&display=swap');
      html { scroll-behavior: smooth; }
      body { font-family: 'Inter', sans-serif; background-color: #051009; color: #fff; overflow-x: hidden; font-size: 16px; line-height: 1.6; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
      .font-serif { font-family: 'Playfair Display', serif; }
      .font-mono { font-family: 'JetBrains Mono', monospace; }
      .font-sans { font-family: 'Inter', sans-serif; }
      .glass-panel {
        background: rgba(10, 30, 18, 0.45);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(163, 191, 174, 0.35);
        border-radius: 8px;
      }
      .form-input, .form-select {
        background: rgba(5, 16, 9, 0.6);
        border: 1px solid rgba(163, 191, 174, 0.3);
        border-radius: 6px;
        color: #fff;
        transition: border-color 0.2s ease, background-color 0.2s ease;
      }
      .form-input:focus, .form-select:focus { background: rgba(5, 16, 9, 0.85); border-color: rgba(163, 191, 174, 0.8); outline: none; }
      .form-input::placeholder { color: rgba(163, 191, 174, 0.3); }
      input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus {
        -webkit-box-shadow: 0 0 0 1000px #0a1f12 inset;
        -webkit-text-fill-color: #fff;
        caret-color: #fff;
        transition: background-color 9999s ease-in-out 0s;
      }
      ::-webkit-scrollbar { width: 8px; background: #051009; }
      ::-webkit-scrollbar-thumb { background: rgba(163, 191, 174, 0.4); border-radius: 4px; }
    `}</style>
  );
}