/** Kategori slug → demo kapak görseli (şemasız). */
export const CATEGORY_DEMO_IMAGES: Record<string, string> = {
  arduino: "/demo/arduino.jpg",
  "raspberry-pi": "/demo/raspberry-pi.jpg",
  "stm32-arm": "/demo/stm32.jpg",
  "pcb-elektronik": "/demo/pcb.jpg",
  "proje-vitrini": "/demo/proje-vitrini.jpg",
  genel: "/demo/genel.jpg",
  "alim-satim": "/demo/alim-satim.jpg",
  duyurular: "/demo/duyurular.jpg",
};

export function categoryDemoImage(slug: string) {
  return CATEGORY_DEMO_IMAGES[slug] ?? "/demo/lab-bench.jpg";
}
