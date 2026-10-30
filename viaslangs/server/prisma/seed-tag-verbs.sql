-- Привязка всех испанских глаголов к тегу «Глаголы» для отдельного повторения

-- 1. Создание или обновление тега для испанского языка
INSERT INTO tags (language_id, name)
SELECT l.id, 'Глаголы'
FROM languages l
WHERE l.code = 'es'
ON CONFLICT (language_id, name) DO UPDATE SET name = EXCLUDED.name;

-- 2. Привязка всех 50 глаголов к тегу «Глаголы»
INSERT INTO word_tags (word_id, tag_id)
SELECT w.id, t.id
FROM words w
CROSS JOIN (
  SELECT t.id
  FROM tags t
  JOIN languages l ON l.id = t.language_id
  WHERE t.name = 'Глаголы'
    AND l.code = 'es'
) t
WHERE w.language_id = (SELECT id FROM languages WHERE code = 'es')
  AND lower(w.english) IN (
    'abonar', 'fabricar', 'solucionar', 'rechazar', 'reembolsar',
    'verificar', 'ofrecer', 'decidir', 'informar', 'transferir',
    'resolver', 'hablar', 'pedir', 'solicitar', 'comprobar',
    'reclamar', 'vender', 'asegurar', 'llegar', 'cobrar',
    'producir', 'contactar', 'facturar', 'comprar', 'preparar',
    'entregar', 'personalizar', 'recibir', 'devolver', 'revisar',
    'necesitar', 'adjuntar', 'importar', 'confirmar', 'cumplir',
    'preguntar', 'despachar', 'esperar', 'responder', 'exportar',
    'intentar', 'negociar', 'firmar', 'costar', 'enviar',
    'acordar', 'pagar', 'avisar', 'garantizar', 'aceptar'
  )
ON CONFLICT DO NOTHING;
