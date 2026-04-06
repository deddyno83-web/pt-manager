// src/data/esercizi.js
export const CATEGORIE = [
  'Petto', 'Schiena', 'Spalle', 'Bicipiti', 'Tricipiti',
  'Gambe', 'Glutei', 'Addominali', 'Cardio', 'Corpo libero'
];

// Immagini placeholder professionali per ogni categoria (via exercisedb / wikimedia)
const IMG = {
  petto: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=150&fit=crop',
  schiena: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=150&fit=crop',
  spalle: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=200&h=150&fit=crop',
  bicipiti: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=200&h=150&fit=crop',
  tricipiti: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=200&h=150&fit=crop',
  gambe: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=200&h=150&fit=crop',
  glutei: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=150&fit=crop',
  addominali: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=200&h=150&fit=crop',
  cardio: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=200&h=150&fit=crop',
  corpo: 'https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=200&h=150&fit=crop',
};

export const ESERCIZI_DEFAULT = [
  // PETTO
  { id: 'panca_piana', nome: 'Panca Piana', categoria: 'Petto', foto: IMG.petto, descrizione: 'Sdraiati sulla panca, bilanciere con presa leggermente più larga delle spalle. Abbassa controllato al petto e spingi in su. Tieni i piedi a terra e le scapole retratte.' },
  { id: 'panca_inclinata', nome: 'Panca Inclinata', categoria: 'Petto', foto: IMG.petto, descrizione: 'Come la panca piana ma con schienale inclinato a 30-45°. Enfatizza la parte alta del petto.' },
  { id: 'panca_declinata', nome: 'Panca Declinata', categoria: 'Petto', foto: IMG.petto, descrizione: 'Schienale declinato verso il basso. Enfatizza la parte bassa del petto.' },
  { id: 'croci_manubri', nome: 'Croci con Manubri', categoria: 'Petto', foto: IMG.petto, descrizione: 'Sdraiato sulla panca, apri le braccia con manubri in arco controllato mantenendo un leggero gomito flesso.' },
  { id: 'push_up', nome: 'Push Up', categoria: 'Petto', foto: IMG.corpo, descrizione: 'In posizione plank, abbassa il petto verso il pavimento e ritorna. Corpo rigido, gomiti a 45°.' },
  { id: 'dips_petto', nome: 'Dips (petto)', categoria: 'Petto', foto: IMG.petto, descrizione: 'Alle parallele, inclina il busto in avanti e scendi fino a 90° di flessione del gomito.' },
  { id: 'cable_crossover', nome: 'Cable Crossover', categoria: 'Petto', foto: IMG.petto, descrizione: 'Ai cavi alti, porta le maniglie verso il basso incrociando le mani. Mantieni le braccia leggermente flesse.' },

  // SCHIENA
  { id: 'stacco', nome: 'Stacco da Terra', categoria: 'Schiena', foto: IMG.schiena, descrizione: 'Piedi spalla-larghezza, schiena dritta. Spingi i talloni a terra e solleva il bilanciere mantenendo la barra vicino al corpo.' },
  { id: 'lat_machine', nome: 'Lat Machine', categoria: 'Schiena', foto: IMG.schiena, descrizione: 'Seduto, tira la barra verso il petto con schiena leggermente arcuata. Contrai i dorsali nella posizione finale.' },
  { id: 'rematore_bilanciere', nome: 'Rematore con Bilanciere', categoria: 'Schiena', foto: IMG.schiena, descrizione: 'Busto parallelo al suolo, tira il bilanciere verso l\'ombelico con gomiti vicini al corpo.' },
  { id: 'trazioni', nome: 'Trazioni', categoria: 'Schiena', foto: IMG.schiena, descrizione: 'Appeso alla sbarra con presa prona, tira il corpo verso l\'alto portando il mento sopra la barra.' },
  { id: 'rematore_manubrio', nome: 'Rematore con Manubrio', categoria: 'Schiena', foto: IMG.schiena, descrizione: 'Un ginocchio e una mano sulla panca, tira il manubrio verso il fianco con il gomito alto.' },
  { id: 'pullover', nome: 'Pullover', categoria: 'Schiena', foto: IMG.schiena, descrizione: 'Sdraiato sulla panca, abbassa il manubrio o il bilanciere oltre la testa a braccia quasi tese.' },
  { id: 'low_row', nome: 'Low Row al Cavo', categoria: 'Schiena', foto: IMG.schiena, descrizione: 'Seduto al cavo basso, tira la maniglia verso l\'addome. Schiena dritta, petto fuori.' },

  // SPALLE
  { id: 'lento_avanti', nome: 'Lento Avanti', categoria: 'Spalle', foto: IMG.spalle, descrizione: 'Seduto o in piedi, spingi il bilanciere o manubri sopra la testa. Schiena neutra, core attivo.' },
  { id: 'alzate_laterali', nome: 'Alzate Laterali', categoria: 'Spalle', foto: IMG.spalle, descrizione: 'Con manubri ai fianchi, alza le braccia lateralmente fino all\'altezza delle spalle con gomiti leggermente flessi.' },
  { id: 'alzate_frontali', nome: 'Alzate Frontali', categoria: 'Spalle', foto: IMG.spalle, descrizione: 'Con manubri davanti alle cosce, alza un braccio alla volta fino all\'altezza delle spalle.' },
  { id: 'scrollate', nome: 'Scrollate (Shrug)', categoria: 'Spalle', foto: IMG.spalle, descrizione: 'Con bilanciere o manubri, solleva le spalle verso le orecchie in modo verticale. Senza ruotare.' },
  { id: 'face_pull', nome: 'Face Pull', categoria: 'Spalle', foto: IMG.spalle, descrizione: 'Al cavo alto con corda, tira verso il viso divaricando le mani. Ottimo per i deltoidi posteriori.' },

  // BICIPITI
  { id: 'curl_bilanciere', nome: 'Curl con Bilanciere', categoria: 'Bicipiti', foto: IMG.bicipiti, descrizione: 'In piedi, gomiti fissi ai fianchi, porta il bilanciere verso le spalle ruotando gli avambracci.' },
  { id: 'curl_manubri', nome: 'Curl con Manubri', categoria: 'Bicipiti', foto: IMG.bicipiti, descrizione: 'Alternando i bracci, porta i manubri verso le spalle. Gomiti fermi ai fianchi, supina nel movimento.' },
  { id: 'curl_martello', nome: 'Curl a Martello', categoria: 'Bicipiti', foto: IMG.bicipiti, descrizione: 'Come il curl normale ma con presa neutra (pollice in alto). Lavora anche il brachiale.' },
  { id: 'curl_concentrato', nome: 'Curl Concentrato', categoria: 'Bicipiti', foto: IMG.bicipiti, descrizione: 'Seduto, gomito appoggiato alla coscia interna, porta il manubrio verso la spalla in modo isolato.' },
  { id: 'curl_cavo', nome: 'Curl al Cavo Basso', categoria: 'Bicipiti', foto: IMG.bicipiti, descrizione: 'Al cavo basso con barra, esegui il curl. Il cavo mantiene tensione costante per tutto il ROM.' },

  // TRICIPITI
  { id: 'french_press', nome: 'French Press', categoria: 'Tricipiti', foto: IMG.tricipiti, descrizione: 'Sdraiato, abbassa il bilanciere verso la fronte flettendo solo i gomiti. Risali in modo controllato.' },
  { id: 'pushdown_cavo', nome: 'Pushdown al Cavo', categoria: 'Tricipiti', foto: IMG.tricipiti, descrizione: 'Al cavo alto, spingi la barra verso il basso con gomiti fissi ai fianchi. Estendi completamente il braccio.' },
  { id: 'dips_tricipiti', nome: 'Dips (tricipiti)', categoria: 'Tricipiti', foto: IMG.tricipiti, descrizione: 'Con mani su panca dietro di te, abbassa i glutei verso il pavimento flettendo i gomiti.' },
  { id: 'kickback', nome: 'Kickback', categoria: 'Tricipiti', foto: IMG.tricipiti, descrizione: 'Busto inclinato in avanti, estendi il braccio con il manubrio verso il retro. Gomito fisso in alto.' },
  { id: 'overhead_tricipiti', nome: 'Overhead Extension', categoria: 'Tricipiti', foto: IMG.tricipiti, descrizione: 'In piedi, porta il manubrio o il bilanciere sopra la testa e abbassa dietro la nuca flettendo i gomiti.' },

  // GAMBE
  { id: 'squat', nome: 'Squat', categoria: 'Gambe', foto: IMG.gambe, descrizione: 'Piedi spalla-larghezza, scendi fino a cosce parallele al suolo. Schiena dritta, ginocchia in linea con i piedi.' },
  { id: 'leg_press', nome: 'Leg Press', categoria: 'Gambe', foto: IMG.gambe, descrizione: 'Seduto alla leg press, spingi la piattaforma con i talloni. Non bloccare le ginocchia in estensione.' },
  { id: 'affondi', nome: 'Affondi', categoria: 'Gambe', foto: IMG.gambe, descrizione: 'Fai un passo avanti, abbassa il ginocchio posteriore verso il suolo mantenendo il busto dritto.' },
  { id: 'leg_curl', nome: 'Leg Curl', categoria: 'Gambe', foto: IMG.gambe, descrizione: 'Sdraiato al macchinario, porta i talloni verso i glutei flettendo le ginocchia. Lavora i femorali.' },
  { id: 'leg_extension', nome: 'Leg Extension', categoria: 'Gambe', foto: IMG.gambe, descrizione: 'Seduto al macchinario, estendi le gambe fino alla posizione orizzontale. Lavora il quadricipite.' },
  { id: 'calf_raise', nome: 'Calf Raise', categoria: 'Gambe', foto: IMG.gambe, descrizione: 'In piedi su un gradino, solleva i talloni il più in alto possibile. Lavora il polpaccio.' },
  { id: 'squat_bulgaro', nome: 'Squat Bulgaro', categoria: 'Gambe', foto: IMG.gambe, descrizione: 'Piede posteriore su una panca, scendi con il ginocchio anteriore. Ottimo per equilibrio e forza unilaterale.' },

  // GLUTEI
  { id: 'hip_thrust', nome: 'Hip Thrust', categoria: 'Glutei', foto: IMG.glutei, descrizione: 'Schiena appoggiata alla panca, bilanciere sulle anche, spingi i fianchi verso l\'alto contraendo i glutei.' },
  { id: 'sumo_squat', nome: 'Sumo Squat', categoria: 'Glutei', foto: IMG.glutei, descrizione: 'Come lo squat ma con stance larga e piedi extraruotati. Enfatizza l\'interno coscia e i glutei.' },
  { id: 'donkey_kick', nome: 'Donkey Kick', categoria: 'Glutei', foto: IMG.glutei, descrizione: 'A quattro zampe, calcia un piede verso il soffitto mantenendo il ginocchio a 90°.' },
  { id: 'glute_bridge', nome: 'Glute Bridge', categoria: 'Glutei', foto: IMG.glutei, descrizione: 'Sdraiato supino con ginocchia piegate, spingi i fianchi verso l\'alto contraendo i glutei al top.' },

  // ADDOMINALI
  { id: 'crunch', nome: 'Crunch', categoria: 'Addominali', foto: IMG.addominali, descrizione: 'Sdraiato, ginocchia piegate, porta le spalle verso le ginocchia contraendo l\'addome. Non tirare il collo.' },
  { id: 'plank', nome: 'Plank', categoria: 'Addominali', foto: IMG.addominali, descrizione: 'In posizione di push up con avambracci a terra. Mantieni il corpo rigido. Attiva core, glutei e quadricipiti.' },
  { id: 'russian_twist', nome: 'Russian Twist', categoria: 'Addominali', foto: IMG.addominali, descrizione: 'Seduto con gambe sollevate, ruota il busto da un lato all\'altro tenendo un peso o le mani giunte.' },
  { id: 'leg_raise', nome: 'Leg Raise', categoria: 'Addominali', foto: IMG.addominali, descrizione: 'Sdraiato, gambe tese, porta i piedi verso il soffitto. Lavora il basso addome senza usare lo slancio.' },
  { id: 'mountain_climber', nome: 'Mountain Climber', categoria: 'Addominali', foto: IMG.addominali, descrizione: 'In posizione di plank, porta le ginocchia alternativamente verso il petto in modo dinamico.' },
  { id: 'ab_wheel', nome: 'Ab Wheel', categoria: 'Addominali', foto: IMG.addominali, descrizione: 'In ginocchio con la ruota, rotolati in avanti mantenendo la schiena piatta, poi torna indietro.' },

  // CARDIO
  { id: 'tapis_roulant', nome: 'Tapis Roulant', categoria: 'Cardio', foto: IMG.cardio, descrizione: 'Corsa o camminata su tapis roulant. Imposta velocità e inclinazione in base all\'obiettivo.' },
  { id: 'cyclette', nome: 'Cyclette', categoria: 'Cardio', foto: IMG.cardio, descrizione: 'Pedalata su cyclette. Regola resistenza e cadenza in base alla fase dell\'allenamento.' },
  { id: 'ellittica', nome: 'Ellittica', categoria: 'Cardio', foto: IMG.cardio, descrizione: 'Movimento ellittico che combina corsa e sciare. Basso impatto sulle articolazioni.' },
  { id: 'corda', nome: 'Salto con la Corda', categoria: 'Cardio', foto: IMG.cardio, descrizione: 'Salto con la corda a ritmo costante o intervallato. Ottimo per coordinazione e cardio.' },
  { id: 'rowing', nome: 'Vogatore', categoria: 'Cardio', foto: IMG.cardio, descrizione: 'Simula il canottaggio. Lavora tutto il corpo con enfasi su schiena e gambe.' },
  { id: 'hiit', nome: 'HIIT', categoria: 'Cardio', foto: IMG.cardio, descrizione: 'Intervalli ad alta intensità alternati a recupero attivo. Es. 30" sprint / 30" camminata.' },

  // CORPO LIBERO
  { id: 'burpee', nome: 'Burpee', categoria: 'Corpo libero', foto: IMG.corpo, descrizione: 'Da in piedi scendi a terra in posizione plank, fai un push up, rialzati e salta. Esercizio completo.' },
  { id: 'jumping_jack', nome: 'Jumping Jack', categoria: 'Corpo libero', foto: IMG.corpo, descrizione: 'Salta aprendo gambe e braccia simultaneamente, poi riuniscile. Ottimo riscaldamento.' },
  { id: 'squat_jump', nome: 'Squat Jump', categoria: 'Corpo libero', foto: IMG.corpo, descrizione: 'Esegui uno squat e nella fase di risalita salta esplosivamente verso l\'alto.' },
];
