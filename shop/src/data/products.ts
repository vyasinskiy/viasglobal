import { Product, ShippingMethod, Coupon, ProductCategory } from "@/types";

/**
 * Каталог реальных товаров интернет-магазина Viasglobal Shop из базы данных.
 * Встроен статически для мгновенного первого рендера без задержек и без зависимости от внешних json файлов.
 */
export const PRODUCTS_DATA: Product[] = [
  {
    "id": "prod-decoraciones-de-huevos-de-pascua-en-form",
    "slug": "decoraciones-de-huevos-de-pascua-en-forma-de-panal-paquete-de-3-medianos-7602",
    "title": {
      "es": "Decoraciones de huevos de Pascua en forma de panal - paquete de 3, medianos",
      "en": "Decoraciones de huevos de Pascua en forma de panal - paquete de 3, medianos"
    },
    "shortDescription": {
      "es": "Paquete de 3 decoraciones de huevos de Pascua de Talking Tables. En tonos primaverales de lavanda, verde y amarillo, estas decoraciones de huevo de Pascua en fo...",
      "en": "Paquete de 3 decoraciones de huevos de Pascua de Talking Tables. En tonos primaverales de lavanda, verde y amarillo, estas decoraciones de huevo de Pascua en fo..."
    },
    "description": {
      "es": "Paquete de 3 decoraciones de huevos de Pascua de Talking Tables. En tonos primaverales de lavanda, verde y amarillo, estas decoraciones de huevo de Pascua en forma de panal son una excelente decoración para el hogar o para la Pascua. Abra cada panal, asegúrelo con el imán y luego use la cinta de raso para colgarlo en la casa o el jardín.\n\nTamaño de las decoraciones - 10cm\n\nTamaño del paquete: 3 decoraciones de huevos de Pascua.",
      "en": "Paquete de 3 decoraciones de huevos de Pascua de Talking Tables. En tonos primaverales de lavanda, verde y amarillo, estas decoraciones de huevo de Pascua en forma de panal son una excelente decoración para el hogar o para la Pascua. Abra cada panal, asegúrelo con el imán y luego use la cinta de raso para colgarlo en la casa o el jardín.\n\nTamaño de las decoraciones - 10cm\n\nTamaño del paquete: 3 decoraciones de huevos de Pascua."
    },
    "price": 16.25,
    "currency": "EUR",
    "category": "lifestyle",
    "brand": "Talking Tables",
    "sku": "BUNNY-HCOMB-EGG-M",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-decoraciones-de-huevos-de-pascua-en-form/img_0_bf61eaac.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-decoraciones-de-huevos-de-pascua-en-form/img_0_bf61eaac.webp"
    ],
    "rating": 5,
    "reviewCount": 39,
    "inStock": true,
    "stockCount": 26,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "hogar",
      "пасха",
      "pascua",
      "decoracion",
      "primavera",
      "hogar-decoracion"
    ],
    "specs": {
      "en": {},
      "es": {}
    },
    "features": {
      "en": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ],
      "es": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ]
    }
  },
  {
    "id": "prod-nevera-portatil-neela-jungle-marine",
    "slug": "nevera-portatil-neela-jungle-marine-5142",
    "title": {
      "es": "Nevera portátil Neela Jungle Marine",
      "en": "Nevera portátil Neela Jungle Marine"
    },
    "shortDescription": {
      "es": "Una bolsa para el almuerzo práctica y elegante. La fiambrera isotérmica NEELA es la compañera ideal para mantener tus comidas y tentempiés a la temperatura adec...",
      "en": "Una bolsa para el almuerzo práctica y elegante. La fiambrera isotérmica NEELA es la compañera ideal para mantener tus comidas y tentempiés a la temperatura adec..."
    },
    "description": {
      "es": "Una bolsa para el almuerzo práctica y elegante. La fiambrera isotérmica NEELA es la compañera ideal para mantener tus comidas y tentempiés a la temperatura adecuada. Gracias a su tejido aislante de alta calidad, mantiene el calor y la frescura, ya sea para ir a la escuela, a la oficina o para viajes familiares. Diseñada para nómadas y viajeros. Compacta, ligera y fácil de guardar en una mochila, bolso o maleta, esta bolsa isotérmica para aperitivos encarna el espíritu nómada y viajero de Maison Horizon. Te acompaña en todas tus aventuras, desde el día a día hasta las escapadas a lugares lejanos. Un regalo práctico y considerado. Perfecto para la vuelta al cole, un nacimiento, un cumpleaños o incluso el Día de la Madre, la fiambrera NILA combina estilo, practicidad y personalización. Al ofrecerse con bordado gratuito, se convierte en un regalo a la vez bonito y útil.",
      "en": "Una bolsa para el almuerzo práctica y elegante. La fiambrera isotérmica NEELA es la compañera ideal para mantener tus comidas y tentempiés a la temperatura adecuada. Gracias a su tejido aislante de alta calidad, mantiene el calor y la frescura, ya sea para ir a la escuela, a la oficina o para viajes familiares. Diseñada para nómadas y viajeros. Compacta, ligera y fácil de guardar en una mochila, bolso o maleta, esta bolsa isotérmica para aperitivos encarna el espíritu nómada y viajero de Maison Horizon. Te acompaña en todas tus aventuras, desde el día a día hasta las escapadas a lugares lejanos. Un regalo práctico y considerado. Perfecto para la vuelta al cole, un nacimiento, un cumpleaños o incluso el Día de la Madre, la fiambrera NILA combina estilo, practicidad y personalización. Al ofrecerse con bordado gratuito, se convierte en un regalo a la vez bonito y útil."
    },
    "price": 38,
    "currency": "EUR",
    "category": "lifestyle",
    "brand": "Maison Horizon",
    "sku": "LUNCH004",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-nevera-portatil-neela-jungle-marine/img_0_14242cba.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-nevera-portatil-neela-jungle-marine/img_0_14242cba.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-nevera-portatil-neela-jungle-marine/img_1_7626632e.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-nevera-portatil-neela-jungle-marine/img_2_1dc6298f.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-nevera-portatil-neela-jungle-marine/img_3_b65bcbd1.webp"
    ],
    "rating": 5,
    "reviewCount": 12,
    "inStock": true,
    "stockCount": 26,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "summer",
      "hogar",
      "verano",
      "playa",
      "beach",
      "hogar-decoracion",
      "пляж",
      "лето"
    ],
    "specs": {
      "en": {},
      "es": {}
    },
    "features": {
      "en": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ],
      "es": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ]
    }
  },
  {
    "id": "prod-8430306280035",
    "slug": "tirelire-sparschwein-coin-bank-kawaii-gamer-3308",
    "title": {
      "es": "Tirelire/Sparschwein/ Coin bank, Kawaii Gamer",
      "en": "Tirelire/Sparschwein/ Coin bank, Kawaii Gamer"
    },
    "shortDescription": {
      "es": "DESIGN ORIGINAL. Tirelire en forme de chat kawaii fan de jeux vidéo. En plus d'être fonctionnel, cet adorable chat au style kawaii décorera à merveille une cham...",
      "en": "DESIGN ORIGINAL. Tirelire en forme de chat kawaii fan de jeux vidéo. En plus d'être fonctionnel, cet adorable chat au style kawaii décorera à merveille une cham..."
    },
    "description": {
      "es": "DESIGN ORIGINAL. Tirelire en forme de chat kawaii fan de jeux vidéo. En plus d'être fonctionnel, cet adorable chat au style kawaii décorera à merveille une chambre, une table de nuit ou un bureau.\nCADEAU PARFAIT. Idéal pour les anniversaires, Noël ou toute occasion spéciale. Un bon outil pour apprendre aux plus petits à épargner de manière ludique.\nRÉUTILISABLE. Vous n'avez pas besoin de la casser pour accéder à vos économies. Retirez simplement le bouchon situé sur la partie inférieure et recommencez.\nFABRICATION ARTISANALE. Fabriqués en céramique de qualité supérieure et peint à la main ; chaque pièce est unique. Dispose de patins antidérapants pour une meilleure stabilité. Pour billets et pièces.\nDimensions: 14,1x10x9,2 cm - Matériel: céramique - Design: Balvi",
      "en": "DESIGN ORIGINAL. Tirelire en forme de chat kawaii fan de jeux vidéo. En plus d'être fonctionnel, cet adorable chat au style kawaii décorera à merveille une chambre, une table de nuit ou un bureau.\nCADEAU PARFAIT. Idéal pour les anniversaires, Noël ou toute occasion spéciale. Un bon outil pour apprendre aux plus petits à épargner de manière ludique.\nRÉUTILISABLE. Vous n'avez pas besoin de la casser pour accéder à vos économies. Retirez simplement le bouchon situé sur la partie inférieure et recommencez.\nFABRICATION ARTISANALE. Fabriqués en céramique de qualité supérieure et peint à la main ; chaque pièce est unique. Dispose de patins antidérapants pour une meilleure stabilité. Pour billets et pièces.\nDimensions: 14,1x10x9,2 cm - Matériel: céramique - Design: Balvi"
    },
    "price": 14.95,
    "currency": "EUR",
    "category": "lifestyle",
    "brand": "BALVI",
    "sku": "28003",
    "ean": "8430306280035",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-8430306280035/img_0_d0ee81ec.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-8430306280035/img_0_d0ee81ec.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-8430306280035/img_1_b09cb855.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-8430306280035/img_2_807a827a.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-8430306280035/img_3_731bb1ef.webp"
    ],
    "rating": 5,
    "reviewCount": 18,
    "inStock": true,
    "stockCount": 33,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "juegos",
      "для-детей",
      "kidult",
      "игрушки",
      "juguetes",
      "hogar",
      "infantil",
      "ninos",
      "hogar-decoracion"
    ],
    "specs": {
      "en": {},
      "es": {}
    },
    "features": {
      "en": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ],
      "es": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ]
    }
  },
  {
    "id": "prod-lego-72037-mario-kart-mario-y-kart-estan",
    "slug": "lego-72037-mario-kart-mario-y-kart-estandar-0300",
    "title": {
      "es": "LEGO 72037 - Mario Kart™: Mario y kart estándar",
      "en": "LEGO 72037 - Mario Kart™: Mario y kart estándar"
    },
    "shortDescription": {
      "es": "Te esperan aventuras creativas con el modelo para construir y exhibir Mario Kart™: Mario & Standard Kart (72037). Un regalo popular para todos los jugadores adu...",
      "en": "Te esperan aventuras creativas con el modelo para construir y exhibir Mario Kart™: Mario & Standard Kart (72037). Un regalo popular para todos los jugadores adu..."
    },
    "description": {
      "es": "Te esperan aventuras creativas con el modelo para construir y exhibir Mario Kart™: Mario & Standard Kart (72037). Un regalo popular para todos los jugadores adultos, este set de Nintendo® incluye una figura de Mario para construir con cabeza y brazos articulados, sentado al volante de uno de los vehículos más emblemáticos de Mario Kart. Coloca el kart en el soporte especial en una posición dinámica que lo haga parecer como si estuviera acelerando o derrapando en una pista de Mario Kart.Este modelo auténticamente detallado es una excelente decoración LEGO® Super Mario™ para tu hogar u oficina.\n\nEncuentra instrucciones paso a paso dentro de la caja o en la aplicación LEGO Builder, que te guiarán a través de una experiencia de construcción inmersiva. La aplicación ofrece herramientas intuitivas que te permiten hacer zoom, rotar una versión 3D del modelo mientras construyes, seguir tu progreso y guardar todos tus conjuntos en un solo lugar.",
      "en": "Te esperan aventuras creativas con el modelo para construir y exhibir Mario Kart™: Mario & Standard Kart (72037). Un regalo popular para todos los jugadores adultos, este set de Nintendo® incluye una figura de Mario para construir con cabeza y brazos articulados, sentado al volante de uno de los vehículos más emblemáticos de Mario Kart. Coloca el kart en el soporte especial en una posición dinámica que lo haga parecer como si estuviera acelerando o derrapando en una pista de Mario Kart.Este modelo auténticamente detallado es una excelente decoración LEGO® Super Mario™ para tu hogar u oficina.\n\nEncuentra instrucciones paso a paso dentro de la caja o en la aplicación LEGO Builder, que te guiarán a través de una experiencia de construcción inmersiva. La aplicación ofrece herramientas intuitivas que te permiten hacer zoom, rotar una versión 3D del modelo mientras construyes, seguir tu progreso y guardar todos tus conjuntos en un solo lugar."
    },
    "price": 197.99,
    "currency": "EUR",
    "category": "lifestyle",
    "brand": "Lego",
    "sku": "A2505107",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-lego-72037-mario-kart-mario-y-kart-estan/img_0_a537ae61.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-lego-72037-mario-kart-mario-y-kart-estan/img_0_a537ae61.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-lego-72037-mario-kart-mario-y-kart-estan/img_1_ff44f0d9.webp"
    ],
    "rating": 5,
    "reviewCount": 5,
    "inStock": true,
    "stockCount": 30,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "juegos",
      "для-детей",
      "kidult",
      "игрушки",
      "juguetes",
      "hogar",
      "infantil",
      "ninos",
      "hogar-decoracion"
    ],
    "specs": {
      "en": {},
      "es": {}
    },
    "features": {
      "en": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ],
      "es": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ]
    }
  },
  {
    "id": "prod-puzzle-de-1000-piezas-bain-a-ver",
    "slug": "puzzle-de-1000-piezas-bain-a-ver-6489",
    "title": {
      "es": "Puzzle de 1000 piezas - Bain A ver",
      "en": "Puzzle de 1000 piezas - Bain A ver"
    },
    "shortDescription": {
      "es": "rompecabezas de 1000 piezas\n Dimensiones del rompecabezas completo: 68x49 cm\n Tamaño de la caja: 17 x 17 x 17 cm\n Hecho en FRANCIA\n Cartón 100% reciclado\n Plást...",
      "en": "rompecabezas de 1000 piezas\n Dimensiones del rompecabezas completo: 68x49 cm\n Tamaño de la caja: 17 x 17 x 17 cm\n Hecho en FRANCIA\n Cartón 100% reciclado\n Plást..."
    },
    "description": {
      "es": "rompecabezas de 1000 piezas\n Dimensiones del rompecabezas completo: 68x49 cm\n Tamaño de la caja: 17 x 17 x 17 cm\n Hecho en FRANCIA\n Cartón 100% reciclado\n Plástico cero\n -\n Radstream es un artista alemán que utiliza la inteligencia artificial para crear universos poéticos que te llevarán de viaje. \n \n\n Ref: Regalo de Navidad / Decoración de pared / Puzzle / Juegos / Regalo",
      "en": "rompecabezas de 1000 piezas\n Dimensiones del rompecabezas completo: 68x49 cm\n Tamaño de la caja: 17 x 17 x 17 cm\n Hecho en FRANCIA\n Cartón 100% reciclado\n Plástico cero\n -\n Radstream es un artista alemán que utiliza la inteligencia artificial para crear universos poéticos que te llevarán de viaje. \n \n\n Ref: Regalo de Navidad / Decoración de pared / Puzzle / Juegos / Regalo"
    },
    "price": 29.9,
    "currency": "EUR",
    "category": "lifestyle",
    "brand": "Piece & Love",
    "sku": "1000PVOY",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-puzzle-de-1000-piezas-bain-a-ver/img_0_71210bea.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-puzzle-de-1000-piezas-bain-a-ver/img_0_71210bea.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-puzzle-de-1000-piezas-bain-a-ver/img_1_d326ada9.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-puzzle-de-1000-piezas-bain-a-ver/img_2_bff234cd.webp"
    ],
    "rating": 5,
    "reviewCount": 52,
    "inStock": true,
    "stockCount": 19,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "ninos-juegos",
      "juegos",
      "для-детей",
      "kidult",
      "игрушки",
      "juguetes",
      "infantil",
      "ninos"
    ],
    "specs": {
      "en": {
        "Peso neto": "0,65"
      },
      "es": {
        "Peso neto": "0,65"
      }
    },
    "features": {
      "en": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ],
      "es": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ]
    }
  },
  {
    "id": "prod-3666666017935",
    "slug": "accesorio-taza-blanca-mama-del-amor-corazon-6253",
    "title": {
      "es": "ACCESORIO TAZA BLANCA MAMÁ DEL AMOR CORAZÓN",
      "en": "ACCESORIO TAZA BLANCA MAMÁ DEL AMOR CORAZÓN"
    },
    "shortDescription": {
      "es": "Taza de cerámica estampada con amor en Francia....",
      "en": "Taza de cerámica estampada con amor en Francia...."
    },
    "description": {
      "es": "Taza de cerámica estampada con amor en Francia.",
      "en": "Taza de cerámica estampada con amor en Francia."
    },
    "price": 22,
    "currency": "EUR",
    "category": "lifestyle",
    "brand": "WE ARE FAMILY",
    "sku": "MPT3263-TU",
    "ean": "3666666017935",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-3666666017935/img_0_b9526c19.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-3666666017935/img_0_b9526c19.webp"
    ],
    "rating": 5,
    "reviewCount": 16,
    "inStock": true,
    "stockCount": 21,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "день-матери",
      "madre",
      "regalos",
      "hogar",
      "mensajes",
      "decoracion",
      "hogar-decoracion",
      "para-ella",
      "dia-de-la-madre",
      "regalos-con-mensaje"
    ],
    "specs": {
      "en": {},
      "es": {}
    },
    "features": {
      "en": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ],
      "es": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ]
    }
  },
  {
    "id": "prod-postal-mama-te-amo-ilustracion-10x15cm",
    "slug": "postal-mama-te-amo-ilustracion-10x15cm-5997",
    "title": {
      "es": "Postal MAMÁ, te amo - Ilustración 10x15cm",
      "en": "Postal MAMÁ, te amo - Ilustración 10x15cm"
    },
    "shortDescription": {
      "es": "Servicio de recogida disponible en el Atelier de Mérignac.Póster enviado en 48 horas La postal \"Mamá te amo\" es el regalo perfecto para expresar tu amor y cariñ...",
      "en": "Servicio de recogida disponible en el Atelier de Mérignac.Póster enviado en 48 horas La postal \"Mamá te amo\" es el regalo perfecto para expresar tu amor y cariñ..."
    },
    "description": {
      "es": "Servicio de recogida disponible en el Atelier de Mérignac.Póster enviado en 48 horas La postal \"Mamá te amo\" es el regalo perfecto para expresar tu amor y cariño a tu mamá. Esta postal está diseñada con una original ilustración de flores coloridas y brillantes, que evocan alegría, calidez y ternura. El estilo retro de la ilustración añade un toque de encanto y autenticidad a la tarjeta, y le da un carácter único y atemporal.Puedes estar seguro de que tu mensaje de amor y cariño será transmitido con elegancia y estilo con esta postal.En definitiva, la postal “Mamá te amo” es una forma perfecta de demostrarle tu amor a tu mamá. Puedes estar seguro de derretir el corazón de tu mamá y traerle alegría. Regálale este regalo único para recordarle lo especial que es. Postal MAMÁ, te amo, ilustración original. Papel de calidad: Impreso en papel estucado mate de 280 g, 100% certificado PEFC para una calidad excepcional. Origen local: Cada postal se imprime cuidadosamente en Burdeos. Dimensiones ideales: formato 10x15 cm, perfecto para meter en un sobre y ofrecer a su ser querido ❤️ Embalaje cuidadoso: Cada postal se empaqueta meticulosamente en un blister y se envía con su sobre de color artesanal en una funda de cartón reforzado para garantizar una recepción perfecta.",
      "en": "Servicio de recogida disponible en el Atelier de Mérignac.Póster enviado en 48 horas La postal \"Mamá te amo\" es el regalo perfecto para expresar tu amor y cariño a tu mamá. Esta postal está diseñada con una original ilustración de flores coloridas y brillantes, que evocan alegría, calidez y ternura. El estilo retro de la ilustración añade un toque de encanto y autenticidad a la tarjeta, y le da un carácter único y atemporal.Puedes estar seguro de que tu mensaje de amor y cariño será transmitido con elegancia y estilo con esta postal.En definitiva, la postal “Mamá te amo” es una forma perfecta de demostrarle tu amor a tu mamá. Puedes estar seguro de derretir el corazón de tu mamá y traerle alegría. Regálale este regalo único para recordarle lo especial que es. Postal MAMÁ, te amo, ilustración original. Papel de calidad: Impreso en papel estucado mate de 280 g, 100% certificado PEFC para una calidad excepcional. Origen local: Cada postal se imprime cuidadosamente en Burdeos. Dimensiones ideales: formato 10x15 cm, perfecto para meter en un sobre y ofrecer a su ser querido ❤️ Embalaje cuidadoso: Cada postal se empaqueta meticulosamente en un blister y se envía con su sobre de color artesanal en una funda de cartón reforzado para garantizar una recepción perfecta."
    },
    "price": 4,
    "currency": "EUR",
    "category": "lifestyle",
    "brand": "Julie Roubergue",
    "sku": "PC-255-001-1015",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-postal-mama-te-amo-ilustracion-10x15cm/img_0_6948033e.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-postal-mama-te-amo-ilustracion-10x15cm/img_0_6948033e.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-postal-mama-te-amo-ilustracion-10x15cm/img_1_2081a85f.webp"
    ],
    "rating": 5,
    "reviewCount": 46,
    "inStock": true,
    "stockCount": 32,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "день-матери",
      "madre",
      "regalos",
      "hogar",
      "mensajes",
      "hogar-decoracion",
      "para-ella",
      "dia-de-la-madre",
      "regalos-con-mensaje"
    ],
    "specs": {
      "en": {},
      "es": {}
    },
    "features": {
      "en": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ],
      "es": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ]
    }
  },
  {
    "id": "prod-3760379741184",
    "slug": "kit-de-bordado-aguacate-kawaii-8529",
    "title": {
      "es": "Kit de bordado - Aguacate Kawaii",
      "en": "Kit de bordado - Aguacate Kawaii"
    },
    "shortDescription": {
      "es": "Este verano, crea un lindo patrón con este pequeño aguacate kawaii. Será perfecto para personalizar tu ropa con estilo. Este moderno kit de bordado es ideal par...",
      "en": "Este verano, crea un lindo patrón con este pequeño aguacate kawaii. Será perfecto para personalizar tu ropa con estilo. Este moderno kit de bordado es ideal par..."
    },
    "description": {
      "es": "Este verano, crea un lindo patrón con este pequeño aguacate kawaii. Será perfecto para personalizar tu ropa con estilo. Este moderno kit de bordado es ideal para iniciarse en el bordado este verano.\nPermite aprender a bordar una prenda uno mismo, a partir de los 12 años. El papel tejido autoadhesivo y soluble permite bordar sobre el modelo y luego el papel desaparece después del primer lavado. Adelante, el bordado es accesible para principiantes y te permite personalizar una prenda o accesorio.\n\n\nContenido\nEste completo kit de bordado contiene todo lo necesario:\nUna lámina autoadhesiva soluble en agua con el diseño impreso. Lo bordas.\nUn bastidor de bordado de madera de haya\nUna aguja de bordar\nLos hilos de algodón necesarios para bordar\nUna tarjeta con instrucciones\n\nEmbalaje del kit completo: Caja de cartón\n\nDificultad: La verdad es que es fácil. Está diseñado para enseñar a bordar a adultos principiantes y niños a partir de 12 años.\nIncluso si nunca has tocado una aguja, te servirá. Hay un folleto con instrucciones en el kit y acceso a un videotutorial \"Cómo hacer tu kit de bordado\" aquí en francés, aquí en inglés.Dimensiones\nIlustración: 4,3 x 2,5 cm\nBastidor de bordado: 10 cm",
      "en": "Este verano, crea un lindo patrón con este pequeño aguacate kawaii. Será perfecto para personalizar tu ropa con estilo. Este moderno kit de bordado es ideal para iniciarse en el bordado este verano.\nPermite aprender a bordar una prenda uno mismo, a partir de los 12 años. El papel tejido autoadhesivo y soluble permite bordar sobre el modelo y luego el papel desaparece después del primer lavado. Adelante, el bordado es accesible para principiantes y te permite personalizar una prenda o accesorio.\n\n\nContenido\nEste completo kit de bordado contiene todo lo necesario:\nUna lámina autoadhesiva soluble en agua con el diseño impreso. Lo bordas.\nUn bastidor de bordado de madera de haya\nUna aguja de bordar\nLos hilos de algodón necesarios para bordar\nUna tarjeta con instrucciones\n\nEmbalaje del kit completo: Caja de cartón\n\nDificultad: La verdad es que es fácil. Está diseñado para enseñar a bordar a adultos principiantes y niños a partir de 12 años.\nIncluso si nunca has tocado una aguja, te servirá. Hay un folleto con instrucciones en el kit y acceso a un videotutorial \"Cómo hacer tu kit de bordado\" aquí en francés, aquí en inglés.Dimensiones\nIlustración: 4,3 x 2,5 cm\nBastidor de bordado: 10 cm"
    },
    "price": 25,
    "currency": "EUR",
    "category": "lifestyle",
    "brand": "FUKURI",
    "sku": "20047-01",
    "ean": "3760379741184",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-3760379741184/img_0_db907baf.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-3760379741184/img_0_db907baf.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-3760379741184/img_1_1a04405e.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-3760379741184/img_2_c18520b8.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-3760379741184/img_3_4cc47b6c.webp"
    ],
    "rating": 5,
    "reviewCount": 73,
    "inStock": true,
    "stockCount": 29,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "juegos",
      "для-детей",
      "kidult",
      "игрушки",
      "juguetes",
      "hogar",
      "infantil",
      "ninos",
      "hogar-decoracion"
    ],
    "specs": {
      "en": {},
      "es": {}
    },
    "features": {
      "en": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ],
      "es": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ]
    }
  },
  {
    "id": "prod-portalapices-de-ceramica-tulipan-rosa",
    "slug": "portalapices-de-ceramica-tulipan-rosa-4270",
    "title": {
      "es": "Portalápices de cerámica, tulipán (rosa)",
      "en": "Portalápices de cerámica, tulipán (rosa)"
    },
    "shortDescription": {
      "es": "Tu escritorio está a punto de florecer. Esta taza de cerámica tiene la forma del más dulce de los tulipanes y es perfecta para guardar bolígrafos, lápices, resa...",
      "en": "Tu escritorio está a punto de florecer. Esta taza de cerámica tiene la forma del más dulce de los tulipanes y es perfecta para guardar bolígrafos, lápices, resa..."
    },
    "description": {
      "es": "Tu escritorio está a punto de florecer. Esta taza de cerámica tiene la forma del más dulce de los tulipanes y es perfecta para guardar bolígrafos, lápices, resaltadores y más.",
      "en": "Tu escritorio está a punto de florecer. Esta taza de cerámica tiene la forma del más dulce de los tulipanes y es perfecta para guardar bolígrafos, lápices, resaltadores y más."
    },
    "price": 27.75,
    "currency": "EUR",
    "category": "lifestyle",
    "brand": "Ban.do",
    "sku": "252251",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-portalapices-de-ceramica-tulipan-rosa/img_0_35622bb3.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-portalapices-de-ceramica-tulipan-rosa/img_0_35622bb3.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-portalapices-de-ceramica-tulipan-rosa/img_2_8fd10dd4.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-portalapices-de-ceramica-tulipan-rosa/img_4_7b10cf72.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-portalapices-de-ceramica-tulipan-rosa/img_6_08de7acd.webp"
    ],
    "rating": 5,
    "reviewCount": 15,
    "inStock": true,
    "stockCount": 17,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "papeleria",
      "escuela",
      "школа",
      "colegio",
      "hogar",
      "papeleria-creatividad",
      "decoracion",
      "hogar-decoracion",
      "vuelta-al-cole"
    ],
    "specs": {
      "en": {},
      "es": {}
    },
    "features": {
      "en": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ],
      "es": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ]
    }
  },
  {
    "id": "prod-taza-mama-del-amor-especial-dia-de-la-ma",
    "slug": "taza-mama-del-amor-especial-dia-de-la-madre-3605",
    "title": {
      "es": "Taza Mamá del Amor / Especial Día de la Madre",
      "en": "Taza Mamá del Amor / Especial Día de la Madre"
    },
    "shortDescription": {
      "es": "¡Ofrece un producto original!\n\nImpreso a mano en nuestro taller en el sur de Francia.  \n¡Se entrega en su caja individual con logo.\n\nLas tazas pueden presentar ...",
      "en": "¡Ofrece un producto original!\n\nImpreso a mano en nuestro taller en el sur de Francia.  \n¡Se entrega en su caja individual con logo.\n\nLas tazas pueden presentar ..."
    },
    "description": {
      "es": "¡Ofrece un producto original!\n\nImpreso a mano en nuestro taller en el sur de Francia.  \n¡Se entrega en su caja individual con logo.\n\nLas tazas pueden presentar pequeñas imperfecciones en el revestimiento o en el borde negro (en el caso de las tazas de cerámica), que no afectan en absoluto a su uso.\n\nNuevo texto\n\n¡Regala algo original!\n\n¿Estabas buscando la marca que le está dando un nuevo aspecto a la taza? ¡Lo encontraste! Ya sea que estés buscando tazas divertidas, tazas para el Día del Padre, el Día de la Madre, el Día de los Abuelos, cumpleaños, San Valentín, festividades como Pascua o Navidad, o simplemente una idea de regalo original, ¡has llegado al lugar correcto!\n\nDisponemos de una variedad de mensajes, con tazas divertidas y adorables, para todas las ocasiones: cumpleaños, nacimientos, bodas, vuelta al cole, primavera, verano, happy hour, etc.\n\nImpreso a mano en nuestro taller del sur de Francia.  \n¡Se entrega en su caja individual con logo.\n\nLas tazas pueden presentar pequeños defectos en el revestimiento o en el contorno negro (en el caso de cerámica), que no impiden en ningún caso su correcto uso.",
      "en": "¡Ofrece un producto original!\n\nImpreso a mano en nuestro taller en el sur de Francia.  \n¡Se entrega en su caja individual con logo.\n\nLas tazas pueden presentar pequeñas imperfecciones en el revestimiento o en el borde negro (en el caso de las tazas de cerámica), que no afectan en absoluto a su uso.\n\nNuevo texto\n\n¡Regala algo original!\n\n¿Estabas buscando la marca que le está dando un nuevo aspecto a la taza? ¡Lo encontraste! Ya sea que estés buscando tazas divertidas, tazas para el Día del Padre, el Día de la Madre, el Día de los Abuelos, cumpleaños, San Valentín, festividades como Pascua o Navidad, o simplemente una idea de regalo original, ¡has llegado al lugar correcto!\n\nDisponemos de una variedad de mensajes, con tazas divertidas y adorables, para todas las ocasiones: cumpleaños, nacimientos, bodas, vuelta al cole, primavera, verano, happy hour, etc.\n\nImpreso a mano en nuestro taller del sur de Francia.  \n¡Se entrega en su caja individual con logo.\n\nLas tazas pueden presentar pequeños defectos en el revestimiento o en el contorno negro (en el caso de cerámica), que no impiden en ningún caso su correcto uso."
    },
    "price": 16.5,
    "currency": "EUR",
    "category": "lifestyle",
    "brand": "Bibiche fait son Cirque",
    "sku": "MUG-MAMANDAMOUR",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-taza-mama-del-amor-especial-dia-de-la-ma/img_0_5f0d0e72.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-taza-mama-del-amor-especial-dia-de-la-ma/img_0_5f0d0e72.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-taza-mama-del-amor-especial-dia-de-la-ma/img_1_024ae929.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-taza-mama-del-amor-especial-dia-de-la-ma/img_2_56fbfb7d.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-taza-mama-del-amor-especial-dia-de-la-ma/img_3_f6b64a2e.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-taza-mama-del-amor-especial-dia-de-la-ma/img_4_3282fb77.webp"
    ],
    "rating": 5,
    "reviewCount": 21,
    "inStock": true,
    "stockCount": 13,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "день-матери",
      "madre",
      "regalos",
      "hogar",
      "mensajes",
      "decoracion",
      "hogar-decoracion",
      "para-ella",
      "dia-de-la-madre",
      "regalos-con-mensaje"
    ],
    "specs": {
      "en": {},
      "es": {}
    },
    "features": {
      "en": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ],
      "es": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ]
    }
  },
  {
    "id": "prod-vela-en-forma-de-calabaza",
    "slug": "vela-en-forma-de-calabaza-7980",
    "title": {
      "es": "Vela en forma de calabaza",
      "en": "Vela en forma de calabaza"
    },
    "shortDescription": {
      "es": "Velas decorativas de calabaza: eleva tu hogar con las decoraciones y velas perfectas para Halloween. disfruta iluminándolos en las acogedoras noches de otoño en...",
      "en": "Velas decorativas de calabaza: eleva tu hogar con las decoraciones y velas perfectas para Halloween. disfruta iluminándolos en las acogedoras noches de otoño en..."
    },
    "description": {
      "es": "Velas decorativas de calabaza: eleva tu hogar con las decoraciones y velas perfectas para Halloween. disfruta iluminándolos en las acogedoras noches de otoño en el sofá.\n\nEstas bellezas te ayudarán a hacer la transición de cualquier espacio del verano al otoño y te brindarán la decoración otoñal más hermosa. Están perfumados con Pumpkin Spice, la fragancia otoñal perfecta que evoca pensamientos de Halloween y noches acogedoras en el sofá. Pumpkin Spice combina a la perfección una mezcla cremosa y picante de nuez moscada y nuez moscada. jengibre, calabaza y amp; base de caramelo y suero de leche dulce para crear una sensación de calidez y confort. 🎃 ☕️ 🍂 \n\nNotas altas: jengibre, nuez moscadaNotas medias: calabaza, carameloNotas base: vainilla, suero de leche\n\nAncho: 7.5 centímetros\n\nAltura: 4.5 centímetros",
      "en": "Velas decorativas de calabaza: eleva tu hogar con las decoraciones y velas perfectas para Halloween. disfruta iluminándolos en las acogedoras noches de otoño en el sofá.\n\nEstas bellezas te ayudarán a hacer la transición de cualquier espacio del verano al otoño y te brindarán la decoración otoñal más hermosa. Están perfumados con Pumpkin Spice, la fragancia otoñal perfecta que evoca pensamientos de Halloween y noches acogedoras en el sofá. Pumpkin Spice combina a la perfección una mezcla cremosa y picante de nuez moscada y nuez moscada. jengibre, calabaza y amp; base de caramelo y suero de leche dulce para crear una sensación de calidez y confort. 🎃 ☕️ 🍂 \n\nNotas altas: jengibre, nuez moscadaNotas medias: calabaza, carameloNotas base: vainilla, suero de leche\n\nAncho: 7.5 centímetros\n\nAltura: 4.5 centímetros"
    },
    "price": 4.65,
    "currency": "EUR",
    "category": "lifestyle",
    "brand": "Interlude Candles",
    "sku": "PCO",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-vela-en-forma-de-calabaza/img_0_a084f5fe.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-vela-en-forma-de-calabaza/img_0_a084f5fe.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-vela-en-forma-de-calabaza/img_1_c129cae7.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-vela-en-forma-de-calabaza/img_2_52c2a38d.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-vela-en-forma-de-calabaza/img_3_2cdf3ff1.webp"
    ],
    "rating": 5,
    "reviewCount": 19,
    "inStock": true,
    "stockCount": 25,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "хеллоуин",
      "fiestas",
      "disfraces",
      "hogar",
      "halloween",
      "otono",
      "decoracion",
      "hogar-decoracion"
    ],
    "specs": {
      "en": {},
      "es": {}
    },
    "features": {
      "en": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ],
      "es": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ]
    }
  },
  {
    "id": "prod-paquete-de-pegatinas-comida-asiatica-7-p",
    "slug": "paquete-de-pegatinas-comida-asiatica-7-pegatinas-7349",
    "title": {
      "es": "Paquete de pegatinas - Comida asiática - 7 pegatinas",
      "en": "Paquete de pegatinas - Comida asiática - 7 pegatinas"
    },
    "shortDescription": {
      "es": "Un set de 7 pegatinas de cocina asiática\n\nCada pegatina está disponible en versión holográfica brillante o con acabado brillante, perfectas para personalizar tu...",
      "en": "Un set de 7 pegatinas de cocina asiática\n\nCada pegatina está disponible en versión holográfica brillante o con acabado brillante, perfectas para personalizar tu..."
    },
    "description": {
      "es": "Un set de 7 pegatinas de cocina asiática\n\nCada pegatina está disponible en versión holográfica brillante o con acabado brillante, perfectas para personalizar tu ordenador, portátil, móvil o proyectos de manualidades con un toque delicioso y kawaii 🍜✨\n\nEste pack incluye: té de burbujas, matcha, ramen, pastel de pescado (taiyaki), salsa de soja, arroz para sushi y algas 🧋🍣\n\n100% Hecho en Francia\n\n- Todos los diseños e ilustraciones son creaciones originales y exclusivas de Atelier Naholi.Cualquier reproducción o utilización, incluso parcial, está estrictamente prohibida.",
      "en": "Un set de 7 pegatinas de cocina asiática\n\nCada pegatina está disponible en versión holográfica brillante o con acabado brillante, perfectas para personalizar tu ordenador, portátil, móvil o proyectos de manualidades con un toque delicioso y kawaii 🍜✨\n\nEste pack incluye: té de burbujas, matcha, ramen, pastel de pescado (taiyaki), salsa de soja, arroz para sushi y algas 🧋🍣\n\n100% Hecho en Francia\n\n- Todos los diseños e ilustraciones son creaciones originales y exclusivas de Atelier Naholi.Cualquier reproducción o utilización, incluso parcial, está estrictamente prohibida."
    },
    "price": 8,
    "currency": "EUR",
    "category": "lifestyle",
    "brand": "Atelier Naholi",
    "sku": "pack-asian-food",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-paquete-de-pegatinas-comida-asiatica-7-p/img_0_59024c1f.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-paquete-de-pegatinas-comida-asiatica-7-p/img_0_59024c1f.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-paquete-de-pegatinas-comida-asiatica-7-p/img_1_29f4b96a.webp"
    ],
    "rating": 5,
    "reviewCount": 58,
    "inStock": true,
    "stockCount": 23,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "juegos",
      "для-детей",
      "kidult",
      "игрушки",
      "juguetes",
      "hogar",
      "infantil",
      "decoracion",
      "ninos",
      "hogar-decoracion"
    ],
    "specs": {
      "en": {},
      "es": {}
    },
    "features": {
      "en": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ],
      "es": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ]
    }
  },
  {
    "id": "prod-agenda-diaria-en-bloque-30-paginas-hippi",
    "slug": "agenda-diaria-en-bloque-30-paginas-hippie-halloween-7156",
    "title": {
      "es": "Agenda diaria en bloque 30 páginas Hippie Halloween",
      "en": "Agenda diaria en bloque 30 páginas Hippie Halloween"
    },
    "shortDescription": {
      "es": "Sumérgete en un día de productividad, organización y motivación con el bloque planificador diario “Dopamine Boost”. Diseñado especialmente para mentes ambiciosa...",
      "en": "Sumérgete en un día de productividad, organización y motivación con el bloque planificador diario “Dopamine Boost”. Diseñado especialmente para mentes ambiciosa..."
    },
    "description": {
      "es": "Sumérgete en un día de productividad, organización y motivación con el bloque planificador diario “Dopamine Boost”. Diseñado especialmente para mentes ambiciosas y conscientes del bienestar, este bloc de 30 páginas es la herramienta perfecta para planificar y lograr sus objetivos diarios. Cada cuaderno está diseñado, impreso, cortado y encuadernado a mano en mi pequeño taller de Corrèze.\r\n\r\nCaracterísticas unicas:\r\n\r\n1. Insertar lista de tareas pendientes: comience cada día enumerando las tareas que necesita realizar. Una lista clara de tareas pendientes le permite visualizar sus objetivos y abordarlos metódicamente.\r\n\r\n2. Cuadro de las 3 Prioridades: Identifique las tres tareas más importantes de su día. Las investigaciones muestran que centrarse en unas pocas prioridades aumenta la eficiencia y reduce el estrés. [Fuente: “Priorizar las tareas más importantes” - Harvard Business Review]\r\n\r\n3. Inserto de recompensa: aquí es donde se vuelve realmente interesante. Una vez que hayas completado tus tres prioridades, date una recompensa. No sólo es una forma divertida de motivarse, sino que también libera una dosis de dopamina, la sustancia química cerebral asociada con la recompensa y el placer. [Fuente: “El papel de la dopamina en la recompensa y el placer” - Nature Neuroscience]\r\n\r\n4. Insertar notas: tome notas, escriba ideas o aclare pensamientos perdidos. Este espacio versátil le permite capturar todos sus pensamientos importantes del día.\r\n\r\n5. Apoyo para personas con TDAH (trastorno por déficit de atención con o sin hiperactividad): al utilizar mi bloque planificador, las personas con TDAH pueden estructurar mejor su día, establecer prioridades y controlar su progreso. Esto no sólo puede mejorar su eficiencia, sino también aumentar su autoestima al ver sus logros diarios. Es una herramienta diseñada para ayudar a todos a lograr sus objetivos, independientemente de cómo esté conectado su cerebro.\r\n\r\n6. Beneficios para personas con TEA (Trastorno del Espectro Autista): Estructuración y rutina para reducir la ansiedad - Apoyo visual con patrones calmantes - Ayuda en la gestión de tareas - Ayuda en la Comunicación y Autonomía.\r\n\r\n¿Por qué “aumento de dopamina”?\r\n\r\nLa noción de recompensa y dopamina está en el centro del concepto de este planificador. Al ofrecerse una recompensa una vez cumplidas las prioridades, se crea un círculo virtuoso de motivación y satisfacción. Es una estrategia de motivación respaldada por la ciencia que puede ayudarle a mantener el rumbo y alcanzar sus objetivos más fácilmente.\r\n\r\nConsejos de uso :\r\n\r\n    Comience cada día completando el inserto de la Lista de tareas pendientes.\r\n    Identifica tus 3 prioridades del día.\r\n    Determina tu recompensa: un trozo de tarta, mira un episodio de tu serie favorita, cómprate un buen café, pide una pizza esta noche\r\n    Trabaje en estas prioridades hasta que se cumplan.\r\n    Una vez completado, recompénsate\r\n    Utilice el inserto de Notas para tomar notas o anotar ideas importantes.\r\n\r\n\r\nCaracterísticas técnicas :\r\n\r\n    Formato: A5 (148 x 210 mm)\r\n    Número de páginas: 30 páginas por 1 mes de organización\r\n    Papel: 90 g/m² Ecoetiqueta FSC\r\n    Encuadernación: Espiral metálica\n\nFormato A5 - 30 páginas - Papel con etiqueta ecológica FSC de 90 g/m²",
      "en": "Sumérgete en un día de productividad, organización y motivación con el bloque planificador diario “Dopamine Boost”. Diseñado especialmente para mentes ambiciosas y conscientes del bienestar, este bloc de 30 páginas es la herramienta perfecta para planificar y lograr sus objetivos diarios. Cada cuaderno está diseñado, impreso, cortado y encuadernado a mano en mi pequeño taller de Corrèze.\r\n\r\nCaracterísticas unicas:\r\n\r\n1. Insertar lista de tareas pendientes: comience cada día enumerando las tareas que necesita realizar. Una lista clara de tareas pendientes le permite visualizar sus objetivos y abordarlos metódicamente.\r\n\r\n2. Cuadro de las 3 Prioridades: Identifique las tres tareas más importantes de su día. Las investigaciones muestran que centrarse en unas pocas prioridades aumenta la eficiencia y reduce el estrés. [Fuente: “Priorizar las tareas más importantes” - Harvard Business Review]\r\n\r\n3. Inserto de recompensa: aquí es donde se vuelve realmente interesante. Una vez que hayas completado tus tres prioridades, date una recompensa. No sólo es una forma divertida de motivarse, sino que también libera una dosis de dopamina, la sustancia química cerebral asociada con la recompensa y el placer. [Fuente: “El papel de la dopamina en la recompensa y el placer” - Nature Neuroscience]\r\n\r\n4. Insertar notas: tome notas, escriba ideas o aclare pensamientos perdidos. Este espacio versátil le permite capturar todos sus pensamientos importantes del día.\r\n\r\n5. Apoyo para personas con TDAH (trastorno por déficit de atención con o sin hiperactividad): al utilizar mi bloque planificador, las personas con TDAH pueden estructurar mejor su día, establecer prioridades y controlar su progreso. Esto no sólo puede mejorar su eficiencia, sino también aumentar su autoestima al ver sus logros diarios. Es una herramienta diseñada para ayudar a todos a lograr sus objetivos, independientemente de cómo esté conectado su cerebro.\r\n\r\n6. Beneficios para personas con TEA (Trastorno del Espectro Autista): Estructuración y rutina para reducir la ansiedad - Apoyo visual con patrones calmantes - Ayuda en la gestión de tareas - Ayuda en la Comunicación y Autonomía.\r\n\r\n¿Por qué “aumento de dopamina”?\r\n\r\nLa noción de recompensa y dopamina está en el centro del concepto de este planificador. Al ofrecerse una recompensa una vez cumplidas las prioridades, se crea un círculo virtuoso de motivación y satisfacción. Es una estrategia de motivación respaldada por la ciencia que puede ayudarle a mantener el rumbo y alcanzar sus objetivos más fácilmente.\r\n\r\nConsejos de uso :\r\n\r\n    Comience cada día completando el inserto de la Lista de tareas pendientes.\r\n    Identifica tus 3 prioridades del día.\r\n    Determina tu recompensa: un trozo de tarta, mira un episodio de tu serie favorita, cómprate un buen café, pide una pizza esta noche\r\n    Trabaje en estas prioridades hasta que se cumplan.\r\n    Una vez completado, recompénsate\r\n    Utilice el inserto de Notas para tomar notas o anotar ideas importantes.\r\n\r\n\r\nCaracterísticas técnicas :\r\n\r\n    Formato: A5 (148 x 210 mm)\r\n    Número de páginas: 30 páginas por 1 mes de organización\r\n    Papel: 90 g/m² Ecoetiqueta FSC\r\n    Encuadernación: Espiral metálica\n\nFormato A5 - 30 páginas - Papel con etiqueta ecológica FSC de 90 g/m²"
    },
    "price": 12.9,
    "currency": "EUR",
    "category": "workspace",
    "brand": "ColorFall Editions",
    "sku": "BP3005",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-agenda-diaria-en-bloque-30-paginas-hippi/img_0_8949e620.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-agenda-diaria-en-bloque-30-paginas-hippi/img_0_8949e620.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-agenda-diaria-en-bloque-30-paginas-hippi/img_1_93b291ee.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-agenda-diaria-en-bloque-30-paginas-hippi/img_2_36bd7ac8.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-agenda-diaria-en-bloque-30-paginas-hippi/img_3_5200527e.webp"
    ],
    "rating": 4.9,
    "reviewCount": 77,
    "inStock": true,
    "stockCount": 14,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "papeleria",
      "хеллоуин",
      "fiestas",
      "disfraces",
      "halloween",
      "otono",
      "papeleria-creatividad"
    ],
    "specs": {
      "en": {
        "Peso neto": "0,22",
        "Composición": "30 páginas, papel con etiqueta ecológica de 90 g/m², encuadernación metálica"
      },
      "es": {
        "Peso neto": "0,22",
        "Composición": "30 páginas, papel con etiqueta ecológica de 90 g/m², encuadernación metálica"
      }
    },
    "features": {
      "en": [
        "30 páginas, papel con etiqueta ecológica de 90 g/m², encuadernación metálica"
      ],
      "es": [
        "30 páginas, papel con etiqueta ecológica de 90 g/m², encuadernación metálica"
      ]
    }
  },
  {
    "id": "prod-softlings-veggie-softlings-para-jugar-y-",
    "slug": "softlings-veggie-softlings-para-jugar-y-coleccionar-munecos-de-peluche-grandes-0606",
    "title": {
      "es": "Softlings, Veggie, Softlings para jugar y coleccionar / muñecos de peluche grandes",
      "en": "Softlings, Veggie, Softlings para jugar y coleccionar / muñecos de peluche grandes"
    },
    "shortDescription": {
      "es": "SF030 – Softlings, Vegetal, 16 cm\n- Peluches ultrasuaves para jugar y coleccionar.\n- Edición: Vegetal\n- Tamaño aproximado. 16cm\n- 6 diferentes en el expositor: ...",
      "en": "SF030 – Softlings, Vegetal, 16 cm\n- Peluches ultrasuaves para jugar y coleccionar.\n- Edición: Vegetal\n- Tamaño aproximado. 16cm\n- 6 diferentes en el expositor: ..."
    },
    "description": {
      "es": "SF030 – Softlings, Vegetal, 16 cm\n- Peluches ultrasuaves para jugar y coleccionar.\n- Edición: Vegetal\n- Tamaño aproximado. 16cm\n- 6 diferentes en el expositor: brócoli, zanahoria, judías, tomate, berenjena, champiñones.\n- PU: 12 piezas. (=1 pantalla)\n\nTambién puede enviar un correo electrónico (hello@toytrends.com) orden.\n\n \n\nLos “Softlings Veggie” miden aprox. Figuras de peluche de 16 cm disponibles en seis variantes diferentes: brócoli, zanahoria, judía, tomate, berenjena y champiñones. Cada softling es ultra suave y tierno, ideal para abrazar y jugar.        \n    \nEstos muñecos de peluche cuidadosamente diseñados llevan la diversión a un nuevo nivel y estimulan la imaginación de los niños. Ya sea como juego de rol en la cocina de juegos o como simpática decoración en la habitación de los niños, ¡los Softlings siempre son un éxito!        \n    \nReflejos:\n- Ultra suave y acogedor\n- Seis variaciones diferentes: brócoli, zanahoria, frijoles, tomate, berenjena y champiñones.\n- Tamaño aproximado. 16cm\n\n¿Estás buscando el juguete moderno perfecto para tu gama?        \n    \n¡Entonces los Softlings son la elección ideal! Haga su pedido hoy y ofrezca a sus clientes las últimas tendencias en juguetes del mercado.        \n    \nPara más información y pedidos por favor contáctenos. ¡Esperamos con interés trabajar con usted!",
      "en": "SF030 – Softlings, Vegetal, 16 cm\n- Peluches ultrasuaves para jugar y coleccionar.\n- Edición: Vegetal\n- Tamaño aproximado. 16cm\n- 6 diferentes en el expositor: brócoli, zanahoria, judías, tomate, berenjena, champiñones.\n- PU: 12 piezas. (=1 pantalla)\n\nTambién puede enviar un correo electrónico (hello@toytrends.com) orden.\n\n \n\nLos “Softlings Veggie” miden aprox. Figuras de peluche de 16 cm disponibles en seis variantes diferentes: brócoli, zanahoria, judía, tomate, berenjena y champiñones. Cada softling es ultra suave y tierno, ideal para abrazar y jugar.        \n    \nEstos muñecos de peluche cuidadosamente diseñados llevan la diversión a un nuevo nivel y estimulan la imaginación de los niños. Ya sea como juego de rol en la cocina de juegos o como simpática decoración en la habitación de los niños, ¡los Softlings siempre son un éxito!        \n    \nReflejos:\n- Ultra suave y acogedor\n- Seis variaciones diferentes: brócoli, zanahoria, frijoles, tomate, berenjena y champiñones.\n- Tamaño aproximado. 16cm\n\n¿Estás buscando el juguete moderno perfecto para tu gama?        \n    \n¡Entonces los Softlings son la elección ideal! Haga su pedido hoy y ofrezca a sus clientes las últimas tendencias en juguetes del mercado.        \n    \nPara más información y pedidos por favor contáctenos. ¡Esperamos con interés trabajar con usted!"
    },
    "price": 8.99,
    "currency": "EUR",
    "category": "lifestyle",
    "brand": "OBILO | we trade trends.",
    "sku": "SF030",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-softlings-veggie-softlings-para-jugar-y-/img_0_a59e0058.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-softlings-veggie-softlings-para-jugar-y-/img_0_a59e0058.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-softlings-veggie-softlings-para-jugar-y-/img_1_a944d0e1.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-softlings-veggie-softlings-para-jugar-y-/img_2_0b8babcb.webp"
    ],
    "rating": 4.9,
    "reviewCount": 79,
    "inStock": true,
    "stockCount": 21,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "decoracion",
      "ninos",
      "hogar-decoracion",
      "juegos",
      "ninos-juegos",
      "для-детей",
      "juguetes",
      "игрушки",
      "kidult",
      "hogar",
      "infantil"
    ],
    "specs": {
      "en": {},
      "es": {}
    },
    "features": {
      "en": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ],
      "es": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ]
    }
  },
  {
    "id": "prod-cojin-de-murcielago-de-halloween-oro-vie",
    "slug": "cojin-de-murcielago-de-halloween-oro-viejo-para-decoracion-del-hogar-cojin-beige-de-murcielago-para-habitacion-infantil-decoracion-de-halloween-cojin-de-murcielago-con-lentejuelas-regalo-para-nina-5303",
    "title": {
      "es": "Cojín de murciélago de Halloween \"oro viejo\" para decoración del hogar, cojín beige de murciélago para habitación infantil, decoración de Halloween, cojín de murciélago con lentejuelas, regalo para niña.",
      "en": "Cojín de murciélago de Halloween \"oro viejo\" para decoración del hogar, cojín beige de murciélago para habitación infantil, decoración de Halloween, cojín de murciélago con lentejuelas, regalo para niña."
    },
    "shortDescription": {
      "es": "Almohada de murciélago de Halloween: nuestro murciélago en el papel protagonista. La almohada Murciélago de Moi Mili es una decoración original, perfecta tanto ...",
      "en": "Almohada de murciélago de Halloween: nuestro murciélago en el papel protagonista. La almohada Murciélago de Moi Mili es una decoración original, perfecta tanto ..."
    },
    "description": {
      "es": "Almohada de murciélago de Halloween: nuestro murciélago en el papel protagonista. La almohada Murciélago de Moi Mili es una decoración original, perfecta tanto para Halloween como para el uso diario. Fabricada con materiales de alta calidad, como terciopelo o lentejuelas, esta almohada única hará las delicias de cualquiera que aprecie los diseños únicos. Su forma que recuerda a las alas de un murciélago, combinada con colores elegantes, lo convierte no solo en un elemento de diseño temático, sino también en una hermosa adición al interior. Los productos de Moi Mili son siempre una buena elección, ya sea como regalo para un ser querido o para ti mismo. Almohada de murciélago de Halloween: decoración perfecta. La almohada de murciélago Moi Mili encaja perfectamente en el clima de Halloween, añadiendo un carácter único al interior. Su original forma de murciélago y la posibilidad de elegir entre terciopelo y lentejuelas permiten combinarlo con cualquier estilo de interior. Estas almohadas decorativas de alta calidad no solo son hermosas decoraciones, sino también un accesorio funcional que se puede utilizar con éxito durante todo el año. Características y ventajas de la almohada de murciélago de Halloween: 1. Mano de obra de alta calidad: la almohada Bat de Moi Mili está cosida con atención a cada detalle, lo que garantiza su durabilidad y apariencia única. 2. Diseño único: el patrón de murciélago del autor hace que la almohada se destaque de otras decoraciones, agregando carácter al interior. 3. Versatilidad: gracias a la combinación de elegante terciopelo negro y lentejuelas brillantes, la almohada Murciélago es perfecta tanto para arreglos de Halloween como de otoño. Cómo la almohada de murciélago enriquece la decoración de Halloween. La almohada de murciélago de Moi Mili es la manera perfecta de agregar un toque atmosférico a tu interior para Halloween. Su diseño distintivo y su calidad excepcional lo convierten en una combinación perfecta con otras decoraciones de temporada. Puedes combinarlo con otras almohadas de la colección de Halloween y la colección de otoño para crear un arreglo mágico y cohesivo. Almohada relajante con motivo de murciélago La almohada de murciélago no solo es una decoración llamativa, sino también un cómodo complemento para su relajación diaria. Fabricado en material suave y aterciopelado, garantiza comodidad y calidez durante el descanso. Su forma y su relleno de alta calidad lo hacen perfecto para apoyar la espalda o la cabeza durante la relajación nocturna. ¿Por qué elegir la almohada de murciélago de Halloween? Las almohadas de Moi Mili son únicas gracias a los diseños del autor y a la atención a los materiales de alta calidad. La almohada de murciélago no solo aporta un ambiente único a la habitación o al salón de tu hijo, sino que también es un elemento de diseño práctico. Es una elección ideal tanto como regalo para un ser querido como para usted mismo: elegante, funcional y siempre a la moda. Moi Mili ofrece: almohadas con Flying Bat Las almohadas de Moi Mili, incluido el modelo Bat, son la quintaesencia de la originalidad y el estilo. Cada uno de ellos fue diseñado para aquellos que buscan decoraciones únicas para Moi Mili Oferta: Almohadas con Murciélago Volador Las almohadas de Moi Mili, incluido el modelo Murciélago, son la quintaesencia de la originalidad y el estilo. Cada uno de ellos fue diseñado para quienes buscan decoraciones únicas para su hogar. La colección también incluye otras almohadas que combinan perfectamente con el modelo Bat, creando un interior cohesivo y armonioso. Combínalos con otros artículos de la colección de otoño para crear un ambiente único en tu hogar. ¿Cómo elegir la almohada de murciélago perfecta para Halloween? A la hora de elegir una almohada Bat de Moi Mili, preste atención a la calidad del material y al estilo que mejor se adapte a su interior. La versión de terciopelo es adecuada para decoraciones más sutiles, mientras que las lentejuelas brillantes aportarán un toque de glamour. Cada uno es una excelente opción para la temporada de Halloween y como complemento para arreglos elegantes durante todo el año. Consejos y recomendaciones para compradores 1. Combina con tu interior: las almohadas decorativas Moi Mili, incluido el modelo Bat, combinan bien con arreglos modernos y clásicos. 2. Combinación con otras decoraciones: combina el cojín Murciélago con otros cojines y guirnaldas de la colección de otoño de Moi Mili para crear un ambiente cálido y cohesivo en la estancia. 3. Para cualquier ocasión: la almohada de murciélago de alta calidad también es una gran idea de regalo que seguramente deleitará al destinatario. Personalización de Almohadas de Halloween Características de la almohada murciélago Halloween: Tejido: 100% poliéster y relleno de lentejuelas bola de silicona antialérgica Tamaño: 72.0cmx35.0 cm Moi Mili ofrece la posibilidad de personalización de las almohadas, lo que las hace aún más especiales. La almohada de murciélago se puede personalizar agregando una inscripción o el nombre de su elección, lo que la convierte en el regalo de Halloween perfecto, o se puede coser en un color diferente con una tela diferente.",
      "en": "Almohada de murciélago de Halloween: nuestro murciélago en el papel protagonista. La almohada Murciélago de Moi Mili es una decoración original, perfecta tanto para Halloween como para el uso diario. Fabricada con materiales de alta calidad, como terciopelo o lentejuelas, esta almohada única hará las delicias de cualquiera que aprecie los diseños únicos. Su forma que recuerda a las alas de un murciélago, combinada con colores elegantes, lo convierte no solo en un elemento de diseño temático, sino también en una hermosa adición al interior. Los productos de Moi Mili son siempre una buena elección, ya sea como regalo para un ser querido o para ti mismo. Almohada de murciélago de Halloween: decoración perfecta. La almohada de murciélago Moi Mili encaja perfectamente en el clima de Halloween, añadiendo un carácter único al interior. Su original forma de murciélago y la posibilidad de elegir entre terciopelo y lentejuelas permiten combinarlo con cualquier estilo de interior. Estas almohadas decorativas de alta calidad no solo son hermosas decoraciones, sino también un accesorio funcional que se puede utilizar con éxito durante todo el año. Características y ventajas de la almohada de murciélago de Halloween: 1. Mano de obra de alta calidad: la almohada Bat de Moi Mili está cosida con atención a cada detalle, lo que garantiza su durabilidad y apariencia única. 2. Diseño único: el patrón de murciélago del autor hace que la almohada se destaque de otras decoraciones, agregando carácter al interior. 3. Versatilidad: gracias a la combinación de elegante terciopelo negro y lentejuelas brillantes, la almohada Murciélago es perfecta tanto para arreglos de Halloween como de otoño. Cómo la almohada de murciélago enriquece la decoración de Halloween. La almohada de murciélago de Moi Mili es la manera perfecta de agregar un toque atmosférico a tu interior para Halloween. Su diseño distintivo y su calidad excepcional lo convierten en una combinación perfecta con otras decoraciones de temporada. Puedes combinarlo con otras almohadas de la colección de Halloween y la colección de otoño para crear un arreglo mágico y cohesivo. Almohada relajante con motivo de murciélago La almohada de murciélago no solo es una decoración llamativa, sino también un cómodo complemento para su relajación diaria. Fabricado en material suave y aterciopelado, garantiza comodidad y calidez durante el descanso. Su forma y su relleno de alta calidad lo hacen perfecto para apoyar la espalda o la cabeza durante la relajación nocturna. ¿Por qué elegir la almohada de murciélago de Halloween? Las almohadas de Moi Mili son únicas gracias a los diseños del autor y a la atención a los materiales de alta calidad. La almohada de murciélago no solo aporta un ambiente único a la habitación o al salón de tu hijo, sino que también es un elemento de diseño práctico. Es una elección ideal tanto como regalo para un ser querido como para usted mismo: elegante, funcional y siempre a la moda. Moi Mili ofrece: almohadas con Flying Bat Las almohadas de Moi Mili, incluido el modelo Bat, son la quintaesencia de la originalidad y el estilo. Cada uno de ellos fue diseñado para aquellos que buscan decoraciones únicas para Moi Mili Oferta: Almohadas con Murciélago Volador Las almohadas de Moi Mili, incluido el modelo Murciélago, son la quintaesencia de la originalidad y el estilo. Cada uno de ellos fue diseñado para quienes buscan decoraciones únicas para su hogar. La colección también incluye otras almohadas que combinan perfectamente con el modelo Bat, creando un interior cohesivo y armonioso. Combínalos con otros artículos de la colección de otoño para crear un ambiente único en tu hogar. ¿Cómo elegir la almohada de murciélago perfecta para Halloween? A la hora de elegir una almohada Bat de Moi Mili, preste atención a la calidad del material y al estilo que mejor se adapte a su interior. La versión de terciopelo es adecuada para decoraciones más sutiles, mientras que las lentejuelas brillantes aportarán un toque de glamour. Cada uno es una excelente opción para la temporada de Halloween y como complemento para arreglos elegantes durante todo el año. Consejos y recomendaciones para compradores 1. Combina con tu interior: las almohadas decorativas Moi Mili, incluido el modelo Bat, combinan bien con arreglos modernos y clásicos. 2. Combinación con otras decoraciones: combina el cojín Murciélago con otros cojines y guirnaldas de la colección de otoño de Moi Mili para crear un ambiente cálido y cohesivo en la estancia. 3. Para cualquier ocasión: la almohada de murciélago de alta calidad también es una gran idea de regalo que seguramente deleitará al destinatario. Personalización de Almohadas de Halloween Características de la almohada murciélago Halloween: Tejido: 100% poliéster y relleno de lentejuelas bola de silicona antialérgica Tamaño: 72.0cmx35.0 cm Moi Mili ofrece la posibilidad de personalización de las almohadas, lo que las hace aún más especiales. La almohada de murciélago se puede personalizar agregando una inscripción o el nombre de su elección, lo que la convierte en el regalo de Halloween perfecto, o se puede coser en un color diferente con una tela diferente."
    },
    "price": 52.4,
    "currency": "EUR",
    "category": "lifestyle",
    "brand": "Moi Mili",
    "sku": "5906508787960",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-cojin-de-murcielago-de-halloween-oro-vie/img_0_fddeaee7.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-cojin-de-murcielago-de-halloween-oro-vie/img_0_fddeaee7.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-cojin-de-murcielago-de-halloween-oro-vie/img_1_7f3b94e2.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-cojin-de-murcielago-de-halloween-oro-vie/img_2_d189f9a7.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-cojin-de-murcielago-de-halloween-oro-vie/img_3_65139f40.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-cojin-de-murcielago-de-halloween-oro-vie/img_4_f9cef3da.webp"
    ],
    "rating": 4.9,
    "reviewCount": 53,
    "inStock": true,
    "stockCount": 17,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "ninos-juegos",
      "fiestas",
      "хеллоуин",
      "disfraces",
      "juguetes",
      "hogar",
      "halloween",
      "otono",
      "infantil",
      "decoracion",
      "hogar-decoracion"
    ],
    "specs": {
      "en": {},
      "es": {}
    },
    "features": {
      "en": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ],
      "es": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ]
    }
  },
  {
    "id": "prod-maceta-maceta-mama-dia-de-la-madre-regal",
    "slug": "maceta-maceta-mama-dia-de-la-madre-regalo-original-para-mama-amante-de-las-flores-y-las-plantas-0471",
    "title": {
      "es": "Maceta, maceta \"Mamá ♥\", Día de la Madre, regalo original para mamá, amante de las flores y las plantas.",
      "en": "Maceta, maceta \"Mamá ♥\", Día de la Madre, regalo original para mamá, amante de las flores y las plantas."
    },
    "shortDescription": {
      "es": "La maceta \"Mamá ♥\" es la idea perfecta para un regalo personalizado para el Día de la Madre, un cumpleaños o incluso para Navidad. Esta maceta de terracota pint...",
      "en": "La maceta \"Mamá ♥\" es la idea perfecta para un regalo personalizado para el Día de la Madre, un cumpleaños o incluso para Navidad. Esta maceta de terracota pint..."
    },
    "description": {
      "es": "La maceta \"Mamá ♥\" es la idea perfecta para un regalo personalizado para el Día de la Madre, un cumpleaños o incluso para Navidad. Esta maceta de terracota pintada a mano es un toque delicado y único que hará sonreír a todas las madres. \n\nCon su diseño elegante y colores suaves, esta maceta es ideal para plantas pequeñas o suculentas, aportando un toque decorativo a cualquier interior. Se adapta fácilmente a boutiques de decoración, tiendas conceptuales y floristerías que buscan regalos decorativos originales y significativos para celebrar a las madres durante todo el año.\n\nCaracterísticas :\n\n- Material: maceta de terracota, pintada a mano.\n- Pintura acrílica\n- Acabado: barniz marino para una protección duradera\n\nInstrucciones de uso:\n\n1. Maceta óptima: para preservar la calidad de la pintura y la longevidad del producto, se recomienda utilizar esta maceta como jardinera. Inserta una maceta de plástico dentro del Joli Pot y riega la planta de forma independiente.\n- Guía de tallas: una maceta de plástico de 9 cm se puede insertar fácilmente en una Joli Pot de 13 cm (coge un mínimo de 2 cm de diámetro debajo).\n\n2. Trasplante directo: también es posible trasplantar directamente en la maceta, pero tenga cuidado de no dejar que se acumule agua en la taza para evitar dañar la pintura con el tiempo.\n\nEntrevista :\n\nAunque está barnizado para ofrecer una protección óptima, se recomienda no dejar que se acumule agua en la olla o plato para conservar la pintura y evitar cualquier deterioro.\n\nDimensiones:\n\n- Maceta de 8 cm, 11 cm, 13 cm de diámetro\n- Alturas respectivas: 7 cm, 10 cm, 12 cm\n- plato de 5 cm para la olla de 8 cm\n- plato de 9 cm para la olla de 11 cm\n- plato de 11 cm para la olla de 13 cm\n\n¿Por qué a usted y a sus clientes les encantará este producto?\n\n- Preciosa maceta hecha a mano, elaborada con cariño en mi pequeño taller de las Cevenas.\n- 100% original, 100% única\n- Una fuente de emoción\n- Ética y eco-responsable\n\nOpción de caja de presentación: Disponible para tamaños de 8 cm y 11 cm (+0,75 € sin IVA / +1,00 € sin IVA).\nPerfecto para tiendas conceptuales donde el envase se exhibe sin embalaje en el estante: mejor visibilidad, mejor manejo, narrativa del producto.\n\nFloristas: si venden la maceta con el arreglo/planta, la opción de la caja no es esencial; solo pueden llevar unas pocas para exhibiciones específicas.\n\nPalabras clave: maceta para el Día de la Madre, regalo decorativo para mamá, maceta personalizada para mamá, regalo de cumpleaños para mamá, idea de regalo decorativo para mamá, maceta personalizada para el Día de la Madre, regalo de Navidad para mamá, maceta decorativa para mamá, regalo decorativo para mamá, maceta de terracota para mamá, maceta de regalo para mamá, maceta personalizada para el Día de la Madre, regalo original para mamá, maceta decorativa para el Día de la Madre, maceta original para decoración del hogar",
      "en": "La maceta \"Mamá ♥\" es la idea perfecta para un regalo personalizado para el Día de la Madre, un cumpleaños o incluso para Navidad. Esta maceta de terracota pintada a mano es un toque delicado y único que hará sonreír a todas las madres. \n\nCon su diseño elegante y colores suaves, esta maceta es ideal para plantas pequeñas o suculentas, aportando un toque decorativo a cualquier interior. Se adapta fácilmente a boutiques de decoración, tiendas conceptuales y floristerías que buscan regalos decorativos originales y significativos para celebrar a las madres durante todo el año.\n\nCaracterísticas :\n\n- Material: maceta de terracota, pintada a mano.\n- Pintura acrílica\n- Acabado: barniz marino para una protección duradera\n\nInstrucciones de uso:\n\n1. Maceta óptima: para preservar la calidad de la pintura y la longevidad del producto, se recomienda utilizar esta maceta como jardinera. Inserta una maceta de plástico dentro del Joli Pot y riega la planta de forma independiente.\n- Guía de tallas: una maceta de plástico de 9 cm se puede insertar fácilmente en una Joli Pot de 13 cm (coge un mínimo de 2 cm de diámetro debajo).\n\n2. Trasplante directo: también es posible trasplantar directamente en la maceta, pero tenga cuidado de no dejar que se acumule agua en la taza para evitar dañar la pintura con el tiempo.\n\nEntrevista :\n\nAunque está barnizado para ofrecer una protección óptima, se recomienda no dejar que se acumule agua en la olla o plato para conservar la pintura y evitar cualquier deterioro.\n\nDimensiones:\n\n- Maceta de 8 cm, 11 cm, 13 cm de diámetro\n- Alturas respectivas: 7 cm, 10 cm, 12 cm\n- plato de 5 cm para la olla de 8 cm\n- plato de 9 cm para la olla de 11 cm\n- plato de 11 cm para la olla de 13 cm\n\n¿Por qué a usted y a sus clientes les encantará este producto?\n\n- Preciosa maceta hecha a mano, elaborada con cariño en mi pequeño taller de las Cevenas.\n- 100% original, 100% única\n- Una fuente de emoción\n- Ética y eco-responsable\n\nOpción de caja de presentación: Disponible para tamaños de 8 cm y 11 cm (+0,75 € sin IVA / +1,00 € sin IVA).\nPerfecto para tiendas conceptuales donde el envase se exhibe sin embalaje en el estante: mejor visibilidad, mejor manejo, narrativa del producto.\n\nFloristas: si venden la maceta con el arreglo/planta, la opción de la caja no es esencial; solo pueden llevar unas pocas para exhibiciones específicas.\n\nPalabras clave: maceta para el Día de la Madre, regalo decorativo para mamá, maceta personalizada para mamá, regalo de cumpleaños para mamá, idea de regalo decorativo para mamá, maceta personalizada para el Día de la Madre, regalo de Navidad para mamá, maceta decorativa para mamá, regalo decorativo para mamá, maceta de terracota para mamá, maceta de regalo para mamá, maceta personalizada para el Día de la Madre, regalo original para mamá, maceta decorativa para el Día de la Madre, maceta original para decoración del hogar"
    },
    "price": 17,
    "currency": "EUR",
    "category": "lifestyle",
    "brand": "Joli Pot",
    "sku": "maman-8-calli-sans",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-maceta-maceta-mama-dia-de-la-madre-regal/img_0_0f6bb755.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-maceta-maceta-mama-dia-de-la-madre-regal/img_0_0f6bb755.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-maceta-maceta-mama-dia-de-la-madre-regal/img_1_0508e22b.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-maceta-maceta-mama-dia-de-la-madre-regal/img_2_28d504fe.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-maceta-maceta-mama-dia-de-la-madre-regal/img_3_553a73b0.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-maceta-maceta-mama-dia-de-la-madre-regal/img_4_8103f8ea.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-maceta-maceta-mama-dia-de-la-madre-regal/img_5_d6be43c6.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-maceta-maceta-mama-dia-de-la-madre-regal/img_6_d655ef1f.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-maceta-maceta-mama-dia-de-la-madre-regal/img_7_12df512c.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-maceta-maceta-mama-dia-de-la-madre-regal/img_8_0d62d469.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-maceta-maceta-mama-dia-de-la-madre-regal/img_9_ebb76a16.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-maceta-maceta-mama-dia-de-la-madre-regal/img_10_35159b9f.webp"
    ],
    "rating": 4.9,
    "reviewCount": 27,
    "inStock": true,
    "stockCount": 34,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "день-матери",
      "madre",
      "regalos",
      "hogar",
      "mensajes",
      "decoracion",
      "hogar-decoracion",
      "para-ella",
      "dia-de-la-madre",
      "regalos-con-mensaje"
    ],
    "specs": {
      "en": {},
      "es": {}
    },
    "features": {
      "en": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ],
      "es": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ]
    }
  },
  {
    "id": "prod-5056131172739",
    "slug": "antifaz-para-dormir-de-terciopelo-sweet-dreams-7354",
    "title": {
      "es": "Antifaz para dormir de terciopelo Sweet Dreams",
      "en": "Antifaz para dormir de terciopelo Sweet Dreams"
    },
    "shortDescription": {
      "es": "Déjate llevar por un estilo de ensueño con esta lujosa máscara de dormir roja que presenta el texto \"Dulces sueños\" rodeado de diseños mágicos de corazones y lu...",
      "en": "Déjate llevar por un estilo de ensueño con esta lujosa máscara de dormir roja que presenta el texto \"Dulces sueños\" rodeado de diseños mágicos de corazones y lu..."
    },
    "description": {
      "es": "Déjate llevar por un estilo de ensueño con esta lujosa máscara de dormir roja que presenta el texto \"Dulces sueños\" rodeado de diseños mágicos de corazones y lunas. Un regalo considerado para noches de descanso y momentos de relax. Diseñado por Something Different Wholesale y parte de la colección Sacred Heart de regalos de San Valentín y decoración del hogar con temática de corazón.",
      "en": "Déjate llevar por un estilo de ensueño con esta lujosa máscara de dormir roja que presenta el texto \"Dulces sueños\" rodeado de diseños mágicos de corazones y lunas. Un regalo considerado para noches de descanso y momentos de relax. Diseñado por Something Different Wholesale y parte de la colección Sacred Heart de regalos de San Valentín y decoración del hogar con temática de corazón."
    },
    "price": 3.11,
    "currency": "EUR",
    "category": "lifestyle",
    "brand": "Something Different Wholesale",
    "sku": "SA_71926",
    "ean": "5056131172739",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-5056131172739/img_0_001d40fc.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-5056131172739/img_0_001d40fc.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-5056131172739/img_1_5459729f.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-5056131172739/img_2_a6ea0792.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-5056131172739/img_3_884889af.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-5056131172739/img_4_7794f35e.webp"
    ],
    "rating": 4.9,
    "reviewCount": 24,
    "inStock": true,
    "stockCount": 19,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "san-valentin",
      "regalos",
      "день-святого-валентина",
      "hogar",
      "mujer",
      "amor",
      "decoracion",
      "hogar-decoracion",
      "para-ella"
    ],
    "specs": {
      "en": {
        "Capacidad": "35g",
        "Peso neto": "35g",
        "Dimensiones": "Alto 10 cm x Ancho 20 cm x Profundidad 2 cm"
      },
      "es": {
        "Capacidad": "35g",
        "Peso neto": "35g",
        "Dimensiones": "Alto 10 cm x Ancho 20 cm x Profundidad 2 cm"
      }
    },
    "features": {
      "en": [
        "Alto 10 cm x Ancho 20 cm x Profundidad 2 cm"
      ],
      "es": [
        "Alto 10 cm x Ancho 20 cm x Profundidad 2 cm"
      ]
    }
  },
  {
    "id": "prod-3760301390459",
    "slug": "tablero-magnetico-castillo-decoracion-magnetica-de-pared-para-ninos-no-requiere-taladro-y-es-modular-educativo-y-creativo-8526",
    "title": {
      "es": "Tablero magnético - Castillo - Decoración magnética de pared para niños, no requiere taladro y es modular - Educativo y creativo",
      "en": "Tablero magnético - Castillo - Decoración magnética de pared para niños, no requiere taladro y es modular - Educativo y creativo"
    },
    "shortDescription": {
      "es": "¡Entra en el reino del juego y la creatividad con este tablero magnético con forma de castillo! Los niños se convierten en los arquitectos y caballeros de su pr...",
      "en": "¡Entra en el reino del juego y la creatividad con este tablero magnético con forma de castillo! Los niños se convierten en los arquitectos y caballeros de su pr..."
    },
    "description": {
      "es": "¡Entra en el reino del juego y la creatividad con este tablero magnético con forma de castillo! Los niños se convierten en los arquitectos y caballeros de su propio universo: pueden utilizar dibujos, fotos y todos nuestros juegos recreativos para construir su reino imaginario.\n\nEL KIT DE PIZARRA MAGNÉTICA CASTILLO FERFLEX® INCLUYE:\n- 1 pizarra magnética reposicionable con forma de castillo, 60x80 cm - 0,6 mm de grosor.\n- 1 juego de formas magnéticas de colores.\n\nCARACTERÍSTICAS TÉCNICAS:\n- Pizarra reposicionable\n- Material flexible\n- Acabado mate\n- Compatible con todo tipo de imanes\n- Fácil instalación sin taladrar: la pizarra se coloca mediante un sistema autoadhesivo\n- Edad recomendada: a partir de 3 años\n- Normas: Cumple con la norma EN71 - Certificación REACH\n- Fabricado en Francia: en el suroeste de Francia, en Artix (64)\n\nVENTAJAS EN TIENDA\n• Aporta un toque decorativo original\n• Estimula la imaginación y el juego simbólico\n• Listo para usar: incluye imanes\n• Regalo original, sostenible y fabricado en Francia\n• Compatible con todas nuestras colecciones de accesorios y juegos magnéticos\n\nINSTRUCCIONES DE USO:\nMuy fácil de pegar, gracias a su adhesivo reposicionable, la pizarra magnética Ferflex® se puede colocar en cualquier superficie perfectamente lisa: paredes, puertas, ventanas, armarios de cocina, puertas de armarios, tablas de madera, etc.\nTenga en cuenta que es mejor colocar la pintura sobre un cuadro que tenga más de 4 meses de antigüedad. \nPara quitarlo, retire con cuidado el tablero desde la parte superior y tire suavemente hacia abajo. Para poder reutilizarlo posteriormente es importante conservar la película protectora del adhesivo para pegar tu tabla en otra superficie o guardarla.",
      "en": "¡Entra en el reino del juego y la creatividad con este tablero magnético con forma de castillo! Los niños se convierten en los arquitectos y caballeros de su propio universo: pueden utilizar dibujos, fotos y todos nuestros juegos recreativos para construir su reino imaginario.\n\nEL KIT DE PIZARRA MAGNÉTICA CASTILLO FERFLEX® INCLUYE:\n- 1 pizarra magnética reposicionable con forma de castillo, 60x80 cm - 0,6 mm de grosor.\n- 1 juego de formas magnéticas de colores.\n\nCARACTERÍSTICAS TÉCNICAS:\n- Pizarra reposicionable\n- Material flexible\n- Acabado mate\n- Compatible con todo tipo de imanes\n- Fácil instalación sin taladrar: la pizarra se coloca mediante un sistema autoadhesivo\n- Edad recomendada: a partir de 3 años\n- Normas: Cumple con la norma EN71 - Certificación REACH\n- Fabricado en Francia: en el suroeste de Francia, en Artix (64)\n\nVENTAJAS EN TIENDA\n• Aporta un toque decorativo original\n• Estimula la imaginación y el juego simbólico\n• Listo para usar: incluye imanes\n• Regalo original, sostenible y fabricado en Francia\n• Compatible con todas nuestras colecciones de accesorios y juegos magnéticos\n\nINSTRUCCIONES DE USO:\nMuy fácil de pegar, gracias a su adhesivo reposicionable, la pizarra magnética Ferflex® se puede colocar en cualquier superficie perfectamente lisa: paredes, puertas, ventanas, armarios de cocina, puertas de armarios, tablas de madera, etc.\nTenga en cuenta que es mejor colocar la pintura sobre un cuadro que tenga más de 4 meses de antigüedad. \nPara quitarlo, retire con cuidado el tablero desde la parte superior y tire suavemente hacia abajo. Para poder reutilizarlo posteriormente es importante conservar la película protectora del adhesivo para pegar tu tabla en otra superficie o guardarla."
    },
    "price": 54,
    "currency": "EUR",
    "category": "lifestyle",
    "brand": "FERFLEX",
    "sku": "TAB_CHATEAU",
    "ean": "3760301390459",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-3760301390459/img_0_528deca8.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-3760301390459/img_0_528deca8.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-3760301390459/img_1_e83c52d3.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-3760301390459/img_2_b16216af.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-3760301390459/img_3_34cd5de2.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-3760301390459/img_4_15dded20.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-3760301390459/img_5_f4302c75.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-3760301390459/img_6_030efdbd.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-3760301390459/img_7_43aef397.webp"
    ],
    "rating": 4.9,
    "reviewCount": 75,
    "inStock": true,
    "stockCount": 20,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "decoracion",
      "hogar-decoracion",
      "vuelta-al-cole",
      "papeleria",
      "ninos-juegos",
      "escuela",
      "школа",
      "colegio",
      "juguetes",
      "hogar",
      "infantil"
    ],
    "specs": {
      "en": {
        "Peso neto": "1.4",
        "Dimensiones": "Los 60cmx80cm"
      },
      "es": {
        "Peso neto": "1.4",
        "Dimensiones": "Los 60cmx80cm"
      }
    },
    "features": {
      "en": [
        "Los 60cmx80cm"
      ],
      "es": [
        "Los 60cmx80cm"
      ]
    }
  },
  {
    "id": "prod-3700876816985",
    "slug": "horario-semanal-visiones-mirage-2282",
    "title": {
      "es": "Horario semanal - VISIONES - Mirage",
      "en": "Horario semanal - VISIONES - Mirage"
    },
    "shortDescription": {
      "es": "¡La agenda semanal perfecta!\nPlanifica tu semana de un vistazo con 52 páginas sin fecha, franjas horarias desde las 7 de la mañana hasta las 11 de la noche y un...",
      "en": "¡La agenda semanal perfecta!\nPlanifica tu semana de un vistazo con 52 páginas sin fecha, franjas horarias desde las 7 de la mañana hasta las 11 de la noche y un..."
    },
    "description": {
      "es": "¡La agenda semanal perfecta!\nPlanifica tu semana de un vistazo con 52 páginas sin fecha, franjas horarias desde las 7 de la mañana hasta las 11 de la noche y una visión general de 12 meses para organizar tu año con total tranquilidad.\n\n- Formato: Agenda semanal\n- Páginas: 52 páginas sin fecha\n- Organización: Franjas horarias de 7:00 a 23:00\n\n- Resumen: Calendario de 12 meses\n- Uso: Planificación semanal y anual\n\nMateriales: Papel y cartón reciclados\nOrigen: Fabricado en París en nuestro taller",
      "en": "¡La agenda semanal perfecta!\nPlanifica tu semana de un vistazo con 52 páginas sin fecha, franjas horarias desde las 7 de la mañana hasta las 11 de la noche y una visión general de 12 meses para organizar tu año con total tranquilidad.\n\n- Formato: Agenda semanal\n- Páginas: 52 páginas sin fecha\n- Organización: Franjas horarias de 7:00 a 23:00\n\n- Resumen: Calendario de 12 meses\n- Uso: Planificación semanal y anual\n\nMateriales: Papel y cartón reciclados\nOrigen: Fabricado en París en nuestro taller"
    },
    "price": 14,
    "currency": "EUR",
    "category": "workspace",
    "brand": "Papier Tigre",
    "sku": "PH-012-TI",
    "ean": "3700876816985",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-3700876816985/img_0_209b89b3.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-3700876816985/img_0_209b89b3.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-3700876816985/img_1_09b9fefa.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-3700876816985/img_2_4a133fa7.webp"
    ],
    "rating": 4.9,
    "reviewCount": 70,
    "inStock": true,
    "stockCount": 14,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "papeleria",
      "escuela",
      "colegio",
      "школа",
      "papeleria-creatividad",
      "vuelta-al-cole"
    ],
    "specs": {
      "en": {},
      "es": {}
    },
    "features": {
      "en": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ],
      "es": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ]
    }
  },
  {
    "id": "prod-5060343424777",
    "slug": "maceta-colgante-con-forma-de-bola-de-discoteca-de-6-pulgadas-0904",
    "title": {
      "es": "Maceta colgante con forma de bola de discoteca de 6 pulgadas",
      "en": "Maceta colgante con forma de bola de discoteca de 6 pulgadas"
    },
    "shortDescription": {
      "es": "La maceta colgante Disco Ball es la maceta perfecta para cualquier jardinero interior amante de la música disco. La bola de purpurina atrapa la luz y la imagina...",
      "en": "La maceta colgante Disco Ball es la maceta perfecta para cualquier jardinero interior amante de la música disco. La bola de purpurina atrapa la luz y la imagina..."
    },
    "description": {
      "es": "La maceta colgante Disco Ball es la maceta perfecta para cualquier jardinero interior amante de la música disco. La bola de purpurina atrapa la luz y la imaginación de cualquier gato moderno al que le encanta bailar mientras cuida su jardín de horticultura. No hay mejor maceta para un disco in-fern-o... o cualquier otra planta a la que le gusten los grandes espacios interiores.",
      "en": "La maceta colgante Disco Ball es la maceta perfecta para cualquier jardinero interior amante de la música disco. La bola de purpurina atrapa la luz y la imaginación de cualquier gato moderno al que le encanta bailar mientras cuida su jardín de horticultura. No hay mejor maceta para un disco in-fern-o... o cualquier otra planta a la que le gusten los grandes espacios interiores."
    },
    "price": 24.99,
    "currency": "EUR",
    "category": "lifestyle",
    "brand": "Bubblegum Stuff",
    "sku": "22118",
    "ean": "5060343424777",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-5060343424777/img_0_cb120929.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-5060343424777/img_0_cb120929.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-5060343424777/img_1_226bae42.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-5060343424777/img_2_7e41f538.webp"
    ],
    "rating": 4.9,
    "reviewCount": 7,
    "inStock": true,
    "stockCount": 24,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "hogar",
      "пасха",
      "pascua",
      "decoracion",
      "primavera",
      "hogar-decoracion"
    ],
    "specs": {
      "en": {
        "Dimensiones": "17x17x15,5 cm"
      },
      "es": {
        "Dimensiones": "17x17x15,5 cm"
      }
    },
    "features": {
      "en": [
        "17x17x15,5 cm"
      ],
      "es": [
        "17x17x15,5 cm"
      ]
    }
  },
  {
    "id": "prod-libreta-pecatsus-en-una-nube",
    "slug": "libreta-pecatsus-en-una-nube-3426",
    "title": {
      "es": "Libreta pecatsus \"en una nube\"",
      "en": "Libreta pecatsus \"en una nube\""
    },
    "shortDescription": {
      "es": "\"En una nube\". Te encuentras así de vez en cuando ¿a que sí? Escribe todo lo que sientes en esos momentos... desahógate, piensa, reflexiona, respira, experiment...",
      "en": "\"En una nube\". Te encuentras así de vez en cuando ¿a que sí? Escribe todo lo que sientes en esos momentos... desahógate, piensa, reflexiona, respira, experiment..."
    },
    "description": {
      "es": "\"En una nube\". Te encuentras así de vez en cuando ¿a que sí? Escribe todo lo que sientes en esos momentos... desahógate, piensa, reflexiona, respira, experimenta. Deja reflejado todo aquello que tengas dentro de ti. Esta bonita libreta guardará todas tus notas más preciadas. Por su tamaño es ideal para llevar siempre encima y tiene un interior con rayas finas para poder escribir o dibujar todo lo que quieras. \n\nLibreta gruesa de la colección Pecatsus.\n\n· Contiene 200 páginas pautadas de 90g (total 100 hojas).\n· Cubiertas de tapa dura con plastificado brillante. \n· Con goma elástica blanca de 10mm de grosor.\n· Tamaño: 16,5 x 21 cm\n· Encuadernación en espiral wire-o blanco de gran resistencia.\n· Peso: 400g\n\nDiseñado y fabricado con mucho amor y detalle en Barcelona.",
      "en": "\"En una nube\". Te encuentras así de vez en cuando ¿a que sí? Escribe todo lo que sientes en esos momentos... desahógate, piensa, reflexiona, respira, experimenta. Deja reflejado todo aquello que tengas dentro de ti. Esta bonita libreta guardará todas tus notas más preciadas. Por su tamaño es ideal para llevar siempre encima y tiene un interior con rayas finas para poder escribir o dibujar todo lo que quieras. \n\nLibreta gruesa de la colección Pecatsus.\n\n· Contiene 200 páginas pautadas de 90g (total 100 hojas).\n· Cubiertas de tapa dura con plastificado brillante. \n· Con goma elástica blanca de 10mm de grosor.\n· Tamaño: 16,5 x 21 cm\n· Encuadernación en espiral wire-o blanco de gran resistencia.\n· Peso: 400g\n\nDiseñado y fabricado con mucho amor y detalle en Barcelona."
    },
    "price": 14.95,
    "currency": "EUR",
    "category": "workspace",
    "brand": "Follow The Cat",
    "sku": "L5PC001",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-libreta-pecatsus-en-una-nube/img_0_0c578889.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-libreta-pecatsus-en-una-nube/img_0_0c578889.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-libreta-pecatsus-en-una-nube/img_1_485e45f1.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-libreta-pecatsus-en-una-nube/img_2_0eabdbee.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-libreta-pecatsus-en-una-nube/img_3_5cd6fccf.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-libreta-pecatsus-en-una-nube/img_4_d8ad9496.webp"
    ],
    "rating": 4.9,
    "reviewCount": 20,
    "inStock": true,
    "stockCount": 26,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "papeleria",
      "escuela",
      "colegio",
      "школа",
      "papeleria-creatividad",
      "vuelta-al-cole"
    ],
    "specs": {
      "en": {
        "Capacidad": "1 Libreta",
        "Peso neto": "400g",
        "Dimensiones": "16,5 x 21 cm"
      },
      "es": {
        "Capacidad": "1 Libreta",
        "Peso neto": "400g",
        "Dimensiones": "16,5 x 21 cm"
      }
    },
    "features": {
      "en": [
        "16,5 x 21 cm",
        "1 Libreta"
      ],
      "es": [
        "16,5 x 21 cm",
        "1 Libreta"
      ]
    }
  },
  {
    "id": "prod-caja-snack-rosa-ma-pause-gourmande",
    "slug": "caja-snack-rosa-ma-pause-gourmande-4639",
    "title": {
      "es": "Caja Snack Rosa - Ma Pause Gourmande",
      "en": "Caja Snack Rosa - Ma Pause Gourmande"
    },
    "shortDescription": {
      "es": "Lonchera infantil personalizada ♡\n\nPara los niños, el momento en que suena la campana del recreo es un recordatorio de que es hora de sacar un refrigerio.\n\nDesc...",
      "en": "Lonchera infantil personalizada ♡\n\nPara los niños, el momento en que suena la campana del recreo es un recordatorio de que es hora de sacar un refrigerio.\n\nDesc..."
    },
    "description": {
      "es": "Lonchera infantil personalizada ♡\n\nPara los niños, el momento en que suena la campana del recreo es un recordatorio de que es hora de sacar un refrigerio.\n\nDescubre nuestra snack box o lunch box rosa para llevar para niños. Hay varios diseños de delicias.\n\nEs la lonchera perfecta para tu hijo, podrá llevarse su merienda a todas partes.\n\nLos colores vibrantes brindan un pequeño momento de felicidad y el refrigerio se mantiene particularmente fresco en esta caja.\n\nTamaño de la caja: 18 cm de largo, 6,5 cm de alto y 12,5 cm de ancho.\n\nMaterial: plástico duradero\nSe recomienda lavar a mano.",
      "en": "Lonchera infantil personalizada ♡\n\nPara los niños, el momento en que suena la campana del recreo es un recordatorio de que es hora de sacar un refrigerio.\n\nDescubre nuestra snack box o lunch box rosa para llevar para niños. Hay varios diseños de delicias.\n\nEs la lonchera perfecta para tu hijo, podrá llevarse su merienda a todas partes.\n\nLos colores vibrantes brindan un pequeño momento de felicidad y el refrigerio se mantiene particularmente fresco en esta caja.\n\nTamaño de la caja: 18 cm de largo, 6,5 cm de alto y 12,5 cm de ancho.\n\nMaterial: plástico duradero\nSe recomienda lavar a mano."
    },
    "price": 21.5,
    "currency": "EUR",
    "category": "lifestyle",
    "brand": "Ourson Câlin",
    "sku": "OC-ANK-0274",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-caja-snack-rosa-ma-pause-gourmande/img_0_4be9d19d.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-caja-snack-rosa-ma-pause-gourmande/img_0_4be9d19d.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-caja-snack-rosa-ma-pause-gourmande/img_1_f75aa2d2.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-caja-snack-rosa-ma-pause-gourmande/img_2_94033f7d.webp"
    ],
    "rating": 4.9,
    "reviewCount": 20,
    "inStock": true,
    "stockCount": 12,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "vuelta-al-cole",
      "papeleria",
      "ninos-juegos",
      "escuela",
      "juguetes",
      "colegio",
      "школа",
      "infantil"
    ],
    "specs": {
      "en": {
        "Materiales": "Plástico duradero",
        "Dimensiones": "18 cm de largo y 6,5 cm de alto y 12,5 cm de ancho",
        "Lista de ingredientes": "Garantizado para uso alimentario según reglamento EG No. 1935/2004 y UE n. 10/201"
      },
      "es": {
        "Materiales": "Plástico duradero",
        "Dimensiones": "18 cm de largo y 6,5 cm de alto y 12,5 cm de ancho",
        "Lista de ingredientes": "Garantizado para uso alimentario según reglamento EG No. 1935/2004 y UE n. 10/201"
      }
    },
    "features": {
      "en": [
        "18 cm de largo y 6,5 cm de alto y 12,5 cm de ancho",
        "Garantizado para uso alimentario según reglamento EG No. 1935/2004 y UE n. 10/201",
        "Plástico duradero"
      ],
      "es": [
        "18 cm de largo y 6,5 cm de alto y 12,5 cm de ancho",
        "Garantizado para uso alimentario según reglamento EG No. 1935/2004 y UE n. 10/201",
        "Plástico duradero"
      ]
    }
  },
  {
    "id": "prod-agenda-diaria-sin-fecha-de-ginger",
    "slug": "agenda-diaria-sin-fecha-de-ginger-1640",
    "title": {
      "es": "Agenda diaria sin fecha de Ginger",
      "en": "Agenda diaria sin fecha de Ginger"
    },
    "shortDescription": {
      "es": "Este encantador libro de agenda de tamaño A5 (14,8 x 21 cm) está hecho por una familia\nejecute el creador de libros de música aquí mismo en el Reino Unido, y la...",
      "en": "Este encantador libro de agenda de tamaño A5 (14,8 x 21 cm) está hecho por una familia\nejecute el creador de libros de música aquí mismo en el Reino Unido, y la..."
    },
    "description": {
      "es": "Este encantador libro de agenda de tamaño A5 (14,8 x 21 cm) está hecho por una familia\nejecute el creador de libros de música aquí mismo en el Reino Unido, y las hojas interiores son\nhecho de papel de la hoja de música. La tapa blanda es una lujosa textura\n250gsm G.F. Smith card y tiene 320 páginas, hechas de una hermosa textura\nPapel Munken de 90 g/m². Tiene un día por página para los días de la semana, y una página\ndividido por la mitad para el fin de semana - hay 52 semanas en total y viene\ncon un marcapáginas a juego. El libro en sí tiene una encuadernación especial que\nsignifica que quedará plano sobre la mesa (perfecto para zurdos)\nque luchan por usar el inicio de los cuadernos!) y viene empaquetado en una\ncaja de cartón, diseñada a medida en conjunto con G.F. Herrero.",
      "en": "Este encantador libro de agenda de tamaño A5 (14,8 x 21 cm) está hecho por una familia\nejecute el creador de libros de música aquí mismo en el Reino Unido, y las hojas interiores son\nhecho de papel de la hoja de música. La tapa blanda es una lujosa textura\n250gsm G.F. Smith card y tiene 320 páginas, hechas de una hermosa textura\nPapel Munken de 90 g/m². Tiene un día por página para los días de la semana, y una página\ndividido por la mitad para el fin de semana - hay 52 semanas en total y viene\ncon un marcapáginas a juego. El libro en sí tiene una encuadernación especial que\nsignifica que quedará plano sobre la mesa (perfecto para zurdos)\nque luchan por usar el inicio de los cuadernos!) y viene empaquetado en una\ncaja de cartón, diseñada a medida en conjunto con G.F. Herrero."
    },
    "price": 38,
    "currency": "EUR",
    "category": "workspace",
    "brand": "The Completist EU",
    "sku": "DP033",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-agenda-diaria-sin-fecha-de-ginger/img_0_efa3ee90.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-agenda-diaria-sin-fecha-de-ginger/img_0_efa3ee90.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-agenda-diaria-sin-fecha-de-ginger/img_1_52eafb05.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-agenda-diaria-sin-fecha-de-ginger/img_2_968aac64.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-agenda-diaria-sin-fecha-de-ginger/img_3_419cf3d0.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-agenda-diaria-sin-fecha-de-ginger/img_4_ba736d08.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-agenda-diaria-sin-fecha-de-ginger/img_5_5ad194e8.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-agenda-diaria-sin-fecha-de-ginger/img_6_d3ecf7b5.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-agenda-diaria-sin-fecha-de-ginger/img_7_1f3b64e6.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-agenda-diaria-sin-fecha-de-ginger/img_8_cba85fd4.webp"
    ],
    "rating": 4.9,
    "reviewCount": 70,
    "inStock": true,
    "stockCount": 13,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "papeleria",
      "escuela",
      "colegio",
      "школа",
      "papeleria-creatividad",
      "vuelta-al-cole"
    ],
    "specs": {
      "en": {
        "Dimensiones": "14,8 X 21 CM"
      },
      "es": {
        "Dimensiones": "14,8 X 21 CM"
      }
    },
    "features": {
      "en": [
        "14,8 X 21 CM"
      ],
      "es": [
        "14,8 X 21 CM"
      ]
    }
  },
  {
    "id": "prod-pack-de-inicio-30-kits-de-ocio-creativo-",
    "slug": "pack-de-inicio-30-kits-de-ocio-creativo-kawaii-decoden-6496",
    "title": {
      "es": "🌈PACK DE INICIO: 30 KITS DE OCIO CREATIVO KAWAII - DECODEN",
      "en": "🌈PACK DE INICIO: 30 KITS DE OCIO CREATIVO KAWAII - DECODEN"
    },
    "shortDescription": {
      "es": "🌈 SET DE 30 KITS CREATIVOS KAWAII que incluye:\n\n🌸 3 kits sin base\n🌸 3 kits de marcos de fotos\n🌸 5 kits de llaveros de motel\n🌸 5 kits de llaveros redondos\n�...",
      "en": "🌈 SET DE 30 KITS CREATIVOS KAWAII que incluye:\n\n🌸 3 kits sin base\n🌸 3 kits de marcos de fotos\n🌸 5 kits de llaveros de motel\n🌸 5 kits de llaveros redondos\n�..."
    },
    "description": {
      "es": "🌈 SET DE 30 KITS CREATIVOS KAWAII que incluye:\n\n🌸 3 kits sin base\n🌸 3 kits de marcos de fotos\n🌸 5 kits de llaveros de motel\n🌸 5 kits de llaveros redondos\n🌸 3 kits de espejos\n🌸 3 kits de insignias\n🌸 4 kits de pinzas para el pelo\n🌸 4 kits de bolsitas\n\nUn pequeño surtido para que puedas probar el arte del Decoden en tu tienda.\n\nPrecio del pack: 459 €\n\n----------------------------------------------------------------------------------\n🌈🌸 Decoden 🧁\n\nEl Decoden es una técnica de decoración japonesa 💖\nUsa el pegamento con efecto crema batida 🍦 para crear decoraciones únicas con dijes, confeti y pedrería ✨\n\n🪄 Instrucciones:\n1️⃣ Aplica el pegamento con efecto crema a la base con la ayuda del aplicador.\n2️⃣ Coloca tus decoraciones 🙂\n3️⃣ Deja secar al menos 24 horas ⏰ sin tocar.\n\n¡Después del secado, la creación es sólida, duradera y muy linda!🐼",
      "en": "🌈 SET DE 30 KITS CREATIVOS KAWAII que incluye:\n\n🌸 3 kits sin base\n🌸 3 kits de marcos de fotos\n🌸 5 kits de llaveros de motel\n🌸 5 kits de llaveros redondos\n🌸 3 kits de espejos\n🌸 3 kits de insignias\n🌸 4 kits de pinzas para el pelo\n🌸 4 kits de bolsitas\n\nUn pequeño surtido para que puedas probar el arte del Decoden en tu tienda.\n\nPrecio del pack: 459 €\n\n----------------------------------------------------------------------------------\n🌈🌸 Decoden 🧁\n\nEl Decoden es una técnica de decoración japonesa 💖\nUsa el pegamento con efecto crema batida 🍦 para crear decoraciones únicas con dijes, confeti y pedrería ✨\n\n🪄 Instrucciones:\n1️⃣ Aplica el pegamento con efecto crema a la base con la ayuda del aplicador.\n2️⃣ Coloca tus decoraciones 🙂\n3️⃣ Deja secar al menos 24 horas ⏰ sin tocar.\n\n¡Después del secado, la creación es sólida, duradera y muy linda!🐼"
    },
    "price": 459,
    "currency": "EUR",
    "category": "lifestyle",
    "brand": "MAISON AYAKA",
    "sku": "LOT DE 22 KITS BEST SELLERS KAWAII",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-pack-de-inicio-30-kits-de-ocio-creativo-/img_0_ab0b2cfd.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-pack-de-inicio-30-kits-de-ocio-creativo-/img_0_ab0b2cfd.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-pack-de-inicio-30-kits-de-ocio-creativo-/img_1_27aa39fb.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-pack-de-inicio-30-kits-de-ocio-creativo-/img_2_ad7dd0e6.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-pack-de-inicio-30-kits-de-ocio-creativo-/img_3_2ef743d5.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-pack-de-inicio-30-kits-de-ocio-creativo-/img_4_d994b1c8.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-pack-de-inicio-30-kits-de-ocio-creativo-/img_5_6dcb338b.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-pack-de-inicio-30-kits-de-ocio-creativo-/img_6_3d9716ca.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-pack-de-inicio-30-kits-de-ocio-creativo-/img_7_161d0322.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-pack-de-inicio-30-kits-de-ocio-creativo-/img_8_c7e5aca1.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-pack-de-inicio-30-kits-de-ocio-creativo-/img_9_5d7c52da.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-pack-de-inicio-30-kits-de-ocio-creativo-/img_10_f463f000.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-pack-de-inicio-30-kits-de-ocio-creativo-/img_11_728a71fe.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-pack-de-inicio-30-kits-de-ocio-creativo-/img_12_d1d52ebb.webp"
    ],
    "rating": 4.9,
    "reviewCount": 21,
    "inStock": true,
    "stockCount": 27,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "ninos-juegos",
      "juegos",
      "для-детей",
      "kidult",
      "игрушки",
      "juguetes",
      "infantil",
      "ninos"
    ],
    "specs": {
      "en": {},
      "es": {}
    },
    "features": {
      "en": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ],
      "es": [
        "Producto certificado europeo",
        "Calidad premium garantizada"
      ]
    }
  },
  {
    "id": "prod-estuche-para-lapices-de-plastico-recicla",
    "slug": "estuche-para-lapices-de-plastico-reciclado-zipit-para-ninas-diseno-de-gato-rosa-7746",
    "title": {
      "es": "Estuche para lápices de plástico reciclado ZIPIT para niñas, diseño de gato rosa",
      "en": "Estuche para lápices de plástico reciclado ZIPIT para niñas, diseño de gato rosa"
    },
    "shortDescription": {
      "es": "Las cajas creativas ZIPIT combinan un encanto divertido con un diseño práctico, lo que las convierte en una opción destacada para los elementos esenciales para ...",
      "en": "Las cajas creativas ZIPIT combinan un encanto divertido con un diseño práctico, lo que las convierte en una opción destacada para los elementos esenciales para ..."
    },
    "description": {
      "es": "Las cajas creativas ZIPIT combinan un encanto divertido con un diseño práctico, lo que las convierte en una opción destacada para los elementos esenciales para la vuelta al cole. Este robusto y espacioso estuche de plástico presenta un diseño transparente para una fácil visibilidad de su contenido, mientras que el carácter vibrante e incrustado en la tapa garantiza un atractivo duradero sin pelarse. Ofrece amplio espacio de almacenamiento para útiles escolares y una etiqueta de nombre dedicada proporciona un toque personal. Fabricada con un 40 % de plástico reciclado, sin PVC y 100 % reciclable, esta caja apoya un futuro sustentable al tiempo que mantiene organizados los elementos esenciales de su hijo.\n\n💡INSPIRE LAS MENTES JÓVENES: este exclusivo estuche de plástico reciclado está diseñado para estimular la imaginación y brindar alegría al aprendizaje diario. El diseño divertido está incrustado en la tapa y siempre se destacará, sin despegarse nunca.\n✨RESISTENTE Y LIGERA: esta práctica caja de plástico es resistente, liviana y espaciosa. Es transparente, tiene una etiqueta de nombre dedicada y es fácilmente apilable 📏 AMPLIO ALMACENAMIENTO - Mide 8.5 x 5.9x2.Este estuche de 4 pulgadas está diseñado para contener hasta 60 bolígrafos y lápices. También es perfecto para guardar otros artículos como borradores, sacapuntas y más.\n🌎OPCIÓN ECOLÓGICA: 40 % reciclado, 100 % libre de PVC y 100 % reciclable, fabricado en EE. UU.S.\n💯GARANTÍA DE POR VIDA: con el compromiso de ZIPIT con la calidad, puede comprar con confianza.Fabricado en plástico resistente, garantiza años de uso práctico.",
      "en": "Las cajas creativas ZIPIT combinan un encanto divertido con un diseño práctico, lo que las convierte en una opción destacada para los elementos esenciales para la vuelta al cole. Este robusto y espacioso estuche de plástico presenta un diseño transparente para una fácil visibilidad de su contenido, mientras que el carácter vibrante e incrustado en la tapa garantiza un atractivo duradero sin pelarse. Ofrece amplio espacio de almacenamiento para útiles escolares y una etiqueta de nombre dedicada proporciona un toque personal. Fabricada con un 40 % de plástico reciclado, sin PVC y 100 % reciclable, esta caja apoya un futuro sustentable al tiempo que mantiene organizados los elementos esenciales de su hijo.\n\n💡INSPIRE LAS MENTES JÓVENES: este exclusivo estuche de plástico reciclado está diseñado para estimular la imaginación y brindar alegría al aprendizaje diario. El diseño divertido está incrustado en la tapa y siempre se destacará, sin despegarse nunca.\n✨RESISTENTE Y LIGERA: esta práctica caja de plástico es resistente, liviana y espaciosa. Es transparente, tiene una etiqueta de nombre dedicada y es fácilmente apilable 📏 AMPLIO ALMACENAMIENTO - Mide 8.5 x 5.9x2.Este estuche de 4 pulgadas está diseñado para contener hasta 60 bolígrafos y lápices. También es perfecto para guardar otros artículos como borradores, sacapuntas y más.\n🌎OPCIÓN ECOLÓGICA: 40 % reciclado, 100 % libre de PVC y 100 % reciclable, fabricado en EE. UU.S.\n💯GARANTÍA DE POR VIDA: con el compromiso de ZIPIT con la calidad, puede comprar con confianza.Fabricado en plástico resistente, garantiza años de uso práctico."
    },
    "price": 5.99,
    "currency": "EUR",
    "category": "workspace",
    "brand": "ZIPIT",
    "sku": "Z24000008",
    "mainImage": "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-estuche-para-lapices-de-plastico-recicla/img_0_d8762656.webp",
    "images": [
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-estuche-para-lapices-de-plastico-recicla/img_0_d8762656.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-estuche-para-lapices-de-plastico-recicla/img_1_1be88fe1.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-estuche-para-lapices-de-plastico-recicla/img_2_27e2fbfd.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-estuche-para-lapices-de-plastico-recicla/img_3_a1814a9c.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-estuche-para-lapices-de-plastico-recicla/img_4_0ddb4b84.webp",
      "https://yzaarsfeztkkzuexhivl.supabase.co/storage/v1/object/public/products/prod-estuche-para-lapices-de-plastico-recicla/img_5_6e622399.webp"
    ],
    "rating": 4.9,
    "reviewCount": 37,
    "inStock": true,
    "stockCount": 25,
    "isBestseller": true,
    "isFeatured": false,
    "isNew": false,
    "tags": [
      "vuelta-al-cole",
      "papeleria",
      "ninos-juegos",
      "escuela",
      "juguetes",
      "colegio",
      "школа",
      "infantil",
      "papeleria-creatividad"
    ],
    "specs": {
      "en": {
        "Peso neto": "0,12",
        "Dimensiones": "21*13,5*7,5 cm"
      },
      "es": {
        "Peso neto": "0,12",
        "Dimensiones": "21*13,5*7,5 cm"
      }
    },
    "features": {
      "en": [
        "21*13,5*7,5 cm"
      ],
      "es": [
        "21*13,5*7,5 cm"
      ]
    }
  }
];

