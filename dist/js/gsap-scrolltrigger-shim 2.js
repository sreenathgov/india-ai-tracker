// Shim: proxy CDN window.ScrollTrigger so our bundle reuses the single CDN instance
export const ScrollTrigger = window.ScrollTrigger;
export default window.ScrollTrigger;
