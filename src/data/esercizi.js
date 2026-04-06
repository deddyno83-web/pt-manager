// src/data/esercizi.js
export const CATEGORIE = [
  'Petto', 'Schiena', 'Spalle', 'Bicipiti', 'Tricipiti',
  'Gambe', 'Glutei', 'Addominali', 'Polpacci', 'Avambracci',
  'Cardio', 'Corpo libero', 'Funzionale', 'Stretching'
];

const IMG = {
  petto:      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=150&fit=crop',
  schiena:    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=150&fit=crop',
  spalle:     'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=200&h=150&fit=crop',
  bicipiti:   'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=200&h=150&fit=crop',
  tricipiti:  'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=200&h=150&fit=crop',
  gambe:      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=200&h=150&fit=crop',
  glutei:     'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=150&fit=crop',
  addome:     'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=150&fit=crop',
  cardio:     'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=200&h=150&fit=crop',
  corpo:      'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=200&h=150&fit=crop',
  funz:       'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=150&fit=crop',
};

export const ESERCIZI_DEFAULT = [
  // ── PETTO ──
  { id: 'panca_piana',        nome: 'Panca Piana',                categoria: 'Petto',    foto: IMG.petto,    descrizione: 'Sdraiati sulla panca, bilanciere con presa più larga delle spalle. Abbassa controllato al petto e spingi in su. Scapole retratte, piedi a terra.' },
  { id: 'panca_inclinata',    nome: 'Panca Inclinata',            categoria: 'Petto',    foto: IMG.petto,    descrizione: 'Come la panca piana ma con schienale inclinato a 30-45°. Enfatizza la parte alta del petto.' },
  { id: 'panca_declinata',    nome: 'Panca Declinata',            categoria: 'Petto',    foto: IMG.petto,    descrizione: 'Schienale declinato verso il basso. Enfatizza la parte bassa del petto. Attenzione alla pressione sulle spalle.' },
  { id: 'panca_manubri',      nome: 'Panca Piana Manubri',        categoria: 'Petto',    foto: IMG.petto,    descrizione: 'Come la panca piana ma con manubri. Maggiore ROM e attivazione stabilizzatori. Ottima alternativa al bilanciere.' },
  { id: 'croci_manubri',      nome: 'Croci con Manubri',          categoria: 'Petto',    foto: IMG.petto,    descrizione: 'Sdraiato sulla panca, apri le braccia ad arco con manubri. Gomiti leggermente flessi durante tutto il movimento.' },
  { id: 'croci_cavi',         nome: 'Croci ai Cavi',              categoria: 'Petto',    foto: IMG.petto,    descrizione: 'Ai cavi alti, porta le maniglie verso il basso incrociando le mani. Tensione costante per tutto il ROM.' },
  { id: 'cable_crossover',    nome: 'Cable Crossover',            categoria: 'Petto',    foto: IMG.petto,    descrizione: 'Ai cavi alti, porta le maniglie verso il centro incrociandole. Ottimo per la definizione del petto.' },
  { id: 'pec_deck',           nome: 'Pec Deck (Farfalla)',        categoria: 'Petto',    foto: IMG.petto,    descrizione: 'Seduto alla macchina farfalla, chiudi le braccia davanti al petto. Esercizio di isolamento molto efficace.' },
  { id: 'chest_press',        nome: 'Chest Press Macchina',       categoria: 'Petto',    foto: IMG.petto,    descrizione: 'Seduto alla macchina chest press, spingi in avanti. Sicuro e controllato, ideale per principianti.' },
  { id: 'push_up',            nome: 'Push Up',                    categoria: 'Petto',    foto: IMG.corpo,    descrizione: 'In posizione plank, abbassa il petto verso il pavimento e risali. Corpo rigido, gomiti a 45°.' },
  { id: 'push_up_inclinato',  nome: 'Push Up Inclinato',          categoria: 'Petto',    foto: IMG.corpo,    descrizione: 'Mani su una panca rialzata. Enfatizza la parte bassa del petto. Più facile del push up standard.' },
  { id: 'dips_petto',         nome: 'Dips (petto)',               categoria: 'Petto',    foto: IMG.petto,    descrizione: 'Alle parallele, inclina il busto in avanti e scendi fino a 90° di flessione del gomito.' },
  { id: 'pullover',           nome: 'Pullover',                   categoria: 'Petto',    foto: IMG.petto,    descrizione: 'Sdraiato sulla panca, abbassa il manubrio o il bilanciere oltre la testa a braccia quasi tese. Coinvolge anche i dorsali.' },
  { id: 'smith_panca',        nome: 'Panca al Multipower',        categoria: 'Petto',    foto: IMG.petto,    descrizione: 'Panca piana eseguita alla macchina Smith. Più sicura del bilanciere libero, utile per allenamenti in solitaria.' },

  // ── SCHIENA ──
  { id: 'stacco',             nome: 'Stacco da Terra',            categoria: 'Schiena',  foto: IMG.schiena,  descrizione: 'Piedi spalla-larghezza, schiena dritta. Spingi i talloni e solleva il bilanciere mantenendo la barra vicino al corpo. Re degli esercizi.' },
  { id: 'stacco_rumeno',      nome: 'Stacco Rumeno',              categoria: 'Schiena',  foto: IMG.schiena,  descrizione: 'Gambe quasi tese, abbassa il bilanciere lungo la coscia piegandoti sui fianchi. Enfatizza femorali e lombari.' },
  { id: 'stacco_sumo',        nome: 'Stacco Sumo',                categoria: 'Schiena',  foto: IMG.schiena,  descrizione: 'Stance larga, piedi extraruotati. Tira il bilanciere verso le anche. Più glutei e adduttori rispetto allo stacco classico.' },
  { id: 'lat_machine',        nome: 'Lat Machine',                categoria: 'Schiena',  foto: IMG.schiena,  descrizione: 'Seduto, tira la barra verso il petto con schiena leggermente arcuata. Contrai i dorsali nella posizione finale.' },
  { id: 'lat_machine_inversa',nome: 'Lat Machine Presa Inversa',  categoria: 'Schiena',  foto: IMG.schiena,  descrizione: 'Come la lat machine ma con presa supina (palmi verso di te). Più enfasi sui bicipiti e parte bassa del dorsale.' },
  { id: 'rematore_bilanciere',nome: 'Rematore con Bilanciere',    categoria: 'Schiena',  foto: IMG.schiena,  descrizione: 'Busto parallelo al suolo, tira il bilanciere verso l\'ombelico con gomiti vicini al corpo. Schiena dritta.' },
  { id: 'rematore_manubrio',  nome: 'Rematore con Manubrio',      categoria: 'Schiena',  foto: IMG.schiena,  descrizione: 'Un ginocchio e una mano sulla panca, tira il manubrio verso il fianco con il gomito alto.' },
  { id: 'trazioni_prone',     nome: 'Trazioni Presa Prona',       categoria: 'Schiena',  foto: IMG.schiena,  descrizione: 'Appeso alla sbarra con presa prona, tira il corpo verso l\'alto portando il mento sopra la barra.' },
  { id: 'trazioni_supine',    nome: 'Trazioni Presa Supina',      categoria: 'Schiena',  foto: IMG.schiena,  descrizione: 'Presa supina (palmi verso di te). Più facile e con maggiore coinvolgimento dei bicipiti rispetto alla presa prona.' },
  { id: 'low_row',            nome: 'Low Row al Cavo',            categoria: 'Schiena',  foto: IMG.schiena,  descrizione: 'Seduto al cavo basso, tira la maniglia verso l\'addome. Schiena dritta, petto fuori. Ottimo per la parte media del dorsale.' },
  { id: 't_bar_row',          nome: 'T-Bar Row',                  categoria: 'Schiena',  foto: IMG.schiena,  descrizione: 'Con il petto sul supporto, tira il bilanciere verso il petto. Esercizio composto molto efficace per il dorsale.' },
  { id: 'good_morning',       nome: 'Good Morning',               categoria: 'Schiena',  foto: IMG.schiena,  descrizione: 'Bilanciere sulle spalle, inclina il busto in avanti mantenendo la schiena dritta. Allena lombari, femorali e glutei.' },
  { id: 'iperextension',      nome: 'Iperestensioni',             categoria: 'Schiena',  foto: IMG.schiena,  descrizione: 'Al macchinario apposito, inclina il busto verso il basso e risali contraendo i lombari. Ottimo per la prevenzione infortuni.' },
  { id: 'seated_row',         nome: 'Seated Row Macchina',        categoria: 'Schiena',  foto: IMG.schiena,  descrizione: 'Seduto alla macchina rematore, tira le maniglie verso il petto. Guidato e sicuro, ottimo per principianti.' },

  // ── SPALLE ──
  { id: 'lento_avanti',       nome: 'Lento Avanti',               categoria: 'Spalle',   foto: IMG.spalle,   descrizione: 'Seduto o in piedi, spingi il bilanciere sopra la testa. Schiena neutra, core attivo. Re degli esercizi per le spalle.' },
  { id: 'lento_avanti_mdb',   nome: 'Lento Avanti Manubri',       categoria: 'Spalle',   foto: IMG.spalle,   descrizione: 'Come il lento avanti ma con manubri. Maggiore libertà di movimento e attivazione stabilizzatori.' },
  { id: 'alzate_laterali',    nome: 'Alzate Laterali',            categoria: 'Spalle',   foto: IMG.spalle,   descrizione: 'Con manubri ai fianchi, alza le braccia lateralmente fino all\'altezza delle spalle con gomiti leggermente flessi.' },
  { id: 'alzate_frontali',    nome: 'Alzate Frontali',            categoria: 'Spalle',   foto: IMG.spalle,   descrizione: 'Con manubri davanti alle cosce, alza un braccio alla volta fino all\'altezza delle spalle. Allena il deltoide anteriore.' },
  { id: 'alzate_post',        nome: 'Alzate Posteriori',          categoria: 'Spalle',   foto: IMG.spalle,   descrizione: 'Busto inclinato, alza i manubri lateralmente verso l\'alto. Allena il deltoide posteriore spesso trascurato.' },
  { id: 'scrollate',          nome: 'Scrollate (Shrug)',           categoria: 'Spalle',   foto: IMG.spalle,   descrizione: 'Con bilanciere o manubri, solleva le spalle verso le orecchie verticalmente. Allena il trapezio superiore.' },
  { id: 'face_pull',          nome: 'Face Pull',                  categoria: 'Spalle',   foto: IMG.spalle,   descrizione: 'Al cavo alto con corda, tira verso il viso divaricando le mani. Ottimo per i deltoidi posteriori e la salute delle spalle.' },
  { id: 'tirate_mento',       nome: 'Tirate al Mento',            categoria: 'Spalle',   foto: IMG.spalle,   descrizione: 'Tira il bilanciere verso il mento con i gomiti alti. Allena trapezio e deltoide laterale.' },
  { id: 'arnold_press',       nome: 'Arnold Press',               categoria: 'Spalle',   foto: IMG.spalle,   descrizione: 'Inventato da Arnold. Parti con i palmi verso di te, ruota durante la spinta. Allena tutti e 3 i fasci del deltoide.' },
  { id: 'lento_dietro',       nome: 'Lento Dietro',               categoria: 'Spalle',   foto: IMG.spalle,   descrizione: 'Spingi il bilanciere sopra la testa da dietro la nuca. Più enfasi sul deltoide posteriore. Attenzione alla cervicale.' },
  { id: 'shoulder_press_mcc', nome: 'Shoulder Press Macchina',    categoria: 'Spalle',   foto: IMG.spalle,   descrizione: 'Seduto alla macchina, spingi verso l\'alto. Sicuro e guidato, ottimo per chi ha problemi alle spalle.' },

  // ── BICIPITI ──
  { id: 'curl_bilanciere',    nome: 'Curl con Bilanciere',        categoria: 'Bicipiti', foto: IMG.bicipiti, descrizione: 'In piedi, gomiti fissi ai fianchi, porta il bilanciere verso le spalle ruotando gli avambracci.' },
  { id: 'curl_ez',            nome: 'Curl con Bilanciere EZ',     categoria: 'Bicipiti', foto: IMG.bicipiti, descrizione: 'Come il curl con bilanciere ma con barra EZ. Meno stress sui polsi, ottima alternativa.' },
  { id: 'curl_manubri',       nome: 'Curl con Manubri',           categoria: 'Bicipiti', foto: IMG.bicipiti, descrizione: 'Alternando i bracci, porta i manubri verso le spalle. Gomiti fermi ai fianchi, supina nel movimento.' },
  { id: 'curl_martello',      nome: 'Curl a Martello',            categoria: 'Bicipiti', foto: IMG.bicipiti, descrizione: 'Come il curl normale ma con presa neutra (pollice in alto). Lavora anche il brachiale e brachioradiale.' },
  { id: 'curl_concentrato',   nome: 'Curl Concentrato',           categoria: 'Bicipiti', foto: IMG.bicipiti, descrizione: 'Seduto, gomito appoggiato alla coscia interna, porta il manubrio verso la spalla in modo isolato.' },
  { id: 'curl_cavo',          nome: 'Curl al Cavo Basso',         categoria: 'Bicipiti', foto: IMG.bicipiti, descrizione: 'Al cavo basso con barra, esegui il curl. Il cavo mantiene tensione costante per tutto il ROM.' },
  { id: 'curl_inclinato',     nome: 'Curl Panca Inclinata',       categoria: 'Bicipiti', foto: IMG.bicipiti, descrizione: 'Seduto su panca inclinata, parti con le braccia completamente estese. Massimo allungamento del bicipite.' },
  { id: 'curl_spider',        nome: 'Spider Curl',                categoria: 'Bicipiti', foto: IMG.bicipiti, descrizione: 'Sul bordo di una panca inclinata, esegui il curl con le braccia pendenti. Ottimo per il picco del bicipite.' },
  { id: 'preacher_curl',      nome: 'Preacher Curl (Scott)',      categoria: 'Bicipiti', foto: IMG.bicipiti, descrizione: 'Al banco Scott, tira la barra verso le spalle. Il banco blocca il gomito per un isolamento perfetto.' },

  // ── TRICIPITI ──
  { id: 'french_press',       nome: 'French Press',               categoria: 'Tricipiti',foto: IMG.tricipiti,descrizione: 'Sdraiato, abbassa il bilanciere verso la fronte flettendo solo i gomiti. Risali in modo controllato.' },
  { id: 'french_press_mdb',   nome: 'French Press Manubri',       categoria: 'Tricipiti',foto: IMG.tricipiti,descrizione: 'Come il french press ma con un manubrio tenuto a due mani. Maggiore libertà di movimento.' },
  { id: 'pushdown_barra',     nome: 'Pushdown con Barra',         categoria: 'Tricipiti',foto: IMG.tricipiti,descrizione: 'Al cavo alto con barra dritta, spingi verso il basso con gomiti fissi. Estendi completamente il braccio.' },
  { id: 'pushdown_corda',     nome: 'Pushdown con Corda',         categoria: 'Tricipiti',foto: IMG.tricipiti,descrizione: 'Al cavo alto con corda, spingi verso il basso aprendo le estremità. Ottima attivazione del capo laterale.' },
  { id: 'dips_tricipiti',     nome: 'Dips (tricipiti)',           categoria: 'Tricipiti',foto: IMG.tricipiti,descrizione: 'Con mani su panca dietro di te, abbassa i glutei verso il pavimento flettendo i gomiti.' },
  { id: 'kickback',           nome: 'Kickback',                   categoria: 'Tricipiti',foto: IMG.tricipiti,descrizione: 'Busto inclinato in avanti, estendi il braccio verso il retro. Gomito fisso in alto. Isolamento puro del tricipite.' },
  { id: 'overhead_ext',       nome: 'Overhead Extension',         categoria: 'Tricipiti',foto: IMG.tricipiti,descrizione: 'In piedi, porta il manubrio sopra la testa e abbassa dietro la nuca flettendo i gomiti.' },
  { id: 'tricipiti_macchina', nome: 'Tricipiti alla Macchina',    categoria: 'Tricipiti',foto: IMG.tricipiti,descrizione: 'Seduto alla macchina, spingi verso il basso. Sicuro e isolato, ottimo per principianti.' },
  { id: 'close_grip_bench',   nome: 'Panca Presa Stretta',        categoria: 'Tricipiti',foto: IMG.tricipiti,descrizione: 'Panca piana con presa stretta (30cm). Sposta il focus dal petto ai tricipiti. Eccellente esercizio composto.' },

  // ── GAMBE ──
  { id: 'squat',              nome: 'Squat',                      categoria: 'Gambe',    foto: IMG.gambe,    descrizione: 'Piedi spalla-larghezza, scendi fino a cosce parallele al suolo. Schiena dritta, ginocchia in linea con i piedi.' },
  { id: 'squat_smith',        nome: 'Squat al Multipower',        categoria: 'Gambe',    foto: IMG.gambe,    descrizione: 'Squat alla macchina Smith. Più sicuro e guidato. Utile per isolare il quadricipite o i glutei cambiando la posizione dei piedi.' },
  { id: 'squat_bulgaro',      nome: 'Squat Bulgaro',              categoria: 'Gambe',    foto: IMG.gambe,    descrizione: 'Piede posteriore su una panca, scendi con il ginocchio anteriore. Ottimo per equilibrio e forza unilaterale.' },
  { id: 'hack_squat',         nome: 'Hack Squat',                 categoria: 'Gambe',    foto: IMG.gambe,    descrizione: 'Alla macchina hack squat, scendi con le spalle nel supporto. Enfatizza il quadricipite. Sicuro per la schiena.' },
  { id: 'leg_press_45',       nome: 'Leg Press 45°',              categoria: 'Gambe',    foto: IMG.gambe,    descrizione: 'Seduto alla leg press 45°, spingi la piattaforma con i talloni. Non bloccare le ginocchia in estensione.' },
  { id: 'leg_press_oriz',     nome: 'Leg Press Orizzontale',      categoria: 'Gambe',    foto: IMG.gambe,    descrizione: 'Seduto alla leg press orizzontale, spingi in avanti. Ideale per chi ha problemi alle ginocchia.' },
  { id: 'affondi',            nome: 'Affondi',                    categoria: 'Gambe',    foto: IMG.gambe,    descrizione: 'Fai un passo avanti, abbassa il ginocchio posteriore verso il suolo mantenendo il busto dritto.' },
  { id: 'affondi_cammino',    nome: 'Affondi in Cammino',         categoria: 'Gambe',    foto: IMG.gambe,    descrizione: 'Affondi eseguiti camminando in avanti. Aumenta la coordinazione e il dispendio energetico rispetto agli affondi statici.' },
  { id: 'affondi_laterali',   nome: 'Affondi Laterali',           categoria: 'Gambe',    foto: IMG.gambe,    descrizione: 'Apri una gamba lateralmente e abbassati su quella gamba. Ottimo per adduttori e glutei.' },
  { id: 'leg_curl',           nome: 'Leg Curl (Sdraiato)',        categoria: 'Gambe',    foto: IMG.gambe,    descrizione: 'Sdraiato al macchinario, porta i talloni verso i glutei. Allena i femorali in modo isolato.' },
  { id: 'leg_curl_seduto',    nome: 'Leg Curl (Seduto)',          categoria: 'Gambe',    foto: IMG.gambe,    descrizione: 'Seduto al macchinario, porta i piedi verso il basso. Allena i femorali con angolazione diversa.' },
  { id: 'leg_extension',      nome: 'Leg Extension',              categoria: 'Gambe',    foto: IMG.gambe,    descrizione: 'Seduto al macchinario, estendi le gambe fino alla posizione orizzontale. Allena il quadricipite in isolamento.' },
  { id: 'stacco_gambe_tese',  nome: 'Stacco Gambe Tese',          categoria: 'Gambe',    foto: IMG.gambe,    descrizione: 'Con gambe quasi tese, abbassa il bilanciere lungo la coscia. Femorali e lombari in primis.' },
  { id: 'step_up',            nome: 'Step Up',                    categoria: 'Gambe',    foto: IMG.gambe,    descrizione: 'Sali su uno step o una panca con un piede, spingi verso l\'alto. Allena quadricipiti e glutei unilateralmente.' },
  { id: 'box_squat',          nome: 'Box Squat',                  categoria: 'Gambe',    foto: IMG.gambe,    descrizione: 'Squat con una panca o box dietro. Scendi fino a sederti brevemente sul box, poi risali esplosivamente.' },
  { id: 'sissy_squat',        nome: 'Sissy Squat',                categoria: 'Gambe',    foto: IMG.gambe,    descrizione: 'In piedi, inclina il corpo indietro mentre i ginocchi avanzano. Isolamento estremo del quadricipite.' },

  // ── GLUTEI ──
  { id: 'hip_thrust',         nome: 'Hip Thrust',                 categoria: 'Glutei',   foto: IMG.glutei,   descrizione: 'Schiena appoggiata alla panca, bilanciere sulle anche, spingi i fianchi verso l\'alto contraendo i glutei.' },
  { id: 'glute_bridge',       nome: 'Glute Bridge',               categoria: 'Glutei',   foto: IMG.glutei,   descrizione: 'Sdraiato supino, pianta i piedi e spingi i fianchi verso l\'alto. Versione più semplice dell\'hip thrust.' },
  { id: 'sumo_squat',         nome: 'Sumo Squat',                 categoria: 'Glutei',   foto: IMG.glutei,   descrizione: 'Stance larga, piedi extraruotati. Enfatizza l\'interno coscia e i glutei rispetto allo squat classico.' },
  { id: 'donkey_kick',        nome: 'Donkey Kick',                categoria: 'Glutei',   foto: IMG.glutei,   descrizione: 'A quattro zampe, calcia un piede verso il soffitto mantenendo il ginocchio a 90°.' },
  { id: 'fire_hydrant',       nome: 'Fire Hydrant',               categoria: 'Glutei',   foto: IMG.glutei,   descrizione: 'A quattro zampe, apri un ginocchio lateralmente verso il soffitto. Allena il gluteo medio.' },
  { id: 'abductor_machine',   nome: 'Abduttore alla Macchina',    categoria: 'Glutei',   foto: IMG.glutei,   descrizione: 'Seduto alla macchina, apri le gambe contro la resistenza. Allena il gluteo medio e i piccoli.' },
  { id: 'cable_kickback',     nome: 'Kickback al Cavo',           categoria: 'Glutei',   foto: IMG.glutei,   descrizione: 'Al cavo basso con cinghia alla caviglia, porta la gamba indietro e in alto. Isolamento del gluteo.' },
  { id: 'good_morning_gl',    nome: 'Good Morning (Glutei)',      categoria: 'Glutei',   foto: IMG.glutei,   descrizione: 'Bilanciere sulle spalle, inclina il busto in avanti mantenendo la schiena dritta. Allena glutei e femorali.' },
  { id: 'squat_sumo_mdb',     nome: 'Sumo Squat Manubrio',        categoria: 'Glutei',   foto: IMG.glutei,   descrizione: 'Come il sumo squat ma con un manubrio tenuto a due mani tra le gambe. Pratico e versatile.' },

  // ── ADDOMINALI ──
  { id: 'crunch',             nome: 'Crunch',                     categoria: 'Addominali',foto: IMG.addome,  descrizione: 'Sdraiato, ginocchia piegate, porta le spalle verso le ginocchia contraendo l\'addome. Non tirare il collo.' },
  { id: 'crunch_inverso',     nome: 'Crunch Inverso',             categoria: 'Addominali',foto: IMG.addome,  descrizione: 'Sdraiato, porta le ginocchia verso il petto sollevando i glutei. Allena il basso addome.' },
  { id: 'crunch_obliquo',     nome: 'Crunch Obliquo',             categoria: 'Addominali',foto: IMG.addome,  descrizione: 'Come il crunch ma ruota verso il ginocchio opposto. Allena gli obliqui.' },
  { id: 'plank',              nome: 'Plank',                      categoria: 'Addominali',foto: IMG.addome,  descrizione: 'In posizione di push up con avambracci a terra. Mantieni il corpo rigido. Attiva core, glutei e quadricipiti.' },
  { id: 'plank_laterale',     nome: 'Plank Laterale',             categoria: 'Addominali',foto: IMG.addome,  descrizione: 'Su un avambraccio e il lato del piede, mantieni il corpo in linea. Allena gli obliqui e il core laterale.' },
  { id: 'russian_twist',      nome: 'Russian Twist',              categoria: 'Addominali',foto: IMG.addome,  descrizione: 'Seduto con gambe sollevate, ruota il busto da un lato all\'altro. Aggiungere un peso per aumentare l\'intensità.' },
  { id: 'leg_raise',          nome: 'Leg Raise',                  categoria: 'Addominali',foto: IMG.addome,  descrizione: 'Sdraiato, gambe tese, porta i piedi verso il soffitto. Basso addome senza usare lo slancio.' },
  { id: 'hanging_leg_raise',  nome: 'Hanging Leg Raise',          categoria: 'Addominali',foto: IMG.addome,  descrizione: 'Appeso alla sbarra, porta le ginocchia o le gambe tese verso il petto. Esercizio avanzato per tutto l\'addome.' },
  { id: 'mountain_climber',   nome: 'Mountain Climber',           categoria: 'Addominali',foto: IMG.addome,  descrizione: 'In posizione di plank, porta le ginocchia alternativamente verso il petto in modo dinamico.' },
  { id: 'ab_wheel',           nome: 'Ab Wheel',                   categoria: 'Addominali',foto: IMG.addome,  descrizione: 'In ginocchio con la ruota, rotolati in avanti mantenendo la schiena piatta, poi torna indietro.' },
  { id: 'v_up',               nome: 'V-Up',                       categoria: 'Addominali',foto: IMG.addome,  descrizione: 'Sdraiato, solleva simultaneamente gambe e busto formando una V. Esercizio completo per tutto il core.' },
  { id: 'sit_up',             nome: 'Sit Up',                     categoria: 'Addominali',foto: IMG.addome,  descrizione: 'Dal pavimento, siediti completamente contraendo gli addominali. Più ROM del crunch classico.' },
  { id: 'bicicletta',         nome: 'Addominali a Bicicletta',    categoria: 'Addominali',foto: IMG.addome,  descrizione: 'Sdraiato, porta un gomito verso il ginocchio opposto in modo alternato come pedalando.' },

  // ── POLPACCI ──
  { id: 'calf_raise',         nome: 'Calf Raise in Piedi',        categoria: 'Polpacci', foto: IMG.gambe,    descrizione: 'In piedi su un gradino o a terra, solleva i talloni il più in alto possibile. Allena il gastrocnemio.' },
  { id: 'calf_raise_seduto',  nome: 'Calf Raise Seduto',          categoria: 'Polpacci', foto: IMG.gambe,    descrizione: 'Seduto con peso sulle ginocchia, solleva i talloni. Allena prevalentemente il soleo (più profondo).' },
  { id: 'calf_leg_press',     nome: 'Calf alla Leg Press',        categoria: 'Polpacci', foto: IMG.gambe,    descrizione: 'Alla leg press con solo la punta dei piedi sulla piattaforma, spingi con i polpacci.' },
  { id: 'donkey_calf',        nome: 'Donkey Calf Raise',          categoria: 'Polpacci', foto: IMG.gambe,    descrizione: 'Busto piegato a 90°, esegui il calf raise. Massima tensione sul gastrocnemio.' },

  // ── AVAMBRACCI ──
  { id: 'wrist_curl',         nome: 'Wrist Curl (Flessori)',      categoria: 'Avambracci',foto: IMG.bicipiti,descrizione: 'Seduto con avambracci sulle cosce, fletti i polsi verso l\'alto con il bilanciere.' },
  { id: 'wrist_ext',          nome: 'Wrist Extension (Estensori)',categoria: 'Avambracci',foto: IMG.bicipiti,descrizione: 'Seduto con avambracci sulle cosce, estendi i polsi verso l\'alto. Allena gli estensori del polso.' },
  { id: 'reverse_curl',       nome: 'Curl Inverso',               categoria: 'Avambracci',foto: IMG.bicipiti,descrizione: 'Curl con presa prona (palmi verso il basso). Allena i brachioradiali e gli estensori dell\'avambraccio.' },
  { id: 'farmer_walk',        nome: 'Farmer Walk',                categoria: 'Avambracci',foto: IMG.funz,    descrizione: 'Cammina reggendo manubri pesanti ai lati. Allena la presa, il trapezio e il core. Funzionale.' },

  // ── CARDIO ──
  { id: 'tapis_roulant',      nome: 'Tapis Roulant',              categoria: 'Cardio',   foto: IMG.cardio,   descrizione: 'Corsa o camminata su tapis roulant. Imposta velocità e inclinazione in base all\'obiettivo.' },
  { id: 'cyclette',           nome: 'Cyclette',                   categoria: 'Cardio',   foto: IMG.cardio,   descrizione: 'Pedalata su cyclette. Regola resistenza e cadenza. Basso impatto sulle articolazioni.' },
  { id: 'ellittica',          nome: 'Ellittica',                  categoria: 'Cardio',   foto: IMG.cardio,   descrizione: 'Movimento ellittico che combina corsa e sciare. Basso impatto, coinvolge tutto il corpo.' },
  { id: 'corda',              nome: 'Salto con la Corda',         categoria: 'Cardio',   foto: IMG.cardio,   descrizione: 'Salto con la corda a ritmo costante o intervallato. Ottimo per coordinazione e cardio.' },
  { id: 'rowing',             nome: 'Vogatore',                   categoria: 'Cardio',   foto: IMG.cardio,   descrizione: 'Simula il canottaggio. Lavora tutto il corpo con enfasi su schiena e gambe. Altissimo dispendio calorico.' },
  { id: 'hiit',               nome: 'HIIT',                       categoria: 'Cardio',   foto: IMG.cardio,   descrizione: 'Intervalli ad alta intensità alternati a recupero. Es. 30" sprint / 30" camminata. Brucia grassi molto efficace.' },
  { id: 'bike_spinning',      nome: 'Spinning',                   categoria: 'Cardio',   foto: IMG.cardio,   descrizione: 'Cyclette ad alta intensità con variazioni di ritmo e resistenza. Ottimo per resistenza cardiovascolare.' },
  { id: 'stairmaster',        nome: 'Stairmaster',                categoria: 'Cardio',   foto: IMG.cardio,   descrizione: 'Simula la salita delle scale. Ottimo cardio con forte coinvolgimento di glutei e gambe.' },
  { id: 'battle_rope',        nome: 'Battle Rope',                categoria: 'Cardio',   foto: IMG.funz,     descrizione: 'Ondula le corde pesanti con le braccia. Cardio ad alta intensità che coinvolge braccia, spalle e core.' },

  // ── CORPO LIBERO ──
  { id: 'burpee',             nome: 'Burpee',                     categoria: 'Corpo libero',foto: IMG.corpo, descrizione: 'Da in piedi scendi a terra in posizione plank, push up, rialzati e salta. Esercizio completo ad alta intensità.' },
  { id: 'jumping_jack',       nome: 'Jumping Jack',               categoria: 'Corpo libero',foto: IMG.corpo, descrizione: 'Salta aprendo gambe e braccia simultaneamente, poi riuniscile. Ottimo riscaldamento e cardio leggero.' },
  { id: 'squat_jump',         nome: 'Squat Jump',                 categoria: 'Corpo libero',foto: IMG.corpo, descrizione: 'Esegui uno squat e nella fase di salita salta esplosivamente verso l\'alto. Allena la potenza delle gambe.' },
  { id: 'box_jump',           nome: 'Box Jump',                   categoria: 'Corpo libero',foto: IMG.corpo, descrizione: 'Salta su un box/panca da fermi. Allena la potenza esplosiva di gambe e glutei.' },
  { id: 'push_up_pliom',      nome: 'Push Up Pliometrico',        categoria: 'Corpo libero',foto: IMG.corpo, descrizione: 'Push up esplosivo con stacco delle mani dal pavimento. Allena la potenza del petto e tricipiti.' },
  { id: 'pistol_squat',       nome: 'Pistol Squat',               categoria: 'Corpo libero',foto: IMG.corpo, descrizione: 'Squat su una gamba sola con l\'altra tesa in avanti. Esercizio avanzato per equilibrio e forza.' },
  { id: 'handstand',          nome: 'Verticale (Handstand)',      categoria: 'Corpo libero',foto: IMG.corpo, descrizione: 'Verticalità sulle mani contro il muro. Allena spalle, core e coordinazione.' },

  // ── FUNZIONALE ──
  { id: 'kettlebell_swing',   nome: 'Kettlebell Swing',           categoria: 'Funzionale',foto: IMG.funz,   descrizione: 'Con il kettlebell, esegui un movimento pendolare tra le gambe e davanti al petto. Core, glutei e schiena.' },
  { id: 'clean_press',        nome: 'Clean and Press',            categoria: 'Funzionale',foto: IMG.funz,   descrizione: 'Solleva il bilanciere da terra fino alle spalle (clean) e poi spingi sopra la testa (press).' },
  { id: 'turkish_getup',      nome: 'Turkish Get Up',             categoria: 'Funzionale',foto: IMG.funz,   descrizione: 'Con kettlebell tenuto in alto, passa da sdraiato a in piedi in una sequenza complessa. Core e stabilità.' },
  { id: 'thruster',           nome: 'Thruster',                   categoria: 'Funzionale',foto: IMG.funz,   descrizione: 'Combinazione di front squat e shoulder press in un unico movimento fluido. Altissimo dispendio energetico.' },
  { id: 'deadball',           nome: 'Dead Ball / Slam Ball',      categoria: 'Funzionale',foto: IMG.funz,   descrizione: 'Solleva e sbatti a terra una palla pesante. Esplosività, core e condizionamento generale.' },
  { id: 'trx_row',            nome: 'TRX Row',                    categoria: 'Funzionale',foto: IMG.funz,   descrizione: 'Con cinghie TRX, tira il corpo verso le maniglie. Difficoltà regolabile dall\'angolo del corpo.' },
  { id: 'trx_push',           nome: 'TRX Push Up',                categoria: 'Funzionale',foto: IMG.funz,   descrizione: 'Push up con le mani nelle cinghie TRX. L\'instabilità aumenta l\'attivazione del core.' },
  { id: 'battle_rope_waves',  nome: 'Battle Rope Waves',          categoria: 'Funzionale',foto: IMG.funz,   descrizione: 'Crea onde con le corde pesanti alternando le braccia. Cardio intenso con coinvolgimento di tutto il corpo.' },
  { id: 'sled_push',          nome: 'Sled Push',                  categoria: 'Funzionale',foto: IMG.funz,   descrizione: 'Spingi il sled (slittino) con le gambe. Ottimo per la potenza e il condizionamento atletico.' },
  { id: 'tire_flip',          nome: 'Tire Flip',                  categoria: 'Funzionale',foto: IMG.funz,   descrizione: 'Ribalta uno pneumatico pesante. Allena la catena posteriore, le braccia e il core in modo funzionale.' },

  // ── STRETCHING ──
  { id: 'stretching_petto',   nome: 'Stretching Petto',           categoria: 'Stretching',foto: IMG.corpo,  descrizione: 'Porta le braccia indietro aprendo il petto. Mantieni 20-30 secondi. Ideale dopo l\'allenamento del petto.' },
  { id: 'stretching_quad',    nome: 'Stretching Quadricipite',    categoria: 'Stretching',foto: IMG.corpo,  descrizione: 'In piedi, porta il tallone verso il gluteo reggendo la caviglia. Mantieni 20-30 secondi.' },
  { id: 'stretching_fem',     nome: 'Stretching Femorali',        categoria: 'Stretching',foto: IMG.corpo,  descrizione: 'Sdraiato, porta una gamba tesa verso il petto. Mantieni 20-30 secondi. Dopo gambe e schiena.' },
  { id: 'stretching_spal',    nome: 'Stretching Spalle',          categoria: 'Stretching',foto: IMG.corpo,  descrizione: 'Porta un braccio attraverso il petto e premi con l\'altro. Mantieni 20-30 secondi per lato.' },
  { id: 'stretching_trici',   nome: 'Stretching Tricipiti',       categoria: 'Stretching',foto: IMG.corpo,  descrizione: 'Porta un braccio sopra la testa e piega il gomito, premi con l\'altra mano. 20-30 secondi.' },
  { id: 'hip_flexor',         nome: 'Stretching Flessori Anca',   categoria: 'Stretching',foto: IMG.corpo,  descrizione: 'In posizione di affondo basso, spingi i fianchi in avanti. Allenta tensione da chi sta seduto molto.' },
  { id: 'cat_cow',            nome: 'Cat-Cow',                    categoria: 'Stretching',foto: IMG.corpo,  descrizione: 'A quattro zampe, alterna l\'inarcamento e l\'arrotondamento della schiena. Mobilità spinale.' },
  { id: 'pigeon_pose',        nome: 'Piccione (Pigeon Pose)',     categoria: 'Stretching',foto: IMG.corpo,  descrizione: 'Gamba anteriore piegata davanti, gamba posteriore tesa indietro. Stretching intenso per i flessori dell\'anca.' },
];