export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "standard",
    title: {
      es: "Envío Estándar (Correos Express / SEUR)",
      en: "Standard Delivery (Correos Express / SEUR)",
    },
    description: {
      es: "Entrega a domicilio en España y la UE",
      en: "Door-to-door delivery across Spain and EU",
    },
    price: 3.99,
    estimatedDays: {
      es: "2-4 días laborables",
      en: "2-4 business days",
    },
  },
  {
    id: "express",
    title: {
      es: "Envío Express 24h (DHL Express / UPS)",
      en: "Express 24h Delivery (DHL Express / UPS)",
    },
    description: {
      es: "Entrega prioritaria urgente con seguimiento en tiempo real",
      en: "Priority urgent delivery with real-time tracking",
    },
    price: 6.99,
    estimatedDays: {
      es: "24-48 horas",
      en: "24-48 hours",
    },
  },
  {
    id: "free",
    title: {
      es: "Envío Gratuito (pedidos > 50€)",
      en: "Free Shipping (orders > €50)",
    },
    description: {
      es: "Envío sin coste a partir de 50€ de compra",
      en: "Free shipping on orders over €50",
    },
    price: 0,
    estimatedDays: {
      es: "3-5 días laborables",
      en: "3-5 business days",
    },
  },
];

export const AVAILABLE_COUPONS: Coupon[] = [
  {
    code: "VERANO10",
    discountPercent: 10,
    minSubtotal: 30,
  },
  {
    code: "BIENVENIDA",
    discountPercent: 15,
    minSubtotal: 25,
  },
  {
    code: "VIASVIP",
    discountPercent: 20,
    minSubtotal: 60,
  },
];

/**
 * Конфигурация категорий товаров для панели фильтрации каталога
 */
export const CATEGORIES_CONFIG: {
  id: ProductCategory;
  label: { es: string; en: string };
  count: number;
}[] = [
  { id: "all", label: { es: "Todos los productos", en: "All Products" }, count: 631 },
  { id: "lifestyle", label: { es: "Hogar y Estilo de Vida", en: "Home & Lifestyle" }, count: 559 },
  { id: "workspace", label: { es: "Papelería y Creatividad", en: "Stationery & Workspace" }, count: 66 },
  { id: "electronics", label: { es: "Tecnología y Gadgets", en: "Tech & Gadgets" }, count: 6 },
];

