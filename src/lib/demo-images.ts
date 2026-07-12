/** Kategori slug → demo kapak görseli (şemasız). */
export const CATEGORY_DEMO_IMAGES: Record<string, string> = {
  arduino: "/demo/arduino.svg",
  "raspberry-pi": "/demo/raspberry-pi.svg",
  "stm32-arm": "/demo/stm32.svg",
  "pcb-elektronik": "/demo/pcb.svg",
  "proje-vitrini": "/demo/proje-vitrini.svg",
  genel: "/demo/genel.svg",
  "alim-satim": "/demo/alim-satim.svg",
  duyurular: "/demo/duyurular.svg",
};

export function categoryDemoImage(slug: string) {
  return CATEGORY_DEMO_IMAGES[slug] ?? "/demo/lab-bench.svg";
}
