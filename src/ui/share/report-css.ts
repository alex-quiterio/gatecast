import { PAGE_MM, PAPERS } from './paper';
import { FONT_SANS, FONT_SERIF, paletteDeclarations } from './themes';
import type { PaperId } from './types';

/** `@page` rule for a paper size; the pages carry their own margins. */
export function pageRule(paper: PaperId): string {
  const p = PAPERS[paper];
  return `@page{size:${p.widthMm}mm ${p.heightMm}mm;margin:0}`;
}

/**
 * The report's stylesheet, scoped to `.rp-root`. Used by the on-screen
 * preview, the print root and the downloaded HTML file, so all three look the
 * same. Every colour is a custom property, so Paper and Ink only swap tokens.
 */
export function reportCss(): string {
  const { padX, padTop, padBottom, header, footer } = PAGE_MM;
  return `
.rp-root{--rp-ink:#1c1830;--rp-muted:#5a5370;--rp-rule:#d9d3e8;--rp-soft:#f4f1fb;--rp-accent:#4b2fb0;--rp-accent-ink:#ffffff;--rp-amber:#8a5a00;--rp-track:#e6e1f2;color:var(--rp-ink);font-family:${FONT_SANS};font-size:9.2pt;line-height:1.45;-webkit-print-color-adjust:exact;print-color-adjust:exact;${paletteDeclarations('light')}}
.rp-root.rp-ink{--rp-ink:#000;--rp-muted:#3a3a3a;--rp-rule:#8c8c8c;--rp-soft:#f2f2f2;--rp-accent:#000;--rp-amber:#000;--rp-track:#dcdcdc;${paletteDeclarations('ink')}}
.rp-root *,.rp-root *::before,.rp-root *::after{box-sizing:border-box}
.rp-root p{margin:0}
.rp-pages{display:flex;flex-direction:column;align-items:flex-start}
.rp-slot{flex:none}
.rp-page{position:relative;display:flex;flex-direction:column;width:var(--rp-w);height:var(--rp-h);padding:${padTop}mm ${padX}mm ${padBottom}mm;background:#fff;color:var(--rp-ink);overflow:hidden;break-after:page;page-break-after:always}
.rp-page:last-child{break-after:auto;page-break-after:auto}
.rp-head{flex:none;height:${header}mm;display:flex;align-items:flex-start;justify-content:space-between;gap:6mm;border-bottom:0.3mm solid var(--rp-rule);font-size:7.6pt;color:var(--rp-muted);letter-spacing:.02em}
.rp-head__brand strong{white-space:nowrap}
.rp-head strong{color:var(--rp-ink);font-weight:600}
.rp-head__brand{display:flex;align-items:center;gap:2.5mm;min-width:0}
.rp-head__logo{height:6.5mm;width:auto;max-width:30mm;object-fit:contain}
.rp-head__for{text-align:right;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rp-content{flex:1;min-height:0;padding-top:4mm;overflow:hidden}
.rp-foot{flex:none;height:${footer}mm;display:flex;flex-direction:column;justify-content:flex-end;gap:1mm;border-top:0.3mm solid var(--rp-rule);padding-top:1.6mm;font-size:7pt;color:var(--rp-muted);line-height:1.3}
.rp-foot__row{display:flex;align-items:center;justify-content:space-between;gap:5mm}
.rp-foot__row>:first-child{min-width:0}
.rp-foot__legal{font-size:6.2pt;opacity:.95;max-width:122mm}
.rp-foot__page{white-space:nowrap;font-variant-numeric:tabular-nums;color:var(--rp-ink);font-weight:600}
.rp-wm{display:inline-flex;align-items:center;gap:1.4mm;white-space:nowrap;font-weight:600;color:var(--rp-muted)}
.rp-wm svg{width:4.2mm;height:4.2mm}
.rp-measure{position:absolute;left:-10000px;top:0;visibility:hidden;pointer-events:none}
.rp-b{display:flow-root;padding-bottom:3.6mm}
.rp-measure .rp-b,.rp-content .rp-b{width:100%}
.rp-label{display:block;font-size:6.6pt;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--rp-muted);margin-bottom:.8mm}
.rp-muted{color:var(--rp-muted)}
.rp-small{font-size:7.6pt}
.rp-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-variant-numeric:tabular-nums}
.rp-eyebrow{font-size:7.6pt;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--rp-accent);margin-bottom:2mm}
.rp-cover h1{font-family:${FONT_SERIF};font-size:26pt;line-height:1.1;font-weight:600;margin:0 0 1.5mm;overflow-wrap:anywhere}
.rp-birth{color:var(--rp-muted);font-size:9.5pt;margin-bottom:3mm}
.rp-cover{border-bottom:0.5mm solid var(--rp-accent);padding-bottom:4mm}
.rp-cover__grid{display:grid;grid-template-columns:78mm 1fr;gap:8mm;align-items:start;margin-top:3mm}
.rp-cover__two{display:grid;grid-template-columns:1fr 1fr;gap:7mm;margin-top:3mm}
.rp-cover__two .rp-graph{width:52mm;margin:1mm auto 2mm}
.rp-cover__two .rp-type{margin-bottom:1.5mm;padding:2mm 3mm}
.rp-cover__two .rp-type strong{font-size:14pt}
.rp-cover__two .rp-facts div{padding:1.1mm 0}
.rp-cover__two .rp-facts dd{font-size:9pt}
.rp-cover h1{max-height:3.4em;overflow:hidden}
.rp-person h3{font-family:${FONT_SERIF};font-size:13pt;margin:0 0 .5mm;overflow-wrap:anywhere}
.rp-graph svg{display:block;width:100%;height:auto}
.rp-wheel{width:150mm;margin:0 auto}
.rp-wheel svg{display:block;width:100%;height:auto}
.rp-type{display:flex;flex-direction:column;gap:.6mm;margin-bottom:3mm;padding:3mm 3.5mm;border:0.35mm solid var(--rp-accent);border-left-width:1.6mm;border-radius:1mm;background:var(--rp-soft)}
.rp-type strong{font-family:${FONT_SERIF};font-size:17pt;line-height:1.15;color:var(--rp-accent);font-weight:600}
.rp-type em{font-style:normal;color:var(--rp-muted);font-size:8.6pt}
.rp-facts{margin:0}
.rp-facts div{padding:1.7mm 0;border-bottom:0.25mm solid var(--rp-rule);break-inside:avoid}
.rp-facts dt{font-size:6.6pt;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--rp-muted)}
.rp-facts dd{margin:.3mm 0 0;font-weight:600;font-size:10pt}
.rp-card{border:0.3mm solid var(--rp-rule);border-radius:1.2mm;padding:3mm 3.6mm;background:var(--rp-soft);break-inside:avoid}
.rp-card strong{display:block;font-family:${FONT_SERIF};font-size:11.5pt;font-weight:600}
.rp-card em{display:block;font-style:normal;color:var(--rp-accent);font-weight:600;margin:.8mm 0}
.rp-card p{margin-top:1.4mm}
.rp-about{display:grid;grid-template-columns:1fr 1fr;gap:6mm}
.rp-about p{margin-top:.6mm}
.rp-h2{padding-top:2mm;margin-bottom:1mm}
.rp-h2 h2{font-family:${FONT_SERIF};font-size:15pt;font-weight:600;margin:0;padding-top:2.2mm;border-top:0.5mm solid var(--rp-accent);overflow-wrap:anywhere}
.rp-sub{color:var(--rp-muted)}
.rp-h3 h3{font-family:${FONT_SERIF};font-size:11.5pt;margin:2mm 0 0;font-weight:600}
.rp-table{width:100%;border-collapse:collapse;font-size:8.2pt;margin:0}
.rp-table caption{text-align:left;font-weight:700;font-size:9.6pt;margin-bottom:1.2mm;font-family:${FONT_SERIF}}
.rp-table th{text-align:left;font-size:6.6pt;letter-spacing:.1em;text-transform:uppercase;padding:1.3mm 1.6mm;background:var(--rp-accent);color:var(--rp-accent-ink)}
.rp-table--design th{background:#fff;color:var(--rp-accent);border-top:0.45mm solid var(--rp-accent);border-bottom:0.45mm solid var(--rp-accent)}
.rp-table td{padding:1.15mm 1.6mm;border-bottom:0.25mm solid var(--rp-rule);vertical-align:top}
.rp-table tr{break-inside:avoid}
.rp-glyph{display:inline-block;width:4mm;text-align:center;font-family:'Apple Symbols','Noto Sans Symbols 2','Segoe UI Symbol','DejaVu Sans',sans-serif}
.rp-mark{font-size:9pt}
.rp-row{padding:1.8mm 0;border-bottom:0.25mm solid var(--rp-rule)}
.rp-row__head{display:flex;flex-wrap:wrap;align-items:baseline;gap:2.2mm}
.rp-row p{margin-top:.6mm}
.rp-tag{display:inline-block;padding:.2mm 1.8mm;border-radius:5mm;font-size:6.6pt;font-weight:700;letter-spacing:.1em;text-transform:uppercase;border:0.3mm solid var(--rp-accent)}
.rp-tag--solid{background:var(--rp-accent);color:var(--rp-accent-ink)}
.rp-tag--outline{background:#fff;color:var(--rp-accent)}
.rp-note{color:var(--rp-muted);font-size:8.4pt;margin-top:1.4mm}
.rp-lead{margin-top:3mm;font-weight:600;font-size:10pt}
.rp-bars{display:grid;gap:2mm}
.rp-bar{display:grid;grid-template-columns:26mm 1fr 20mm;align-items:center;gap:3mm}
.rp-bar__track{display:block;height:3.2mm;border-radius:2mm;background:var(--rp-track);border:0.2mm solid var(--rp-rule);overflow:hidden}
.rp-bar__fill{display:block;height:100%;background:var(--rp-accent);background-image:repeating-linear-gradient(135deg,rgba(255,255,255,.35) 0 .6mm,transparent .6mm 1.4mm)}
.rp-line{padding:2mm 0 2.2mm;border-bottom:0.25mm solid var(--rp-rule)}
.rp-line__head{display:flex;flex-wrap:wrap;align-items:baseline;gap:2.2mm}
.rp-line p{margin-top:.7mm}
.rp-flow .rp-label{display:inline;margin-right:1.2mm;color:var(--rp-amber)}
.rp-composite{display:grid;grid-template-columns:70mm 1fr;gap:7mm;align-items:start}
.rp-dyn{list-style:none;margin:1mm 0 0;padding:0;display:grid;gap:2mm}
.rp-dyn li{display:grid;grid-template-columns:auto 1fr;gap:2.4mm;align-items:start}
.rp-dyn__electromagnetic{color:var(--hd-dyn-electromagnetic)}.rp-dyn__companionship{color:var(--hd-dyn-companionship)}.rp-dyn__dominance{color:var(--hd-dyn-dominance)}.rp-dyn__compromise{color:var(--hd-dyn-compromise)}
.rp-dyn li>span{color:var(--rp-ink)}
.rp-swatch{margin-top:1.4mm}
.rp-gloss{padding:1.4mm 0;border-bottom:0.25mm solid var(--rp-rule)}
.rp-gloss p{margin-top:.4mm}
.rp-notes{white-space:pre-wrap;overflow-wrap:anywhere}
.rp-closing{display:grid;grid-template-columns:1fr auto;gap:8mm;align-items:start;border-top:0.5mm solid var(--rp-accent);padding-top:3mm}
.rp-closing p{margin-top:1.2mm}
.rp-qr{width:30mm;height:30mm}
@media screen{
.rp-root{--rp-shadow:0 0.4mm 3mm rgba(20,16,40,.28)}
.rp-pages .rp-page{box-shadow:var(--rp-shadow)}
.rp-pages{gap:5mm}
}
@media print{
.rp-pages{display:block}
.rp-pages .rp-slot{width:auto!important;height:auto!important}
.rp-pages .rp-page{box-shadow:none;transform:none!important;height:calc(var(--rp-h) - 0.6mm)}
.rp-measure{display:none!important}
}
`.replace(/\n/g, '\n');
}
