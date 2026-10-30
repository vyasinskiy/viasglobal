--
-- PostgreSQL database dump
--

\restrict wER9vJ8ZrsDDYFkB6Te3lrOinBvsvq8VlI6ka1jiLo2kg426iOq6zOhlnhHnstx

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.11 (Debian 17.11-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.vy_words DROP CONSTRAINT IF EXISTS vy_words_language_id_fkey;
ALTER TABLE IF EXISTS ONLY public.vy_words DROP CONSTRAINT IF EXISTS vy_words_base_word_id_fkey;
ALTER TABLE IF EXISTS ONLY public.vy_study_sessions DROP CONSTRAINT IF EXISTS vy_study_sessions_language_id_fkey;
ALTER TABLE IF EXISTS ONLY public.vy_session_activities DROP CONSTRAINT IF EXISTS vy_session_activities_word_id_fkey;
ALTER TABLE IF EXISTS ONLY public.vy_session_activities DROP CONSTRAINT IF EXISTS vy_session_activities_session_id_fkey;
ALTER TABLE IF EXISTS ONLY public.vy_answers DROP CONSTRAINT IF EXISTS vy_answers_word_id_fkey;
ALTER TABLE IF EXISTS ONLY public.vy_word_tags DROP CONSTRAINT IF EXISTS fk_vy_word_tags_word_id;
ALTER TABLE IF EXISTS ONLY public.vy_word_tags DROP CONSTRAINT IF EXISTS fk_vy_word_tags_tag_id;
ALTER TABLE IF EXISTS ONLY public.vy_tags DROP CONSTRAINT IF EXISTS fk_vy_tags_language_id;
DROP INDEX IF EXISTS public.vy_words_language_id_idx;
DROP INDEX IF EXISTS public.vy_answers_word_id_idx;
DROP INDEX IF EXISTS public.idx_vy_words_base_word_id;
DROP INDEX IF EXISTS public.idx_vy_word_tags_tag_id;
DROP INDEX IF EXISTS public.idx_vy_tags_language_id;
DROP INDEX IF EXISTS public.idx_vy_study_sessions_lang;
DROP INDEX IF EXISTS public.idx_vy_study_sessions_date;
DROP INDEX IF EXISTS public.idx_vy_session_activities_word;
DROP INDEX IF EXISTS public.idx_vy_session_activities_type;
DROP INDEX IF EXISTS public.idx_vy_session_activities_session;
ALTER TABLE IF EXISTS ONLY public.vy_words DROP CONSTRAINT IF EXISTS vy_words_pkey;
ALTER TABLE IF EXISTS ONLY public.vy_word_tags DROP CONSTRAINT IF EXISTS vy_word_tags_pkey;
ALTER TABLE IF EXISTS ONLY public.vy_tags DROP CONSTRAINT IF EXISTS vy_tags_pkey;
ALTER TABLE IF EXISTS ONLY public.vy_tags DROP CONSTRAINT IF EXISTS vy_tags_language_id_name_key;
ALTER TABLE IF EXISTS ONLY public.vy_study_sessions DROP CONSTRAINT IF EXISTS vy_study_sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.vy_session_activities DROP CONSTRAINT IF EXISTS vy_session_activities_pkey;
ALTER TABLE IF EXISTS ONLY public.vy_languages DROP CONSTRAINT IF EXISTS vy_languages_pkey;
ALTER TABLE IF EXISTS ONLY public.vy_languages DROP CONSTRAINT IF EXISTS vy_languages_code_key;
ALTER TABLE IF EXISTS ONLY public.vy_answers DROP CONSTRAINT IF EXISTS vy_answers_pkey;
ALTER TABLE IF EXISTS ONLY public.vy_study_sessions DROP CONSTRAINT IF EXISTS uq_vy_study_sessions_lang_date;
ALTER TABLE IF EXISTS public.vy_words ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.vy_tags ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.vy_study_sessions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.vy_session_activities ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.vy_languages ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.vy_answers ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.vy_words_id_seq;
DROP TABLE IF EXISTS public.vy_words;
DROP TABLE IF EXISTS public.vy_word_tags;
DROP SEQUENCE IF EXISTS public.vy_tags_id_seq;
DROP TABLE IF EXISTS public.vy_tags;
DROP SEQUENCE IF EXISTS public.vy_study_sessions_id_seq;
DROP TABLE IF EXISTS public.vy_study_sessions;
DROP SEQUENCE IF EXISTS public.vy_session_activities_id_seq;
DROP TABLE IF EXISTS public.vy_session_activities;
DROP SEQUENCE IF EXISTS public.vy_languages_id_seq;
DROP TABLE IF EXISTS public.vy_languages;
DROP SEQUENCE IF EXISTS public.vy_answers_id_seq;
DROP TABLE IF EXISTS public.vy_answers;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: vy_answers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vy_answers (
    id integer NOT NULL,
    word_id integer NOT NULL,
    answer text NOT NULL,
    is_correct boolean NOT NULL,
    is_synonym boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vy_answers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vy_answers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vy_answers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vy_answers_id_seq OWNED BY public.vy_answers.id;


--
-- Name: vy_languages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vy_languages (
    id integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL
);


--
-- Name: vy_languages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vy_languages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vy_languages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vy_languages_id_seq OWNED BY public.vy_languages.id;


--
-- Name: vy_session_activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vy_session_activities (
    id integer NOT NULL,
    session_id integer NOT NULL,
    word_id integer NOT NULL,
    activity_type character varying(32) NOT NULL,
    user_answer text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vy_session_activities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vy_session_activities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vy_session_activities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vy_session_activities_id_seq OWNED BY public.vy_session_activities.id;


--
-- Name: vy_study_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vy_study_sessions (
    id integer NOT NULL,
    language_id integer NOT NULL,
    session_date date NOT NULL,
    next_clicks integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vy_study_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vy_study_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vy_study_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vy_study_sessions_id_seq OWNED BY public.vy_study_sessions.id;


--
-- Name: vy_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vy_tags (
    id integer NOT NULL,
    language_id integer NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vy_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vy_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vy_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vy_tags_id_seq OWNED BY public.vy_tags.id;


--
-- Name: vy_word_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vy_word_tags (
    word_id integer NOT NULL,
    tag_id integer NOT NULL
);


--
-- Name: vy_words; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vy_words (
    id integer NOT NULL,
    language_id integer NOT NULL,
    english text NOT NULL,
    russian text NOT NULL,
    example_en text NOT NULL,
    example_ru text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    is_favorite boolean DEFAULT false NOT NULL,
    base_word_id integer
);


--
-- Name: vy_words_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vy_words_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: vy_words_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vy_words_id_seq OWNED BY public.vy_words.id;


--
-- Name: vy_answers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_answers ALTER COLUMN id SET DEFAULT nextval('public.vy_answers_id_seq'::regclass);


--
-- Name: vy_languages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_languages ALTER COLUMN id SET DEFAULT nextval('public.vy_languages_id_seq'::regclass);


--
-- Name: vy_session_activities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_session_activities ALTER COLUMN id SET DEFAULT nextval('public.vy_session_activities_id_seq'::regclass);


--
-- Name: vy_study_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_study_sessions ALTER COLUMN id SET DEFAULT nextval('public.vy_study_sessions_id_seq'::regclass);


--
-- Name: vy_tags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_tags ALTER COLUMN id SET DEFAULT nextval('public.vy_tags_id_seq'::regclass);


--
-- Name: vy_words id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_words ALTER COLUMN id SET DEFAULT nextval('public.vy_words_id_seq'::regclass);


--
-- Data for Name: vy_answers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vy_answers (id, word_id, answer, is_correct, is_synonym, created_at) FROM stdin;
382	11	decidir	t	f	2026-10-18 21:50:44.829085+00
1175	300	esperabamos	t	f	2026-10-25 08:22:19.563644+00
3	44	intentar	t	f	2026-10-01 21:00:25.400219+00
4	33	revisar	t	f	2026-10-01 21:37:29.650913+00
1176	294	esperaba	t	f	2026-10-25 08:22:19.563644+00
6	32	devolver	t	f	2026-10-02 21:06:52.785801+00
7	47	costar	t	f	2026-10-02 21:10:32.509448+00
8	14	resolver	t	f	2026-10-02 21:35:31.714561+00
9	46	firmar	t	f	2026-10-02 21:35:43.120038+00
10	36	importar	t	f	2026-10-02 21:36:00.301408+00
11	27	comprar	t	f	2026-10-02 21:42:02.441794+00
12	34	necesitar	t	f	2026-10-02 21:43:24.297737+00
13	45	negociar	t	f	2026-10-02 21:45:23.103995+00
14	10	ofrecer	t	f	2026-10-02 21:47:49.581645+00
15	28	preparar	t	f	2026-10-02 21:51:25.246553+00
16	23	cobrar	t	f	2026-10-02 21:54:40.251152+00
17	25	contactar	t	f	2026-10-03 11:32:44.328617+00
18	52	garantizar	t	f	2026-10-03 11:33:05.512289+00
19	13	transferir	t	f	2026-10-03 11:36:12.241799+00
20	71	embalaje	f	f	2026-10-04 08:12:07.233955+00
21	71	el embalaje	t	f	2026-10-04 08:12:15.460017+00
22	31	recibir	t	f	2026-10-04 08:12:33.800717+00
23	6	solicionar	f	f	2026-10-04 08:18:12.22861+00
24	72	ya que	t	f	2026-10-04 08:19:24.223382+00
25	15	hablar	t	f	2026-10-04 08:20:42.555015+00
26	5	fabricar	t	f	2026-10-04 08:22:36.337281+00
27	56	bajo pedido	t	f	2026-10-04 08:30:15.459567+00
28	65	el proveedor	t	f	2026-10-04 08:30:23.09368+00
29	62	el producto estrella	f	f	2026-10-04 08:30:33.839029+00
30	49	acordar	t	f	2026-10-04 08:31:00.474127+00
31	61	por escrito	t	f	2026-10-04 08:33:02.826576+00
1177	296	esperabas	t	f	2026-10-25 08:22:19.563644+00
1178	298	esperaba	t	f	2026-10-25 08:22:19.563644+00
1179	302	esperabais	t	f	2026-10-25 08:22:19.563644+00
1180	304	esperaban	t	f	2026-10-25 08:22:19.563644+00
1259	387	importabais	t	f	2026-10-25 15:53:29.265923+00
1260	379	importaba	t	f	2026-10-25 15:53:29.265923+00
1261	381	importabas	t	f	2026-10-25 15:53:29.265923+00
1262	383	importaba	t	f	2026-10-25 15:53:29.265923+00
1263	385	importábamos	t	f	2026-10-25 15:53:29.265923+00
1264	389	importaban	t	f	2026-10-25 15:53:29.265923+00
1265	247	dispachabas	f	f	2026-10-25 15:53:57.596654+00
1266	247	despachabas	t	f	2026-10-25 15:54:27.527769+00
1267	245	despachaba	t	f	2026-10-25 15:54:27.527769+00
1268	249	despachaba	t	f	2026-10-25 15:54:27.527769+00
1269	251	despachábamos	t	f	2026-10-25 15:54:27.527769+00
1270	253	despachabais	t	f	2026-10-25 15:54:27.527769+00
1271	255	despachaban	t	f	2026-10-25 15:54:27.527769+00
1272	314	exportabais	t	f	2026-10-25 15:54:47.611547+00
1273	306	exportaba	t	f	2026-10-25 15:54:47.611547+00
1274	308	exportabas	t	f	2026-10-25 15:54:47.611547+00
1275	310	exportaba	t	f	2026-10-25 15:54:47.611547+00
1276	312	exportábamos	t	f	2026-10-25 15:54:47.611547+00
1277	316	exportaban	t	f	2026-10-25 15:54:47.611547+00
1278	322	fabricaba	t	f	2026-10-25 15:55:08.019919+00
1279	318	fabricaba	t	f	2026-10-25 15:55:08.019919+00
1280	320	fabricabas	t	f	2026-10-25 15:55:08.019919+00
1281	324	fabricábamos	t	f	2026-10-25 15:55:08.019919+00
1282	326	fabricabais	t	f	2026-10-25 15:55:08.019919+00
1283	328	fabricaban	t	f	2026-10-25 15:55:08.019919+00
1284	397	imformabamos	f	f	2026-10-25 15:55:39.479268+00
185	162	compraste	t	f	2026-10-18 21:32:02.394046+00
186	160	compré	t	f	2026-10-18 21:32:02.394046+00
187	164	compró	t	f	2026-10-18 21:32:02.394046+00
188	166	compramos	t	f	2026-10-18 21:32:02.394046+00
189	168	comprasteis	t	f	2026-10-18 21:32:02.394046+00
190	170	compraron	t	f	2026-10-18 21:32:02.394046+00
1285	397	informabamos	t	f	2026-10-25 15:56:01.499719+00
1286	391	informaba	t	f	2026-10-25 15:56:01.499719+00
1287	393	informabas	t	f	2026-10-25 15:56:01.499719+00
1288	395	informaba	t	f	2026-10-25 15:56:01.499719+00
1289	399	informabais	t	f	2026-10-25 15:56:01.499719+00
1290	401	informaban	t	f	2026-10-25 15:56:01.499719+00
1291	491	personalizaba	t	f	2026-10-25 15:56:24.249138+00
740	538	rechazo	t	f	2026-10-24 20:39:38.185849+00
741	534	rechacé	t	f	2026-10-24 20:39:38.185849+00
742	536	rechazaste	t	f	2026-10-24 20:39:38.185849+00
743	540	rechazamos	t	f	2026-10-24 20:39:38.185849+00
744	542	rechazasteis	t	f	2026-10-24 20:39:38.185849+00
745	544	rechazaron	t	f	2026-10-24 20:39:38.185849+00
1292	487	personalizaba	t	f	2026-10-25 15:56:24.249138+00
1293	489	personalizabas	t	f	2026-10-25 15:56:24.249138+00
1294	493	personalizábamos	t	f	2026-10-25 15:56:24.249138+00
1295	495	personalizabais	t	f	2026-10-25 15:56:24.249138+00
1296	497	personalizaban	t	f	2026-10-25 15:56:24.249138+00
1297	377	hablaban	t	f	2026-10-25 15:58:14.291509+00
1298	367	hablaba	t	f	2026-10-25 15:58:14.291509+00
1299	369	hablabas	t	f	2026-10-25 15:58:14.291509+00
1300	371	hablaba	t	f	2026-10-25 15:58:14.291509+00
1301	373	hablábamos	t	f	2026-10-25 15:58:14.291509+00
1302	375	hablabais	t	f	2026-10-25 15:58:14.291509+00
1303	139	avisabas	t	f	2026-10-26 07:15:32.235327+00
1304	137	avisaba	t	f	2026-10-26 07:15:32.235327+00
1305	141	avisaba	t	f	2026-10-26 07:15:32.235327+00
1306	143	avisábamos	t	f	2026-10-26 07:15:32.235327+00
1307	145	avisabais	t	f	2026-10-26 07:15:32.235327+00
1308	147	avisaban	t	f	2026-10-26 07:15:32.235327+00
\.


--
-- Data for Name: vy_languages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vy_languages (id, code, name) FROM stdin;
4	en	English
5	es	Spanish
\.


--
-- Data for Name: vy_session_activities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vy_session_activities (id, session_id, word_id, activity_type, user_answer, created_at) FROM stdin;
67	12	97	NEXT	\N	2026-10-25 08:20:42.871845+00
68	12	644	NEXT	\N	2026-10-25 08:21:11.914216+00
69	12	219	NEXT	\N	2026-10-25 08:21:41.374557+00
70	12	300	ANSWER_CORRECT	Esperabamos	2026-10-25 08:22:19.563644+00
71	12	594	NEXT	\N	2026-10-25 08:23:03.953935+00
84	12	387	ANSWER_CORRECT	Importabais	2026-10-25 15:53:29.265923+00
85	12	247	ANSWER_ERROR	Dispachabas	2026-10-25 15:53:57.596654+00
86	12	247	ANSWER_CORRECT	Despachabas	2026-10-25 15:54:27.527769+00
87	12	314	ANSWER_CORRECT	Exportabais	2026-10-25 15:54:47.611547+00
88	12	322	ANSWER_CORRECT	Fabricaba	2026-10-25 15:55:08.019919+00
89	12	397	ANSWER_ERROR	Imformabamos	2026-10-25 15:55:39.479268+00
90	12	397	ANSWER_CORRECT	Informabamos	2026-10-25 15:56:01.499719+00
91	12	491	ANSWER_CORRECT	Personalizaba	2026-10-25 15:56:24.249138+00
92	12	663	NEXT	\N	2026-10-25 15:57:39.301674+00
93	12	129	NEXT	\N	2026-10-25 15:57:58.767425+00
94	12	377	ANSWER_CORRECT	Hablaban	2026-10-25 15:58:14.291509+00
\.


--
-- Data for Name: vy_study_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vy_study_sessions (id, language_id, session_date, next_clicks, created_at, updated_at) FROM stdin;
30	5	2026-10-26	10	2026-10-26 07:12:47.321466+00	2026-10-26 22:26:21.002073+00
60	5	2026-10-29	0	2026-10-29 16:49:36.766487+00	2026-10-29 16:51:21.127855+00
12	5	2026-10-25	6	2026-10-25 08:20:42.667802+00	2026-10-25 15:58:14.291509+00
\.


--
-- Data for Name: vy_tags; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vy_tags (id, language_id, name, created_at) FROM stdin;
3	5	Глаголы	2026-10-02 22:05:18.508848+00
1	5	Для общения с поставщиками	2026-10-02 08:17:42.70941+00
6	5	Pretérito Indefinido	2026-10-04 19:04:04.781+00
7	5	Pretérito Imperfecto	2026-10-04 19:04:04.781+00
\.


--
-- Data for Name: vy_word_tags; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vy_word_tags (word_id, tag_id) FROM stdin;
4	1
5	1
6	1
7	1
8	1
9	1
10	1
11	1
12	1
13	1
14	1
15	1
16	1
17	1
18	1
19	1
20	1
21	1
22	1
23	1
24	1
25	1
26	1
27	1
28	1
29	1
30	1
31	1
32	1
33	1
34	1
35	1
36	1
37	1
38	1
39	1
40	1
41	1
42	1
43	1
44	1
45	1
46	1
47	1
48	1
49	1
50	1
52	1
53	1
51	1
54	1
55	1
56	1
57	1
58	1
59	1
60	1
61	1
62	1
63	1
64	1
65	1
66	1
4	3
5	3
6	3
7	3
8	3
9	3
10	3
11	3
12	3
13	3
14	3
15	3
16	3
17	3
18	3
19	3
20	3
21	3
22	3
23	3
24	3
25	3
26	3
27	3
28	3
29	3
30	3
31	3
32	3
33	3
34	3
35	3
36	3
37	3
38	3
39	3
40	3
41	3
42	3
43	3
44	3
45	3
46	3
47	3
48	3
49	3
50	3
52	3
53	3
51	3
67	1
68	1
69	1
70	1
71	1
69	3
70	3
72	1
73	1
74	1
75	1
74	3
76	6
77	7
78	6
79	7
80	6
81	7
82	6
83	7
84	6
85	7
86	6
87	7
88	6
89	7
90	6
91	7
92	6
93	7
94	6
95	7
96	6
97	7
98	6
99	7
100	6
101	7
102	6
103	7
104	6
105	7
106	6
107	7
108	6
109	7
110	6
111	7
112	6
113	7
114	6
115	7
116	6
117	7
118	6
119	7
120	6
121	7
122	6
123	7
124	6
125	7
126	6
127	7
128	6
129	7
130	6
131	7
132	6
133	7
134	6
135	7
136	6
137	7
138	6
139	7
140	6
141	7
142	6
143	7
144	6
145	7
146	6
147	7
148	6
149	7
150	6
151	7
152	6
153	7
154	6
155	7
156	6
157	7
158	6
159	7
160	6
161	7
162	6
163	7
164	6
165	7
166	6
167	7
168	6
169	7
170	6
171	7
172	6
173	7
174	6
175	7
176	6
177	7
178	6
179	7
180	6
181	7
182	6
183	7
184	6
185	7
186	6
187	7
188	6
189	7
190	6
191	7
192	6
193	7
194	6
195	7
196	6
197	7
198	6
199	7
200	6
201	7
202	6
203	7
204	6
205	7
206	6
207	7
208	6
209	7
210	6
211	7
212	6
213	7
214	6
215	7
216	6
217	7
218	6
219	7
220	6
221	7
222	6
223	7
224	6
225	7
226	6
227	7
228	6
229	7
230	6
231	7
232	6
233	7
234	6
235	7
236	6
237	7
238	6
239	7
240	6
241	7
242	6
243	7
244	6
245	7
246	6
247	7
248	6
249	7
250	6
251	7
252	6
253	7
254	6
255	7
256	6
257	7
258	6
259	7
260	6
261	7
262	6
263	7
264	6
265	7
266	6
267	7
268	6
269	7
270	6
271	7
272	6
273	7
274	6
275	7
276	6
277	7
278	6
279	6
280	7
281	6
282	7
283	6
284	7
285	6
286	7
287	6
288	7
289	6
290	7
291	6
292	7
293	6
294	7
295	6
296	7
297	6
298	7
299	6
300	7
301	6
302	7
303	6
304	7
305	6
306	7
307	6
308	7
309	6
310	7
311	6
312	7
313	6
314	7
315	6
316	7
317	6
318	7
319	6
320	7
321	6
322	7
323	6
324	7
325	6
326	7
327	6
328	7
329	6
330	7
331	6
332	7
333	6
334	7
335	6
336	7
337	6
338	7
339	6
340	7
341	6
342	7
343	6
344	7
345	6
346	7
347	6
348	7
349	6
350	7
351	6
352	7
353	6
354	7
355	6
356	7
357	6
358	6
359	7
360	6
361	7
362	6
363	7
364	6
365	7
366	6
367	7
368	6
369	7
370	6
371	7
372	6
373	7
374	6
375	7
376	6
377	7
378	6
379	7
380	6
381	7
382	6
383	7
384	6
385	7
386	6
387	7
388	6
389	7
390	6
391	7
392	6
393	7
394	6
395	7
396	6
397	7
398	6
399	7
400	6
401	7
402	6
403	7
404	6
405	7
406	6
407	7
408	6
409	7
410	6
411	7
412	6
413	7
414	6
415	7
416	6
417	7
418	6
419	7
420	6
421	7
422	6
423	7
424	6
425	7
426	6
427	7
428	6
429	7
430	6
431	7
432	6
433	7
434	6
435	7
436	6
437	7
438	6
439	7
440	6
441	7
442	6
443	7
444	6
445	7
446	6
447	7
448	6
449	7
450	6
451	7
452	6
453	7
454	6
455	7
456	6
457	7
458	6
459	7
460	6
461	7
462	6
463	7
464	6
465	7
466	6
467	7
468	6
469	7
470	6
471	7
472	6
473	7
474	6
475	7
476	6
477	7
478	6
479	7
480	6
481	7
482	6
483	7
484	6
485	7
486	6
487	7
488	6
489	7
490	6
491	7
492	6
493	7
494	6
495	7
496	6
497	7
498	6
499	7
500	6
501	7
502	6
503	7
504	6
505	7
506	6
507	7
508	6
509	7
510	6
511	7
512	6
513	7
514	6
515	7
516	6
517	7
518	6
519	7
520	6
521	7
522	6
523	7
524	6
525	7
526	6
527	7
528	6
529	7
530	6
531	7
532	6
533	7
534	6
535	7
536	6
537	7
538	6
539	7
540	6
541	7
542	6
543	7
544	6
545	7
546	6
547	7
548	7
549	6
550	7
551	6
552	7
553	6
554	7
555	6
556	7
557	6
558	7
559	6
560	7
561	6
562	7
563	6
564	7
565	6
566	7
567	6
568	7
569	6
570	7
571	6
572	7
573	6
574	7
575	6
576	7
577	6
578	7
579	6
580	7
581	6
582	7
583	6
584	7
585	6
586	7
587	6
588	7
589	6
590	7
591	6
592	7
593	6
594	7
595	6
596	7
597	6
598	7
599	6
600	7
601	6
602	7
603	6
604	7
605	6
606	7
607	6
608	7
609	6
610	7
611	6
612	7
613	6
614	7
615	6
616	7
617	6
618	7
619	6
620	7
621	6
622	7
623	6
624	7
625	6
626	7
627	6
628	7
629	6
630	7
631	6
632	7
633	6
634	7
635	6
636	7
637	6
638	7
639	6
640	7
641	6
642	7
643	6
644	7
645	6
646	7
647	6
648	7
649	6
650	7
651	6
652	7
653	7
654	6
655	7
656	6
657	7
658	6
659	7
660	6
661	7
662	6
663	7
664	6
665	7
666	6
667	7
668	6
669	7
670	6
671	7
672	6
673	7
674	6
675	7
76	3
77	3
78	3
79	3
80	3
81	3
82	3
83	3
84	3
85	3
86	3
87	3
88	3
89	3
90	3
91	3
92	3
93	3
94	3
95	3
96	3
97	3
98	3
99	3
100	3
101	3
102	3
103	3
104	3
105	3
106	3
107	3
108	3
109	3
110	3
111	3
112	3
113	3
114	3
115	3
116	3
117	3
118	3
119	3
120	3
121	3
122	3
123	3
124	3
125	3
126	3
127	3
128	3
129	3
130	3
131	3
132	3
133	3
134	3
135	3
136	3
137	3
138	3
139	3
140	3
141	3
142	3
143	3
144	3
145	3
146	3
147	3
148	3
149	3
150	3
151	3
152	3
153	3
154	3
155	3
156	3
157	3
158	3
159	3
160	3
161	3
162	3
163	3
164	3
165	3
166	3
167	3
168	3
169	3
170	3
171	3
172	3
173	3
174	3
175	3
176	3
177	3
178	3
179	3
180	3
181	3
182	3
183	3
184	3
185	3
186	3
187	3
188	3
189	3
190	3
191	3
192	3
193	3
194	3
195	3
196	3
197	3
198	3
199	3
200	3
201	3
202	3
203	3
204	3
205	3
206	3
207	3
208	3
209	3
210	3
211	3
212	3
213	3
214	3
215	3
216	3
217	3
218	3
219	3
220	3
221	3
222	3
223	3
224	3
225	3
226	3
227	3
228	3
229	3
230	3
231	3
232	3
233	3
234	3
235	3
236	3
237	3
238	3
239	3
240	3
241	3
242	3
243	3
244	3
245	3
246	3
247	3
248	3
249	3
250	3
251	3
252	3
253	3
254	3
255	3
256	3
257	3
258	3
259	3
260	3
261	3
262	3
263	3
264	3
265	3
266	3
267	3
268	3
269	3
270	3
271	3
272	3
273	3
274	3
275	3
276	3
277	3
278	3
279	3
280	3
281	3
282	3
283	3
284	3
285	3
286	3
287	3
288	3
289	3
290	3
291	3
292	3
293	3
294	3
295	3
296	3
297	3
298	3
299	3
300	3
301	3
302	3
303	3
304	3
305	3
306	3
307	3
308	3
309	3
310	3
311	3
312	3
313	3
314	3
315	3
316	3
317	3
318	3
319	3
320	3
321	3
322	3
323	3
324	3
325	3
326	3
327	3
328	3
329	3
330	3
331	3
332	3
333	3
334	3
335	3
336	3
337	3
338	3
339	3
340	3
341	3
342	3
343	3
344	3
345	3
346	3
347	3
348	3
349	3
350	3
351	3
352	3
353	3
354	3
355	3
356	3
357	3
358	3
359	3
360	3
361	3
362	3
363	3
364	3
365	3
366	3
367	3
368	3
369	3
370	3
371	3
372	3
373	3
374	3
375	3
376	3
377	3
378	3
379	3
380	3
381	3
382	3
383	3
384	3
385	3
386	3
387	3
388	3
389	3
390	3
391	3
392	3
393	3
394	3
395	3
396	3
397	3
398	3
399	3
400	3
401	3
402	3
403	3
404	3
405	3
406	3
407	3
408	3
409	3
410	3
411	3
412	3
413	3
414	3
415	3
416	3
417	3
418	3
419	3
420	3
421	3
422	3
423	3
424	3
425	3
426	3
427	3
428	3
429	3
430	3
431	3
432	3
433	3
434	3
435	3
436	3
437	3
438	3
439	3
440	3
441	3
442	3
443	3
444	3
445	3
446	3
447	3
448	3
449	3
450	3
451	3
452	3
453	3
454	3
455	3
456	3
457	3
458	3
459	3
460	3
461	3
462	3
463	3
464	3
465	3
466	3
467	3
468	3
469	3
470	3
471	3
472	3
473	3
474	3
475	3
476	3
477	3
478	3
479	3
480	3
481	3
482	3
483	3
484	3
485	3
486	3
487	3
488	3
489	3
490	3
491	3
492	3
493	3
494	3
495	3
496	3
497	3
498	3
499	3
500	3
501	3
502	3
503	3
504	3
505	3
506	3
507	3
508	3
509	3
510	3
511	3
512	3
513	3
514	3
515	3
516	3
517	3
518	3
519	3
520	3
521	3
522	3
523	3
524	3
525	3
526	3
527	3
528	3
529	3
530	3
531	3
532	3
533	3
534	3
535	3
536	3
537	3
538	3
539	3
540	3
541	3
542	3
543	3
544	3
545	3
546	3
547	3
548	3
549	3
550	3
551	3
552	3
553	3
554	3
555	3
556	3
557	3
558	3
559	3
560	3
561	3
562	3
563	3
564	3
565	3
566	3
567	3
568	3
569	3
570	3
571	3
572	3
573	3
574	3
575	3
576	3
577	3
578	3
579	3
580	3
581	3
582	3
583	3
584	3
585	3
586	3
587	3
588	3
589	3
590	3
591	3
592	3
593	3
594	3
595	3
596	3
597	3
598	3
599	3
600	3
601	3
602	3
603	3
604	3
605	3
606	3
607	3
608	3
609	3
610	3
611	3
612	3
613	3
614	3
615	3
616	3
617	3
618	3
619	3
620	3
621	3
622	3
623	3
624	3
625	3
626	3
627	3
628	3
629	3
630	3
631	3
632	3
633	3
634	3
635	3
636	3
637	3
638	3
639	3
640	3
641	3
642	3
643	3
644	3
645	3
646	3
647	3
648	3
649	3
650	3
651	3
652	3
653	3
654	3
655	3
656	3
657	3
658	3
659	3
660	3
661	3
662	3
663	3
664	3
665	3
666	3
667	3
668	3
669	3
670	3
671	3
672	3
673	3
674	3
675	3
76	1
77	1
78	1
79	1
80	1
81	1
82	1
83	1
84	1
85	1
86	1
87	1
88	1
89	1
90	1
91	1
92	1
93	1
94	1
95	1
96	1
97	1
98	1
99	1
100	1
101	1
102	1
103	1
104	1
105	1
106	1
107	1
108	1
109	1
110	1
111	1
112	1
113	1
114	1
115	1
116	1
117	1
118	1
119	1
120	1
121	1
122	1
123	1
124	1
125	1
126	1
127	1
128	1
129	1
130	1
131	1
132	1
133	1
134	1
135	1
136	1
137	1
138	1
139	1
140	1
141	1
142	1
143	1
144	1
145	1
146	1
147	1
148	1
149	1
150	1
151	1
152	1
153	1
154	1
155	1
156	1
157	1
158	1
159	1
160	1
161	1
162	1
163	1
164	1
165	1
166	1
167	1
168	1
169	1
170	1
171	1
172	1
173	1
174	1
175	1
176	1
177	1
178	1
179	1
180	1
181	1
182	1
183	1
184	1
185	1
186	1
187	1
188	1
189	1
190	1
191	1
192	1
193	1
194	1
195	1
196	1
197	1
198	1
199	1
200	1
201	1
202	1
203	1
204	1
205	1
206	1
207	1
208	1
209	1
210	1
211	1
212	1
213	1
214	1
215	1
216	1
217	1
218	1
219	1
220	1
221	1
222	1
223	1
224	1
225	1
226	1
227	1
228	1
229	1
230	1
231	1
232	1
233	1
234	1
235	1
236	1
237	1
238	1
239	1
240	1
241	1
242	1
243	1
244	1
245	1
246	1
247	1
248	1
249	1
250	1
251	1
252	1
253	1
254	1
255	1
256	1
257	1
258	1
259	1
260	1
261	1
262	1
263	1
264	1
265	1
266	1
267	1
268	1
269	1
270	1
271	1
272	1
273	1
274	1
275	1
276	1
277	1
278	1
279	1
280	1
281	1
282	1
283	1
284	1
285	1
286	1
287	1
288	1
289	1
290	1
291	1
292	1
293	1
294	1
295	1
296	1
297	1
298	1
299	1
300	1
301	1
302	1
303	1
304	1
305	1
306	1
307	1
308	1
309	1
310	1
311	1
312	1
313	1
314	1
315	1
316	1
317	1
318	1
319	1
320	1
321	1
322	1
323	1
324	1
325	1
326	1
327	1
328	1
329	1
330	1
331	1
332	1
333	1
334	1
335	1
336	1
337	1
338	1
339	1
340	1
341	1
342	1
343	1
344	1
345	1
346	1
347	1
348	1
349	1
350	1
351	1
352	1
353	1
354	1
355	1
356	1
357	1
358	1
359	1
360	1
361	1
362	1
363	1
364	1
365	1
366	1
367	1
368	1
369	1
370	1
371	1
372	1
373	1
374	1
375	1
376	1
377	1
378	1
379	1
380	1
381	1
382	1
383	1
384	1
385	1
386	1
387	1
388	1
389	1
390	1
391	1
392	1
393	1
394	1
395	1
396	1
397	1
398	1
399	1
400	1
401	1
402	1
403	1
404	1
405	1
406	1
407	1
408	1
409	1
410	1
411	1
412	1
413	1
414	1
415	1
416	1
417	1
418	1
419	1
420	1
421	1
422	1
423	1
424	1
425	1
426	1
427	1
428	1
429	1
430	1
431	1
432	1
433	1
434	1
435	1
436	1
437	1
438	1
439	1
440	1
441	1
442	1
443	1
444	1
445	1
446	1
447	1
448	1
449	1
450	1
451	1
452	1
453	1
454	1
455	1
456	1
457	1
458	1
459	1
460	1
461	1
462	1
463	1
464	1
465	1
466	1
467	1
468	1
469	1
470	1
471	1
472	1
473	1
474	1
475	1
476	1
477	1
478	1
479	1
480	1
481	1
482	1
483	1
484	1
485	1
486	1
487	1
488	1
489	1
490	1
491	1
492	1
493	1
494	1
495	1
496	1
497	1
498	1
499	1
500	1
501	1
502	1
503	1
504	1
505	1
506	1
507	1
508	1
509	1
510	1
511	1
512	1
513	1
514	1
515	1
516	1
517	1
518	1
519	1
520	1
521	1
522	1
523	1
524	1
525	1
526	1
527	1
528	1
529	1
530	1
531	1
532	1
533	1
534	1
535	1
536	1
537	1
538	1
539	1
540	1
541	1
542	1
543	1
544	1
545	1
546	1
547	1
548	1
549	1
550	1
551	1
552	1
553	1
554	1
555	1
556	1
557	1
558	1
559	1
560	1
561	1
562	1
563	1
564	1
565	1
566	1
567	1
568	1
569	1
570	1
571	1
572	1
573	1
574	1
575	1
576	1
577	1
578	1
579	1
580	1
581	1
582	1
583	1
584	1
585	1
586	1
587	1
588	1
589	1
590	1
591	1
592	1
593	1
594	1
595	1
596	1
597	1
598	1
599	1
600	1
601	1
602	1
603	1
604	1
605	1
606	1
607	1
608	1
609	1
610	1
611	1
612	1
613	1
614	1
615	1
616	1
617	1
618	1
619	1
620	1
621	1
622	1
623	1
624	1
625	1
626	1
627	1
628	1
629	1
630	1
631	1
632	1
633	1
634	1
635	1
636	1
637	1
638	1
639	1
640	1
641	1
642	1
643	1
644	1
645	1
646	1
647	1
648	1
649	1
650	1
651	1
652	1
653	1
654	1
655	1
656	1
657	1
658	1
659	1
660	1
661	1
662	1
663	1
664	1
665	1
666	1
667	1
668	1
669	1
670	1
671	1
672	1
673	1
674	1
675	1
676	1
677	1
678	1
679	1
680	1
680	3
681	1
682	1
683	1
\.


--
-- Data for Name: vy_words; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vy_words (id, language_id, english, russian, example_en, example_ru, created_at, updated_at, is_favorite, base_word_id) FROM stdin;
4	5	abonar	зачислять	Abonaremos el importe restante tras la entrega.	Мы выплатим оставшуюся сумму после поставки.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
5	5	fabricar	изготавливать	Fabricamos los productos bajo pedido en nuestra fábrica en Valencia.	Мы изготавливаем продукцию под заказ на нашей фабрике в Валенсии.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
6	5	solucionar	устранять	Nuestro equipo técnico solucionará la incidencia en 24 horas.	Наша техническая команда устранит неполадку в течение 24 часов.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
7	5	rechazar	отклонять	El proveedor rechazó nuestra propuesta de precio inicial.	Поставщик отклонил наше первоначальное ценовое предложение.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
8	5	reembolsar	возвращать деньги	Si el producto llega dañado, le reembolsaremos el importe.	Если товар приедет повреждённым, мы вернём вам сумму.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
9	5	verificar	проверять наличие	Verificaremos el stock disponible antes de confirmar el pedido.	Мы проверим наличие на складе перед подтверждением заказа.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
10	5	ofrecer	предлагать	¿Puede ofrecernos un mejor precio para pedidos grandes?	Можете ли вы предложить нам лучшую цену для больших заказов?	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
11	5	decidir	решать	Debemos decidir el volumen del pedido antes del viernes.	Нам нужно решить объём заказа до пятницы.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
12	5	informar	информировать	Le informaremos sobre cualquier cambio en el plazo de entrega.	Мы проинформируем вас о любых изменениях сроков поставки.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
13	5	transferir	переводить деньги	Transferiremos el pago a su cuenta bancaria mañana.	Мы переведём платёж на ваш банковский счёт завтра.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
14	5	resolver	решать проблему	Esperamos resolver este problema con la calidad lo antes posible.	Мы надеемся как можно скорее решить эту проблему с качеством.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
15	5	hablar	говорить	Me gustaría hablar con el responsable de ventas.	Я хотел бы поговорить с ответственным за продажи.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
16	5	pedir	заказывать, просить	Queremos pedir 500 unidades de su producto estrella.	Мы хотим заказать 500 единиц вашего основного продукта.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
17	5	solicitar	запрашивать	Necesito solicitar el precio de venta al por mayor.	Мне нужно запросить оптовую цену.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
18	5	comprobar	убеждаться	Compruebe si el número de cuenta bancaria es correcto.	Проверьте, правильный ли номер банковского счёта.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
19	5	reclamar	предъявлять претензию	Vamos a reclamar los daños causados durante el transporte.	Мы собираемся предъявить претензию по поводу повреждений во время перевозки.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
20	5	vender	продавать	Esta empresa vende sus productos en toda Europa.	Эта компания продаёт свою продукцию по всей Европе.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
21	5	asegurar	обеспечивать	Debemos asegurar el transporte seguro de la mercancía.	Мы должны обеспечить безопасную перевозку товара.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
22	5	llegar	прибывать	El contenedor llegará al puerto la próxima semana.	Контейнер прибудет в порт на следующей неделе.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
23	5	cobrar	взимать плату	¿Nos cobrarán los gastos de envío por separado?	Вы возьмёте с нас плату за доставку отдельно?	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
24	5	producir	производить	La fábrica produce mil unidades al día.	Фабрика производит тысячу единиц в день.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
25	5	contactar	связываться	Puede contactar con nuestro gestor de pedidos por teléfono.	Вы можете связаться с нашим менеджером по заказам по телефону.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
26	5	facturar	выставлять счёт	El proveedor nos factura en euros cada mes.	Поставщик выставляет нам счёт в евро каждый месяц.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
27	5	comprar	покупать	Compramos estos productos para revenderlos en nuestra tienda.	Мы покупаем эту продукцию, чтобы перепродавать её в нашем магазине.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
28	5	preparar	подготавливать	Prepararemos la documentación de exportación esta semana.	Мы подготовим экспортную документацию на этой неделе.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
29	5	entregar	доставлять	El transportista entregará la mercancía el lunes por la mañana.	Перевозчик доставит товар в понедельник утром.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
30	5	personalizar	делать на заказ	Podemos personalizar el embalaje con el logotipo del cliente.	Мы можем кастомизировать упаковку с логотипом клиента.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
31	5	recibir	получать	¿Cuándo recibiremos el primer envío?	Когда мы получим первую партию?	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
32	5	devolver	возвращать товар	Puede devolver la mercancía defectuosa en un plazo de 14 días.	Вы можете вернуть бракованный товар в течение 14 дней.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
33	5	revisar	проверять	Me gustaría revisar el contrato antes de firmarlo.	Я хотел бы проверить контракт перед подписанием.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
34	5	necesitar	нуждаться	Necesitamos su ayuda para resolver este problema con el pedido.	Нам нужна ваша помощь в решении этой проблемы с заказом.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
35	5	adjuntar	прикреплять	Le adjunto la oferta con los precios actualizados.	Прикрепляю вам предложение с актуальными ценами.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
36	5	importar	импортировать	Importamos mercancía directamente de España.	Мы импортируем товары напрямую из Испании.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
37	5	confirmar	подтверждать	Por favor, confirme la fecha de entrega por escrito.	Пожалуйста, подтвердите дату поставки в письменном виде.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
38	5	cumplir	выполнять	El proveedor cumple todos los plazos acordados.	Поставщик соблюдает все согласованные сроки.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
39	5	preguntar	спрашивать	Quiero preguntarle sobre las condiciones de pago.	Я хочу спросить вас об условиях оплаты.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
40	5	despachar	отправлять груз	Despacharemos su pedido en cuanto recibamos el pago.	Мы отправим ваш заказ, как только получим оплату.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
41	5	esperar	ожидать	Esperamos su respuesta para continuar con el pedido.	Ждём вашего ответа, чтобы продолжить работу над заказом.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
42	5	responder	отвечать	Le rogamos que responda a nuestra solicitud lo antes posible.	Просим вас ответить на наш запрос как можно скорее.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
43	5	exportar	экспортировать	Su empresa exporta a más de veinte países.	Ваша компания экспортирует более чем в двадцать стран.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
44	5	intentar	пытаться	Intentaremos reducir el tiempo de entrega en un 10%.	Мы постараемся сократить время доставки на 10%.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
45	5	negociar	вести переговоры	Estos son los precios que podemos negociar para contratos anuales.	Это цены, которые мы можем обсудить для годовых контрактов.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
46	5	firmar	подписывать	Debe firmar el acuerdo de suministro para iniciar la colaboración.	Вы должны подписать соглашение о поставке, чтобы начать сотрудничество.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
47	5	costar	стоить	¿Cuánto cuesta una unidad con el descuento por volumen?	Сколько стоит одна единица со скидкой за объём?	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
48	5	enviar	отправлять	Le enviaré el catálogo actualizado por correo electrónico.	Я отправлю вам обновлённый каталог по электронной почте.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
49	5	acordar	договариваться	Acordamos un plazo de entrega de dos semanas.	Мы договорились о сроке поставки в две недели.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
50	5	pagar	платить	Estamos dispuestos a pagar el 30% por adelantado.	Мы готовы платить 30% авансом.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
52	5	garantizar	гарантировать	Le garantizamos la calidad de todos nuestros productos.	Мы гарантируем качество всей нашей продукции.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
53	5	aceptar	принимать условия	Aceptamos las condiciones de pago propuestas por el proveedor.	Мы принимаем условия оплаты, предложенные поставщиком.	2026-10-01 20:41:36.959287+00	2026-10-01 20:41:36.959287+00	f	\N
51	5	avisar	уведомлять	Avísenos si hay algún retraso en la producción.	Сообщите нам, если будет задержка в производстве.	2026-10-01 20:41:36.959287+00	2026-10-01 21:22:00.249096+00	f	\N
54	5	gestor de pedidos	менеджер по заказам	Nuestro gestor de pedidos le enviará la factura proforma en cuanto esté lista.	Наш менеджер по заказам отправит вам счёт-проформу, как только он будет готов.	2026-10-02 21:58:58.366045+00	2026-10-02 21:58:58.366045+00	f	\N
55	5	en cuanto	как только	Le enviaremos el comprobante de transferencia en cuanto realicemos el pago.	Мы отправим вам подтверждение перевода, как только совершим платёж.	2026-10-02 21:58:58.366045+00	2026-10-02 21:58:58.366045+00	f	\N
56	5	bajo pedido	под заказ	No tenemos este artículo en stock, ya que se fabrica exclusivamente bajo pedido.	У нас нет этого товара на складе, так как он производится исключительно под заказ.	2026-10-02 21:58:58.366045+00	2026-10-02 21:58:58.366045+00	f	\N
57	5	retraso	задержка, опоздание	Cualquier retraso en la entrega puede afectar negativamente a nuestras ventas.	Любая задержка в поставке может негативно сказаться на наших продажах.	2026-10-02 21:58:58.366045+00	2026-10-02 21:58:58.366045+00	f	\N
58	5	el importe restante	оставшаяся сумма, остаток суммы	Abonaremos el importe restante una vez comprobada la calidad de los productos.	Мы выплатим оставшуюся сумму после того, как проверим качество продукции.	2026-10-02 21:58:58.366045+00	2026-10-02 21:58:58.366045+00	f	\N
59	5	tras la entrega	после поставки, после доставки	Disponemos de un plazo de siete días tras la entrega para notificar cualquier incidencia.	У нас есть 7 дней после поставки, чтобы заявить о любых инцидентах.	2026-10-02 21:58:58.366045+00	2026-10-02 21:58:58.366045+00	f	\N
60	5	los plazos acordados	согласованные сроки	Es imprescindible respetar los plazos acordados para no retrasar el lanzamiento.	Крайне важно соблюдать согласованные сроки, чтобы не задержать запуск.	2026-10-02 21:58:58.366045+00	2026-10-02 21:58:58.366045+00	f	\N
61	5	por escrito	в письменном виде, письменно	Para evitar malentendidos, preferimos cerrar todos los acuerdos por escrito.	Чтобы избежать недоразумений, мы предпочитаем заключать все договоренности в письменном виде.	2026-10-02 21:58:58.366045+00	2026-10-02 21:58:58.366045+00	f	\N
62	5	producto estrella	флагманский продукт, хит продаж	Este modelo es su producto estrella y queremos incluirlo en nuestro catálogo.	Эта модель — их флагманский продукт, и мы хотим включить её в наш каталог.	2026-10-02 21:58:58.366045+00	2026-10-02 21:58:58.366045+00	f	\N
63	5	propuesta	предложение, коммерческое предложение	Hemos analizado su propuesta y estamos dispuestos a realizar el primer pedido de prueba.	Мы проанализировали ваше предложение и готовы сделать первый тестовый заказ.	2026-10-02 21:58:58.366045+00	2026-10-02 21:58:58.366045+00	f	\N
64	5	fecha de entrega	дата поставки, срок поставки	Por favor, infórmenos sobre la fecha de entrega estimada de este lote.	Пожалуйста, сообщите нам ориентировочную дату поставки этой партии.	2026-10-02 21:58:58.366045+00	2026-10-02 21:58:58.366045+00	f	\N
65	5	el proveedor	поставщик	El proveedor nos ofreció un descuento adicional del cinco por ciento por volumen de compra.	Поставщик предложил нам дополнительную скидку 5% за объём закупки.	2026-10-02 21:58:58.366045+00	2026-10-02 21:58:58.366045+00	f	\N
66	5	por separado	отдельно, по отдельности	Los costes de transporte y embalaje especial se facturan por separado.	Стоимость транспортировки и специальной упаковки оплачивается отдельно.	2026-10-02 21:58:58.366045+00	2026-10-02 21:58:58.366045+00	f	\N
67	5	el lanzamiento	запуск, старт продаж	Estamos preparando el lanzamiento de una nueva línea de productos en Amazon.	Мы готовим запуск новой линейки продуктов на Amazon.	2026-10-03 08:02:40.292773+00	2026-10-03 08:02:40.292773+00	f	\N
68	5	el responsable	ответственный, руководитель	Pásenos el contacto del responsable del departamento de compras.	Передайте нам контакт ответственного лица отдела закупок.	2026-10-03 08:02:40.292773+00	2026-10-03 08:02:40.292773+00	f	\N
69	5	retrasar	задерживать, откладывать	La falta de materias primas puede retrasar la producción varios días.	Нехватка сырья может задержать производство на несколько дней.	2026-10-03 08:02:40.292773+00	2026-10-03 08:02:40.292773+00	f	\N
70	5	respetar	соблюдать	Ambas partes deben respetar las condiciones pactadas en el contrato.	Обе стороны должны соблюдать условия, согласованные в контракте.	2026-10-03 08:02:40.292773+00	2026-10-03 08:02:40.292773+00	f	\N
71	5	el embalaje	упаковка	El embalaje debe ser lo suficientemente resistente para soportar el transporte internacional.	Упаковка должна быть достаточно прочной, чтобы выдержать международную транспортировку.	2026-10-03 08:02:40.292773+00	2026-10-03 08:02:40.292773+00	f	\N
72	5	ya que	так как, поскольку	Necesitamos la confirmación hoy, ya que debemos planificar la logística semanal.	Нам нужно подтверждение сегодня, так как мы должны спланировать недельную логистику.	2026-10-03 11:40:44.678514+00	2026-10-03 11:40:44.678514+00	f	\N
73	5	estamos dispuestos	мы готовы, готовы	Estamos dispuestos a negociar un contrato de suministro a largo plazo.	Мы готовы обсудить долгосрочный контракт на поставку.	2026-10-03 11:40:44.678514+00	2026-10-03 11:40:44.678514+00	f	\N
74	5	soportar	выдерживать, переносить	Los palets deben soportar un peso máximo de mil kilogramos.	Паллеты должны выдерживать максимальный вес в тысячу килограммов.	2026-10-03 11:40:44.678514+00	2026-10-03 11:40:44.678514+00	f	\N
75	5	resistente	прочный, устойчивый, стойкий	Utilizamos cajas de cartón resistente para proteger los productos frágiles.	Мы используем коробки из прочного картона для защиты хрупких товаров.	2026-10-03 11:40:44.678514+00	2026-10-03 11:40:44.678514+00	f	\N
76	5	aboné	зачислил (я)	Ayer yo aboné el importe de la factura por transferencia.	Вчера я зачислил сумму по счёту через банковский перевод.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	4
77	5	abonaba	зачислял (я)	Antes yo siempre abonaba el importe de la factura por transferencia.	Раньше я регулярно зачислял сумму по счёту через банковский перевод.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	4
78	5	abonaste	зачислил (ты)	¿Ayer tú abonaste el importe de la factura por transferencia?	Вчера ты зачислил сумму по счёту через банковский перевод?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	4
79	5	abonabas	зачислял (ты)	¿Antes tú abonabas el importe de la factura por transferencia?	Раньше ты регулярно зачислял сумму по счёту через банковский перевод?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	4
80	5	abonó	зачислил (он / Вы)	Ayer el proveedor abonó el importe de la factura por transferencia.	Вчера поставщик зачислил сумму по счёту через банковский перевод.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	4
81	5	abonaba	зачислял (он / Вы)	El proveedor siempre abonaba el importe de la factura por transferencia.	Поставщик всегда зачислял сумму по счёту через банковский перевод.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	4
82	5	abonamos	зачислили (мы)	La semana pasada nosotros abonamos el importe de la factura por transferencia.	На прошлой неделе мы зачислили сумму по счёту через банковский перевод.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	4
83	5	abonábamos	зачисляли (мы)	Nosotros normalmente abonábamos el importe de la factura por transferencia.	Мы обычно зачисляли сумму по счёту через банковский перевод.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	4
84	5	abonasteis	зачислили (вы)	¿Ayer vosotros abonasteis el importe de la factura por transferencia?	Вчера вы зачислили сумму по счёту через банковский перевод?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	4
85	5	abonabais	зачисляли (вы)	¿Antes vosotros abonabais el importe de la factura por transferencia?	Раньше вы регулярно зачисляли сумму по счёту через банковский перевод?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	4
86	5	abonaron	зачислили (они / Вы)	Esta mañana ellos abonaron el importe de la factura por transferencia.	Сегодня утром они зачислили сумму по счёту через банковский перевод.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	4
87	5	abonaban	зачисляли (они / Вы)	Ellos habitualmente abonaban el importe de la factura por transferencia.	Они обычно зачисляли сумму по счёту через банковский перевод.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	4
88	5	acepté	принял (я)	Ayer yo acepté las condiciones comerciales del proveedor.	Вчера я принял коммерческие условия поставщика.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	53
89	5	aceptaba	принимал (я)	Antes yo siempre aceptaba las condiciones comerciales del proveedor.	Раньше я регулярно принимал коммерческие условия поставщика.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	53
90	5	aceptaste	принял (ты)	¿Ayer tú aceptaste las condiciones comerciales del proveedor?	Вчера ты принял коммерческие условия поставщика?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	53
91	5	aceptabas	принимал (ты)	¿Antes tú aceptabas las condiciones comerciales del proveedor?	Раньше ты регулярно принимал коммерческие условия поставщика?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	53
92	5	aceptó	принял (он / Вы)	Ayer el proveedor aceptó las condiciones comerciales del proveedor.	Вчера поставщик принял коммерческие условия поставщика.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	53
93	5	aceptaba	принимал (он / Вы)	El proveedor siempre aceptaba las condiciones comerciales del proveedor.	Поставщик всегда принимал коммерческие условия поставщика.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	53
94	5	aceptamos	приняли (мы)	La semana pasada nosotros aceptamos las condiciones comerciales del proveedor.	На прошлой неделе мы приняли коммерческие условия поставщика.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	53
95	5	aceptábamos	принимали (мы)	Nosotros normalmente aceptábamos las condiciones comerciales del proveedor.	Мы обычно принимали коммерческие условия поставщика.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	53
96	5	aceptasteis	приняли (вы)	¿Ayer vosotros aceptasteis las condiciones comerciales del proveedor?	Вчера вы приняли коммерческие условия поставщика?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	53
97	5	aceptabais	принимали (вы)	¿Antes vosotros aceptabais las condiciones comerciales del proveedor?	Раньше вы регулярно принимали коммерческие условия поставщика?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	53
98	5	aceptaron	приняли (они / Вы)	Esta mañana ellos aceptaron las condiciones comerciales del proveedor.	Сегодня утром они приняли коммерческие условия поставщика.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	53
99	5	aceptaban	принимали (они / Вы)	Ellos habitualmente aceptaban las condiciones comerciales del proveedor.	Они обычно принимали коммерческие условия поставщика.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	53
100	5	acordé	согласовал (я)	Ayer yo acordé el plazo de entrega de dos semanas.	Вчера я согласовал срок поставки в две недели.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	49
101	5	acordaba	согласовывал (я)	Antes yo siempre acordaba el plazo de entrega de dos semanas.	Раньше я регулярно согласовывал срок поставки в две недели.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	49
102	5	acordaste	согласовал (ты)	¿Ayer tú acordaste el plazo de entrega de dos semanas?	Вчера ты согласовал срок поставки в две недели?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	49
103	5	acordabas	согласовывал (ты)	¿Antes tú acordabas el plazo de entrega de dos semanas?	Раньше ты регулярно согласовывал срок поставки в две недели?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	49
104	5	acordó	согласовал (он / Вы)	Ayer el proveedor acordó el plazo de entrega de dos semanas.	Вчера поставщик согласовал срок поставки в две недели.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	49
105	5	acordaba	согласовывал (он / Вы)	El proveedor siempre acordaba el plazo de entrega de dos semanas.	Поставщик всегда согласовывал срок поставки в две недели.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	49
106	5	acordamos	согласовали (мы)	La semana pasada nosotros acordamos el plazo de entrega de dos semanas.	На прошлой неделе мы согласовали срок поставки в две недели.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	49
107	5	acordábamos	согласовывали (мы)	Nosotros normalmente acordábamos el plazo de entrega de dos semanas.	Мы обычно согласовывали срок поставки в две недели.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	49
108	5	acordasteis	согласовали (вы)	¿Ayer vosotros acordasteis el plazo de entrega de dos semanas?	Вчера вы согласовали срок поставки в две недели?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	49
109	5	acordabais	согласовывали (вы)	¿Antes vosotros acordabais el plazo de entrega de dos semanas?	Раньше вы регулярно согласовывали срок поставки в две недели?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	49
110	5	acordaron	согласовали (они / Вы)	Esta mañana ellos acordaron el plazo de entrega de dos semanas.	Сегодня утром они согласовали срок поставки в две недели.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	49
111	5	acordaban	согласовывали (они / Вы)	Ellos habitualmente acordaban el plazo de entrega de dos semanas.	Они обычно согласовывали срок поставки в две недели.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	49
112	5	adjunté	прикрепил (я)	Ayer yo adjunté el catálogo actualizado en formato PDF.	Вчера я прикрепил обновленный каталог в формате PDF.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	35
113	5	adjuntaba	прикреплял (я)	Antes yo siempre adjuntaba el catálogo actualizado en formato PDF.	Раньше я регулярно прикреплял обновленный каталог в формате PDF.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	35
114	5	adjuntaste	прикрепил (ты)	¿Ayer tú adjuntaste el catálogo actualizado en formato PDF?	Вчера ты прикрепил обновленный каталог в формате PDF?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	35
115	5	adjuntabas	прикреплял (ты)	¿Antes tú adjuntabas el catálogo actualizado en formato PDF?	Раньше ты регулярно прикреплял обновленный каталог в формате PDF?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	35
116	5	adjuntó	прикрепил (он / Вы)	Ayer el proveedor adjuntó el catálogo actualizado en formato PDF.	Вчера поставщик прикрепил обновленный каталог в формате PDF.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	35
474	5	pedí	заказал (я)	Ayer yo pedí quinientas unidades del producto estrella.	Вчера я заказал пятьсот единиц флагманского товара.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	16
117	5	adjuntaba	прикреплял (он / Вы)	El proveedor siempre adjuntaba el catálogo actualizado en formato PDF.	Поставщик всегда прикреплял обновленный каталог в формате PDF.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	35
118	5	adjuntamos	прикрепили (мы)	La semana pasada nosotros adjuntamos el catálogo actualizado en formato PDF.	На прошлой неделе мы прикрепили обновленный каталог в формате PDF.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	35
119	5	adjuntábamos	прикрепляли (мы)	Nosotros normalmente adjuntábamos el catálogo actualizado en formato PDF.	Мы обычно прикрепляли обновленный каталог в формате PDF.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	35
120	5	adjuntasteis	прикрепили (вы)	¿Ayer vosotros adjuntasteis el catálogo actualizado en formato PDF?	Вчера вы прикрепили обновленный каталог в формате PDF?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	35
121	5	adjuntabais	прикрепляли (вы)	¿Antes vosotros adjuntabais el catálogo actualizado en formato PDF?	Раньше вы регулярно прикрепляли обновленный каталог в формате PDF?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	35
122	5	adjuntaron	прикрепили (они / Вы)	Esta mañana ellos adjuntaron el catálogo actualizado en formato PDF.	Сегодня утром они прикрепили обновленный каталог в формате PDF.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	35
123	5	adjuntaban	прикрепляли (они / Вы)	Ellos habitualmente adjuntaban el catálogo actualizado en formato PDF.	Они обычно прикрепляли обновленный каталог в формате PDF.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	35
124	5	aseguré	обеспечил (я)	Ayer yo aseguré el transporte seguro de la carga.	Вчера я обеспечил безопасную перевозку груза.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	21
125	5	aseguraba	обеспечивал (я)	Antes yo siempre aseguraba el transporte seguro de la carga.	Раньше я регулярно обеспечивал безопасную перевозку груза.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	21
126	5	aseguraste	обеспечил (ты)	¿Ayer tú aseguraste el transporte seguro de la carga?	Вчера ты обеспечил безопасную перевозку груза?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	21
127	5	asegurabas	обеспечивал (ты)	¿Antes tú asegurabas el transporte seguro de la carga?	Раньше ты регулярно обеспечивал безопасную перевозку груза?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	21
128	5	aseguró	обеспечил (он / Вы)	Ayer el proveedor aseguró el transporte seguro de la carga.	Вчера поставщик обеспечил безопасную перевозку груза.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	21
129	5	aseguraba	обеспечивал (он / Вы)	El proveedor siempre aseguraba el transporte seguro de la carga.	Поставщик всегда обеспечивал безопасную перевозку груза.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	21
130	5	aseguramos	обеспечили (мы)	La semana pasada nosotros aseguramos el transporte seguro de la carga.	На прошлой неделе мы обеспечили безопасную перевозку груза.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	21
131	5	asegurábamos	обеспечивали (мы)	Nosotros normalmente asegurábamos el transporte seguro de la carga.	Мы обычно обеспечивали безопасную перевозку груза.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	21
132	5	asegurasteis	обеспечили (вы)	¿Ayer vosotros asegurasteis el transporte seguro de la carga?	Вчера вы обеспечили безопасную перевозку груза?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	21
133	5	asegurabais	обеспечивали (вы)	¿Antes vosotros asegurabais el transporte seguro de la carga?	Раньше вы регулярно обеспечивали безопасную перевозку груза?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	21
134	5	aseguraron	обеспечили (они / Вы)	Esta mañana ellos aseguraron el transporte seguro de la carga.	Сегодня утром они обеспечили безопасную перевозку груза.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	21
135	5	aseguraban	обеспечивали (они / Вы)	Ellos habitualmente aseguraban el transporte seguro de la carga.	Они обычно обеспечивали безопасную перевозку груза.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	21
136	5	avisé	уведомил (я)	Ayer yo avisé del retraso en la producción al cliente.	Вчера я уведомил клиента о задержке в производстве.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	51
137	5	avisaba	уведомлял (я)	Antes yo siempre avisaba del retraso en la producción al cliente.	Раньше я регулярно уведомлял клиента о задержке в производстве.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	51
138	5	avisaste	уведомил (ты)	¿Ayer tú avisaste del retraso en la producción al cliente?	Вчера ты уведомил клиента о задержке в производстве?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	51
139	5	avisabas	уведомлял (ты)	¿Antes tú avisabas del retraso en la producción al cliente?	Раньше ты регулярно уведомлял клиента о задержке в производстве?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	51
140	5	avisó	уведомил (он / Вы)	Ayer el proveedor avisó del retraso en la producción al cliente.	Вчера поставщик уведомил клиента о задержке в производстве.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	51
141	5	avisaba	уведомлял (он / Вы)	El proveedor siempre avisaba del retraso en la producción al cliente.	Поставщик всегда уведомлял клиента о задержке в производстве.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	51
142	5	avisamos	уведомили (мы)	La semana pasada nosotros avisamos del retraso en la producción al cliente.	На прошлой неделе мы уведомили клиента о задержке в производстве.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	51
143	5	avisábamos	уведомляли (мы)	Nosotros normalmente avisábamos del retraso en la producción al cliente.	Мы обычно уведомляли клиента о задержке в производстве.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	51
144	5	avisasteis	уведомили (вы)	¿Ayer vosotros avisasteis del retraso en la producción al cliente?	Вчера вы уведомили клиента о задержке в производстве?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	51
145	5	avisabais	уведомляли (вы)	¿Antes vosotros avisabais del retraso en la producción al cliente?	Раньше вы регулярно уведомляли клиента о задержке в производстве?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	51
146	5	avisaron	уведомили (они / Вы)	Esta mañana ellos avisaron del retraso en la producción al cliente.	Сегодня утром они уведомили клиента о задержке в производстве.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	51
147	5	avisaban	уведомляли (они / Вы)	Ellos habitualmente avisaban del retraso en la producción al cliente.	Они обычно уведомляли клиента о задержке в производстве.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	51
148	5	cobré	взыскал (я)	Ayer yo cobré los gastos de envío acordados.	Вчера я взыскал согласованные расходы на доставку.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	23
149	5	cobraba	взимал (я)	Antes yo siempre cobraba los gastos de envío acordados.	Раньше я регулярно взимал согласованные расходы на доставку.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	23
150	5	cobraste	взыскал (ты)	¿Ayer tú cobraste los gastos de envío acordados?	Вчера ты взыскал согласованные расходы на доставку?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	23
151	5	cobrabas	взимал (ты)	¿Antes tú cobrabas los gastos de envío acordados?	Раньше ты регулярно взимал согласованные расходы на доставку?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	23
152	5	cobró	взыскал (он / Вы)	Ayer el proveedor cobró los gastos de envío acordados.	Вчера поставщик взыскал согласованные расходы на доставку.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	23
153	5	cobraba	взимал (он / Вы)	El proveedor siempre cobraba los gastos de envío acordados.	Поставщик всегда взимал согласованные расходы на доставку.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	23
154	5	cobramos	взыскали (мы)	La semana pasada nosotros cobramos los gastos de envío acordados.	На прошлой неделе мы взыскали согласованные расходы на доставку.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	23
155	5	cobrábamos	взимали (мы)	Nosotros normalmente cobrábamos los gastos de envío acordados.	Мы обычно взимали согласованные расходы на доставку.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	23
156	5	cobrasteis	взыскали (вы)	¿Ayer vosotros cobrasteis los gastos de envío acordados?	Вчера вы взыскали согласованные расходы на доставку?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	23
157	5	cobrabais	взимали (вы)	¿Antes vosotros cobrabais los gastos de envío acordados?	Раньше вы регулярно взимали согласованные расходы на доставку?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	23
158	5	cobraron	взыскали (они / Вы)	Esta mañana ellos cobraron los gastos de envío acordados.	Сегодня утром они взыскали согласованные расходы на доставку.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	23
159	5	cobraban	взимали (они / Вы)	Ellos habitualmente cobraban los gastos de envío acordados.	Они обычно взимали согласованные расходы на доставку.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	23
160	5	compré	купил (я)	Ayer yo compré un lote grande con descuento por volumen.	Вчера я купил крупную партию со скидкой за объем.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	27
161	5	compraba	покупал (я)	Antes yo siempre compraba un lote grande con descuento por volumen.	Раньше я регулярно покупал крупную партию со скидкой за объем.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	27
162	5	compraste	купил (ты)	¿Ayer tú compraste un lote grande con descuento por volumen?	Вчера ты купил крупную партию со скидкой за объем?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	27
163	5	comprabas	покупал (ты)	¿Antes tú comprabas un lote grande con descuento por volumen?	Раньше ты регулярно покупал крупную партию со скидкой за объем?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	27
164	5	compró	купил (он / Вы)	Ayer el proveedor compró un lote grande con descuento por volumen.	Вчера поставщик купил крупную партию со скидкой за объем.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	27
165	5	compraba	покупал (он / Вы)	El proveedor siempre compraba un lote grande con descuento por volumen.	Поставщик всегда покупал крупную партию со скидкой за объем.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	27
166	5	compramos	купили (мы)	La semana pasada nosotros compramos un lote grande con descuento por volumen.	На прошлой неделе мы купили крупную партию со скидкой за объем.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	27
167	5	comprábamos	покупали (мы)	Nosotros normalmente comprábamos un lote grande con descuento por volumen.	Мы обычно покупали крупную партию со скидкой за объем.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	27
168	5	comprasteis	купили (вы)	¿Ayer vosotros comprasteis un lote grande con descuento por volumen?	Вчера вы купили крупную партию со скидкой за объем?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	27
169	5	comprabais	покупали (вы)	¿Antes vosotros comprabais un lote grande con descuento por volumen?	Раньше вы регулярно покупали крупную партию со скидкой за объем?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	27
170	5	compraron	купили (они / Вы)	Esta mañana ellos compraron un lote grande con descuento por volumen.	Сегодня утром они купили крупную партию со скидкой за объем.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	27
171	5	compraban	покупали (они / Вы)	Ellos habitualmente compraban un lote grande con descuento por volumen.	Они обычно покупали крупную партию со скидкой за объем.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	27
172	5	comprobé	проверил (я)	Ayer yo comprobé el código EAN en el embalaje exterior.	Вчера я проверил штрихкод EAN на внешней упаковке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	18
173	5	comprobaba	проверял (я)	Antes yo siempre comprobaba el código EAN en el embalaje exterior.	Раньше я регулярно проверял штрихкод EAN на внешней упаковке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	18
174	5	comprobaste	проверил (ты)	¿Ayer tú comprobaste el código EAN en el embalaje exterior?	Вчера ты проверил штрихкод EAN на внешней упаковке?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	18
175	5	comprobabas	проверял (ты)	¿Antes tú comprobabas el código EAN en el embalaje exterior?	Раньше ты регулярно проверял штрихкод EAN на внешней упаковке?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	18
176	5	comprobó	проверил (он / Вы)	Ayer el proveedor comprobó el código EAN en el embalaje exterior.	Вчера поставщик проверил штрихкод EAN на внешней упаковке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	18
177	5	comprobaba	проверял (он / Вы)	El proveedor siempre comprobaba el código EAN en el embalaje exterior.	Поставщик всегда проверял штрихкод EAN на внешней упаковке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	18
178	5	comprobamos	проверили (мы)	La semana pasada nosotros comprobamos el código EAN en el embalaje exterior.	На прошлой неделе мы проверили штрихкод EAN на внешней упаковке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	18
179	5	comprobábamos	проверяли (мы)	Nosotros normalmente comprobábamos el código EAN en el embalaje exterior.	Мы обычно проверяли штрихкод EAN на внешней упаковке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	18
180	5	comprobasteis	проверили (вы)	¿Ayer vosotros comprobasteis el código EAN en el embalaje exterior?	Вчера вы проверили штрихкод EAN на внешней упаковке?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	18
181	5	comprobabais	проверяли (вы)	¿Antes vosotros comprobabais el código EAN en el embalaje exterior?	Раньше вы регулярно проверяли штрихкод EAN на внешней упаковке?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	18
182	5	comprobaron	проверили (они / Вы)	Esta mañana ellos comprobaron el código EAN en el embalaje exterior.	Сегодня утром они проверили штрихкод EAN на внешней упаковке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	18
183	5	comprobaban	проверяли (они / Вы)	Ellos habitualmente comprobaban el código EAN en el embalaje exterior.	Они обычно проверяли штрихкод EAN на внешней упаковке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	18
184	5	confirmé	подтвердил (я)	Ayer yo confirmé la orden de compra por correo escrito.	Вчера я подтвердил заказ на поставку в письменном виде.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	37
185	5	confirmaba	подтверждал (я)	Antes yo siempre confirmaba la orden de compra por correo escrito.	Раньше я регулярно подтверждал заказ на поставку в письменном виде.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	37
186	5	confirmaste	подтвердил (ты)	¿Ayer tú confirmaste la orden de compra por correo escrito?	Вчера ты подтвердил заказ на поставку в письменном виде?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	37
187	5	confirmabas	подтверждал (ты)	¿Antes tú confirmabas la orden de compra por correo escrito?	Раньше ты регулярно подтверждал заказ на поставку в письменном виде?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	37
188	5	confirmó	подтвердил (он / Вы)	Ayer el proveedor confirmó la orden de compra por correo escrito.	Вчера поставщик подтвердил заказ на поставку в письменном виде.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	37
189	5	confirmaba	подтверждал (он / Вы)	El proveedor siempre confirmaba la orden de compra por correo escrito.	Поставщик всегда подтверждал заказ на поставку в письменном виде.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	37
190	5	confirmamos	подтвердили (мы)	La semana pasada nosotros confirmamos la orden de compra por correo escrito.	На прошлой неделе мы подтвердили заказ на поставку в письменном виде.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	37
191	5	confirmábamos	подтверждали (мы)	Nosotros normalmente confirmábamos la orden de compra por correo escrito.	Мы обычно подтверждали заказ на поставку в письменном виде.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	37
192	5	confirmasteis	подтвердили (вы)	¿Ayer vosotros confirmasteis la orden de compra por correo escrito?	Вчера вы подтвердили заказ на поставку в письменном виде?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	37
193	5	confirmabais	подтверждали (вы)	¿Antes vosotros confirmabais la orden de compra por correo escrito?	Раньше вы регулярно подтверждали заказ на поставку в письменном виде?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	37
194	5	confirmaron	подтвердили (они / Вы)	Esta mañana ellos confirmaron la orden de compra por correo escrito.	Сегодня утром они подтвердили заказ на поставку в письменном виде.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	37
195	5	confirmaban	подтверждали (они / Вы)	Ellos habitualmente confirmaban la orden de compra por correo escrito.	Они обычно подтверждали заказ на поставку в письменном виде.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	37
196	5	contacté	связался (я)	Ayer yo contacté con el responsable del departamento de compras.	Вчера я связался с ответственным сотрудником отдела закупок.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	25
197	5	contactaba	связывался (я)	Antes yo siempre contactaba con el responsable del departamento de compras.	Раньше я регулярно связывался с ответственным сотрудником отдела закупок.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	25
198	5	contactaste	связался (ты)	¿Ayer tú contactaste con el responsable del departamento de compras?	Вчера ты связался с ответственным сотрудником отдела закупок?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	25
199	5	contactabas	связывался (ты)	¿Antes tú contactabas con el responsable del departamento de compras?	Раньше ты регулярно связывался с ответственным сотрудником отдела закупок?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	25
200	5	contactó	связался (он / Вы)	Ayer el proveedor contactó con el responsable del departamento de compras.	Вчера поставщик связался с ответственным сотрудником отдела закупок.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	25
201	5	contactaba	связывался (он / Вы)	El proveedor siempre contactaba con el responsable del departamento de compras.	Поставщик всегда связывался с ответственным сотрудником отдела закупок.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	25
202	5	contactamos	связались (мы)	La semana pasada nosotros contactamos con el responsable del departamento de compras.	На прошлой неделе мы связались с ответственным сотрудником отдела закупок.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	25
203	5	contactábamos	связывались (мы)	Nosotros normalmente contactábamos con el responsable del departamento de compras.	Мы обычно связывались с ответственным сотрудником отдела закупок.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	25
204	5	contactasteis	связались (вы)	¿Ayer vosotros contactasteis con el responsable del departamento de compras?	Вчера вы связались с ответственным сотрудником отдела закупок?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	25
205	5	contactabais	связывались (вы)	¿Antes vosotros contactabais con el responsable del departamento de compras?	Раньше вы регулярно связывались с ответственным сотрудником отдела закупок?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	25
206	5	contactaron	связались (они / Вы)	Esta mañana ellos contactaron con el responsable del departamento de compras.	Сегодня утром они связались с ответственным сотрудником отдела закупок.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	25
207	5	contactaban	связывались (они / Вы)	Ellos habitualmente contactaban con el responsable del departamento de compras.	Они обычно связывались с ответственным сотрудником отдела закупок.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	25
208	5	costé	обошёлся (я)	Ayer yo costé menos gracias al descuento comercial.	Вчера я обошёлся дешевле благодаря коммерческой скидке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	47
209	5	costaba	стоил (я)	Antes yo siempre costaba menos gracias al descuento comercial.	Раньше я регулярно стоил дешевле благодаря коммерческой скидке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	47
210	5	costaste	обошёлся (ты)	¿Ayer tú costaste menos gracias al descuento comercial?	Вчера ты обошёлся дешевле благодаря коммерческой скидке?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	47
211	5	costabas	стоил (ты)	¿Antes tú costabas menos gracias al descuento comercial?	Раньше ты регулярно стоил дешевле благодаря коммерческой скидке?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	47
212	5	costó	обошёлся (он / Вы)	Ayer el proveedor costó menos gracias al descuento comercial.	Вчера поставщик обошёлся дешевле благодаря коммерческой скидке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	47
213	5	costaba	стоил (он / Вы)	El proveedor siempre costaba menos gracias al descuento comercial.	Поставщик всегда стоил дешевле благодаря коммерческой скидке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	47
214	5	costamos	обошлись (мы)	La semana pasada nosotros costamos menos gracias al descuento comercial.	На прошлой неделе мы обошлись дешевле благодаря коммерческой скидке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	47
215	5	costábamos	стоили (мы)	Nosotros normalmente costábamos menos gracias al descuento comercial.	Мы обычно стоили дешевле благодаря коммерческой скидке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	47
216	5	costasteis	обошлись (вы)	¿Ayer vosotros costasteis menos gracias al descuento comercial?	Вчера вы обошлись дешевле благодаря коммерческой скидке?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	47
217	5	costabais	стоили (вы)	¿Antes vosotros costabais menos gracias al descuento comercial?	Раньше вы регулярно стоили дешевле благодаря коммерческой скидке?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	47
218	5	costaron	обошлись (они / Вы)	Esta mañana ellos costaron menos gracias al descuento comercial.	Сегодня утром они обошлись дешевле благодаря коммерческой скидке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	47
219	5	costaban	стоили (они / Вы)	Ellos habitualmente costaban menos gracias al descuento comercial.	Они обычно стоили дешевле благодаря коммерческой скидке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	47
220	5	cumplí	выполнил (я)	Ayer yo cumplí todos los plazos de entrega acordados.	Вчера я выполнил все согласованные сроки поставки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	38
221	5	cumplía	выполнял (я)	Antes yo siempre cumplía todos los plazos de entrega acordados.	Раньше я регулярно выполнял все согласованные сроки поставки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	38
222	5	cumpliste	выполнил (ты)	¿Ayer tú cumpliste todos los plazos de entrega acordados?	Вчера ты выполнил все согласованные сроки поставки?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	38
223	5	cumplías	выполнял (ты)	¿Antes tú cumplías todos los plazos de entrega acordados?	Раньше ты регулярно выполнял все согласованные сроки поставки?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	38
224	5	cumplió	выполнил (он / Вы)	Ayer el proveedor cumplió todos los plazos de entrega acordados.	Вчера поставщик выполнил все согласованные сроки поставки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	38
225	5	cumplía	выполнял (он / Вы)	El proveedor siempre cumplía todos los plazos de entrega acordados.	Поставщик всегда выполнял все согласованные сроки поставки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	38
226	5	cumplimos	выполнили (мы)	La semana pasada nosotros cumplimos todos los plazos de entrega acordados.	На прошлой неделе мы выполнили все согласованные сроки поставки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	38
227	5	cumplíamos	выполняли (мы)	Nosotros normalmente cumplíamos todos los plazos de entrega acordados.	Мы обычно выполняли все согласованные сроки поставки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	38
228	5	cumplisteis	выполнили (вы)	¿Ayer vosotros cumplisteis todos los plazos de entrega acordados?	Вчера вы выполнили все согласованные сроки поставки?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	38
229	5	cumplíais	выполняли (вы)	¿Antes vosotros cumplíais todos los plazos de entrega acordados?	Раньше вы регулярно выполняли все согласованные сроки поставки?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	38
230	5	cumplieron	выполнили (они / Вы)	Esta mañana ellos cumplieron todos los plazos de entrega acordados.	Сегодня утром они выполнили все согласованные сроки поставки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	38
231	5	cumplían	выполняли (они / Вы)	Ellos habitualmente cumplían todos los plazos de entrega acordados.	Они обычно выполняли все согласованные сроки поставки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	38
232	5	decidí	решил (я)	Ayer yo decidí el volumen del pedido para el próximo trimestre.	Вчера я решил объём заказа на следующий квартал.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	11
233	5	decidía	решал (я)	Antes yo siempre decidía el volumen del pedido para el próximo trimestre.	Раньше я регулярно решал объём заказа на следующий квартал.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	11
234	5	decidiste	решил (ты)	¿Ayer tú decidiste el volumen del pedido para el próximo trimestre?	Вчера ты решил объём заказа на следующий квартал?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	11
235	5	decidías	решал (ты)	¿Antes tú decidías el volumen del pedido para el próximo trimestre?	Раньше ты регулярно решал объём заказа на следующий квартал?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	11
236	5	decidió	решил (он / Вы)	Ayer el proveedor decidió el volumen del pedido para el próximo trimestre.	Вчера поставщик решил объём заказа на следующий квартал.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	11
237	5	decidía	решал (он / Вы)	El proveedor siempre decidía el volumen del pedido para el próximo trimestre.	Поставщик всегда решал объём заказа на следующий квартал.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	11
238	5	decidimos	решили (мы)	La semana pasada nosotros decidimos el volumen del pedido para el próximo trimestre.	На прошлой неделе мы решили объём заказа на следующий квартал.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	11
239	5	decidíamos	решали (мы)	Nosotros normalmente decidíamos el volumen del pedido para el próximo trimestre.	Мы обычно решали объём заказа на следующий квартал.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	11
240	5	decidisteis	решили (вы)	¿Ayer vosotros decidisteis el volumen del pedido para el próximo trimestre?	Вчера вы решили объём заказа на следующий квартал?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	11
241	5	decidíais	решали (вы)	¿Antes vosotros decidíais el volumen del pedido para el próximo trimestre?	Раньше вы регулярно решали объём заказа на следующий квартал?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	11
242	5	decidieron	решили (они / Вы)	Esta mañana ellos decidieron el volumen del pedido para el próximo trimestre.	Сегодня утром они решили объём заказа на следующий квартал.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	11
243	5	decidían	решали (они / Вы)	Ellos habitualmente decidían el volumen del pedido para el próximo trimestre.	Они обычно решали объём заказа на следующий квартал.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	11
244	5	despaché	отправил (я)	Ayer yo despaché el contenedor completo desde el puerto.	Вчера я отправил целый контейнер из порта.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	40
245	5	despachaba	отправлял (я)	Antes yo siempre despachaba el contenedor completo desde el puerto.	Раньше я регулярно отправлял целый контейнер из порта.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	40
246	5	despachaste	отправил (ты)	¿Ayer tú despachaste el contenedor completo desde el puerto?	Вчера ты отправил целый контейнер из порта?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	40
247	5	despachabas	отправлял (ты)	¿Antes tú despachabas el contenedor completo desde el puerto?	Раньше ты регулярно отправлял целый контейнер из порта?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	40
248	5	despachó	отправил (он / Вы)	Ayer el proveedor despachó el contenedor completo desde el puerto.	Вчера поставщик отправил целый контейнер из порта.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	40
249	5	despachaba	отправлял (он / Вы)	El proveedor siempre despachaba el contenedor completo desde el puerto.	Поставщик всегда отправлял целый контейнер из порта.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	40
250	5	despachamos	отправили (мы)	La semana pasada nosotros despachamos el contenedor completo desde el puerto.	На прошлой неделе мы отправили целый контейнер из порта.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	40
251	5	despachábamos	отправляли (мы)	Nosotros normalmente despachábamos el contenedor completo desde el puerto.	Мы обычно отправляли целый контейнер из порта.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	40
252	5	despachasteis	отправили (вы)	¿Ayer vosotros despachasteis el contenedor completo desde el puerto?	Вчера вы отправили целый контейнер из порта?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	40
253	5	despachabais	отправляли (вы)	¿Antes vosotros despachabais el contenedor completo desde el puerto?	Раньше вы регулярно отправляли целый контейнер из порта?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	40
254	5	despacharon	отправили (они / Вы)	Esta mañana ellos despacharon el contenedor completo desde el puerto.	Сегодня утром они отправили целый контейнер из порта.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	40
255	5	despachaban	отправляли (они / Вы)	Ellos habitualmente despachaban el contenedor completo desde el puerto.	Они обычно отправляли целый контейнер из порта.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	40
256	5	devolví	вернул (я)	Ayer yo devolví la mercancía dañada al almacén central.	Вчера я вернул повреждённый товар на центральный склад.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	32
257	5	devolvía	возвращал (я)	Antes yo siempre devolvía la mercancía dañada al almacén central.	Раньше я регулярно возвращал повреждённый товар на центральный склад.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	32
258	5	devolviste	вернул (ты)	¿Ayer tú devolviste la mercancía dañada al almacén central?	Вчера ты вернул повреждённый товар на центральный склад?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	32
259	5	devolvías	возвращал (ты)	¿Antes tú devolvías la mercancía dañada al almacén central?	Раньше ты регулярно возвращал повреждённый товар на центральный склад?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	32
607	5	revisaste	проверил (ты)	¿Ayer tú revisaste las cláusulas del contrato antes de firmar?	Вчера ты проверил пункты договора перед подписанием?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	33
260	5	devolvió	вернул (он / Вы)	Ayer el proveedor devolvió la mercancía dañada al almacén central.	Вчера поставщик вернул повреждённый товар на центральный склад.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	32
261	5	devolvía	возвращал (он / Вы)	El proveedor siempre devolvía la mercancía dañada al almacén central.	Поставщик всегда возвращал повреждённый товар на центральный склад.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	32
262	5	devolvimos	вернули (мы)	La semana pasada nosotros devolvimos la mercancía dañada al almacén central.	На прошлой неделе мы вернули повреждённый товар на центральный склад.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	32
263	5	devolvíamos	возвращали (мы)	Nosotros normalmente devolvíamos la mercancía dañada al almacén central.	Мы обычно возвращали повреждённый товар на центральный склад.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	32
264	5	devolvisteis	вернули (вы)	¿Ayer vosotros devolvisteis la mercancía dañada al almacén central?	Вчера вы вернули повреждённый товар на центральный склад?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	32
265	5	devolvíais	возвращали (вы)	¿Antes vosotros devolvíais la mercancía dañada al almacén central?	Раньше вы регулярно возвращали повреждённый товар на центральный склад?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	32
266	5	devolvieron	вернули (они / Вы)	Esta mañana ellos devolvieron la mercancía dañada al almacén central.	Сегодня утром они вернули повреждённый товар на центральный склад.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	32
267	5	devolvían	возвращали (они / Вы)	Ellos habitualmente devolvían la mercancía dañada al almacén central.	Они обычно возвращали повреждённый товар на центральный склад.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	32
268	5	entregué	доставил (я)	Ayer yo entregué los paquetes a tiempo en destino.	Вчера я доставил посылки вовремя в пункт назначения.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	29
269	5	entregaba	доставлял (я)	Antes yo siempre entregaba los paquetes a tiempo en destino.	Раньше я регулярно доставлял посылки вовремя в пункт назначения.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	29
270	5	entregaste	доставил (ты)	¿Ayer tú entregaste los paquetes a tiempo en destino?	Вчера ты доставил посылки вовремя в пункт назначения?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	29
271	5	entregabas	доставлял (ты)	¿Antes tú entregabas los paquetes a tiempo en destino?	Раньше ты регулярно доставлял посылки вовремя в пункт назначения?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	29
272	5	entregó	доставил (он / Вы)	Ayer el proveedor entregó los paquetes a tiempo en destino.	Вчера поставщик доставил посылки вовремя в пункт назначения.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	29
273	5	entregaba	доставлял (он / Вы)	El proveedor siempre entregaba los paquetes a tiempo en destino.	Поставщик всегда доставлял посылки вовремя в пункт назначения.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	29
274	5	entregamos	доставили (мы)	La semana pasada nosotros entregamos los paquetes a tiempo en destino.	На прошлой неделе мы доставили посылки вовремя в пункт назначения.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	29
275	5	entregábamos	доставляли (мы)	Nosotros normalmente entregábamos los paquetes a tiempo en destino.	Мы обычно доставляли посылки вовремя в пункт назначения.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	29
276	5	entregasteis	доставили (вы)	¿Ayer vosotros entregasteis los paquetes a tiempo en destino?	Вчера вы доставили посылки вовремя в пункт назначения?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	29
277	5	entregabais	доставляли (вы)	¿Antes vosotros entregabais los paquetes a tiempo en destino?	Раньше вы регулярно доставляли посылки вовремя в пункт назначения?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	29
278	5	recibiste	получил (ты)	¿Ayer tú recibiste el albarán de entrega debidamente sellado?	Вчера ты получил товарную накладную с круглой печатью?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	31
279	5	entregaron	доставили (они / Вы)	Esta mañana ellos entregaron los paquetes a tiempo en destino.	Сегодня утром они доставили посылки вовремя в пункт назначения.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	29
280	5	entregaban	доставляли (они / Вы)	Ellos habitualmente entregaban los paquetes a tiempo en destino.	Они обычно доставляли посылки вовремя в пункт назначения.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	29
281	5	envié	отправил (я)	Ayer yo envié la factura proforma actualizada al cliente.	Вчера я отправил обновленный предварительный счёт клиенту.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	48
282	5	enviaba	отправлял (я)	Antes yo siempre enviaba la factura proforma actualizada al cliente.	Раньше я регулярно отправлял обновленный предварительный счёт клиенту.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	48
283	5	enviaste	отправил (ты)	¿Ayer tú enviaste la factura proforma actualizada al cliente?	Вчера ты отправил обновленный предварительный счёт клиенту?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	48
284	5	enviabas	отправлял (ты)	¿Antes tú enviabas la factura proforma actualizada al cliente?	Раньше ты регулярно отправлял обновленный предварительный счёт клиенту?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	48
285	5	envió	отправил (он / Вы)	Ayer el proveedor envió la factura proforma actualizada al cliente.	Вчера поставщик отправил обновленный предварительный счёт клиенту.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	48
286	5	enviaba	отправлял (он / Вы)	El proveedor siempre enviaba la factura proforma actualizada al cliente.	Поставщик всегда отправлял обновленный предварительный счёт клиенту.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	48
287	5	enviamos	отправили (мы)	La semana pasada nosotros enviamos la factura proforma actualizada al cliente.	На прошлой неделе мы отправили обновленный предварительный счёт клиенту.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	48
288	5	enviábamos	отправляли (мы)	Nosotros normalmente enviábamos la factura proforma actualizada al cliente.	Мы обычно отправляли обновленный предварительный счёт клиенту.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	48
289	5	enviasteis	отправили (вы)	¿Ayer vosotros enviasteis la factura proforma actualizada al cliente?	Вчера вы отправили обновленный предварительный счёт клиенту?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	48
290	5	enviabais	отправляли (вы)	¿Antes vosotros enviabais la factura proforma actualizada al cliente?	Раньше вы регулярно отправляли обновленный предварительный счёт клиенту?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	48
291	5	enviaron	отправили (они / Вы)	Esta mañana ellos enviaron la factura proforma actualizada al cliente.	Сегодня утром они отправили обновленный предварительный счёт клиенту.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	48
292	5	enviaban	отправляли (они / Вы)	Ellos habitualmente enviaban la factura proforma actualizada al cliente.	Они обычно отправляли обновленный предварительный счёт клиенту.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	48
293	5	esperé	дождался (я)	Ayer yo esperé la confirmación oficial del fabricante.	Вчера я дождался официального подтверждения от производителя.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	41
294	5	esperaba	ожидал (я)	Antes yo siempre esperaba la confirmación oficial del fabricante.	Раньше я регулярно ожидал официального подтверждения от производителя.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	41
295	5	esperaste	дождался (ты)	¿Ayer tú esperaste la confirmación oficial del fabricante?	Вчера ты дождался официального подтверждения от производителя?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	41
296	5	esperabas	ожидал (ты)	¿Antes tú esperabas la confirmación oficial del fabricante?	Раньше ты регулярно ожидал официального подтверждения от производителя?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	41
297	5	esperó	дождался (он / Вы)	Ayer el proveedor esperó la confirmación oficial del fabricante.	Вчера поставщик дождался официального подтверждения от производителя.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	41
298	5	esperaba	ожидал (он / Вы)	El proveedor siempre esperaba la confirmación oficial del fabricante.	Поставщик всегда ожидал официального подтверждения от производителя.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	41
299	5	esperamos	дождались (мы)	La semana pasada nosotros esperamos la confirmación oficial del fabricante.	На прошлой неделе мы дождались официального подтверждения от производителя.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	41
300	5	esperábamos	ожидали (мы)	Nosotros normalmente esperábamos la confirmación oficial del fabricante.	Мы обычно ожидали официального подтверждения от производителя.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	41
301	5	esperasteis	дождались (вы)	¿Ayer vosotros esperasteis la confirmación oficial del fabricante?	Вчера вы дождались официального подтверждения от производителя?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	41
302	5	esperabais	ожидали (вы)	¿Antes vosotros esperabais la confirmación oficial del fabricante?	Раньше вы регулярно ожидали официального подтверждения от производителя?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	41
303	5	esperaron	дождались (они / Вы)	Esta mañana ellos esperaron la confirmación oficial del fabricante.	Сегодня утром они дождались официального подтверждения от производителя.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	41
304	5	esperaban	ожидали (они / Вы)	Ellos habitualmente esperaban la confirmación oficial del fabricante.	Они обычно ожидали официального подтверждения от производителя.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	41
305	5	exporté	экспортировал (я)	Ayer yo exporté productos a más de veinte países europeos.	Вчера я экспортировал товары в более чем двадцать европейских стран.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	43
306	5	exportaba	экспортировал (я)	Antes yo siempre exportaba productos a más de veinte países europeos.	Раньше я регулярно экспортировал товары в более чем двадцать европейских стран.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	43
307	5	exportaste	экспортировал (ты)	¿Ayer tú exportaste productos a más de veinte países europeos?	Вчера ты экспортировал товары в более чем двадцать европейских стран?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	43
308	5	exportabas	экспортировал (ты)	¿Antes tú exportabas productos a más de veinte países europeos?	Раньше ты регулярно экспортировал товары в более чем двадцать европейских стран?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	43
309	5	exportó	экспортировал (он / Вы)	Ayer el proveedor exportó productos a más de veinte países europeos.	Вчера поставщик экспортировал товары в более чем двадцать европейских стран.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	43
310	5	exportaba	экспортировал (он / Вы)	El proveedor siempre exportaba productos a más de veinte países europeos.	Поставщик всегда экспортировал товары в более чем двадцать европейских стран.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	43
311	5	exportamos	экспортировали (мы)	La semana pasada nosotros exportamos productos a más de veinte países europeos.	На прошлой неделе мы экспортировали товары в более чем двадцать европейских стран.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	43
312	5	exportábamos	экспортировали (мы)	Nosotros normalmente exportábamos productos a más de veinte países europeos.	Мы обычно экспортировали товары в более чем двадцать европейских стран.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	43
313	5	exportasteis	экспортировали (вы)	¿Ayer vosotros exportasteis productos a más de veinte países europeos?	Вчера вы экспортировали товары в более чем двадцать европейских стран?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	43
314	5	exportabais	экспортировали (вы)	¿Antes vosotros exportabais productos a más de veinte países europeos?	Раньше вы регулярно экспортировали товары в более чем двадцать европейских стран?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	43
315	5	exportaron	экспортировали (они / Вы)	Esta mañana ellos exportaron productos a más de veinte países europeos.	Сегодня утром они экспортировали товары в более чем двадцать европейских стран.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	43
316	5	exportaban	экспортировали (они / Вы)	Ellos habitualmente exportaban productos a más de veinte países europeos.	Они обычно экспортировали товары в более чем двадцать европейских стран.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	43
317	5	fabriqué	изготовил (я)	Ayer yo fabriqué las piezas bajo pedido en la planta local.	Вчера я изготовил детали под заказ на местном заводе.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	5
318	5	fabricaba	изготавливал (я)	Antes yo siempre fabricaba las piezas bajo pedido en la planta local.	Раньше я регулярно изготавливал детали под заказ на местном заводе.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	5
319	5	fabricaste	изготовил (ты)	¿Ayer tú fabricaste las piezas bajo pedido en la planta local?	Вчера ты изготовил детали под заказ на местном заводе?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	5
320	5	fabricabas	изготавливал (ты)	¿Antes tú fabricabas las piezas bajo pedido en la planta local?	Раньше ты регулярно изготавливал детали под заказ на местном заводе?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	5
321	5	fabricó	изготовил (он / Вы)	Ayer el proveedor fabricó las piezas bajo pedido en la planta local.	Вчера поставщик изготовил детали под заказ на местном заводе.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	5
322	5	fabricaba	изготавливал (он / Вы)	El proveedor siempre fabricaba las piezas bajo pedido en la planta local.	Поставщик всегда изготавливал детали под заказ на местном заводе.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	5
323	5	fabricamos	изготовили (мы)	La semana pasada nosotros fabricamos las piezas bajo pedido en la planta local.	На прошлой неделе мы изготовили детали под заказ на местном заводе.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	5
324	5	fabricábamos	изготавливали (мы)	Nosotros normalmente fabricábamos las piezas bajo pedido en la planta local.	Мы обычно изготавливали детали под заказ на местном заводе.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	5
325	5	fabricasteis	изготовили (вы)	¿Ayer vosotros fabricasteis las piezas bajo pedido en la planta local?	Вчера вы изготовили детали под заказ на местном заводе?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	5
326	5	fabricabais	изготавливали (вы)	¿Antes vosotros fabricabais las piezas bajo pedido en la planta local?	Раньше вы регулярно изготавливали детали под заказ на местном заводе?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	5
327	5	fabricaron	изготовили (они / Вы)	Esta mañana ellos fabricaron las piezas bajo pedido en la planta local.	Сегодня утром они изготовили детали под заказ на местном заводе.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	5
328	5	fabricaban	изготавливали (они / Вы)	Ellos habitualmente fabricaban las piezas bajo pedido en la planta local.	Они обычно изготавливали детали под заказ на местном заводе.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	5
329	5	facturé	выставил счёт на (я)	Ayer yo facturé el pedido con el IVA correspondiente.	Вчера я выставил счёт на заказ с соответствующим НДС.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	26
330	5	facturaba	выставлял счёт на (я)	Antes yo siempre facturaba el pedido con el IVA correspondiente.	Раньше я регулярно выставлял счёт на заказ с соответствующим НДС.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	26
331	5	facturaste	выставил счёт на (ты)	¿Ayer tú facturaste el pedido con el IVA correspondiente?	Вчера ты выставил счёт на заказ с соответствующим НДС?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	26
332	5	facturabas	выставлял счёт на (ты)	¿Antes tú facturabas el pedido con el IVA correspondiente?	Раньше ты регулярно выставлял счёт на заказ с соответствующим НДС?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	26
333	5	facturó	выставил счёт на (он / Вы)	Ayer el proveedor facturó el pedido con el IVA correspondiente.	Вчера поставщик выставил счёт на заказ с соответствующим НДС.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	26
334	5	facturaba	выставлял счёт на (он / Вы)	El proveedor siempre facturaba el pedido con el IVA correspondiente.	Поставщик всегда выставлял счёт на заказ с соответствующим НДС.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	26
335	5	facturamos	выставили счёт на (мы)	La semana pasada nosotros facturamos el pedido con el IVA correspondiente.	На прошлой неделе мы выставили счёт на заказ с соответствующим НДС.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	26
336	5	facturábamos	выставляли счёт на (мы)	Nosotros normalmente facturábamos el pedido con el IVA correspondiente.	Мы обычно выставляли счёт на заказ с соответствующим НДС.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	26
337	5	facturasteis	выставили счёт на (вы)	¿Ayer vosotros facturasteis el pedido con el IVA correspondiente?	Вчера вы выставили счёт на заказ с соответствующим НДС?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	26
338	5	facturabais	выставляли счёт на (вы)	¿Antes vosotros facturabais el pedido con el IVA correspondiente?	Раньше вы регулярно выставляли счёт на заказ с соответствующим НДС?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	26
339	5	facturaron	выставили счёт на (они / Вы)	Esta mañana ellos facturaron el pedido con el IVA correspondiente.	Сегодня утром они выставили счёт на заказ с соответствующим НДС.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	26
340	5	facturaban	выставляли счёт на (они / Вы)	Ellos habitualmente facturaban el pedido con el IVA correspondiente.	Они обычно выставляли счёт на заказ с соответствующим НДС.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	26
341	5	firmé	подписал (я)	Ayer yo firmé el acuerdo marco de distribución exclusiva.	Вчера я подписал рамочный договор об эксклюзивной дистрибуции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	46
342	5	firmaba	подписывал (я)	Antes yo siempre firmaba el acuerdo marco de distribución exclusiva.	Раньше я регулярно подписывал рамочный договор об эксклюзивной дистрибуции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	46
343	5	firmaste	подписал (ты)	¿Ayer tú firmaste el acuerdo marco de distribución exclusiva?	Вчера ты подписал рамочный договор об эксклюзивной дистрибуции?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	46
344	5	firmabas	подписывал (ты)	¿Antes tú firmabas el acuerdo marco de distribución exclusiva?	Раньше ты регулярно подписывал рамочный договор об эксклюзивной дистрибуции?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	46
345	5	firmó	подписал (он / Вы)	Ayer el proveedor firmó el acuerdo marco de distribución exclusiva.	Вчера поставщик подписал рамочный договор об эксклюзивной дистрибуции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	46
346	5	firmaba	подписывал (он / Вы)	El proveedor siempre firmaba el acuerdo marco de distribución exclusiva.	Поставщик всегда подписывал рамочный договор об эксклюзивной дистрибуции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	46
347	5	firmamos	подписали (мы)	La semana pasada nosotros firmamos el acuerdo marco de distribución exclusiva.	На прошлой неделе мы подписали рамочный договор об эксклюзивной дистрибуции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	46
348	5	firmábamos	подписывали (мы)	Nosotros normalmente firmábamos el acuerdo marco de distribución exclusiva.	Мы обычно подписывали рамочный договор об эксклюзивной дистрибуции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	46
349	5	firmasteis	подписали (вы)	¿Ayer vosotros firmasteis el acuerdo marco de distribución exclusiva?	Вчера вы подписали рамочный договор об эксклюзивной дистрибуции?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	46
350	5	firmabais	подписывали (вы)	¿Antes vosotros firmabais el acuerdo marco de distribución exclusiva?	Раньше вы регулярно подписывали рамочный договор об эксклюзивной дистрибуции?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	46
351	5	firmaron	подписали (они / Вы)	Esta mañana ellos firmaron el acuerdo marco de distribución exclusiva.	Сегодня утром они подписали рамочный договор об эксклюзивной дистрибуции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	46
352	5	firmaban	подписывали (они / Вы)	Ellos habitualmente firmaban el acuerdo marco de distribución exclusiva.	Они обычно подписывали рамочный договор об эксклюзивной дистрибуции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	46
353	5	garanticé	гарантировал (я)	Ayer yo garanticé la máxima calidad en cada envío.	Вчера я гарантировал максимальное качество в каждой поставке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	52
354	5	garantizaba	гарантировал (я)	Antes yo siempre garantizaba la máxima calidad en cada envío.	Раньше я регулярно гарантировал максимальное качество в каждой поставке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	52
355	5	garantizaste	гарантировал (ты)	¿Ayer tú garantizaste la máxima calidad en cada envío?	Вчера ты гарантировал максимальное качество в каждой поставке?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	52
356	5	garantizabas	гарантировал (ты)	¿Antes tú garantizabas la máxima calidad en cada envío?	Раньше ты регулярно гарантировал максимальное качество в каждой поставке?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	52
357	5	garantizó	гарантировал (он / Вы)	Ayer el proveedor garantizó la máxima calidad en cada envío.	Вчера поставщик гарантировал максимальное качество в каждой поставке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	52
358	5	vendí	продал (я)	Ayer yo vendí toda la partida en los canales de distribución.	Вчера я продал всю партию по каналам дистрибуции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	20
359	5	garantizaba	гарантировал (он / Вы)	El proveedor siempre garantizaba la máxima calidad en cada envío.	Поставщик всегда гарантировал максимальное качество в каждой поставке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	52
360	5	garantizamos	гарантировали (мы)	La semana pasada nosotros garantizamos la máxima calidad en cada envío.	На прошлой неделе мы гарантировали максимальное качество в каждой поставке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	52
361	5	garantizábamos	гарантировали (мы)	Nosotros normalmente garantizábamos la máxima calidad en cada envío.	Мы обычно гарантировали максимальное качество в каждой поставке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	52
362	5	garantizasteis	гарантировали (вы)	¿Ayer vosotros garantizasteis la máxima calidad en cada envío?	Вчера вы гарантировали максимальное качество в каждой поставке?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	52
363	5	garantizabais	гарантировали (вы)	¿Antes vosotros garantizabais la máxima calidad en cada envío?	Раньше вы регулярно гарантировали максимальное качество в каждой поставке?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	52
364	5	garantizaron	гарантировали (они / Вы)	Esta mañana ellos garantizaron la máxima calidad en cada envío.	Сегодня утром они гарантировали максимальное качество в каждой поставке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	52
365	5	garantizaban	гарантировали (они / Вы)	Ellos habitualmente garantizaban la máxima calidad en cada envío.	Они обычно гарантировали максимальное качество в каждой поставке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	52
366	5	hablé	поговорил (я)	Ayer yo hablé con el director de logística sobre el transporte.	Вчера я поговорил с директором по логистике о перевозке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	15
367	5	hablaba	говорил (я)	Antes yo siempre hablaba con el director de logística sobre el transporte.	Раньше я регулярно говорил с директором по логистике о перевозке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	15
368	5	hablaste	поговорил (ты)	¿Ayer tú hablaste con el director de logística sobre el transporte?	Вчера ты поговорил с директором по логистике о перевозке?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	15
369	5	hablabas	говорил (ты)	¿Antes tú hablabas con el director de logística sobre el transporte?	Раньше ты регулярно говорил с директором по логистике о перевозке?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	15
370	5	habló	поговорил (он / Вы)	Ayer el proveedor habló con el director de logística sobre el transporte.	Вчера поставщик поговорил с директором по логистике о перевозке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	15
371	5	hablaba	говорил (он / Вы)	El proveedor siempre hablaba con el director de logística sobre el transporte.	Поставщик всегда говорил с директором по логистике о перевозке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	15
372	5	hablamos	поговорили (мы)	La semana pasada nosotros hablamos con el director de logística sobre el transporte.	На прошлой неделе мы поговорили с директором по логистике о перевозке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	15
373	5	hablábamos	говорили (мы)	Nosotros normalmente hablábamos con el director de logística sobre el transporte.	Мы обычно говорили с директором по логистике о перевозке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	15
374	5	hablasteis	поговорили (вы)	¿Ayer vosotros hablasteis con el director de logística sobre el transporte?	Вчера вы поговорили с директором по логистике о перевозке?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	15
375	5	hablabais	говорили (вы)	¿Antes vosotros hablabais con el director de logística sobre el transporte?	Раньше вы регулярно говорили с директором по логистике о перевозке?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	15
376	5	hablaron	поговорили (они / Вы)	Esta mañana ellos hablaron con el director de logística sobre el transporte.	Сегодня утром они поговорили с директором по логистике о перевозке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	15
377	5	hablaban	говорили (они / Вы)	Ellos habitualmente hablaban con el director de logística sobre el transporte.	Они обычно говорили с директором по логистике о перевозке.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	15
378	5	importé	импортировал (я)	Ayer yo importé artículos de papelería directamente de España.	Вчера я импортировал канцелярские товары напрямую из Испании.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	36
379	5	importaba	импортировал (я)	Antes yo siempre importaba artículos de papelería directamente de España.	Раньше я регулярно импортировал канцелярские товары напрямую из Испании.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	36
380	5	importaste	импортировал (ты)	¿Ayer tú importaste artículos de papelería directamente de España?	Вчера ты импортировал канцелярские товары напрямую из Испании?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	36
381	5	importabas	импортировал (ты)	¿Antes tú importabas artículos de papelería directamente de España?	Раньше ты регулярно импортировал канцелярские товары напрямую из Испании?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	36
382	5	importó	импортировал (он / Вы)	Ayer el proveedor importó artículos de papelería directamente de España.	Вчера поставщик импортировал канцелярские товары напрямую из Испании.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	36
383	5	importaba	импортировал (он / Вы)	El proveedor siempre importaba artículos de papelería directamente de España.	Поставщик всегда импортировал канцелярские товары напрямую из Испании.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	36
384	5	importamos	импортировали (мы)	La semana pasada nosotros importamos artículos de papelería directamente de España.	На прошлой неделе мы импортировали канцелярские товары напрямую из Испании.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	36
385	5	importábamos	импортировали (мы)	Nosotros normalmente importábamos artículos de papelería directamente de España.	Мы обычно импортировали канцелярские товары напрямую из Испании.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	36
386	5	importasteis	импортировали (вы)	¿Ayer vosotros importasteis artículos de papelería directamente de España?	Вчера вы импортировали канцелярские товары напрямую из Испании?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	36
387	5	importabais	импортировали (вы)	¿Antes vosotros importabais artículos de papelería directamente de España?	Раньше вы регулярно импортировали канцелярские товары напрямую из Испании?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	36
388	5	importaron	импортировали (они / Вы)	Esta mañana ellos importaron artículos de papelería directamente de España.	Сегодня утром они импортировали канцелярские товары напрямую из Испании.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	36
389	5	importaban	импортировали (они / Вы)	Ellos habitualmente importaban artículos de papelería directamente de España.	Они обычно импортировали канцелярские товары напрямую из Испании.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	36
390	5	informé	проинформировал (я)	Ayer yo informé sobre el estado del envío internacional.	Вчера я проинформировал о статусе международной доставки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	12
391	5	informaba	информировал (я)	Antes yo siempre informaba sobre el estado del envío internacional.	Раньше я регулярно информировал о статусе международной доставки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	12
392	5	informaste	проинформировал (ты)	¿Ayer tú informaste sobre el estado del envío internacional?	Вчера ты проинформировал о статусе международной доставки?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	12
393	5	informabas	информировал (ты)	¿Antes tú informabas sobre el estado del envío internacional?	Раньше ты регулярно информировал о статусе международной доставки?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	12
394	5	informó	проинформировал (он / Вы)	Ayer el proveedor informó sobre el estado del envío internacional.	Вчера поставщик проинформировал о статусе международной доставки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	12
395	5	informaba	информировал (он / Вы)	El proveedor siempre informaba sobre el estado del envío internacional.	Поставщик всегда информировал о статусе международной доставки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	12
396	5	informamos	проинформировали (мы)	La semana pasada nosotros informamos sobre el estado del envío internacional.	На прошлой неделе мы проинформировали о статусе международной доставки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	12
397	5	informábamos	информировали (мы)	Nosotros normalmente informábamos sobre el estado del envío internacional.	Мы обычно информировали о статусе международной доставки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	12
398	5	informasteis	проинформировали (вы)	¿Ayer vosotros informasteis sobre el estado del envío internacional?	Вчера вы проинформировали о статусе международной доставки?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	12
399	5	informabais	информировали (вы)	¿Antes vosotros informabais sobre el estado del envío internacional?	Раньше вы регулярно информировали о статусе международной доставки?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	12
400	5	informaron	проинформировали (они / Вы)	Esta mañana ellos informaron sobre el estado del envío internacional.	Сегодня утром они проинформировали о статусе международной доставки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	12
401	5	informaban	информировали (они / Вы)	Ellos habitualmente informaban sobre el estado del envío internacional.	Они обычно информировали о статусе международной доставки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	12
402	5	intenté	попытался (я)	Ayer yo intenté conseguir un mejor precio por volumen.	Вчера я попытался получить лучшую цену за объём.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	44
403	5	intentaba	пытался (я)	Antes yo siempre intentaba conseguir un mejor precio por volumen.	Раньше я регулярно пытался получить лучшую цену за объём.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	44
404	5	intentaste	попытался (ты)	¿Ayer tú intentaste conseguir un mejor precio por volumen?	Вчера ты попытался получить лучшую цену за объём?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	44
405	5	intentabas	пытался (ты)	¿Antes tú intentabas conseguir un mejor precio por volumen?	Раньше ты регулярно пытался получить лучшую цену за объём?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	44
406	5	intentó	попытался (он / Вы)	Ayer el proveedor intentó conseguir un mejor precio por volumen.	Вчера поставщик попытался получить лучшую цену за объём.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	44
407	5	intentaba	пытался (он / Вы)	El proveedor siempre intentaba conseguir un mejor precio por volumen.	Поставщик всегда пытался получить лучшую цену за объём.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	44
408	5	intentamos	попытались (мы)	La semana pasada nosotros intentamos conseguir un mejor precio por volumen.	На прошлой неделе мы попытались получить лучшую цену за объём.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	44
409	5	intentábamos	пытались (мы)	Nosotros normalmente intentábamos conseguir un mejor precio por volumen.	Мы обычно пытались получить лучшую цену за объём.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	44
410	5	intentasteis	попытались (вы)	¿Ayer vosotros intentasteis conseguir un mejor precio por volumen?	Вчера вы попытались получить лучшую цену за объём?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	44
411	5	intentabais	пытались (вы)	¿Antes vosotros intentabais conseguir un mejor precio por volumen?	Раньше вы регулярно пытались получить лучшую цену за объём?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	44
412	5	intentaron	попытались (они / Вы)	Esta mañana ellos intentaron conseguir un mejor precio por volumen.	Сегодня утром они попытались получить лучшую цену за объём.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	44
413	5	intentaban	пытались (они / Вы)	Ellos habitualmente intentaban conseguir un mejor precio por volumen.	Они обычно пытались получить лучшую цену за объём.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	44
414	5	llegué	прибыл (я)	Ayer yo llegué al muelle de carga a primera hora.	Вчера я прибыл на погрузочную платформу рано утром.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	22
415	5	llegaba	прибывал (я)	Antes yo siempre llegaba al muelle de carga a primera hora.	Раньше я регулярно прибывал на погрузочную платформу рано утром.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	22
416	5	llegaste	прибыл (ты)	¿Ayer tú llegaste al muelle de carga a primera hora?	Вчера ты прибыл на погрузочную платформу рано утром?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	22
417	5	llegabas	прибывал (ты)	¿Antes tú llegabas al muelle de carga a primera hora?	Раньше ты регулярно прибывал на погрузочную платформу рано утром?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	22
418	5	llegó	прибыл (он / Вы)	Ayer el proveedor llegó al muelle de carga a primera hora.	Вчера поставщик прибыл на погрузочную платформу рано утром.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	22
419	5	llegaba	прибывал (он / Вы)	El proveedor siempre llegaba al muelle de carga a primera hora.	Поставщик всегда прибывал на погрузочную платформу рано утром.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	22
420	5	llegamos	прибыли (мы)	La semana pasada nosotros llegamos al muelle de carga a primera hora.	На прошлой неделе мы прибыли на погрузочную платформу рано утром.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	22
421	5	llegábamos	прибывали (мы)	Nosotros normalmente llegábamos al muelle de carga a primera hora.	Мы обычно прибывали на погрузочную платформу рано утром.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	22
422	5	llegasteis	прибыли (вы)	¿Ayer vosotros llegasteis al muelle de carga a primera hora?	Вчера вы прибыли на погрузочную платформу рано утром?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	22
423	5	llegabais	прибывали (вы)	¿Antes vosotros llegabais al muelle de carga a primera hora?	Раньше вы регулярно прибывали на погрузочную платформу рано утром?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	22
424	5	llegaron	прибыли (они / Вы)	Esta mañana ellos llegaron al muelle de carga a primera hora.	Сегодня утром они прибыли на погрузочную платформу рано утром.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	22
425	5	llegaban	прибывали (они / Вы)	Ellos habitualmente llegaban al muelle de carga a primera hora.	Они обычно прибывали на погрузочную платформу рано утром.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	22
426	5	necesité	испытал нужду в (я)	Ayer yo necesité más unidades para cubrir el aumento de ventas.	Вчера я испытал нужду в дополнительных единицах для роста продаж.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	34
427	5	necesitaba	нуждался в (я)	Antes yo siempre necesitaba más unidades para cubrir el aumento de ventas.	Раньше я регулярно нуждался в дополнительных единицах для роста продаж.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	34
428	5	necesitaste	испытал нужду в (ты)	¿Ayer tú necesitaste más unidades para cubrir el aumento de ventas?	Вчера ты испытал нужду в дополнительных единицах для роста продаж?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	34
429	5	necesitabas	нуждался в (ты)	¿Antes tú necesitabas más unidades para cubrir el aumento de ventas?	Раньше ты регулярно нуждался в дополнительных единицах для роста продаж?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	34
430	5	necesitó	испытал нужду в (он / Вы)	Ayer el proveedor necesitó más unidades para cubrir el aumento de ventas.	Вчера поставщик испытал нужду в дополнительных единицах для роста продаж.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	34
431	5	necesitaba	нуждался в (он / Вы)	El proveedor siempre necesitaba más unidades para cubrir el aumento de ventas.	Поставщик всегда нуждался в дополнительных единицах для роста продаж.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	34
432	5	necesitamos	нуждались в (мы)	La semana pasada nosotros necesitamos más unidades para cubrir el aumento de ventas.	На прошлой неделе мы нуждались в дополнительных единицах для роста продаж.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	34
433	5	necesitábamos	нуждались в (мы)	Nosotros normalmente necesitábamos más unidades para cubrir el aumento de ventas.	Мы обычно нуждались в дополнительных единицах для роста продаж.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	34
434	5	necesitasteis	нуждались в (вы)	¿Ayer vosotros necesitasteis más unidades para cubrir el aumento de ventas?	Вчера вы нуждались в дополнительных единицах для роста продаж?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	34
435	5	necesitabais	нуждались в (вы)	¿Antes vosotros necesitabais más unidades para cubrir el aumento de ventas?	Раньше вы регулярно нуждались в дополнительных единицах для роста продаж?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	34
436	5	necesitaron	нуждались в (они / Вы)	Esta mañana ellos necesitaron más unidades para cubrir el aumento de ventas.	Сегодня утром они нуждались в дополнительных единицах для роста продаж.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	34
437	5	necesitaban	нуждались в (они / Вы)	Ellos habitualmente necesitaban más unidades para cubrir el aumento de ventas.	Они обычно нуждались в дополнительных единицах для роста продаж.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	34
438	5	negocié	согласовал (я)	Ayer yo negocié mejores condiciones de pago a crédito.	Вчера я согласовал более выгодных условиях оплаты в кредит.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	45
439	5	negociaba	вёл переговоры о (я)	Antes yo siempre negociaba mejores condiciones de pago a crédito.	Раньше я регулярно вёл переговоры о более выгодных условиях оплаты в кредит.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	45
440	5	negociaste	согласовал (ты)	¿Ayer tú negociaste mejores condiciones de pago a crédito?	Вчера ты согласовал более выгодных условиях оплаты в кредит?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	45
441	5	negociabas	вёл переговоры о (ты)	¿Antes tú negociabas mejores condiciones de pago a crédito?	Раньше ты регулярно вёл переговоры о более выгодных условиях оплаты в кредит?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	45
442	5	negoció	согласовал (он / Вы)	Ayer el proveedor negoció mejores condiciones de pago a crédito.	Вчера поставщик согласовал более выгодных условиях оплаты в кредит.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	45
443	5	negociaba	вёл переговоры о (он / Вы)	El proveedor siempre negociaba mejores condiciones de pago a crédito.	Поставщик всегда вёл переговоры о более выгодных условиях оплаты в кредит.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	45
444	5	negociamos	согласовали (мы)	La semana pasada nosotros negociamos mejores condiciones de pago a crédito.	На прошлой неделе мы согласовали более выгодных условиях оплаты в кредит.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	45
445	5	negociábamos	вели переговоры о (мы)	Nosotros normalmente negociábamos mejores condiciones de pago a crédito.	Мы обычно вели переговоры о более выгодных условиях оплаты в кредит.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	45
446	5	negociasteis	согласовали (вы)	¿Ayer vosotros negociasteis mejores condiciones de pago a crédito?	Вчера вы согласовали более выгодных условиях оплаты в кредит?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	45
447	5	negociabais	вели переговоры о (вы)	¿Antes vosotros negociabais mejores condiciones de pago a crédito?	Раньше вы регулярно вели переговоры о более выгодных условиях оплаты в кредит?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	45
448	5	negociaron	согласовали (они / Вы)	Esta mañana ellos negociaron mejores condiciones de pago a crédito.	Сегодня утром они согласовали более выгодных условиях оплаты в кредит.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	45
449	5	negociaban	вели переговоры о (они / Вы)	Ellos habitualmente negociaban mejores condiciones de pago a crédito.	Они обычно вели переговоры о более выгодных условиях оплаты в кредит.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	45
450	5	ofrecí	предложил (я)	Ayer yo ofrecí un descuento por pronto pago del cinco por ciento.	Вчера я предложил скидку за раннюю оплату в размере пяти процентов.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	10
451	5	ofrecía	предлагал (я)	Antes yo siempre ofrecía un descuento por pronto pago del cinco por ciento.	Раньше я регулярно предлагал скидку за раннюю оплату в размере пяти процентов.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	10
452	5	ofreciste	предложил (ты)	¿Ayer tú ofreciste un descuento por pronto pago del cinco por ciento?	Вчера ты предложил скидку за раннюю оплату в размере пяти процентов?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	10
453	5	ofrecías	предлагал (ты)	¿Antes tú ofrecías un descuento por pronto pago del cinco por ciento?	Раньше ты регулярно предлагал скидку за раннюю оплату в размере пяти процентов?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	10
454	5	ofreció	предложил (он / Вы)	Ayer el proveedor ofreció un descuento por pronto pago del cinco por ciento.	Вчера поставщик предложил скидку за раннюю оплату в размере пяти процентов.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	10
455	5	ofrecía	предлагал (он / Вы)	El proveedor siempre ofrecía un descuento por pronto pago del cinco por ciento.	Поставщик всегда предлагал скидку за раннюю оплату в размере пяти процентов.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	10
456	5	ofrecimos	предложили (мы)	La semana pasada nosotros ofrecimos un descuento por pronto pago del cinco por ciento.	На прошлой неделе мы предложили скидку за раннюю оплату в размере пяти процентов.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	10
457	5	ofrecíamos	предлагали (мы)	Nosotros normalmente ofrecíamos un descuento por pronto pago del cinco por ciento.	Мы обычно предлагали скидку за раннюю оплату в размере пяти процентов.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	10
458	5	ofrecisteis	предложили (вы)	¿Ayer vosotros ofrecisteis un descuento por pronto pago del cinco por ciento?	Вчера вы предложили скидку за раннюю оплату в размере пяти процентов?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	10
459	5	ofrecíais	предлагали (вы)	¿Antes vosotros ofrecíais un descuento por pronto pago del cinco por ciento?	Раньше вы регулярно предлагали скидку за раннюю оплату в размере пяти процентов?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	10
460	5	ofrecieron	предложили (они / Вы)	Esta mañana ellos ofrecieron un descuento por pronto pago del cinco por ciento.	Сегодня утром они предложили скидку за раннюю оплату в размере пяти процентов.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	10
461	5	ofrecían	предлагали (они / Вы)	Ellos habitualmente ofrecían un descuento por pronto pago del cinco por ciento.	Они обычно предлагали скидку за раннюю оплату в размере пяти процентов.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	10
462	5	pagué	оплатил (я)	Ayer yo pagué el anticipo mediante transferencia bancaria.	Вчера я оплатил аванс через банковский перевод.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	50
463	5	pagaba	платил (я)	Antes yo siempre pagaba el anticipo mediante transferencia bancaria.	Раньше я регулярно платил аванс через банковский перевод.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	50
464	5	pagaste	оплатил (ты)	¿Ayer tú pagaste el anticipo mediante transferencia bancaria?	Вчера ты оплатил аванс через банковский перевод?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	50
465	5	pagabas	платил (ты)	¿Antes tú pagabas el anticipo mediante transferencia bancaria?	Раньше ты регулярно платил аванс через банковский перевод?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	50
466	5	pagó	оплатил (он / Вы)	Ayer el proveedor pagó el anticipo mediante transferencia bancaria.	Вчера поставщик оплатил аванс через банковский перевод.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	50
467	5	pagaba	платил (он / Вы)	El proveedor siempre pagaba el anticipo mediante transferencia bancaria.	Поставщик всегда платил аванс через банковский перевод.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	50
468	5	pagamos	оплатили (мы)	La semana pasada nosotros pagamos el anticipo mediante transferencia bancaria.	На прошлой неделе мы оплатили аванс через банковский перевод.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	50
469	5	pagábamos	платили (мы)	Nosotros normalmente pagábamos el anticipo mediante transferencia bancaria.	Мы обычно платили аванс через банковский перевод.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	50
470	5	pagasteis	оплатили (вы)	¿Ayer vosotros pagasteis el anticipo mediante transferencia bancaria?	Вчера вы оплатили аванс через банковский перевод?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	50
471	5	pagabais	платили (вы)	¿Antes vosotros pagabais el anticipo mediante transferencia bancaria?	Раньше вы регулярно платили аванс через банковский перевод?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	50
472	5	pagaron	оплатили (они / Вы)	Esta mañana ellos pagaron el anticipo mediante transferencia bancaria.	Сегодня утром они оплатили аванс через банковский перевод.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	50
473	5	pagaban	платили (они / Вы)	Ellos habitualmente pagaban el anticipo mediante transferencia bancaria.	Они обычно платили аванс через банковский перевод.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	50
475	5	pedía	заказывал (я)	Antes yo siempre pedía quinientas unidades del producto estrella.	Раньше я регулярно заказывал пятьсот единиц флагманского товара.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	16
476	5	pediste	заказал (ты)	¿Ayer tú pediste quinientas unidades del producto estrella?	Вчера ты заказал пятьсот единиц флагманского товара?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	16
477	5	pedías	заказывал (ты)	¿Antes tú pedías quinientas unidades del producto estrella?	Раньше ты регулярно заказывал пятьсот единиц флагманского товара?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	16
478	5	pidió	заказал (он / Вы)	Ayer el proveedor pidió quinientas unidades del producto estrella.	Вчера поставщик заказал пятьсот единиц флагманского товара.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	16
479	5	pedía	заказывал (он / Вы)	El proveedor siempre pedía quinientas unidades del producto estrella.	Поставщик всегда заказывал пятьсот единиц флагманского товара.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	16
480	5	pedimos	заказали (мы)	La semana pasada nosotros pedimos quinientas unidades del producto estrella.	На прошлой неделе мы заказали пятьсот единиц флагманского товара.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	16
481	5	pedíamos	заказывали (мы)	Nosotros normalmente pedíamos quinientas unidades del producto estrella.	Мы обычно заказывали пятьсот единиц флагманского товара.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	16
482	5	pedisteis	заказали (вы)	¿Ayer vosotros pedisteis quinientas unidades del producto estrella?	Вчера вы заказали пятьсот единиц флагманского товара?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	16
483	5	pedíais	заказывали (вы)	¿Antes vosotros pedíais quinientas unidades del producto estrella?	Раньше вы регулярно заказывали пятьсот единиц флагманского товара?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	16
484	5	pidieron	заказали (они / Вы)	Esta mañana ellos pidieron quinientas unidades del producto estrella.	Сегодня утром они заказали пятьсот единиц флагманского товара.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	16
485	5	pedían	заказывали (они / Вы)	Ellos habitualmente pedían quinientas unidades del producto estrella.	Они обычно заказывали пятьсот единиц флагманского товара.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	16
486	5	personalicé	брендировал (я)	Ayer yo personalicé el embalaje con el logotipo de la marca.	Вчера я брендировал упаковку с логотипом бренда.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	30
487	5	personalizaba	брендировал (я)	Antes yo siempre personalizaba el embalaje con el logotipo de la marca.	Раньше я регулярно брендировал упаковку с логотипом бренда.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	30
488	5	personalizaste	брендировал (ты)	¿Ayer tú personalizaste el embalaje con el logotipo de la marca?	Вчера ты брендировал упаковку с логотипом бренда?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	30
489	5	personalizabas	брендировал (ты)	¿Antes tú personalizabas el embalaje con el logotipo de la marca?	Раньше ты регулярно брендировал упаковку с логотипом бренда?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	30
490	5	personalizó	брендировал (он / Вы)	Ayer el proveedor personalizó el embalaje con el logotipo de la marca.	Вчера поставщик брендировал упаковку с логотипом бренда.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	30
491	5	personalizaba	брендировал (он / Вы)	El proveedor siempre personalizaba el embalaje con el logotipo de la marca.	Поставщик всегда брендировал упаковку с логотипом бренда.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	30
492	5	personalizamos	брендировали (мы)	La semana pasada nosotros personalizamos el embalaje con el logotipo de la marca.	На прошлой неделе мы брендировали упаковку с логотипом бренда.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	30
493	5	personalizábamos	брендировали (мы)	Nosotros normalmente personalizábamos el embalaje con el logotipo de la marca.	Мы обычно брендировали упаковку с логотипом бренда.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	30
494	5	personalizasteis	брендировали (вы)	¿Ayer vosotros personalizasteis el embalaje con el logotipo de la marca?	Вчера вы брендировали упаковку с логотипом бренда?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	30
495	5	personalizabais	брендировали (вы)	¿Antes vosotros personalizabais el embalaje con el logotipo de la marca?	Раньше вы регулярно брендировали упаковку с логотипом бренда?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	30
496	5	personalizaron	брендировали (они / Вы)	Esta mañana ellos personalizaron el embalaje con el logotipo de la marca.	Сегодня утром они брендировали упаковку с логотипом бренда.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	30
497	5	personalizaban	брендировали (они / Вы)	Ellos habitualmente personalizaban el embalaje con el logotipo de la marca.	Они обычно брендировали упаковку с логотипом бренда.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	30
498	5	pregunté	спросил (я)	Ayer yo pregunté por el número de seguimiento del paquete.	Вчера я спросил про трек-номер посылки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	39
499	5	preguntaba	спрашивал (я)	Antes yo siempre preguntaba por el número de seguimiento del paquete.	Раньше я регулярно спрашивал про трек-номер посылки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	39
500	5	preguntaste	спросил (ты)	¿Ayer tú preguntaste por el número de seguimiento del paquete?	Вчера ты спросил про трек-номер посылки?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	39
501	5	preguntabas	спрашивал (ты)	¿Antes tú preguntabas por el número de seguimiento del paquete?	Раньше ты регулярно спрашивал про трек-номер посылки?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	39
502	5	preguntó	спросил (он / Вы)	Ayer el proveedor preguntó por el número de seguimiento del paquete.	Вчера поставщик спросил про трек-номер посылки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	39
503	5	preguntaba	спрашивал (он / Вы)	El proveedor siempre preguntaba por el número de seguimiento del paquete.	Поставщик всегда спрашивал про трек-номер посылки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	39
504	5	preguntamos	спросили (мы)	La semana pasada nosotros preguntamos por el número de seguimiento del paquete.	На прошлой неделе мы спросили про трек-номер посылки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	39
505	5	preguntábamos	спрашивали (мы)	Nosotros normalmente preguntábamos por el número de seguimiento del paquete.	Мы обычно спрашивали про трек-номер посылки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	39
506	5	preguntasteis	спросили (вы)	¿Ayer vosotros preguntasteis por el número de seguimiento del paquete?	Вчера вы спросили про трек-номер посылки?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	39
507	5	preguntabais	спрашивали (вы)	¿Antes vosotros preguntabais por el número de seguimiento del paquete?	Раньше вы регулярно спрашивали про трек-номер посылки?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	39
508	5	preguntaron	спросили (они / Вы)	Esta mañana ellos preguntaron por el número de seguimiento del paquete.	Сегодня утром они спросили про трек-номер посылки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	39
509	5	preguntaban	спрашивали (они / Вы)	Ellos habitualmente preguntaban por el número de seguimiento del paquete.	Они обычно спрашивали про трек-номер посылки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	39
510	5	preparé	подготовил (я)	Ayer yo preparé toda la documentación para el despacho aduanero.	Вчера я подготовил всю документацию для таможенного оформления.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	28
511	5	preparaba	подготавливал (я)	Antes yo siempre preparaba toda la documentación para el despacho aduanero.	Раньше я регулярно подготавливал всю документацию для таможенного оформления.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	28
512	5	preparaste	подготовил (ты)	¿Ayer tú preparaste toda la documentación para el despacho aduanero?	Вчера ты подготовил всю документацию для таможенного оформления?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	28
513	5	preparabas	подготавливал (ты)	¿Antes tú preparabas toda la documentación para el despacho aduanero?	Раньше ты регулярно подготавливал всю документацию для таможенного оформления?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	28
514	5	preparó	подготовил (он / Вы)	Ayer el proveedor preparó toda la documentación para el despacho aduanero.	Вчера поставщик подготовил всю документацию для таможенного оформления.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	28
515	5	preparaba	подготавливал (он / Вы)	El proveedor siempre preparaba toda la documentación para el despacho aduanero.	Поставщик всегда подготавливал всю документацию для таможенного оформления.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	28
516	5	preparamos	подготовили (мы)	La semana pasada nosotros preparamos toda la documentación para el despacho aduanero.	На прошлой неделе мы подготовили всю документацию для таможенного оформления.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	28
517	5	preparábamos	подготавливали (мы)	Nosotros normalmente preparábamos toda la documentación para el despacho aduanero.	Мы обычно подготавливали всю документацию для таможенного оформления.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	28
518	5	preparasteis	подготовили (вы)	¿Ayer vosotros preparasteis toda la documentación para el despacho aduanero?	Вчера вы подготовили всю документацию для таможенного оформления?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	28
519	5	preparabais	подготавливали (вы)	¿Antes vosotros preparabais toda la documentación para el despacho aduanero?	Раньше вы регулярно подготавливали всю документацию для таможенного оформления?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	28
520	5	prepararon	подготовили (они / Вы)	Esta mañana ellos prepararon toda la documentación para el despacho aduanero.	Сегодня утром они подготовили всю документацию для таможенного оформления.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	28
521	5	preparaban	подготавливали (они / Вы)	Ellos habitualmente preparaban toda la documentación para el despacho aduanero.	Они обычно подготавливали всю документацию для таможенного оформления.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	28
522	5	produje	произвёл (я)	Ayer yo produje mil unidades diarias en la fábrica de Valencia.	Вчера я произвёл тысячу единиц в день на фабрике в Валенсии.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	24
523	5	producía	производил (я)	Antes yo siempre producía mil unidades diarias en la fábrica de Valencia.	Раньше я регулярно производил тысячу единиц в день на фабрике в Валенсии.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	24
524	5	produjiste	произвёл (ты)	¿Ayer tú produjiste mil unidades diarias en la fábrica de Valencia?	Вчера ты произвёл тысячу единиц в день на фабрике в Валенсии?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	24
525	5	producías	производил (ты)	¿Antes tú producías mil unidades diarias en la fábrica de Valencia?	Раньше ты регулярно производил тысячу единиц в день на фабрике в Валенсии?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	24
526	5	produjo	произвёл (он / Вы)	Ayer el proveedor produjo mil unidades diarias en la fábrica de Valencia.	Вчера поставщик произвёл тысячу единиц в день на фабрике в Валенсии.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	24
527	5	producía	производил (он / Вы)	El proveedor siempre producía mil unidades diarias en la fábrica de Valencia.	Поставщик всегда производил тысячу единиц в день на фабрике в Валенсии.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	24
528	5	produjimos	произвели (мы)	La semana pasada nosotros produjimos mil unidades diarias en la fábrica de Valencia.	На прошлой неделе мы произвели тысячу единиц в день на фабрике в Валенсии.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	24
529	5	producíamos	производили (мы)	Nosotros normalmente producíamos mil unidades diarias en la fábrica de Valencia.	Мы обычно производили тысячу единиц в день на фабрике в Валенсии.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	24
530	5	produjisteis	произвели (вы)	¿Ayer vosotros produjisteis mil unidades diarias en la fábrica de Valencia?	Вчера вы произвели тысячу единиц в день на фабрике в Валенсии?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	24
531	5	producíais	производили (вы)	¿Antes vosotros producíais mil unidades diarias en la fábrica de Valencia?	Раньше вы регулярно производили тысячу единиц в день на фабрике в Валенсии?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	24
532	5	produjeron	произвели (они / Вы)	Esta mañana ellos produjeron mil unidades diarias en la fábrica de Valencia.	Сегодня утром они произвели тысячу единиц в день на фабрике в Валенсии.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	24
533	5	producían	производили (они / Вы)	Ellos habitualmente producían mil unidades diarias en la fábrica de Valencia.	Они обычно производили тысячу единиц в день на фабрике в Валенсии.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	24
534	5	rechacé	отклонил (я)	Ayer yo rechacé el lote defectuoso durante la inspección técnica.	Вчера я отклонил бракованную партию во время технической инспекции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	7
535	5	rechazaba	отклонял (я)	Antes yo siempre rechazaba el lote defectuoso durante la inspección técnica.	Раньше я регулярно отклонял бракованную партию во время технической инспекции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	7
536	5	rechazaste	отклонил (ты)	¿Ayer tú rechazaste el lote defectuoso durante la inspección técnica?	Вчера ты отклонил бракованную партию во время технической инспекции?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	7
537	5	rechazabas	отклонял (ты)	¿Antes tú rechazabas el lote defectuoso durante la inspección técnica?	Раньше ты регулярно отклонял бракованную партию во время технической инспекции?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	7
538	5	rechazó	отклонил (он / Вы)	Ayer el proveedor rechazó el lote defectuoso durante la inspección técnica.	Вчера поставщик отклонил бракованную партию во время технической инспекции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	7
539	5	rechazaba	отклонял (он / Вы)	El proveedor siempre rechazaba el lote defectuoso durante la inspección técnica.	Поставщик всегда отклонял бракованную партию во время технической инспекции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	7
540	5	rechazamos	отклонили (мы)	La semana pasada nosotros rechazamos el lote defectuoso durante la inspección técnica.	На прошлой неделе мы отклонили бракованную партию во время технической инспекции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	7
541	5	rechazábamos	отклоняли (мы)	Nosotros normalmente rechazábamos el lote defectuoso durante la inspección técnica.	Мы обычно отклоняли бракованную партию во время технической инспекции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	7
542	5	rechazasteis	отклонили (вы)	¿Ayer vosotros rechazasteis el lote defectuoso durante la inspección técnica?	Вчера вы отклонили бракованную партию во время технической инспекции?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	7
543	5	rechazabais	отклоняли (вы)	¿Antes vosotros rechazabais el lote defectuoso durante la inspección técnica?	Раньше вы регулярно отклоняли бракованную партию во время технической инспекции?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	7
544	5	rechazaron	отклонили (они / Вы)	Esta mañana ellos rechazaron el lote defectuoso durante la inspección técnica.	Сегодня утром они отклонили бракованную партию во время технической инспекции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	7
545	5	rechazaban	отклоняли (они / Вы)	Ellos habitualmente rechazaban el lote defectuoso durante la inspección técnica.	Они обычно отклоняли бракованную партию во время технической инспекции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	7
546	5	recibí	получил (я)	Ayer yo recibí el albarán de entrega debidamente sellado.	Вчера я получил товарную накладную с круглой печатью.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	31
547	5	recibía	получал (я)	Antes yo siempre recibía el albarán de entrega debidamente sellado.	Раньше я регулярно получал товарную накладную с круглой печатью.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	31
548	5	recibías	получал (ты)	¿Antes tú recibías el albarán de entrega debidamente sellado?	Раньше ты регулярно получал товарную накладную с круглой печатью?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	31
549	5	recibió	получил (он / Вы)	Ayer el proveedor recibió el albarán de entrega debidamente sellado.	Вчера поставщик получил товарную накладную с круглой печатью.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	31
550	5	recibía	получал (он / Вы)	El proveedor siempre recibía el albarán de entrega debidamente sellado.	Поставщик всегда получал товарную накладную с круглой печатью.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	31
551	5	recibimos	получили (мы)	La semana pasada nosotros recibimos el albarán de entrega debidamente sellado.	На прошлой неделе мы получили товарную накладную с круглой печатью.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	31
552	5	recibíamos	получали (мы)	Nosotros normalmente recibíamos el albarán de entrega debidamente sellado.	Мы обычно получали товарную накладную с круглой печатью.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	31
553	5	recibisteis	получили (вы)	¿Ayer vosotros recibisteis el albarán de entrega debidamente sellado?	Вчера вы получили товарную накладную с круглой печатью?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	31
554	5	recibíais	получали (вы)	¿Antes vosotros recibíais el albarán de entrega debidamente sellado?	Раньше вы регулярно получали товарную накладную с круглой печатью?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	31
555	5	recibieron	получили (они / Вы)	Esta mañana ellos recibieron el albarán de entrega debidamente sellado.	Сегодня утром они получили товарную накладную с круглой печатью.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	31
556	5	recibían	получали (они / Вы)	Ellos habitualmente recibían el albarán de entrega debidamente sellado.	Они обычно получали товарную накладную с круглой печатью.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	31
557	5	reclamé	предъявил претензию за (я)	Ayer yo reclamé las piezas rotas durante el transporte marítimo.	Вчера я предъявил претензию за разбитые детали во время морской перевозки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	19
558	5	reclamaba	предъявлял претензию за (я)	Antes yo siempre reclamaba las piezas rotas durante el transporte marítimo.	Раньше я регулярно предъявлял претензию за разбитые детали во время морской перевозки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	19
559	5	reclamaste	предъявил претензию за (ты)	¿Ayer tú reclamaste las piezas rotas durante el transporte marítimo?	Вчера ты предъявил претензию за разбитые детали во время морской перевозки?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	19
560	5	reclamabas	предъявлял претензию за (ты)	¿Antes tú reclamabas las piezas rotas durante el transporte marítimo?	Раньше ты регулярно предъявлял претензию за разбитые детали во время морской перевозки?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	19
561	5	reclamó	предъявил претензию за (он / Вы)	Ayer el proveedor reclamó las piezas rotas durante el transporte marítimo.	Вчера поставщик предъявил претензию за разбитые детали во время морской перевозки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	19
562	5	reclamaba	предъявлял претензию за (он / Вы)	El proveedor siempre reclamaba las piezas rotas durante el transporte marítimo.	Поставщик всегда предъявлял претензию за разбитые детали во время морской перевозки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	19
563	5	reclamamos	предъявили претензию за (мы)	La semana pasada nosotros reclamamos las piezas rotas durante el transporte marítimo.	На прошлой неделе мы предъявили претензию за разбитые детали во время морской перевозки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	19
564	5	reclamábamos	предъявляли претензию за (мы)	Nosotros normalmente reclamábamos las piezas rotas durante el transporte marítimo.	Мы обычно предъявляли претензию за разбитые детали во время морской перевозки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	19
565	5	reclamasteis	предъявили претензию за (вы)	¿Ayer vosotros reclamasteis las piezas rotas durante el transporte marítimo?	Вчера вы предъявили претензию за разбитые детали во время морской перевозки?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	19
566	5	reclamabais	предъявляли претензию за (вы)	¿Antes vosotros reclamabais las piezas rotas durante el transporte marítimo?	Раньше вы регулярно предъявляли претензию за разбитые детали во время морской перевозки?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	19
567	5	reclamaron	предъявили претензию за (они / Вы)	Esta mañana ellos reclamaron las piezas rotas durante el transporte marítimo.	Сегодня утром они предъявили претензию за разбитые детали во время морской перевозки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	19
568	5	reclamaban	предъявляли претензию за (они / Вы)	Ellos habitualmente reclamaban las piezas rotas durante el transporte marítimo.	Они обычно предъявляли претензию за разбитые детали во время морской перевозки.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	19
569	5	reembolsé	вернул деньги за (я)	Ayer yo reembolsé los productos defectuosos sin demora.	Вчера я вернул деньги за бракованных товаров без задержек.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	8
570	5	reembolsaba	возмещал стоимость (я)	Antes yo siempre reembolsaba los productos defectuosos sin demora.	Раньше я регулярно возмещал стоимость бракованных товаров без задержек.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	8
571	5	reembolsaste	вернул деньги за (ты)	¿Ayer tú reembolsaste los productos defectuosos sin demora?	Вчера ты вернул деньги за бракованных товаров без задержек?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	8
572	5	reembolsabas	возмещал стоимость (ты)	¿Antes tú reembolsabas los productos defectuosos sin demora?	Раньше ты регулярно возмещал стоимость бракованных товаров без задержек?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	8
573	5	reembolsó	вернул деньги за (он / Вы)	Ayer el proveedor reembolsó los productos defectuosos sin demora.	Вчера поставщик вернул деньги за бракованных товаров без задержек.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	8
574	5	reembolsaba	возмещал стоимость (он / Вы)	El proveedor siempre reembolsaba los productos defectuosos sin demora.	Поставщик всегда возмещал стоимость бракованных товаров без задержек.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	8
575	5	reembolsamos	вернули деньги за (мы)	La semana pasada nosotros reembolsamos los productos defectuosos sin demora.	На прошлой неделе мы вернули деньги за бракованных товаров без задержек.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	8
576	5	reembolsábamos	возмещали стоимость (мы)	Nosotros normalmente reembolsábamos los productos defectuosos sin demora.	Мы обычно возмещали стоимость бракованных товаров без задержек.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	8
577	5	reembolsasteis	вернули деньги за (вы)	¿Ayer vosotros reembolsasteis los productos defectuosos sin demora?	Вчера вы вернули деньги за бракованных товаров без задержек?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	8
578	5	reembolsabais	возмещали стоимость (вы)	¿Antes vosotros reembolsabais los productos defectuosos sin demora?	Раньше вы регулярно возмещали стоимость бракованных товаров без задержек?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	8
579	5	reembolsaron	вернули деньги за (они / Вы)	Esta mañana ellos reembolsaron los productos defectuosos sin demora.	Сегодня утром они вернули деньги за бракованных товаров без задержек.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	8
580	5	reembolsaban	возмещали стоимость (они / Вы)	Ellos habitualmente reembolsaban los productos defectuosos sin demora.	Они обычно возмещали стоимость бракованных товаров без задержек.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	8
581	5	resolví	решил (я)	Ayer yo resolví la incidencia técnica en menos de veinticuatro horas.	Вчера я решил техническую неполадку менее чем за двадцать четыре часа.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	14
582	5	resolvía	решал (я)	Antes yo siempre resolvía la incidencia técnica en menos de veinticuatro horas.	Раньше я регулярно решал техническую неполадку менее чем за двадцать четыре часа.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	14
583	5	resolviste	решил (ты)	¿Ayer tú resolviste la incidencia técnica en menos de veinticuatro horas?	Вчера ты решил техническую неполадку менее чем за двадцать четыре часа?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	14
584	5	resolvías	решал (ты)	¿Antes tú resolvías la incidencia técnica en menos de veinticuatro horas?	Раньше ты регулярно решал техническую неполадку менее чем за двадцать четыре часа?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	14
585	5	resolvió	решил (он / Вы)	Ayer el proveedor resolvió la incidencia técnica en menos de veinticuatro horas.	Вчера поставщик решил техническую неполадку менее чем за двадцать четыре часа.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	14
586	5	resolvía	решал (он / Вы)	El proveedor siempre resolvía la incidencia técnica en menos de veinticuatro horas.	Поставщик всегда решал техническую неполадку менее чем за двадцать четыре часа.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	14
587	5	resolvimos	решили (мы)	La semana pasada nosotros resolvimos la incidencia técnica en menos de veinticuatro horas.	На прошлой неделе мы решили техническую неполадку менее чем за двадцать четыре часа.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	14
588	5	resolvíamos	решали (мы)	Nosotros normalmente resolvíamos la incidencia técnica en menos de veinticuatro horas.	Мы обычно решали техническую неполадку менее чем за двадцать четыре часа.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	14
589	5	resolvisteis	решили (вы)	¿Ayer vosotros resolvisteis la incidencia técnica en menos de veinticuatro horas?	Вчера вы решили техническую неполадку менее чем за двадцать четыре часа?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	14
590	5	resolvíais	решали (вы)	¿Antes vosotros resolvíais la incidencia técnica en menos de veinticuatro horas?	Раньше вы регулярно решали техническую неполадку менее чем за двадцать четыре часа?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	14
591	5	resolvieron	решили (они / Вы)	Esta mañana ellos resolvieron la incidencia técnica en menos de veinticuatro horas.	Сегодня утром они решили техническую неполадку менее чем за двадцать четыре часа.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	14
592	5	resolvían	решали (они / Вы)	Ellos habitualmente resolvían la incidencia técnica en menos de veinticuatro horas.	Они обычно решали техническую неполадку менее чем за двадцать четыре часа.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	14
593	5	respondí	ответил на (я)	Ayer yo respondí la solicitud de presupuesto en el mismo día.	Вчера я ответил на запрос сметы в тот же день.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	42
594	5	respondía	отвечал на (я)	Antes yo siempre respondía la solicitud de presupuesto en el mismo día.	Раньше я регулярно отвечал на запрос сметы в тот же день.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	42
595	5	respondiste	ответил на (ты)	¿Ayer tú respondiste la solicitud de presupuesto en el mismo día?	Вчера ты ответил на запрос сметы в тот же день?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	42
596	5	respondías	отвечал на (ты)	¿Antes tú respondías la solicitud de presupuesto en el mismo día?	Раньше ты регулярно отвечал на запрос сметы в тот же день?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	42
597	5	respondió	ответил на (он / Вы)	Ayer el proveedor respondió la solicitud de presupuesto en el mismo día.	Вчера поставщик ответил на запрос сметы в тот же день.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	42
598	5	respondía	отвечал на (он / Вы)	El proveedor siempre respondía la solicitud de presupuesto en el mismo día.	Поставщик всегда отвечал на запрос сметы в тот же день.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	42
599	5	respondimos	ответили на (мы)	La semana pasada nosotros respondimos la solicitud de presupuesto en el mismo día.	На прошлой неделе мы ответили на запрос сметы в тот же день.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	42
600	5	respondíamos	отвечали на (мы)	Nosotros normalmente respondíamos la solicitud de presupuesto en el mismo día.	Мы обычно отвечали на запрос сметы в тот же день.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	42
601	5	respondisteis	ответили на (вы)	¿Ayer vosotros respondisteis la solicitud de presupuesto en el mismo día?	Вчера вы ответили на запрос сметы в тот же день?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	42
602	5	respondíais	отвечали на (вы)	¿Antes vosotros respondíais la solicitud de presupuesto en el mismo día?	Раньше вы регулярно отвечали на запрос сметы в тот же день?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	42
603	5	respondieron	ответили на (они / Вы)	Esta mañana ellos respondieron la solicitud de presupuesto en el mismo día.	Сегодня утром они ответили на запрос сметы в тот же день.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	42
604	5	respondían	отвечали на (они / Вы)	Ellos habitualmente respondían la solicitud de presupuesto en el mismo día.	Они обычно отвечали на запрос сметы в тот же день.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	42
605	5	revisé	проверил (я)	Ayer yo revisé las cláusulas del contrato antes de firmar.	Вчера я проверил пункты договора перед подписанием.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	33
606	5	revisaba	проверял (я)	Antes yo siempre revisaba las cláusulas del contrato antes de firmar.	Раньше я регулярно проверял пункты договора перед подписанием.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	33
608	5	revisabas	проверял (ты)	¿Antes tú revisabas las cláusulas del contrato antes de firmar?	Раньше ты регулярно проверял пункты договора перед подписанием?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	33
609	5	revisó	проверил (он / Вы)	Ayer el proveedor revisó las cláusulas del contrato antes de firmar.	Вчера поставщик проверил пункты договора перед подписанием.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	33
610	5	revisaba	проверял (он / Вы)	El proveedor siempre revisaba las cláusulas del contrato antes de firmar.	Поставщик всегда проверял пункты договора перед подписанием.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	33
611	5	revisamos	проверили (мы)	La semana pasada nosotros revisamos las cláusulas del contrato antes de firmar.	На прошлой неделе мы проверили пункты договора перед подписанием.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	33
612	5	revisábamos	проверяли (мы)	Nosotros normalmente revisábamos las cláusulas del contrato antes de firmar.	Мы обычно проверяли пункты договора перед подписанием.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	33
613	5	revisasteis	проверили (вы)	¿Ayer vosotros revisasteis las cláusulas del contrato antes de firmar?	Вчера вы проверили пункты договора перед подписанием?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	33
614	5	revisabais	проверяли (вы)	¿Antes vosotros revisabais las cláusulas del contrato antes de firmar?	Раньше вы регулярно проверяли пункты договора перед подписанием?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	33
615	5	revisaron	проверили (они / Вы)	Esta mañana ellos revisaron las cláusulas del contrato antes de firmar.	Сегодня утром они проверили пункты договора перед подписанием.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	33
616	5	revisaban	проверяли (они / Вы)	Ellos habitualmente revisaban las cláusulas del contrato antes de firmar.	Они обычно проверяли пункты договора перед подписанием.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	33
617	5	solicité	запросил (я)	Ayer yo solicité la lista de precios de venta al por mayor.	Вчера я запросил оптовый прайс-лист.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	17
618	5	solicitaba	запрашивал (я)	Antes yo siempre solicitaba la lista de precios de venta al por mayor.	Раньше я регулярно запрашивал оптовый прайс-лист.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	17
619	5	solicitaste	запросил (ты)	¿Ayer tú solicitaste la lista de precios de venta al por mayor?	Вчера ты запросил оптовый прайс-лист?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	17
620	5	solicitabas	запрашивал (ты)	¿Antes tú solicitabas la lista de precios de venta al por mayor?	Раньше ты регулярно запрашивал оптовый прайс-лист?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	17
621	5	solicitó	запросил (он / Вы)	Ayer el proveedor solicitó la lista de precios de venta al por mayor.	Вчера поставщик запросил оптовый прайс-лист.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	17
622	5	solicitaba	запрашивал (он / Вы)	El proveedor siempre solicitaba la lista de precios de venta al por mayor.	Поставщик всегда запрашивал оптовый прайс-лист.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	17
623	5	solicitamos	запросили (мы)	La semana pasada nosotros solicitamos la lista de precios de venta al por mayor.	На прошлой неделе мы запросили оптовый прайс-лист.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	17
624	5	solicitábamos	запрашивали (мы)	Nosotros normalmente solicitábamos la lista de precios de venta al por mayor.	Мы обычно запрашивали оптовый прайс-лист.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	17
625	5	solicitasteis	запросили (вы)	¿Ayer vosotros solicitasteis la lista de precios de venta al por mayor?	Вчера вы запросили оптовый прайс-лист?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	17
626	5	solicitabais	запрашивали (вы)	¿Antes vosotros solicitabais la lista de precios de venta al por mayor?	Раньше вы регулярно запрашивали оптовый прайс-лист?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	17
627	5	solicitaron	запросили (они / Вы)	Esta mañana ellos solicitaron la lista de precios de venta al por mayor.	Сегодня утром они запросили оптовый прайс-лист.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	17
628	5	solicitaban	запрашивали (они / Вы)	Ellos habitualmente solicitaban la lista de precios de venta al por mayor.	Они обычно запрашивали оптовый прайс-лист.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	17
629	5	solucioné	устранил (я)	Ayer yo solucioné el problema logístico con la empresa de transporte.	Вчера я устранил логистическую проблему с транспортной компанией.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	6
630	5	solucionaba	устранял (я)	Antes yo siempre solucionaba el problema logístico con la empresa de transporte.	Раньше я регулярно устранял логистическую проблему с транспортной компанией.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	6
631	5	solucionaste	устранил (ты)	¿Ayer tú solucionaste el problema logístico con la empresa de transporte?	Вчера ты устранил логистическую проблему с транспортной компанией?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	6
632	5	solucionabas	устранял (ты)	¿Antes tú solucionabas el problema logístico con la empresa de transporte?	Раньше ты регулярно устранял логистическую проблему с транспортной компанией?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	6
633	5	solucionó	устранил (он / Вы)	Ayer el proveedor solucionó el problema logístico con la empresa de transporte.	Вчера поставщик устранил логистическую проблему с транспортной компанией.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	6
634	5	solucionaba	устранял (он / Вы)	El proveedor siempre solucionaba el problema logístico con la empresa de transporte.	Поставщик всегда устранял логистическую проблему с транспортной компанией.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	6
635	5	solucionamos	устранили (мы)	La semana pasada nosotros solucionamos el problema logístico con la empresa de transporte.	На прошлой неделе мы устранили логистическую проблему с транспортной компанией.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	6
636	5	solucionábamos	устраняли (мы)	Nosotros normalmente solucionábamos el problema logístico con la empresa de transporte.	Мы обычно устраняли логистическую проблему с транспортной компанией.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	6
637	5	solucionasteis	устранили (вы)	¿Ayer vosotros solucionasteis el problema logístico con la empresa de transporte?	Вчера вы устранили логистическую проблему с транспортной компанией?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	6
638	5	solucionabais	устраняли (вы)	¿Antes vosotros solucionabais el problema logístico con la empresa de transporte?	Раньше вы регулярно устраняли логистическую проблему с транспортной компанией?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	6
639	5	solucionaron	устранили (они / Вы)	Esta mañana ellos solucionaron el problema logístico con la empresa de transporte.	Сегодня утром они устранили логистическую проблему с транспортной компанией.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	6
640	5	solucionaban	устраняли (они / Вы)	Ellos habitualmente solucionaban el problema logístico con la empresa de transporte.	Они обычно устраняли логистическую проблему с транспортной компанией.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	6
641	5	transferí	перевёл (я)	Ayer yo transferí el importe íntegro a la cuenta del fabricante.	Вчера я перевёл полную сумму на банковский счёт производителя.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	13
642	5	transfería	переводил (я)	Antes yo siempre transfería el importe íntegro a la cuenta del fabricante.	Раньше я регулярно переводил полную сумму на банковский счёт производителя.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	13
643	5	transferiste	перевёл (ты)	¿Ayer tú transferiste el importe íntegro a la cuenta del fabricante?	Вчера ты перевёл полную сумму на банковский счёт производителя?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	13
644	5	transferías	переводил (ты)	¿Antes tú transferías el importe íntegro a la cuenta del fabricante?	Раньше ты регулярно переводил полную сумму на банковский счёт производителя?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	13
645	5	transfirió	перевёл (он / Вы)	Ayer el proveedor transfirió el importe íntegro a la cuenta del fabricante.	Вчера поставщик перевёл полную сумму на банковский счёт производителя.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	13
646	5	transfería	переводил (он / Вы)	El proveedor siempre transfería el importe íntegro a la cuenta del fabricante.	Поставщик всегда переводил полную сумму на банковский счёт производителя.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	13
647	5	transferimos	перевели (мы)	La semana pasada nosotros transferimos el importe íntegro a la cuenta del fabricante.	На прошлой неделе мы перевели полную сумму на банковский счёт производителя.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	13
648	5	transferíamos	переводили (мы)	Nosotros normalmente transferíamos el importe íntegro a la cuenta del fabricante.	Мы обычно переводили полную сумму на банковский счёт производителя.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	13
649	5	transferisteis	перевели (вы)	¿Ayer vosotros transferisteis el importe íntegro a la cuenta del fabricante?	Вчера вы перевели полную сумму на банковский счёт производителя?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	13
650	5	transferíais	переводили (вы)	¿Antes vosotros transferíais el importe íntegro a la cuenta del fabricante?	Раньше вы регулярно переводили полную сумму на банковский счёт производителя?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	13
651	5	transfirieron	перевели (они / Вы)	Esta mañana ellos transfirieron el importe íntegro a la cuenta del fabricante.	Сегодня утром они перевели полную сумму на банковский счёт производителя.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	13
652	5	transferían	переводили (они / Вы)	Ellos habitualmente transferían el importe íntegro a la cuenta del fabricante.	Они обычно переводили полную сумму на банковский счёт производителя.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	13
653	5	vendía	продавал (я)	Antes yo siempre vendía toda la partida en los canales de distribución.	Раньше я регулярно продавал всю партию по каналам дистрибуции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	20
654	5	vendiste	продал (ты)	¿Ayer tú vendiste toda la partida en los canales de distribución?	Вчера ты продал всю партию по каналам дистрибуции?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	20
655	5	vendías	продавал (ты)	¿Antes tú vendías toda la partida en los canales de distribución?	Раньше ты регулярно продавал всю партию по каналам дистрибуции?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	20
656	5	vendió	продал (он / Вы)	Ayer el proveedor vendió toda la partida en los canales de distribución.	Вчера поставщик продал всю партию по каналам дистрибуции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	20
657	5	vendía	продавал (он / Вы)	El proveedor siempre vendía toda la partida en los canales de distribución.	Поставщик всегда продавал всю партию по каналам дистрибуции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	20
658	5	vendimos	продали (мы)	La semana pasada nosotros vendimos toda la partida en los canales de distribución.	На прошлой неделе мы продали всю партию по каналам дистрибуции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	20
659	5	vendíamos	продавали (мы)	Nosotros normalmente vendíamos toda la partida en los canales de distribución.	Мы обычно продавали всю партию по каналам дистрибуции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	20
660	5	vendisteis	продали (вы)	¿Ayer vosotros vendisteis toda la partida en los canales de distribución?	Вчера вы продали всю партию по каналам дистрибуции?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	20
661	5	vendíais	продавали (вы)	¿Antes vosotros vendíais toda la partida en los canales de distribución?	Раньше вы регулярно продавали всю партию по каналам дистрибуции?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	20
662	5	vendieron	продали (они / Вы)	Esta mañana ellos vendieron toda la partida en los canales de distribución.	Сегодня утром они продали всю партию по каналам дистрибуции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	20
663	5	vendían	продавали (они / Вы)	Ellos habitualmente vendían toda la partida en los canales de distribución.	Они обычно продавали всю партию по каналам дистрибуции.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	20
664	5	verifiqué	проверил (я)	Ayer yo verifiqué el stock físico disponible en el almacén.	Вчера я проверил физический остаток на складе.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	9
665	5	verificaba	проверял (я)	Antes yo siempre verificaba el stock físico disponible en el almacén.	Раньше я регулярно проверял физический остаток на складе.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	9
666	5	verificaste	проверил (ты)	¿Ayer tú verificaste el stock físico disponible en el almacén?	Вчера ты проверил физический остаток на складе?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	9
667	5	verificabas	проверял (ты)	¿Antes tú verificabas el stock físico disponible en el almacén?	Раньше ты регулярно проверял физический остаток на складе?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	9
668	5	verificó	проверил (он / Вы)	Ayer el proveedor verificó el stock físico disponible en el almacén.	Вчера поставщик проверил физический остаток на складе.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	9
669	5	verificaba	проверял (он / Вы)	El proveedor siempre verificaba el stock físico disponible en el almacén.	Поставщик всегда проверял физический остаток на складе.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	9
670	5	verificamos	проверили (мы)	La semana pasada nosotros verificamos el stock físico disponible en el almacén.	На прошлой неделе мы проверили физический остаток на складе.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	9
671	5	verificábamos	проверяли (мы)	Nosotros normalmente verificábamos el stock físico disponible en el almacén.	Мы обычно проверяли физический остаток на складе.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	9
672	5	verificasteis	проверили (вы)	¿Ayer vosotros verificasteis el stock físico disponible en el almacén?	Вчера вы проверили физический остаток на складе?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	9
673	5	verificabais	проверяли (вы)	¿Antes vosotros verificabais el stock físico disponible en el almacén?	Раньше вы регулярно проверяли физический остаток на складе?	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	9
674	5	verificaron	проверили (они / Вы)	Esta mañana ellos verificaron el stock físico disponible en el almacén.	Сегодня утром они проверили физический остаток на складе.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	9
675	5	verificaban	проверяли (они / Вы)	Ellos habitualmente verificaban el stock físico disponible en el almacén.	Они обычно проверяли физический остаток на складе.	2026-10-04 19:04:04.781+00	2026-10-04 19:04:04.781+00	f	9
676	5	gracias a	благодаря	Conseguimos un mejor precio gracias al volumen de compra anual.	Мы получили лучшую цену благодаря годовому объёму закупок.	2026-10-18 21:34:49.10093+00	2026-10-18 21:34:49.10093+00	f	\N
677	5	el importe íntegro	полная сумма, вся сумма целиком	Ayer transferimos el importe íntegro a la cuenta bancaria del fabricante.	Вчера мы перевели полную сумму на банковский счёт производителя.	2026-10-18 21:34:49.10093+00	2026-10-18 21:34:49.10093+00	f	\N
678	5	sin demora	без задержек, незамедлительно	Por favor, envíenos la factura proforma sin demora para autorizar el pago.	Пожалуйста, отправьте нам счёт-проформу без задержек, чтобы авторизовать платёж.	2026-10-18 21:34:49.10093+00	2026-10-18 21:34:49.10093+00	f	\N
679	5	el lote	партия	Ayer compramos un lote grande con descuento especial por volumen.	Вчера мы купили крупную партию со специальной скидкой за объём.	2026-10-18 21:34:49.10093+00	2026-10-18 21:34:49.10093+00	f	\N
680	5	pásenos	передайте нам, перешлите нам	Pásenos, sin demora, el albarán de entrega sellado por el transportista.	Передайте нам без задержек товарную накладную с печатью перевозчика.	2026-10-18 21:34:49.10093+00	2026-10-18 21:34:49.10093+00	f	\N
681	5	el albarán de entrega	товарная накладная, накладная о доставке	Ayer nosotros recibimos el albarán de entrega debidamente sellado.	Вчера мы получили товарную накладную с круглой печатью.	2026-10-18 21:34:49.10093+00	2026-10-18 21:34:49.10093+00	f	\N
682	5	sellado	с печатью, заверенный печатью	Es obligatorio adjuntar el albarán sellado para tramitar la garantía.	Обязательно приложить накладную с печатью для оформления гарантии.	2026-10-18 21:34:49.10093+00	2026-10-18 21:34:49.10093+00	f	\N
683	5	el transporte marítimo	морская перевозка, морской транспорт	Ayer reclamamos las piezas que sufrieron daños durante el transporte marítimo.	Вчера мы предъявили претензию по деталям, пострадавшим во время морской перевозки.	2026-10-18 21:34:49.10093+00	2026-10-18 21:34:49.10093+00	f	\N
\.


--
-- Name: vy_answers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vy_answers_id_seq', 1620, true);


--
-- Name: vy_languages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vy_languages_id_seq', 5, true);


--
-- Name: vy_session_activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vy_session_activities_id_seq', 181, true);


--
-- Name: vy_study_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vy_study_sessions_id_seq', 65, true);


--
-- Name: vy_tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vy_tags_id_seq', 7, true);


--
-- Name: vy_words_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vy_words_id_seq', 683, true);


--
-- Name: vy_study_sessions uq_vy_study_sessions_lang_date; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_study_sessions
    ADD CONSTRAINT uq_vy_study_sessions_lang_date UNIQUE (language_id, session_date);


--
-- Name: vy_answers vy_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_answers
    ADD CONSTRAINT vy_answers_pkey PRIMARY KEY (id);


--
-- Name: vy_languages vy_languages_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_languages
    ADD CONSTRAINT vy_languages_code_key UNIQUE (code);


--
-- Name: vy_languages vy_languages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_languages
    ADD CONSTRAINT vy_languages_pkey PRIMARY KEY (id);


--
-- Name: vy_session_activities vy_session_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_session_activities
    ADD CONSTRAINT vy_session_activities_pkey PRIMARY KEY (id);


--
-- Name: vy_study_sessions vy_study_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_study_sessions
    ADD CONSTRAINT vy_study_sessions_pkey PRIMARY KEY (id);


--
-- Name: vy_tags vy_tags_language_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_tags
    ADD CONSTRAINT vy_tags_language_id_name_key UNIQUE (language_id, name);


--
-- Name: vy_tags vy_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_tags
    ADD CONSTRAINT vy_tags_pkey PRIMARY KEY (id);


--
-- Name: vy_word_tags vy_word_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_word_tags
    ADD CONSTRAINT vy_word_tags_pkey PRIMARY KEY (word_id, tag_id);


--
-- Name: vy_words vy_words_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_words
    ADD CONSTRAINT vy_words_pkey PRIMARY KEY (id);


--
-- Name: idx_vy_session_activities_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vy_session_activities_session ON public.vy_session_activities USING btree (session_id);


--
-- Name: idx_vy_session_activities_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vy_session_activities_type ON public.vy_session_activities USING btree (activity_type);


--
-- Name: idx_vy_session_activities_word; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vy_session_activities_word ON public.vy_session_activities USING btree (word_id);


--
-- Name: idx_vy_study_sessions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vy_study_sessions_date ON public.vy_study_sessions USING btree (session_date);


--
-- Name: idx_vy_study_sessions_lang; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vy_study_sessions_lang ON public.vy_study_sessions USING btree (language_id);


--
-- Name: idx_vy_tags_language_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vy_tags_language_id ON public.vy_tags USING btree (language_id);


--
-- Name: idx_vy_word_tags_tag_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vy_word_tags_tag_id ON public.vy_word_tags USING btree (tag_id);


--
-- Name: idx_vy_words_base_word_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vy_words_base_word_id ON public.vy_words USING btree (base_word_id);


--
-- Name: vy_answers_word_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vy_answers_word_id_idx ON public.vy_answers USING btree (word_id);


--
-- Name: vy_words_language_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vy_words_language_id_idx ON public.vy_words USING btree (language_id);


--
-- Name: vy_tags fk_vy_tags_language_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_tags
    ADD CONSTRAINT fk_vy_tags_language_id FOREIGN KEY (language_id) REFERENCES public.vy_languages(id) ON DELETE CASCADE;


--
-- Name: vy_word_tags fk_vy_word_tags_tag_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_word_tags
    ADD CONSTRAINT fk_vy_word_tags_tag_id FOREIGN KEY (tag_id) REFERENCES public.vy_tags(id) ON DELETE CASCADE;


--
-- Name: vy_word_tags fk_vy_word_tags_word_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_word_tags
    ADD CONSTRAINT fk_vy_word_tags_word_id FOREIGN KEY (word_id) REFERENCES public.vy_words(id) ON DELETE CASCADE;


--
-- Name: vy_answers vy_answers_word_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_answers
    ADD CONSTRAINT vy_answers_word_id_fkey FOREIGN KEY (word_id) REFERENCES public.vy_words(id) ON DELETE CASCADE;


--
-- Name: vy_session_activities vy_session_activities_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_session_activities
    ADD CONSTRAINT vy_session_activities_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.vy_study_sessions(id) ON DELETE CASCADE;


--
-- Name: vy_session_activities vy_session_activities_word_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_session_activities
    ADD CONSTRAINT vy_session_activities_word_id_fkey FOREIGN KEY (word_id) REFERENCES public.vy_words(id) ON DELETE CASCADE;


--
-- Name: vy_study_sessions vy_study_sessions_language_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_study_sessions
    ADD CONSTRAINT vy_study_sessions_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.vy_languages(id) ON DELETE CASCADE;


--
-- Name: vy_words vy_words_base_word_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_words
    ADD CONSTRAINT vy_words_base_word_id_fkey FOREIGN KEY (base_word_id) REFERENCES public.vy_words(id) ON DELETE CASCADE;


--
-- Name: vy_words vy_words_language_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vy_words
    ADD CONSTRAINT vy_words_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.vy_languages(id) ON DELETE CASCADE;


--
-- Name: vy_answers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vy_answers ENABLE ROW LEVEL SECURITY;

--
-- Name: vy_languages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vy_languages ENABLE ROW LEVEL SECURITY;

--
-- Name: vy_words; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vy_words ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict wER9vJ8ZrsDDYFkB6Te3lrOinBvsvq8VlI6ka1jiLo2kg426iOq6zOhlnhHnstx