// Categorie schede allenamento
export const CATEGORIE_SCHEDE = [
  { id: 'massa',         nome: 'Massa Muscolare',  emoji: '💪', descrizione: 'Ipertrofia muscolare con carichi progressivi, 8-12 rip' },
  { id: 'forza',         nome: 'Forza',             emoji: '🏋️', descrizione: 'Forza massimale con carichi elevati, 3-6 rip' },
  { id: 'definizione',   nome: 'Definizione',       emoji: '🔥', descrizione: 'Tonificazione e riduzione grasso, carichi medi, recuperi brevi' },
  { id: 'dimagrimento',  nome: 'Dimagrimento',      emoji: '⚡', descrizione: 'Cardio + pesi, circuiti ad alta intensità, HIIT' },
  { id: 'resistenza',    nome: 'Resistenza',        emoji: '🏃', descrizione: 'Resistenza muscolare, alte ripetizioni, recuperi brevi' },
  { id: 'circuito',      nome: 'Circuito',          emoji: '🔄', descrizione: 'Circuit training, esercizi in sequenza senza pause' },
  { id: 'fullbody',      nome: 'Full Body',         emoji: '🏆', descrizione: 'Allenamento completo, tutti i gruppi muscolari in una seduta' },
  { id: 'upper_lower',   nome: 'Upper/Lower',       emoji: '↕️', descrizione: 'Split parte superiore e inferiore alternati' },
  { id: 'push_pull',     nome: 'Push/Pull/Legs',    emoji: '🔀', descrizione: 'Split spinta, trazione e gambe su giorni separati' },
  { id: 'powerbuilding', nome: 'Powerbuilding',     emoji: '⚔️', descrizione: 'Mix forza e massa, carichi alti + volume moderato' },
  { id: 'riabilitazione',nome: 'Riabilitazione',    emoji: '🩺', descrizione: 'Recupero infortuni, carichi bassi e movimenti controllati' },
  { id: 'principianti',  nome: 'Principianti',      emoji: '🌱', descrizione: 'Adattamento al movimento, tecnica base, carichi leggeri' },
  { id: 'donna',         nome: 'Femminile',         emoji: '🌸', descrizione: 'Focus glutei e gambe, tonificazione, basso impatto' },
  { id: 'custom',        nome: 'Personalizzato',    emoji: '✨', descrizione: 'Categoria personalizzata' },
];
