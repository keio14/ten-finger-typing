// js/views/certificate.js — printable certificate at #/certificate/:courseId.
import { store } from "../storage.js";
import { courseById } from "../curriculum.js";
import { escapeHtml } from "../util.js";

export function certificateView(host) {
  const m = (location.hash || "").slice(1).match(/^\/certificate\/(.+)$/);
  const id = m ? decodeURIComponent(m[1]) : null;
  const cert = (store.getCertificates() || []).find((c) => c.courseId === id);
  const course = courseById(id);
  if (!cert || !course) { location.hash = "#/"; return { destroy() {} }; }

  const name = store.getName();
  const dateStr = new Date(cert.dateISO).toLocaleDateString();

  host.innerHTML =
    `<div class="cert">
       <div class="cert-inner">
         <div class="cert-badge">🏆</div>
         <h1>Certificate of Achievement</h1>
         <p class="cert-sub">This certifies that</p>
         <p class="cert-name">${name ? escapeHtml(name) : "A Star Typist"}</p>
         <p class="cert-sub">has completed the <b>${escapeHtml(course.title)}</b> typing course</p>
         <p class="cert-stats">Best ${cert.wpm} WPM &middot; ${Math.round(cert.accuracy * 100)}% accuracy &middot; ${escapeHtml(dateStr)}</p>
       </div>
     </div>
     <div class="cert-actions no-print">
       <button id="print" class="btn-primary" type="button">Print / Save as PDF</button>
       <a class="btn-ghost" href="#/">Back home</a>
     </div>`;

  host.querySelector("#print").addEventListener("click", () => window.print());
  return { destroy() {} };
}
