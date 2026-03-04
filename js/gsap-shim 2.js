// Shim: proxy CDN window.gsap so our bundle reuses the single CDN instance
export const gsap = window.gsap;
export default window.gsap;
