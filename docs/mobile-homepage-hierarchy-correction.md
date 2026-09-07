# Mobile homepage — hierarchy correction

This replaces the rejected first revision. Preview: [local production build](http://127.0.0.1:4180/).

Restored the original transparent header, hero gradient, two-row animated SVG workflow and single-word reel emphasis. Removed all six visible pause controls and the capability disclosure. The complete capability list remains available to assistive technology and becomes visible when animation is unavailable or reduced motion is enabled.

The phone typography now distinguishes roles:

| Role | Treatment |
| --- | --- |
| Eyebrows and product status | 10px, restrained uppercase tracking |
| Roadmap metadata | 11px |
| Quotes and supporting bylines | 12–13px |
| Explanatory paragraphs | 15px / 1.5 line height |
| Audience names | 18px, above 13px bylines |
| Card and stage titles | 26px serif |
| Major titles | 34–40px serif, tighter line spacing |
| Hero | 40–44px serif |

Spacing within text groups is tighter, and product cards are separated by 48px. The roadmap remains content-sized and vertical on phones. Existing copy, images, section order, destinations and application tracking parameters remain intact. Keyboard disclosure behaviour and offscreen/reduced-motion handling remain active.

Visual captures: [hero](reviews/mobile-homepage-correction/hero-390.png), [restored workflow](reviews/mobile-homepage-correction/workflow-390.png), [restored reel](reviews/mobile-homepage-correction/reel-390.png).

Verification: **115 tests passed**, production build passed, and `git diff --check` passed. [Responsive measurements](reviews/mobile-homepage-correction/viewports.json) cover 320, 360, 390, 430, 768, 1023, 1280 and 1440px widths plus short landscape at 844×390, with no horizontal overflow in inspected text/controls. Manufacturer disclosure activation was checked after the typography changes. Physical-phone profiling has not been performed.
