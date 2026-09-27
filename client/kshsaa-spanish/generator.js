/* Curated phrase inventory. Only target lemmas found in the supplied Anki deck are used. */
(() => {
  const D = window.BOWL_DATA;
  const byLemma = new Map();
  for (const v of D.vocab) { const key = v.lemma.toLocaleLowerCase('es'); if (!byLemma.has(key))byLemma.set(key, v); }
  const groups = {
    food: [['pan', 'el pan', 'the bread'], ['arroz', 'el arroz', 'the rice'], ['queso', 'el queso', 'the cheese'], ['pollo', 'el pollo', 'the chicken'], ['pescado', 'el pescado', 'the fish'], ['carne', 'la carne', 'the meat'], ['manzana', 'una manzana', 'an apple'], ['ensalada', 'una ensalada', 'a salad'], ['sopa', 'la sopa', 'the soup'], ['pastel', 'el pastel', 'the cake'], ['huevo', 'un huevo', 'an egg']],
    drinks: [['agua', 'agua', 'water'], ['leche', 'leche', 'milk'], ['café', 'café', 'coffee'], ['té', 'té', 'tea'], ['jugo', 'jugo de naranja', 'orange juice']],
    reading: [['libro', 'el libro', 'the book'], ['carta', 'la carta', 'the letter'], ['revista', 'la revista', 'the magazine'], ['periódico', 'el periódico', 'the newspaper'], ['noticia', 'la noticia', 'the news item'], ['informe', 'el informe', 'the report'], ['mensaje', 'el mensaje', 'the message'], ['poema', 'el poema', 'the poem']],
    writing: [['carta', 'una carta', 'a letter'], ['mensaje', 'un mensaje', 'a message'], ['poema', 'un poema', 'a poem'], ['informe', 'un informe', 'a report'], ['novela', 'una novela', 'a novel'], ['cuento', 'un cuento', 'a story']],
    objects: [['libro', 'el libro', 'the book'], ['carta', 'la carta', 'the letter'], ['llave', 'la llave', 'the key'], ['bolsa', 'la bolsa', 'the bag'], ['mochila', 'la mochila', 'the backpack'], ['dinero', 'el dinero', 'the money'], ['billete', 'el billete', 'the ticket'], ['mapa', 'el mapa', 'the map'], ['paraguas', 'el paraguas', 'the umbrella'], ['sombrero', 'el sombrero', 'the hat'], ['reloj', 'el reloj', 'the watch'], ['regalo', 'el regalo', 'the gift'], ['cuaderno', 'el cuaderno', 'the notebook'], ['lápiz', 'el lápiz', 'the pencil']],
    buy: [['libro', 'un libro', 'a book'], ['camisa', 'una camisa', 'a shirt'], ['zapato', 'unos zapatos', 'some shoes'], ['vestido', 'un vestido', 'a dress'], ['abrigo', 'un abrigo', 'a coat'], ['pantalón', 'unos pantalones', 'some pants'], ['regalo', 'un regalo', 'a gift'], ['boleto', 'un boleto', 'a ticket'], ['bicicleta', 'una bicicleta', 'a bicycle'], ['mesa', 'una mesa', 'a table'], ['silla', 'una silla', 'a chair'], ['flor', 'unas flores', 'some flowers']],
    places: [['escuela', 'la escuela', 'the school'], ['biblioteca', 'la biblioteca', 'the library'], ['museo', 'el museo', 'the museum'], ['iglesia', 'la iglesia', 'the church'], ['ciudad', 'la ciudad', 'the city'], ['pueblo', 'el pueblo', 'the town'], ['parque', 'el parque', 'the park'], ['hospital', 'el hospital', 'the hospital'], ['mercado', 'el mercado', 'the market'], ['tienda', 'la tienda', 'the store']],
    clean: [['casa', 'la casa', 'the house'], ['cocina', 'la cocina', 'the kitchen'], ['baño', 'el baño', 'the bathroom'], ['habitación', 'la habitación', 'the room'], ['ventana', 'la ventana', 'the window'], ['mesa', 'la mesa', 'the table'], ['suelo', 'el suelo', 'the floor'], ['coche', 'el coche', 'the car']],
    open: [['puerta', 'la puerta', 'the door'], ['ventana', 'la ventana', 'the window'], ['caja', 'la caja', 'the box'], ['tienda', 'la tienda', 'the store'], ['libro', 'el libro', 'the book']],
    learning: [['español', 'español', 'Spanish'], ['francés', 'francés', 'French'], ['alemán', 'alemán', 'German'], ['inglés', 'inglés', 'English'], ['historia', 'historia', 'history'], ['matemática', 'matemáticas', 'mathematics'], ['ciencia', 'ciencias', 'science']],
    tasks: [['tarea', 'la tarea', 'the homework'], ['trabajo', 'el trabajo', 'the work'], ['proyecto', 'el proyecto', 'the project'], ['informe', 'el informe', 'the report']],
    hear: [['música', 'música', 'music'], ['radio', 'la radio', 'the radio'], ['canción', 'una canción', 'a song']],
    questions: [['pregunta', 'la pregunta', 'the question'], ['respuesta', 'la respuesta', 'the answer'], ['problema', 'el problema', 'the problem'], ['explicación', 'la explicación', 'the explanation'], ['regla', 'la regla', 'the rule']]
  };
  const verbs = [
    // lemma, English base/past/third, object group, six present forms; overrides below
    ['comer', 'eat', 'ate', 'eats', 'food', 'como comes come comemos coméis comen'],
    ['beber', 'drink', 'drank', 'drinks', 'drinks', 'bebo bebes bebe bebemos bebéis beben'],
    ['comprar', 'buy', 'bought', 'buys', 'buy', 'compro compras compra compramos compráis compran'],
    ['vender', 'sell', 'sold', 'sells', 'buy', 'vendo vendes vende vendemos vendéis venden'],
    ['necesitar', 'need', 'needed', 'needs', 'objects', 'necesito necesitas necesita necesitamos necesitáis necesitan'],
    ['buscar', 'look for', 'looked for', 'looks for', 'objects', 'busco buscas busca buscamos buscáis buscan'],
    ['encontrar', 'find', 'found', 'finds', 'objects', 'encuentro encuentras encuentra encontramos encontráis encuentran'],
    ['perder', 'lose', 'lost', 'loses', 'objects', 'pierdo pierdes pierde perdemos perdéis pierden'],
    ['traer', 'bring', 'brought', 'brings', 'objects', 'traigo traes trae traemos traéis traen'],
    ['llevar', 'carry', 'carried', 'carries', 'objects', 'llevo llevas lleva llevamos lleváis llevan'],
    ['leer', 'read', 'read', 'reads', 'reading', 'leo lees lee leemos leéis leen'],
    ['escribir', 'write', 'wrote', 'writes', 'writing', 'escribo escribes escribe escribimos escribís escriben'],
    ['visitar', 'visit', 'visited', 'visits', 'places', 'visito visitas visita visitamos visitáis visitan'],
    ['limpiar', 'clean', 'cleaned', 'cleans', 'clean', 'limpio limpias limpia limpiamos limpiáis limpian'],
    ['abrir', 'open', 'opened', 'opens', 'open', 'abro abres abre abrimos abrís abren'],
    ['cerrar', 'close', 'closed', 'closes', 'open', 'cierro cierras cierra cerramos cerráis cierran'],
    ['estudiar', 'study', 'studied', 'studies', 'learning', 'estudio estudias estudia estudiamos estudiáis estudian'],
    ['terminar', 'finish', 'finished', 'finishes', 'tasks', 'termino terminas termina terminamos termináis terminan'],
    ['hacer', 'do', 'did', 'does', 'tasks', 'hago haces hace hacemos hacéis hacen'],
    ['escuchar', 'listen to', 'listened to', 'listens to', 'hear', 'escucho escuchas escucha escuchamos escucháis escuchan'],
    ['entender', 'understand', 'understood', 'understands', 'questions', 'entiendo entiendes entiende entendemos entendéis entienden'],
    ['preparar', 'prepare', 'prepared', 'prepares', 'food', 'preparo preparas prepara preparamos preparáis preparan'],
    ['recordar', 'remember', 'remembered', 'remembers', 'questions', 'recuerdo recuerdas recuerda recordamos recordáis recuerdan'],
    ['explicar', 'explain', 'explained', 'explains', 'questions', 'explico explicas explica explicamos explicáis explican']
  ];
  const special = {
    traer: { preterite: 'traje trajiste trajo trajimos trajisteis trajeron' },
    leer: { preterite: 'leí leíste leyó leímos leísteis leyeron' },
    hacer: { preterite: 'hice hiciste hizo hicimos hicisteis hicieron', future: 'har', conditional: 'har' },
    buscar: { preterite: 'busqué buscaste buscó buscamos buscasteis buscaron' },
    explicar: { preterite: 'expliqué explicaste explicó explicamos explicasteis explicaron' }
  };
  const endings = { preterite: { ar: 'é aste ó amos asteis aron', er: 'í iste ió imos isteis ieron', ir: 'í iste ió imos isteis ieron' }, imperfect: { ar: 'aba abas aba ábamos abais aban', er: 'ía ías ía íamos íais ían', ir: 'ía ías ía íamos íais ían' }, future: 'é ás á emos éis án', conditional: 'ía ías ía íamos íais ían' };
  const subjects = [['Yo', 'I', 0], ['Tú', 'You', 1], ['Ella', 'She', 2], ['Él', 'He', 2], ['Nosotros', 'We', 3], ['Ellos', 'They', 5], ['Mi hermano', 'My brother', 2], ['Mi hermana', 'My sister', 2], ['Mis amigos', 'My friends', 5], ['La profesora', 'The teacher', 2]];
  const times = { present: [['', ''], [' por la mañana', ' in the morning'], [' por la tarde', ' in the afternoon'], [' después de la escuela', ' after school']], preterite: [[' ayer', ' yesterday'], [' anoche', ' last night'], [' la semana pasada', ' last week'], [' esta mañana', ' this morning']], imperfect: [['', ''], [' todos los días', ' every day'], [' por la mañana', ' in the morning'], [' los domingos', ' on Sundays']], future: [[' mañana', ' tomorrow'], [' la semana que viene', ' next week'], [' más tarde', ' later'], [' después de la escuela', ' after school']], conditional: [['', ''], [' si fuera necesario', ' if it were necessary'], [' si tuviera tiempo', ' if I had time']] };
  const tenses = ['present', 'preterite', 'imperfect', 'future', 'conditional'];
  const target = lemma => byLemma.get(lemma);
  function pair (x) { return { lemma: x[0], es: x[1], en: x[2], v: target(x[0]) }; }
  for (const key in groups)groups[key] = groups[key].map(pair).filter(x => x.v);
  const availableVerbs = verbs.filter(v => target(v[0]) && groups[v[4]].length);
  function pick (a) { return a[Math.floor(Math.random() * a.length)]; }
  function conjugate (v, tense, p) { if (tense === 'present') return v[5].split(' ')[p]; const over = special[v[0]]?.[tense]; if (over && tense === 'preterite') return over.split(' ')[p]; if (tense === 'future' || tense === 'conditional') return (over || v[0]) + endings[tense].split(' ')[p]; return v[0].slice(0, -2) + endings[tense][v[0].slice(-2)].split(' ')[p]; }
  function english (v, tense, p, neg) { if (tense === 'present') return neg ? `${p === 2 ? 'does' : 'do'} not ${v[1]}` : p === 2 ? v[3] : v[1]; if (tense === 'preterite') return neg ? 'did not ' + v[1] : v[2]; if (tense === 'imperfect') return neg ? 'did not use to ' + v[1] : 'used to ' + v[1]; return (tense === 'future' ? 'will' : 'would') + (neg ? ' not' : '') + ' ' + v[1]; }
  function finish (es, en, grammar, targets, note = '') { return { id: 'g:' + es, spanish: es, english: en, grammar, targets: [...new Map(targets.filter(Boolean).map(v => [v.rank, v])).values()], note, source: 'Generated practice · ' + grammar }; }
  function regular (rank, focus) { const vs = availableVerbs.filter(v => target(v[0]).rank <= rank && groups[v[4]].some(x => x.v.rank <= rank)); if (!vs.length) return null; const v = pick(vs); const o = pick(groups[v[4]].filter(x => x.v.rank <= rank)); const s = pick(subjects); const tense = focus === 'mixed' ? pick(tenses) : focus; const neg = Math.random() < 0.25; let tm = pick(times[tense]); if (tense === 'conditional' && tm[0].includes('tuviera')) { const had = ['tuviera', 'tuvieras', 'tuviera', 'tuviéramos', 'tuvierais', 'tuvieran'][s[2]]; tm = [' si ' + had + ' tiempo', ' if ' + s[1].replace(/^My/, 'my').replace(/^The/, 'the').replace(/^You/, 'you').replace(/^She/, 'she').replace(/^He/, 'he').replace(/^We/, 'we').replace(/^They/, 'they') + ' had time']; } return finish(`${s[0]} ${neg ? 'no ' : ''}${conjugate(v, tense, s[2])} ${o.es}${tm[0]}.`, `${s[1]} ${english(v, tense, s[2], neg)} ${o.en}${tm[1]}.`, tense, [target(v[0]), o.v]); }
  const commands = [['abrir', 'Abre', 'open', 'open'], ['cerrar', 'Cierra', 'close', 'open'], ['leer', 'Lee', 'read', 'reading'], ['escribir', 'Escribe', 'write', 'writing'], ['traer', 'Trae', 'bring', 'objects'], ['comprar', 'Compra', 'buy', 'buy'], ['limpiar', 'Limpia', 'clean', 'clean'], ['terminar', 'Termina', 'finish', 'tasks'], ['hacer', 'Haz', 'do', 'tasks'], ['buscar', 'Busca', 'look for', 'objects']];
  function command (rank) { const pool = commands.filter(v => target(v[0])?.rank <= rank && groups[v[3]].some(o => o.v.rank <= rank)); if (!pool.length) return null; const v = pick(pool); const o = pick(groups[v[3]].filter(o => o.v.rank <= rank)); const t = pick([['', ''], [', por favor', ', please'], [' antes de salir', ' before leaving'], [' después de comer', ' after eating']]); return finish(`${v[1]} ${o.es}${t[0]}.`, `${v[2][0].toUpperCase() + v[2].slice(1)} ${o.en}${t[1]}.`, 'commands', [target(v[0]), o.v]); }
  const subj = [['comprar', 'compres', 'buy', 'buy'], ['leer', 'leas', 'read', 'reading'], ['traer', 'traigas', 'bring', 'objects'], ['hacer', 'hagas', 'do', 'tasks'], ['limpiar', 'limpies', 'clean', 'clean'], ['abrir', 'abras', 'open', 'open'], ['cerrar', 'cierres', 'close', 'open'], ['terminar', 'termines', 'finish', 'tasks'], ['estudiar', 'estudies', 'study', 'learning']];
  function subjunctive (rank) { const pool = subj.filter(v => target(v[0])?.rank <= rank && groups[v[3]].some(o => o.v.rank <= rank)); if (!pool.length) return null; const v = pick(pool); const o = pick(groups[v[3]].filter(o => o.v.rank <= rank)); const opener = pick([['Mi madre quiere que', 'My mother wants you to'], ['Espero que', 'I hope you'], ['Es importante que', 'It is important that you'], ['El profesor quiere que', 'The teacher wants you to']]); return finish(`${opener[0]} ${v[1]} ${o.es}.`, `${opener[1]} ${v[2]} ${o.en}.`, 'subjunctive', [target(v[0]), o.v]); }
  const expressions = [
    ['objects', '¿Dónde está {es}?', 'Where is {en}?'], ['objects', 'No puedo encontrar {es}.', 'I cannot find {en}.'], ['objects', '¿Puedes traer {es}?', 'Can you bring {en}?'], ['objects', 'Acabo de encontrar {es}.', 'I have just found {en}.'], ['objects', 'No sé dónde está {es}.', 'I do not know where {en} is.'], ['food', 'Me gusta {es}.', 'I like {en}.'], ['food', 'Voy a preparar {es}.', 'I am going to prepare {en}.'], ['food', 'Acabo de comer {es}.', 'I have just eaten {en}.'], ['places', '¿Dónde está {es}?', 'Where is {en}?'], ['places', 'Vamos a visitar {es} mañana.', 'We are going to visit {en} tomorrow.'], ['places', '{Es} está cerca de mi casa.', '{En} is near my house.'], ['reading', '¿De quién es {es}?', 'Whose {noun} is it?'], ['reading', 'Me gustaría leer {es}.', 'I would like to read {en}.'], ['tasks', 'Tengo que terminar {es}.', 'I have to finish {en}.'], ['tasks', 'No olvides terminar {es}.', 'Do not forget to finish {en}.'], ['tasks', 'Todavía no he terminado {es}.', 'I have not finished {en} yet.'], ['questions', 'No entiendo {es}.', 'I do not understand {en}.'], ['questions', '¿Puedes explicar {es}?', 'Can you explain {en}?'], ['questions', '¿Cuál es {es}?', 'What is {en}?'], ['writing', 'Acabo de escribir {es}.', 'I have just written {en}.']
  ];
  function expression (rank) { const pool = expressions.filter(t => groups[t[0]].some(o => o.v.rank <= rank)); if (!pool.length) return null; const t = pick(pool); const o = pick(groups[t[0]].filter(o => o.v.rank <= rank)); const sub = x => x.replaceAll('{es}', o.es).replaceAll('{en}', o.en).replaceAll('{Es}', o.es[0].toUpperCase() + o.es.slice(1)).replaceAll('{En}', o.en[0].toUpperCase() + o.en.slice(1)).replaceAll('{noun}', o.en.replace(/^the /, '')); return finish(sub(t[1]), sub(t[2]), 'expressions', [o.v]); }
  const seen = new Set();
  function generate (rank = 2000, focus = 'mixed') { for (let i = 0; i < 80; i++) { const f = focus === 'mixed' ? pick([...tenses, ...tenses, 'commands', 'subjunctive', 'expressions', 'expressions']) : focus; const q = f === 'commands' ? command(rank) : f === 'subjunctive' ? subjunctive(rank) : f === 'expressions' ? expression(rank) : regular(rank, f); if (!q) return null; if (!seen.has(q.spanish) || i === 79) { seen.add(q.spanish); return q; } } }
  const coverage = new Set(); for (const v of availableVerbs)coverage.add(target(v[0]).rank); for (const group of Object.values(groups)) for (const o of group)coverage.add(o.v.rank);
  window.BOWL_GENERATOR = { generate, coverage: coverage.size, patterns: availableVerbs.length * 5 + commands.length + subj.length + expressions.length, conjugate, verbs: availableVerbs, groups };
})();
