INSERT INTO vy_tags (language_id, name)
SELECT l.id, 'Для общения с поставщиками'
FROM vy_languages l
WHERE l.code = 'es'
ON CONFLICT (language_id, name) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO vy_word_tags (word_id, tag_id)
SELECT w.id, t.id
FROM vy_words w
CROSS JOIN (SELECT id FROM vy_tags WHERE name = 'Для общения с поставщиками') t
WHERE w.language_id = (SELECT id FROM vy_languages WHERE code = 'es')
  AND lower(w.english) IN (
    'enviar', 'pedir', 'solicitar', 'necesitar', 'recibir',
    'costar', 'pagar', 'cobrar', 'facturar', 'comprar',
    'vender', 'ofrecer', 'entregar', 'despachar', 'importar',
    'exportar', 'llegar', 'fabricar', 'producir', 'personalizar',
    'confirmar', 'preguntar', 'responder', 'informar', 'avisar',
    'contactar', 'negociar', 'aceptar', 'rechazar', 'acordar',
    'decidir', 'revisar', 'preparar', 'firmar', 'adjuntar',
    'transferir', 'abonar', 'reembolsar', 'devolver', 'reclamar',
    'resolver', 'solucionar', 'verificar', 'comprobar', 'garantizar',
    'cumplir', 'asegurar', 'intentar', 'esperar', 'hablar'
  )
ON CONFLICT DO NOTHING;