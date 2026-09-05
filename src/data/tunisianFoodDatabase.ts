import { FoodItem } from '../types';

export const TUNISIAN_FOOD_DATABASE: FoodItem[] = [
  // ==========================================
  // GROUPE 1 — FÉCULENTS
  // ==========================================
  {
    id: 'fec-01',
    name_fr: 'Pain blanc standard',
    name_ar: 'خبز أبيض',
    name_tn: 'Khobz abyadh',
    category: 'feculents',
    carbs_per_100g: 50,
    protein_per_100g: 8.5,
    fat_per_100g: 1.2,
    fiber_per_100g: 2.7,
    default_portion_g: 50,
    source: 'INNT Tunis / CIQUAL',
    confidence_base: 'high',
    serving_unit_description: '1 morceau moyen (1/4 de pain ≈ 50 g)',
  },
  {
    id: 'fec-02',
    name_fr: 'Pain complet',
    name_ar: 'خبز كامل / قمح',
    name_tn: 'Khobz nkhala / goumh',
    category: 'feculents',
    carbs_per_100g: 44,
    protein_per_100g: 9.0,
    fat_per_100g: 1.8,
    fiber_per_100g: 6.5,
    default_portion_g: 50,
    source: 'INNT Tunis',
    confidence_base: 'high',
    serving_unit_description: '1 tranche ou 1/4 baguette',
  },
  {
    id: 'fec-03',
    name_fr: 'Baguette tunisienne',
    name_ar: 'باغيت',
    name_tn: 'Baguette',
    category: 'feculents',
    carbs_per_100g: 55,
    protein_per_100g: 8.2,
    fat_per_100g: 1.0,
    fiber_per_100g: 2.5,
    default_portion_g: 60,
    source: 'INNT Tunis',
    confidence_base: 'high',
    serving_unit_description: '1 quart de baguette (60 g)',
  },
  {
    id: 'fec-04',
    name_fr: 'Pain Tabouna traditionnel',
    name_ar: 'خبز طابونة',
    name_tn: 'Khobz Tabouna',
    category: 'feculents',
    carbs_per_100g: 48,
    protein_per_100g: 8.8,
    fat_per_100g: 2.0,
    fiber_per_100g: 4.2,
    default_portion_g: 75,
    source: 'Table tunisienne de composition',
    confidence_base: 'high',
    serving_unit_description: '1/2 pain tabouna artisanal (75 g)',
  },
  {
    id: 'fec-05',
    name_fr: 'Mlawi tunisien',
    name_ar: 'ملاوي',
    name_tn: 'Mlawi',
    category: 'feculents',
    carbs_per_100g: 47,
    protein_per_100g: 7.5,
    fat_per_100g: 12.0,
    fiber_per_100g: 2.4,
    default_portion_g: 100,
    source: 'Relevé INNT',
    confidence_base: 'medium',
    serving_unit_description: '1 galette mlawi moyenne (100 g)',
  },
  {
    id: 'fec-06',
    name_fr: 'Kesra semoule (Khobz Ftair)',
    name_ar: 'كسرة سميد',
    name_tn: 'Kesra / Khobz mbesses',
    category: 'feculents',
    carbs_per_100g: 46,
    protein_per_100g: 8.0,
    fat_per_100g: 8.5,
    fiber_per_100g: 3.1,
    default_portion_g: 70,
    source: 'INNT Tunis',
    confidence_base: 'medium',
    serving_unit_description: '1 quart de galette (70 g)',
  },
  {
    id: 'fec-07',
    name_fr: 'Couscous (semoule cuite à la vapeur)',
    name_ar: 'كسكسي (حبات مطبوخة)',
    name_tn: 'Kousksi tayeb',
    category: 'feculents',
    carbs_per_100g: 28,
    protein_per_100g: 4.2,
    fat_per_100g: 0.8,
    fiber_per_100g: 1.8,
    default_portion_g: 200,
    source: 'INNT / CIQUAL',
    confidence_base: 'high',
    serving_unit_description: '1 assiette moyenne cuite (200 g)',
  },
  {
    id: 'fec-08',
    name_fr: 'Pâtes cuites (nature)',
    name_ar: 'مقرونة مسلوقة',
    name_tn: 'Makrouna maslouka',
    category: 'feculents',
    carbs_per_100g: 25,
    protein_per_100g: 4.8,
    fat_per_100g: 0.9,
    fiber_per_100g: 1.5,
    default_portion_g: 200,
    source: 'CIQUAL',
    confidence_base: 'high',
    serving_unit_description: '1 bol de pâtes cuites (200 g)',
  },
  {
    id: 'fec-09',
    name_fr: 'Riz blanc cuit',
    name_ar: 'أرز أبيض مطبوخ',
    name_tn: 'Rouz abyadh',
    category: 'feculents',
    carbs_per_100g: 28,
    protein_per_100g: 2.7,
    fat_per_100g: 0.4,
    fiber_per_100g: 0.4,
    default_portion_g: 180,
    source: 'CIQUAL',
    confidence_base: 'high',
    serving_unit_description: '1 tasse moyenne (180 g)',
  },
  {
    id: 'fec-10',
    name_fr: 'Pommes de terre vapeur',
    name_ar: 'بطاطا مسلوقة',
    name_tn: 'Batata maslouka',
    category: 'feculents',
    carbs_per_100g: 17,
    protein_per_100g: 2.0,
    fat_per_100g: 0.1,
    fiber_per_100g: 1.6,
    default_portion_g: 150,
    source: 'CIQUAL',
    confidence_base: 'high',
    serving_unit_description: '2 petites pommes de terre (150 g)',
  },
  {
    id: 'fec-11',
    name_fr: 'Frites maison',
    name_ar: 'بطاطا مقلية',
    name_tn: 'Batata maklia',
    category: 'feculents',
    carbs_per_100g: 35,
    protein_per_100g: 3.8,
    fat_per_100g: 14.0,
    fiber_per_100g: 2.8,
    default_portion_g: 120,
    source: 'CIQUAL',
    confidence_base: 'high',
    serving_unit_description: '1 petite portion (120 g)',
  },
  {
    id: 'fec-12',
    name_fr: 'Semoule de blé dur crue',
    name_ar: 'سميد خام',
    name_tn: 'Smida',
    category: 'feculents',
    carbs_per_100g: 72,
    protein_per_100g: 12.0,
    fat_per_100g: 1.5,
    fiber_per_100g: 4.0,
    default_portion_g: 50,
    source: 'INNT',
    confidence_base: 'high',
    serving_unit_description: '50 g cru',
  },

  // ==========================================
  // GROUPE 2 — LÉGUMINEUSES
  // ==========================================
  {
    id: 'leg-01',
    name_fr: 'Pois chiches cuits',
    name_ar: 'حمص مسلوق',
    name_tn: 'Hommos tayeb',
    category: 'legumineuses',
    carbs_per_100g: 20,
    protein_per_100g: 8.8,
    fat_per_100g: 2.6,
    fiber_per_100g: 7.6,
    default_portion_g: 100,
    source: 'CIQUAL / INNT',
    confidence_base: 'high',
    serving_unit_description: '1/2 bol égoutté (100 g)',
  },
  {
    id: 'leg-02',
    name_fr: 'Lentilles cuites',
    name_ar: 'عدس مطبوخ',
    name_tn: 'Aades',
    category: 'legumineuses',
    carbs_per_100g: 16,
    protein_per_100g: 9.0,
    fat_per_100g: 0.8,
    fiber_per_100g: 4.5,
    default_portion_g: 120,
    source: 'CIQUAL',
    confidence_base: 'high',
    serving_unit_description: '1 bol moyen (120 g)',
  },
  {
    id: 'leg-03',
    name_fr: 'Haricots blancs cuits (Loubia)',
    name_ar: 'فاصوليا بيضاء / لوبيا',
    name_tn: 'Loubia tayba',
    category: 'legumineuses',
    carbs_per_100g: 17,
    protein_per_100g: 8.2,
    fat_per_100g: 0.6,
    fiber_per_100g: 6.4,
    default_portion_g: 130,
    source: 'CIQUAL',
    confidence_base: 'high',
    serving_unit_description: '1 assiette à sauce (130 g)',
  },
  {
    id: 'leg-04',
    name_fr: 'Fèves fraîches cuites',
    name_ar: 'فول أخضر',
    name_tn: 'Foul akhdhar',
    category: 'legumineuses',
    carbs_per_100g: 11,
    protein_per_100g: 5.6,
    fat_per_100g: 0.4,
    fiber_per_100g: 5.0,
    default_portion_g: 100,
    source: 'INNT',
    confidence_base: 'medium',
    serving_unit_description: '1 poignée cuite (100 g)',
  },
  {
    id: 'leg-05',
    name_fr: 'Fèves sèches cuites (Foul mdammis)',
    name_ar: 'فول مدمس / يابس',
    name_tn: 'Foul yaabes',
    category: 'legumineuses',
    carbs_per_100g: 19,
    protein_per_100g: 7.9,
    fat_per_100g: 0.7,
    fiber_per_100g: 7.0,
    default_portion_g: 120,
    source: 'INNT',
    confidence_base: 'high',
    serving_unit_description: '1 bol (120 g)',
  },
  {
    id: 'leg-06',
    name_fr: 'Petits pois cuits',
    name_ar: 'جلبانة مطبوخة',
    name_tn: 'Jilbana tayba',
    category: 'legumineuses',
    carbs_per_100g: 12,
    protein_per_100g: 5.4,
    fat_per_100g: 0.4,
    fiber_per_100g: 5.2,
    default_portion_g: 100,
    source: 'CIQUAL',
    confidence_base: 'high',
    serving_unit_description: '1 louche moyenne (100 g)',
  },

  // ==========================================
  // GROUPE 3 — PLATS TRADITIONNELS TUNISIENS
  // ==========================================
  {
    id: 'plat-01',
    name_fr: 'Couscous agneau et légumes',
    name_ar: 'كسكسي بلحم الخروف والخضار',
    name_tn: 'Kousksi bel allouch w khodhra',
    category: 'plats',
    carbs_per_100g: 22,
    protein_per_100g: 7.5,
    fat_per_100g: 6.2,
    fiber_per_100g: 2.1,
    default_portion_g: 350,
    source: 'Étude INNT nutrition diabète',
    confidence_base: 'medium',
    serving_unit_description: '1 grand plat individuel garni (350 g)',
  },
  {
    id: 'plat-02',
    name_fr: 'Couscous au poisson',
    name_ar: 'كسكسي بالحوت',
    name_tn: 'Kousksi bel houth',
    category: 'plats',
    carbs_per_100g: 20,
    protein_per_100g: 8.5,
    fat_per_100g: 3.5,
    fiber_per_100g: 1.9,
    default_portion_g: 350,
    source: 'INNT Tunis',
    confidence_base: 'medium',
    serving_unit_description: '1 portion complète avec poisson & piment (350 g)',
  },
  {
    id: 'plat-03',
    name_fr: 'Lablabi tunisien complet (avec œuf & thon)',
    name_ar: 'لبلابي تونسي كامل',
    name_tn: 'Lablabi kemel (thon, adham)',
    category: 'plats',
    carbs_per_100g: 18,
    protein_per_100g: 7.2,
    fat_per_100g: 4.8,
    fiber_per_100g: 3.9,
    default_portion_g: 380,
    source: 'Enquête nutritionnelle tunisienne',
    confidence_base: 'medium',
    serving_unit_description: '1 bol traditionnel (pois chiches + pain rassis trempé, 380 g)',
  },
  {
    id: 'plat-04',
    name_fr: 'Ojja merguez aux œufs',
    name_ar: 'عجة بالمرقاز والبيض',
    name_tn: 'Ojja merguez',
    category: 'plats',
    carbs_per_100g: 4,
    protein_per_100g: 9.2,
    fat_per_100g: 13.5,
    fiber_per_100g: 1.2,
    default_portion_g: 220,
    source: 'INNT / Table calcul',
    confidence_base: 'high',
    serving_unit_description: '1 poêlon individuel sans le pain (220 g)',
  },
  {
    id: 'plat-05',
    name_fr: 'Chakchouka tunisienne (aux poivrons & tomates)',
    name_ar: 'شكشوكة تونسية',
    name_tn: 'Chakchouka felfel w tmatem',
    category: 'plats',
    carbs_per_100g: 5,
    protein_per_100g: 2.2,
    fat_per_100g: 5.5,
    fiber_per_100g: 2.1,
    default_portion_g: 200,
    source: 'INNT',
    confidence_base: 'high',
    serving_unit_description: '1 assiette creuse sans le pain (200 g)',
  },
  {
    id: 'plat-06',
    name_fr: 'Mloukhiya tunisienne (sauce à la viande de bœuf)',
    name_ar: 'ملوخية تونسية بلحم البقر',
    name_tn: 'Mloukhiya bel baqri',
    category: 'plats',
    carbs_per_100g: 3,
    protein_per_100g: 11.0,
    fat_per_100g: 16.0,
    fiber_per_100g: 3.2,
    default_portion_g: 200,
    source: 'INNT',
    confidence_base: 'high',
    serving_unit_description: '1 portion de sauce avec viande (hors pain consommé, 200 g)',
  },
  {
    id: 'plat-07',
    name_fr: 'Makrouna bel salsa (Pâtes tunisiennes à la sauce rouge & viande)',
    name_ar: 'مقرونة جارية / بالصلصة واللحم',
    name_tn: 'Makrouna bel salsa',
    category: 'plats',
    carbs_per_100g: 21,
    protein_per_100g: 7.8,
    fat_per_100g: 6.0,
    fiber_per_100g: 1.8,
    default_portion_g: 320,
    source: 'INNT',
    confidence_base: 'high',
    serving_unit_description: '1 assiette généreuse de pâtes en sauce (320 g)',
  },
  {
    id: 'plat-08',
    name_fr: 'Nwasser tunisiennes à la vapeur (poulet)',
    name_ar: 'نواصر بالدجاج',
    name_tn: 'Nwasser bel djej',
    category: 'plats',
    carbs_per_100g: 24,
    protein_per_100g: 8.6,
    fat_per_100g: 5.8,
    fiber_per_100g: 1.7,
    default_portion_g: 300,
    source: 'INNT',
    confidence_base: 'medium',
    serving_unit_description: '1 assiette de nwasser garnie (300 g)',
  },
  {
    id: 'plat-09',
    name_fr: 'Kafteji tunisien (légumes frits hachés avec œuf)',
    name_ar: 'كفتاجي تونسي بالبيض',
    name_tn: 'Kafteji bel adham',
    category: 'plats',
    carbs_per_100g: 8,
    protein_per_100g: 4.5,
    fat_per_100g: 14.2,
    fiber_per_100g: 2.8,
    default_portion_g: 200,
    source: 'INNT',
    confidence_base: 'medium',
    serving_unit_description: '1 assiette de kafteji sans pain (200 g)',
  },
  {
    id: 'plat-10',
    name_fr: 'Kamounia de bœuf (sauce au cumin)',
    name_ar: 'كمونية بلحم البقر',
    name_tn: 'Kamounia',
    category: 'plats',
    carbs_per_100g: 3,
    protein_per_100g: 14.5,
    fat_per_100g: 9.0,
    fiber_per_100g: 1.1,
    default_portion_g: 200,
    source: 'INNT',
    confidence_base: 'high',
    serving_unit_description: '1 assiette creuse (200 g)',
  },
  {
    id: 'plat-11',
    name_fr: 'Riz djerbien à la vapeur (Rouz Jerbi)',
    name_ar: 'أرز جربي بالخضار واللحم',
    name_tn: 'Rouz jerbi',
    category: 'plats',
    carbs_per_100g: 21,
    protein_per_100g: 6.8,
    fat_per_100g: 5.2,
    fiber_per_100g: 2.2,
    default_portion_g: 300,
    source: 'INNT',
    confidence_base: 'medium',
    serving_unit_description: '1 assiette complète (300 g)',
  },
  {
    id: 'plat-12',
    name_fr: 'Brik à l’œuf et au thon',
    name_ar: 'بريكة بالعظمة والتن',
    name_tn: 'Brika bel adham w thon',
    category: 'plats',
    carbs_per_100g: 16,
    protein_per_100g: 11.5,
    fat_per_100g: 18.0,
    fiber_per_100g: 0.9,
    default_portion_g: 90,
    source: 'INNT',
    confidence_base: 'high',
    serving_unit_description: '1 brik frite entière (≈ 90 g, dont feuille malsouka ≈ 14 g glucides)',
  },
  {
    id: 'plat-13',
    name_fr: 'Tajine tunisien au poulet et fromage',
    name_ar: 'طاجين تونسي بالدجاج والجبن',
    name_tn: 'Tajine tounsi',
    category: 'plats',
    carbs_per_100g: 5,
    protein_per_100g: 15.2,
    fat_per_100g: 13.8,
    fiber_per_100g: 1.0,
    default_portion_g: 140,
    source: 'INNT',
    confidence_base: 'high',
    serving_unit_description: '1 part carrée généreuse (140 g)',
  },
  {
    id: 'plat-14',
    name_fr: 'Chorba Frik à l’agneau',
    name_ar: 'شربة فريك بلحم الخروف',
    name_tn: 'Chorba frik',
    category: 'plats',
    carbs_per_100g: 9,
    protein_per_100g: 5.5,
    fat_per_100g: 3.8,
    fiber_per_100g: 1.8,
    default_portion_g: 250,
    source: 'INNT',
    confidence_base: 'medium',
    serving_unit_description: '1 bol de soupe tunisienne (250 g)',
  },

  // ==========================================
  // GROUPE 4 — PÂTISSERIES & DOUCEURS
  // ==========================================
  {
    id: 'pat-01',
    name_fr: 'Makroudh kairouanais aux dattes',
    name_ar: 'مقروض قيرواني بالتمر',
    name_tn: 'Makroudh bel tmar',
    category: 'patisseries',
    carbs_per_100g: 65,
    protein_per_100g: 4.2,
    fat_per_100g: 14.5,
    fiber_per_100g: 3.5,
    default_portion_g: 45,
    source: 'Table composition desserts maghrébins',
    confidence_base: 'high',
    serving_unit_description: '1 pièce de makroudh moyen (45 g)',
  },
  {
    id: 'pat-02',
    name_fr: 'Baklawa tunisienne aux amandes',
    name_ar: 'بقلاوة تونسية باللوز',
    name_tn: 'Baklawa bel louz',
    category: 'patisseries',
    carbs_per_100g: 52,
    protein_per_100g: 7.8,
    fat_per_100g: 22.0,
    fiber_per_100g: 2.8,
    default_portion_g: 40,
    source: 'INNT',
    confidence_base: 'high',
    serving_unit_description: '1 losange de baklawa (40 g)',
  },
  {
    id: 'pat-03',
    name_fr: 'Samsa aux amandes et graines de sésame',
    name_ar: 'صمصة باللوز والجلجلان',
    name_tn: 'Samsa',
    category: 'patisseries',
    carbs_per_100g: 56,
    protein_per_100g: 6.5,
    fat_per_100g: 18.2,
    fiber_per_100g: 2.2,
    default_portion_g: 35,
    source: 'INNT',
    confidence_base: 'high',
    serving_unit_description: '1 pièce triangulaire (35 g)',
  },
  {
    id: 'pat-04',
    name_fr: 'Bambalouni de Sidi Bou Saïd (beignet au sucre)',
    name_ar: 'بمبالوني بالسكر',
    name_tn: 'Bambalouni bel sokker',
    category: 'patisseries',
    carbs_per_100g: 54,
    protein_per_100g: 5.0,
    fat_per_100g: 15.0,
    fiber_per_100g: 1.5,
    default_portion_g: 80,
    source: 'Relevé nutritionnel artisanal',
    confidence_base: 'medium',
    serving_unit_description: '1 beignet chaud enrobé de sucre (80 g)',
  },
  {
    id: 'pat-05',
    name_fr: 'Youyou tunisien glacé au sirop',
    name_ar: 'يو يو معسل',
    name_tn: 'Youyou m3assel',
    category: 'patisseries',
    carbs_per_100g: 60,
    protein_per_100g: 4.8,
    fat_per_100g: 13.0,
    fiber_per_100g: 1.2,
    default_portion_g: 50,
    source: 'INNT',
    confidence_base: 'high',
    serving_unit_description: '1 beignet rond glacé (50 g)',
  },
  {
    id: 'pat-06',
    name_fr: 'Assida Zgougou (crème de pin d’Alep garnie)',
    name_ar: 'عصيدة زقوقو بالفواكه الجافة',
    name_tn: 'Assida zgougou mzahra',
    category: 'patisseries',
    carbs_per_100g: 38,
    protein_per_100g: 6.2,
    fat_per_100g: 11.5,
    fiber_per_100g: 3.0,
    default_portion_g: 160,
    source: 'Étude fête du Mouled INNT',
    confidence_base: 'medium',
    serving_unit_description: '1 bol individuel garni de crème blanche & fruits secs (160 g)',
  },
  {
    id: 'pat-07',
    name_fr: 'Bsissa de blé et pois chiches à l’huile d’olive',
    name_ar: 'بسيسة قمح وحمص بزيت الزيتون',
    name_tn: 'Bsissa mrawya',
    category: 'patisseries',
    carbs_per_100g: 48,
    protein_per_100g: 11.2,
    fat_per_100g: 22.0,
    fiber_per_100g: 7.5,
    default_portion_g: 60,
    source: 'INNT',
    confidence_base: 'high',
    serving_unit_description: '3 cuillères à soupe denses (60 g)',
  },
  {
    id: 'pat-08',
    name_fr: 'Zlabia tunisienne',
    name_ar: 'زلابية تونسية',
    name_tn: 'Zlabia',
    category: 'patisseries',
    carbs_per_100g: 74,
    protein_per_100g: 2.1,
    fat_per_100g: 8.5,
    fiber_per_100g: 0.8,
    default_portion_g: 50,
    source: 'Table composition',
    confidence_base: 'high',
    serving_unit_description: '1 morceau torsadé (50 g)',
  },

  // ==========================================
  // GROUPE 5 — FRUITS, LÉGUMES, LAITAGES, BOISSONS & INDUSTRIELS
  // ==========================================
  {
    id: 'div-01',
    name_fr: 'Dattes Deglet Nour de Tozeur',
    name_ar: 'تمر دقلة النور التونسية',
    name_tn: 'Tmar Deglet Nour',
    category: 'fruits_legumes',
    carbs_per_100g: 68,
    protein_per_100g: 2.2,
    fat_per_100g: 0.4,
    fiber_per_100g: 7.0,
    default_portion_g: 35,
    source: 'INNT',
    confidence_base: 'high',
    serving_unit_description: '3 dattes dénoyautées (≈ 30-35 g)',
  },
  {
    id: 'div-02',
    name_fr: 'Orange maltaise de Tunisie',
    name_ar: 'برتقال مالطي تونسي',
    name_tn: 'Bordeaux / Bourtdgale',
    category: 'fruits_legumes',
    carbs_per_100g: 9.5,
    protein_per_100g: 1.0,
    fat_per_100g: 0.2,
    fiber_per_100g: 2.0,
    default_portion_g: 150,
    source: 'CIQUAL',
    confidence_base: 'high',
    serving_unit_description: '1 orange moyenne entière (150 g)',
  },
  {
    id: 'div-03',
    name_fr: 'Grenade de Testour',
    name_ar: 'رمان تستور',
    name_tn: 'Rommen',
    category: 'fruits_legumes',
    carbs_per_100g: 14.5,
    protein_per_100g: 1.4,
    fat_per_100g: 0.6,
    fiber_per_100g: 3.4,
    default_portion_g: 120,
    source: 'CIQUAL',
    confidence_base: 'high',
    serving_unit_description: '1 petit bol de grains (120 g)',
  },
  {
    id: 'div-04',
    name_fr: 'Salade Méchouia tunisienne (avec thon & œuf)',
    name_ar: 'سلاطة مشوية بالتن والبيض',
    name_tn: 'Slata mechouia',
    category: 'fruits_legumes',
    carbs_per_100g: 3.5,
    protein_per_100g: 4.8,
    fat_per_100g: 7.2,
    fiber_per_100g: 2.1,
    default_portion_g: 130,
    source: 'INNT',
    confidence_base: 'high',
    serving_unit_description: '1 ramequin (hors pain d’accompagnement, 130 g)',
  },
  {
    id: 'div-05',
    name_fr: 'Salade tunisienne fraîche (concombre, tomate, menthe)',
    name_ar: 'سلاطة خضراء تونسية',
    name_tn: 'Slata tounsia',
    category: 'fruits_legumes',
    carbs_per_100g: 3.0,
    protein_per_100g: 1.2,
    fat_per_100g: 3.5,
    fiber_per_100g: 1.4,
    default_portion_g: 120,
    source: 'INNT',
    confidence_base: 'high',
    serving_unit_description: '1 bol individuel (120 g)',
  },
  {
    id: 'div-06',
    name_fr: 'Lben traditionnel fermenté',
    name_ar: 'لبن رائب تقليدي',
    name_tn: 'Lben',
    category: 'boissons',
    carbs_per_100g: 4.5,
    protein_per_100g: 3.2,
    fat_per_100g: 1.5,
    fiber_per_100g: 0,
    default_portion_g: 200,
    source: 'INNT',
    confidence_base: 'high',
    serving_unit_description: '1 grand verre (200 ml / 200 g)',
  },
  {
    id: 'div-07',
    name_fr: 'Boisson gazeuse sucrée / Soda (Gazouza, Boga, Coca, Fanta)',
    name_ar: 'ڤازوزة / قازوزة / غازوزة / مشروب غازي سكري',
    name_tn: 'Gazouza / Gazouz / Boga / Coca',
    aliases: [
      'gazouza', 'gazouz', 'gazouza sghira', 'gazouzet', 'gazouz sghir',
      'ڤازوزة', 'قازوزة', 'غازوزة', 'ڤازوز', 'قازوز', 'غازوز',
      'ڤازوزة صغيرة', 'قازوزة صغيرة', 'غازوزة صغيرة', 'ڤازوزة ص', 'قازوزة ص',
      'دبوزة قازوز', 'دبوزة ڤازوز', 'دبوزة غازوز', 'دبوزة صغيرة',
      'soda', 'coca', 'coca cola', 'coca-cola', 'boga', 'boga cidre', 'boga lim', 'fanta', 'apla', 'viva',
      'canette', 'canette soda', 'boisson gazeuse'
    ],
    category: 'boissons',
    carbs_per_100g: 10.5,
    protein_per_100g: 0,
    fat_per_100g: 0,
    fiber_per_100g: 0,
    default_portion_g: 250,
    source: 'Étiquette produit SFBT / INNT',
    confidence_base: 'high',
    serving_unit_description: '1 canette ou petite bouteille (250 ml = 26 g glucides rapides)',
    glycemic_index: 75,
    glycemic_load: 20,
  },
  {
    id: 'div-08',
    name_fr: 'Boisson gazeuse sans sucre (Gazouza Light / Zéro, Boga Light, Coca Zéro)',
    name_ar: 'ڤازوزة لايت / قازوزة بدون سكر / غازوزة زيرو',
    name_tn: 'Gazouza Light / Zero',
    aliases: [
      'gazouza light', 'gazouza zero', 'gazouzet light',
      'ڤازوزة لايت', 'قازوزة لايت', 'غازوزة لايت', 'ڤازوزة زيرو', 'قازوزة زيرو', 'غازوزة زيرو',
      'قازوزة بدون سكر', 'ڤازوزة بدون سكر',
      'soda light', 'coca zero', 'coca light', 'boga light', 'boisson gazeuse sans sucre'
    ],
    category: 'boissons',
    carbs_per_100g: 0.1,
    protein_per_100g: 0,
    fat_per_100g: 0,
    fiber_per_100g: 0,
    default_portion_g: 250,
    source: 'Étiquette produit',
    confidence_base: 'high',
    serving_unit_description: '1 canette (250 ml ≈ 0 g glucides)',
    glycemic_index: 0,
    glycemic_load: 0,
  },
  {
    id: 'div-16',
    name_fr: 'Poulet mijoté (viande de poulet / cuisse)',
    name_ar: 'لحم دجاجة / دجاج مسموط في المرقة',
    name_tn: 'Lham djej / djeja',
    aliases: ['poulet', 'viande de poulet', 'cuisse de poulet', 'blanc de poulet', 'دجاج', 'دجاجة', 'لحم دجاج', 'لحم دجاجة', 'djej', 'djeja'],
    category: 'plats',
    carbs_per_100g: 0,
    protein_per_100g: 27,
    fat_per_100g: 6,
    fiber_per_100g: 0,
    default_portion_g: 120,
    source: 'INNT Tunis',
    confidence_base: 'high',
    serving_unit_description: '1 morceau ou cuisse de poulet (120 g = 0 g glucides, 32 g protéines)',
    glycemic_index: 0,
    glycemic_load: 0,
  },
  {
    id: 'div-17',
    name_fr: 'Légumes de couscous (carottes, navets, courgettes)',
    name_ar: 'خضرة الكسكسي (سفنارية، لفت، قرع)',
    name_tn: 'Khodhra kousksi',
    aliases: ['legumes', 'légumes', 'legumes couscous', 'خضرة', 'خضار', 'خضرة كسكسي', 'خضرة الكسكسي', 'khodhra'],
    category: 'plats',
    carbs_per_100g: 4.5,
    protein_per_100g: 1.2,
    fat_per_100g: 1.5,
    fiber_per_100g: 2.5,
    default_portion_g: 100,
    source: 'INNT Tunis',
    confidence_base: 'high',
    serving_unit_description: 'Portion de légumes cuits (100 g ≈ 4.5 g glucides)',
    glycemic_index: 40,
    glycemic_load: 2,
  },
  {
    id: 'div-09',
    name_fr: 'Biscuits Carré Saïda (Petit Beurre tunisien)',
    name_ar: 'بسكويت سيدة التقليدي',
    name_tn: 'Biskwi Saïda',
    category: 'produits_industriels',
    carbs_per_100g: 74,
    protein_per_100g: 7.5,
    fat_per_100g: 12.0,
    fiber_per_100g: 2.1,
    default_portion_g: 30,
    source: 'Étiquette Saïda Group',
    confidence_base: 'high',
    serving_unit_description: '4 biscuits (30 g ≈ 22 g glucides)',
  },
  {
    id: 'div-10',
    name_fr: 'Yaourt aromatisé tunisien sucré',
    name_ar: 'ياغورت معطر ومحلى',
    name_tn: 'Yaghort hlou',
    category: 'produits_industriels',
    carbs_per_100g: 13.5,
    protein_per_100g: 3.4,
    fat_per_100g: 2.8,
    fiber_per_100g: 0,
    default_portion_g: 110,
    source: 'Étiquette Délice / Vitalait',
    confidence_base: 'high',
    serving_unit_description: '1 pot individuel (110 g = 15 g glucides)',
  },
  {
    id: 'div-11',
    name_fr: 'Yaourt nature sans sucre ajouté',
    name_ar: 'ياغورت طبيعي بدون سكر',
    name_tn: 'Yaghort nature',
    category: 'produits_industriels',
    carbs_per_100g: 4.8,
    protein_per_100g: 4.2,
    fat_per_100g: 3.0,
    fiber_per_100g: 0,
    default_portion_g: 110,
    source: 'Étiquette produit',
    confidence_base: 'high',
    serving_unit_description: '1 pot individuel (110 g = 5 g glucides)',
  },
  {
    id: 'div-12',
    name_fr: 'Harissa tunisienne traditionnelle',
    name_ar: 'هريسة تونسية عربي',
    name_tn: 'Hrissa arbi',
    category: 'fruits_legumes',
    carbs_per_100g: 5.0,
    protein_per_100g: 2.5,
    fat_per_100g: 6.0,
    fiber_per_100g: 3.0,
    default_portion_g: 20,
    source: 'INNT',
    confidence_base: 'high',
    serving_unit_description: '1 cuillère à café (20 g = 1 g glucides)',
    glycemic_index: 20,
    glycemic_load: 1,
  },

  // =========================================================================
  // NOUVEAUX PLATS POPULAIRES TUNISIENS ENRICHIS (CIQUAL / INNT / DT1)
  // =========================================================================
  {
    id: 'plat-kafteji-01',
    name_fr: 'Kafteji tunisien traditionnel',
    name_ar: 'كفتاجي تونسي تقليدي',
    name_tn: 'Kafteji tounsi',
    category: 'plats',
    carbs_per_100g: 7.2,
    protein_per_100g: 4.8,
    fat_per_100g: 11.5,
    fiber_per_100g: 3.2,
    default_portion_g: 250,
    source: 'INNT Tunis / Étude Diabète',
    confidence_base: 'high',
    serving_unit_description: '1 assiette moyenne (250 g ≈ 18 g glucides)',
    glycemic_index: 48, // Bas : fibres végétales (courge, piments, tomates) et œuf
    glycemic_load: 9, // Faible
  },
  {
    id: 'plat-makrouna-salsa-01',
    name_fr: 'Makrouna bel salsa tunisienne',
    name_ar: 'مقرونة بالصلصة التونسية الحارة',
    name_tn: 'Makrouna bel salsa',
    category: 'plats',
    carbs_per_100g: 24.0,
    protein_per_100g: 9.5,
    fat_per_100g: 8.0,
    fiber_per_100g: 2.8,
    default_portion_g: 300,
    source: 'CIQUAL / INNT',
    confidence_base: 'high',
    serving_unit_description: '1 assiette standard (300 g ≈ 72 g glucides)',
    glycemic_index: 65, // Modéré : pâtes blé dur avec sauce tomate huile d’olive
    glycemic_load: 47, // Élevée : nécessite un bolus adapté et surveillance DT1
  },
  {
    id: 'plat-mloukhiya-01',
    name_fr: 'Mloukhiya tunisienne au bœuf (sans pain)',
    name_ar: 'ملوخية تونسية باللحم البقري',
    name_tn: 'Mloukhiya bel bkar',
    category: 'plats',
    carbs_per_100g: 2.5,
    protein_per_100g: 16.0,
    fat_per_100g: 19.5,
    fiber_per_100g: 4.0,
    default_portion_g: 180,
    source: 'Table Nationale INNT',
    confidence_base: 'high',
    serving_unit_description: '1 louche généreuse de sauce (180 g ≈ 5 g glucides)',
    glycemic_index: 15, // Très bas : quasi aucun glucide, compter principalement le pain !
    glycemic_load: 1, // Négligeable
  },
  {
    id: 'plat-brik-oeuf-01',
    name_fr: 'Brik à l’œuf et au thon',
    name_ar: 'بريكة بالعظمة والتن',
    name_tn: 'Brika bel adhma w thon',
    category: 'plats',
    carbs_per_100g: 17.5,
    protein_per_100g: 12.0,
    fat_per_100g: 18.0,
    fiber_per_100g: 1.2,
    default_portion_g: 90,
    source: 'INNT / Mesures directes',
    confidence_base: 'high',
    serving_unit_description: '1 brik frite complète (90 g ≈ 16 g glucides)',
    glycemic_index: 58, // Modéré : feuille de malsouka croustillante
    glycemic_load: 9, // Faible à Modérée
  },
  {
    id: 'plat-fricasse-01',
    name_fr: 'Fricassé tunisien classique',
    name_ar: 'فريكاسي تونسي كلاسيكي',
    name_tn: 'Fricassé tounsi',
    category: 'patisseries',
    carbs_per_100g: 32.0,
    protein_per_100g: 8.0,
    fat_per_100g: 14.5,
    fiber_per_100g: 2.0,
    default_portion_g: 85,
    source: 'INNT / Street Food Tunisienne',
    confidence_base: 'high',
    serving_unit_description: '1 pièce garnie (85 g ≈ 27 g glucides)',
    glycemic_index: 68, // Modéré à Élevé : pâte levée frite
    glycemic_load: 18, // Modérée
  },
  {
    id: 'plat-chorba-frik-01',
    name_fr: 'Chorba Frik tunisienne à l’agneau',
    name_ar: 'شربة فريك تونسية بلحم العلوش',
    name_tn: 'Chorba frik allouch',
    category: 'plats',
    carbs_per_100g: 8.8,
    protein_per_100g: 7.2,
    fat_per_100g: 4.5,
    fiber_per_100g: 3.5,
    default_portion_g: 250,
    source: 'INNT / Recueil Céréales',
    confidence_base: 'high',
    serving_unit_description: '1 bol moyen (250 g ≈ 22 g glucides)',
    glycemic_index: 46, // Bas : blé vert concassé riche en fibres solubles
    glycemic_load: 10, // Faible
  },
  // ==========================================
  // GROUPE 8 — SPÉCIALITÉS RÉGIONALES & STREET FOOD DU TERROIR
  // ==========================================
  {
    id: 'reg-01',
    name_fr: 'Bazine traditionnel au kadid et huile d\'olive (Sud tunisien)',
    name_ar: 'بازين بالقديد وزيت الزيتون',
    name_tn: 'Bazine kadid',
    category: 'plats',
    carbs_per_100g: 22,
    protein_per_100g: 7.5,
    fat_per_100g: 11.0,
    fiber_per_100g: 4.0,
    default_portion_g: 300,
    source: 'Tradition Sud Tunisien (Tataouine / Médenine)',
    confidence_base: 'high',
    serving_unit_description: '1 assiette creuse de bazine (300 g ≈ 66 g glucides)',
    glycemic_index: 48, // IG bas/modéré : farine d'orge non raffinée
    glycemic_load: 32, // Charge élevée en raison de la portion dense
  },
  {
    id: 'reg-02',
    name_fr: 'Charmoula sfaxienne aux raisins secs et oignons (Sfax / Sahel)',
    name_ar: 'شرمولة صفاقسية بالزبيب',
    name_tn: 'Charmoula sfaxienne',
    category: 'plats',
    carbs_per_100g: 38,
    protein_per_100g: 2.1,
    fat_per_100g: 6.5,
    fiber_per_100g: 3.2,
    default_portion_g: 80,
    source: 'Patrimoine culinaire de Sfax (Aïd el-Fitr)',
    confidence_base: 'high',
    serving_unit_description: '1 portion d\'accompagnement (80 g ≈ 30 g glucides)',
    glycemic_index: 68, // Élevé : forte concentration en raisins secs cuits
    glycemic_load: 20,
  },
  {
    id: 'reg-03',
    name_fr: 'Borghol jery au poisson ou poulet (Sahel & Nord)',
    name_ar: 'برغل جاري بالحوت أو الدجاج',
    name_tn: 'Borghol jery',
    category: 'plats',
    carbs_per_100g: 14,
    protein_per_100g: 6.0,
    fat_per_100g: 3.8,
    fiber_per_100g: 2.8,
    default_portion_g: 250,
    source: 'Relevé nutritionnel INNT Sahel',
    confidence_base: 'high',
    serving_unit_description: '1 grand bol de borghol en sauce (250 g ≈ 35 g glucides)',
    glycemic_index: 45, // Blé dur concassé complet
    glycemic_load: 16,
  },
  {
    id: 'reg-04',
    name_fr: 'Chakhchoukha du Sud aux légumes et galette émiettée (Gafsa / Tozeur)',
    name_ar: 'شخشوخة الجنوب التونسي',
    name_tn: 'Chakhchoukha jnoub',
    category: 'plats',
    carbs_per_100g: 21,
    protein_per_100g: 5.8,
    fat_per_100g: 5.2,
    fiber_per_100g: 3.5,
    default_portion_g: 280,
    source: 'Traditions du Djérid et Gafsa',
    confidence_base: 'high',
    serving_unit_description: '1 assiette moyenne (280 g ≈ 59 g glucides)',
    glycemic_index: 54, // Modéré : semoule et légumes mijotés
    glycemic_load: 32,
  },
  {
    id: 'reg-05',
    name_fr: 'Kafteji tunisien complet (poivrons, œufs, foie, citrouille)',
    name_ar: 'كفتاجي تونسي بالبيض والكبدة',
    name_tn: 'Kafteji complet',
    category: 'plats',
    carbs_per_100g: 7.5,
    protein_per_100g: 6.8,
    fat_per_100g: 13.5,
    fiber_per_100g: 2.2,
    default_portion_g: 200,
    source: 'Relevé INNT Grand Tunis / Kairouan',
    confidence_base: 'high',
    serving_unit_description: '1 assiette moyenne (200 g ≈ 15 g glucides hors pain)',
    glycemic_index: 40, // Très bas : riche en légumes frits, œufs et foie
    glycemic_load: 6,
  },
  {
    id: 'reg-06',
    name_fr: 'Makrouna jerya tunisienne piquante en sauce',
    name_ar: 'مقرونة جارية حارة',
    name_tn: 'Makrouna jerya',
    category: 'plats',
    carbs_per_100g: 17,
    protein_per_100g: 5.2,
    fat_per_100g: 4.8,
    fiber_per_100g: 1.8,
    default_portion_g: 280,
    source: 'Standard familial tunisien',
    confidence_base: 'high',
    serving_unit_description: '1 grand bol de pâtes en sauce (280 g ≈ 48 g glucides)',
    glycemic_index: 58, // Pâtes mijotées en bouillon
    glycemic_load: 28,
  },
  {
    id: 'reg-07',
    name_fr: 'Chorba Frik traditionnelle à l\'agneau',
    name_ar: 'شوربة فريك بلحم الخروف',
    name_tn: 'Chorba Frik allouch',
    category: 'plats',
    carbs_per_100g: 9.2,
    protein_per_100g: 7.8,
    fat_per_100g: 5.5,
    fiber_per_100g: 3.2,
    default_portion_g: 250,
    source: 'INNT / Recueil Ramadan',
    confidence_base: 'high',
    serving_unit_description: '1 bol de soupe (250 g ≈ 23 g glucides)',
    glycemic_index: 44, // Bas : blé vert concassé
    glycemic_load: 10,
  },
  {
    id: 'reg-08',
    name_fr: 'Chapati Mahdia traditionnel (pain farci omelette et thon)',
    name_ar: 'شباتي مهدية تونسي',
    name_tn: 'Chapati Mahdia',
    category: 'feculents',
    carbs_per_100g: 32,
    protein_per_100g: 11.5,
    fat_per_100g: 10.2,
    fiber_per_100g: 2.1,
    default_portion_g: 180,
    source: 'Street food du Sahel (Mahdia)',
    confidence_base: 'high',
    serving_unit_description: '1 sandwich chapati entier (180 g ≈ 58 g glucides)',
    glycemic_index: 62, // Pâte à pain levée cuite à la poêle
    glycemic_load: 36,
  },
  {
    id: 'reg-09',
    name_fr: 'Makloub tunisien au poulet et fromage',
    name_ar: 'مقلوب تونسي بالدجاج والجبن',
    name_tn: 'Makloub djej fromage',
    category: 'feculents',
    carbs_per_100g: 29,
    protein_per_100g: 13.0,
    fat_per_100g: 11.8,
    fiber_per_100g: 2.0,
    default_portion_g: 220,
    source: 'Fast-food populaire tunisien',
    confidence_base: 'high',
    serving_unit_description: '1 makloub moyen roulé (220 g ≈ 64 g glucides)',
    glycemic_index: 64,
    glycemic_load: 41,
  },
  {
    id: 'reg-10',
    name_fr: 'Zlabia traditionnelle de Béja (au miel)',
    name_ar: 'زلابية باجة بالعسل',
    name_tn: 'Zlabia Beja',
    category: 'patisseries',
    carbs_per_100g: 68,
    protein_per_100g: 2.5,
    fat_per_100g: 14.0,
    fiber_per_100g: 0.8,
    default_portion_g: 50,
    source: 'Artisanat Béja / Ramadan',
    confidence_base: 'high',
    serving_unit_description: '1 pièce de zlabia (50 g ≈ 34 g glucides rapides)',
    glycemic_index: 85, // Très élevé : sucre pur et friture
    glycemic_load: 29,
  },
  {
    id: 'reg-11',
    name_fr: 'Mkharek de Béja traditionnels',
    name_ar: 'مخارق باجة',
    name_tn: 'Mkharek Beja',
    category: 'patisseries',
    carbs_per_100g: 62,
    protein_per_100g: 4.0,
    fat_per_100g: 16.5,
    fiber_per_100g: 1.0,
    default_portion_g: 45,
    source: 'Artisanat Béja',
    confidence_base: 'high',
    serving_unit_description: '1 pièce moyenne (45 g ≈ 28 g glucides)',
    glycemic_index: 80,
    glycemic_load: 22,
  },
  {
    id: 'reg-12',
    name_fr: 'Assida Zgougou traditionnelle (Graines de pin d\'Alep)',
    name_ar: 'عصيدة زقوقو تونسية',
    name_tn: 'Assida Zgougou',
    category: 'patisseries',
    carbs_per_100g: 34,
    protein_per_100g: 4.5,
    fat_per_100g: 12.0,
    fiber_per_100g: 3.5,
    default_portion_g: 150,
    source: 'Fête du Mouled Tunisie',
    confidence_base: 'high',
    serving_unit_description: '1 bol d\'assida avec crème blanche (150 g ≈ 51 g glucides)',
    glycemic_index: 60, // Amidon + sucre, tempéré par les lipides du zgougou
    glycemic_load: 31,
  },
  {
    id: 'reg-13',
    name_fr: 'Rkako (Pain d\'orge artisanal du Sud)',
    name_ar: 'رقاق أو خبز شعير تقليدي',
    name_tn: 'Rkako ch\'ir',
    category: 'feculents',
    carbs_per_100g: 42,
    protein_per_100g: 8.5,
    fat_per_100g: 1.5,
    fiber_per_100g: 8.0,
    default_portion_g: 60,
    source: 'INNT / Terroirs du Sud',
    confidence_base: 'high',
    serving_unit_description: '1 galette fine d\'orge (60 g ≈ 25 g glucides)',
    glycemic_index: 42, // IG très favorable pour les diabétiques
    glycemic_load: 11,
  },
  {
    id: 'reg-14',
    name_fr: 'Droo tunisien (Crème de sorgho au lait et sésame)',
    name_ar: 'صحفة درع بالحليب والجلجلان',
    name_tn: 'Droo tunisien',
    category: 'boissons',
    carbs_per_100g: 16,
    protein_per_100g: 4.2,
    fat_per_100g: 3.0,
    fiber_per_100g: 2.1,
    default_portion_g: 220,
    source: "Petit-déjeuner traditionnel d'hiver",
    confidence_base: 'high',
    serving_unit_description: '1 bol de droo chaud (220 g ≈ 35 g glucides)',
    glycemic_index: 52, // Farine de sorgho complet
    glycemic_load: 18,
  },
  // ==========================================
  // SPÉCIALITÉS RÉGIONALES TUNISIENNES
  // ==========================================
  {
    id: 'reg-01',
    name_fr: 'Bazine aux fèves et huile d\'olive (Gafsa / Sud)',
    name_ar: 'بازين بالفول وزيت الزيتون',
    name_tn: 'Bazine bil foul',
    category: 'plats',
    carbs_per_100g: 22,
    protein_per_100g: 6.5,
    fat_per_100g: 9.0,
    fiber_per_100g: 4.5,
    default_portion_g: 280,
    source: 'Tradition culinaire du Sud / INNT',
    confidence_base: 'high',
    serving_unit_description: '1 assiette creuse de bazine (280 g ≈ 62 g glucides)',
    glycemic_index: 48,
    glycemic_load: 30,
  },
  {
    id: 'reg-02',
    name_fr: 'Couscous au mérou / poisson (Djerba & Kerkennah)',
    name_ar: 'كسكسي بالمناني / حوت جربة',
    name_tn: 'Kosksi bil hout',
    category: 'plats',
    carbs_per_100g: 24,
    protein_per_100g: 11.2,
    fat_per_100g: 4.8,
    fiber_per_100g: 2.4,
    default_portion_g: 300,
    source: 'Cuisine côtière insulaire Djerba/Kerkennah',
    confidence_base: 'high',
    serving_unit_description: '1 portion de couscous au poisson (300 g ≈ 72 g glucides)',
    glycemic_index: 55,
    glycemic_load: 40,
  },
  {
    id: 'reg-03',
    name_fr: 'Mrouzia tunisienne (agneau, amandes et raisins secs)',
    name_ar: 'مروزية تونسية باللوز والزبيب',
    name_tn: 'Mrouzia',
    category: 'plats',
    carbs_per_100g: 18,
    protein_per_100g: 13.0,
    fat_per_100g: 12.5,
    fiber_per_100g: 2.1,
    default_portion_g: 220,
    source: 'Plat traditionnel de fête / Aïd',
    confidence_base: 'high',
    serving_unit_description: '1 assiette moyenne (220 g ≈ 40 g glucides)',
    glycemic_index: 50,
    glycemic_load: 20,
  },
  {
    id: 'reg-04',
    name_fr: 'Masfouf aux dattes Deglet Nour de Tozeur',
    name_ar: 'مسفوف بدقلة النور وتمر توزر',
    name_tn: 'Masfouf bil degla',
    category: 'patisseries',
    carbs_per_100g: 42,
    protein_per_100g: 4.8,
    fat_per_100g: 5.5,
    fiber_per_100g: 3.8,
    default_portion_g: 180,
    source: 'Désert tunisien / Shor Ramadan',
    confidence_base: 'high',
    serving_unit_description: '1 bol de masfouf aux dattes (180 g ≈ 76 g glucides)',
    glycemic_index: 62,
    glycemic_load: 47,
  },
  {
    id: 'reg-05',
    name_fr: 'Bsaissa de blé dur et pois chiches (Sfax)',
    name_ar: 'بسيسة قمح وحمص بالفاكية',
    name_tn: 'Bsissa Sfaxia',
    category: 'feculents',
    carbs_per_100g: 58,
    protein_per_100g: 12.0,
    fat_per_100g: 14.0,
    fiber_per_100g: 8.5,
    default_portion_g: 60,
    source: 'Recette artisanale de Sfax / Sahel',
    confidence_base: 'high',
    serving_unit_description: '1 portion délayée à l\'huile d\'olive (60 g poudre ≈ 35 g glucides)',
    glycemic_index: 45,
    glycemic_load: 16,
  },
  {
    id: 'reg-06',
    name_fr: 'Madfouna tunisienne aux bettes (Tunis)',
    name_ar: 'مدفونة تونسية بالسلق والهرقمة',
    name_tn: 'Madfouna',
    category: 'plats',
    carbs_per_100g: 6,
    protein_per_100g: 14.5,
    fat_per_100g: 16.0,
    fiber_per_100g: 3.5,
    default_portion_g: 250,
    source: 'Cuisine traditionnelle de Tunis / Bab Souika',
    confidence_base: 'high',
    serving_unit_description: '1 assiette creuse de madfouna (250 g ≈ 15 g glucides)',
    glycemic_index: 30,
    glycemic_load: 5,
  },
  {
    id: 'reg-07',
    name_fr: 'Chakhchoukha tunisienne au poulet (Nefta / Tozeur)',
    name_ar: 'شخشوخة تونسية بالدجاج وحمص الجريد',
    name_tn: 'Chakhchoukha Jeridia',
    category: 'plats',
    carbs_per_100g: 25,
    protein_per_100g: 10.5,
    fat_per_100g: 6.0,
    fiber_per_100g: 3.2,
    default_portion_g: 320,
    source: 'Spécialité du Jérid tunisien',
    confidence_base: 'high',
    serving_unit_description: '1 grand plat de chakhchoukha (320 g ≈ 80 g glucides)',
    glycemic_index: 58,
    glycemic_load: 46,
  },
  {
    id: 'reg-08',
    name_fr: 'Chorba Lssan Asfour (Langue d\'oiseau)',
    name_ar: 'شوربة لسان عصفور تونسية',
    name_tn: 'Chorba lsen asfour',
    category: 'plats',
    carbs_per_100g: 12,
    protein_per_100g: 4.8,
    fat_per_100g: 3.2,
    fiber_per_100g: 1.5,
    default_portion_g: 220,
    source: 'INNT Tunis / Soupe quotidienne',
    confidence_base: 'high',
    serving_unit_description: '1 bol moyen de chorba (220 g ≈ 26 g glucides)',
    glycemic_index: 52,
    glycemic_load: 14,
  },
  // ==========================================
  // MARQUES & PRODUITS POPULAIRES TUNISIENS
  // ==========================================
  {
    id: 'ind-07',
    name_fr: 'Yaourt aux fruits Délice Danone (Fraise / Pêche)',
    name_ar: 'ياغورت غلال ديليس دانون',
    name_tn: 'Yoghourt Délice ghalla',
    category: 'produits_industriels',
    carbs_per_100g: 13.5,
    protein_per_100g: 3.2,
    fat_per_100g: 2.5,
    fiber_per_100g: 0.2,
    default_portion_g: 110,
    source: 'Étiquetage nutritionnel Délice Danone Tunisie',
    confidence_base: 'high',
    serving_unit_description: '1 pot individuel (110 g = 15 g glucides)',
    glycemic_index: 45,
    glycemic_load: 7,
  },
  {
    id: 'ind-08',
    name_fr: 'Yaourt Nature sans sucre Délice / Vitalait',
    name_ar: 'ياغورت طبيعي بدون سكر ديليس أو فيتالايت',
    name_tn: 'Yoghourt Nature',
    category: 'produits_industriels',
    carbs_per_100g: 4.5,
    protein_per_100g: 3.8,
    fat_per_100g: 3.0,
    fiber_per_100g: 0,
    default_portion_g: 110,
    source: 'Étiquetage nutritionnel Vitalait / Délice',
    confidence_base: 'high',
    serving_unit_description: '1 pot (110 g = 5 g glucides)',
    glycemic_index: 28,
    glycemic_load: 1,
  },
  {
    id: 'ind-09',
    name_fr: 'Lait demi-écrémé Vitalait / Délice',
    name_ar: 'حليب نصف دسم فيتالايت أو ديليس',
    name_tn: 'Hlib demi-écrémé',
    category: 'boissons',
    carbs_per_100g: 4.8,
    protein_per_100g: 3.2,
    fat_per_100g: 1.6,
    fiber_per_100g: 0,
    default_portion_g: 200,
    source: 'Centrale laitière tunisienne',
    confidence_base: 'high',
    serving_unit_description: '1 grand verre ou briquette (200 ml = 10 g glucides)',
    glycemic_index: 32,
    glycemic_load: 3,
  },
  {
    id: 'ind-10',
    name_fr: 'Biscuit Saïda Sablito classique',
    name_ar: 'بسكويت سيدة سابليتو',
    name_tn: 'Biskwi Sablito',
    category: 'produits_industriels',
    carbs_per_100g: 68,
    protein_per_100g: 7.0,
    fat_per_100g: 16.0,
    fiber_per_100g: 2.2,
    default_portion_g: 30,
    source: 'Biscuiterie Saïda Tunisie',
    confidence_base: 'high',
    serving_unit_description: '3 biscuits Sablito (30 g ≈ 20 g glucides)',
    glycemic_index: 68,
    glycemic_load: 14,
  },
  {
    id: 'ind-11',
    name_fr: 'Biscuit Major chocolat (Saïda)',
    name_ar: 'بسكويت ماجور شوكولاتة سيدة',
    name_tn: 'Major Saïda choco',
    category: 'produits_industriels',
    carbs_per_100g: 64,
    protein_per_100g: 6.5,
    fat_per_100g: 18.0,
    fiber_per_100g: 3.0,
    default_portion_g: 32,
    source: 'Biscuiterie Saïda Tunisie',
    confidence_base: 'high',
    serving_unit_description: '2 biscuits fourrés Major (32 g ≈ 20 g glucides)',
    glycemic_index: 65,
    glycemic_load: 13,
  },
  {
    id: 'ind-12',
    name_fr: 'Biscuit Gaucho chocolat (Saïda)',
    name_ar: 'بسكويت غاوتشو شوكولاتة',
    name_tn: 'Gaucho Saïda',
    category: 'produits_industriels',
    carbs_per_100g: 66,
    protein_per_100g: 6.8,
    fat_per_100g: 17.5,
    fiber_per_100g: 2.5,
    default_portion_g: 28,
    source: 'Biscuiterie Saïda Tunisie',
    confidence_base: 'high',
    serving_unit_description: '2 biscuits Gaucho (28 g ≈ 18 g glucides)',
    glycemic_index: 64,
    glycemic_load: 12,
  },
  {
    id: 'ind-13',
    name_fr: 'Halwa Chamia à la pistache (La Gazelle)',
    name_ar: 'حلوى شامية بالفستق الغزالة',
    name_tn: 'Chamia Gazelle',
    category: 'patisseries',
    carbs_per_100g: 52,
    protein_per_100g: 12.5,
    fat_per_100g: 28.0,
    fiber_per_100g: 4.0,
    default_portion_g: 30,
    source: 'Industrie confiserie tunisienne',
    confidence_base: 'high',
    serving_unit_description: '1 tranche moyenne de chamia (30 g ≈ 16 g glucides)',
    glycemic_index: 60,
    glycemic_load: 10,
  },
  {
    id: 'ind-14',
    name_fr: 'Jus Nectar d\'orange Diva / Délice',
    name_ar: 'عصير برتقال ديفا أو ديليس',
    name_tn: 'Jus Diva bourtoukel',
    category: 'boissons',
    carbs_per_100g: 11,
    protein_per_100g: 0.5,
    fat_per_100g: 0.1,
    fiber_per_100g: 0.3,
    default_portion_g: 200,
    source: 'Jus et Nectars de Tunisie',
    confidence_base: 'high',
    serving_unit_description: '1 verre de jus (200 ml = 22 g glucides rapides)',
    glycemic_index: 65,
    glycemic_load: 14,
  },
  {
    id: 'ind-15',
    name_fr: 'Fromage fondu / Carré frais Sicam / Land\'Or',
    name_ar: 'جبن مثلثات أو مربع سيكام / لاندور',
    name_tn: 'Jben Land\'Or / Sicam',
    category: 'produits_industriels',
    carbs_per_100g: 3,
    protein_per_100g: 11.0,
    fat_per_100g: 22.0,
    fiber_per_100g: 0,
    default_portion_g: 40,
    source: 'Industrie fromagère tunisienne',
    confidence_base: 'high',
    serving_unit_description: '2 portions de fromage (40 g ≈ 1 g glucides)',
    glycemic_index: 10,
    glycemic_load: 0,
  },
  {
    id: 'ind-16',
    name_fr: 'Harissa tunisienne traditionnelle Phare du Cap Bon',
    name_ar: 'هريسة تونسية معجونة منارة كاب بون',
    name_tn: 'Hrissa dyeri Cap Bon',
    category: 'produits_industriels',
    carbs_per_100g: 7,
    protein_per_100g: 2.8,
    fat_per_100g: 1.5,
    fiber_per_100g: 3.5,
    default_portion_g: 15,
    source: 'Label Harissa Tunisienne de Terroir',
    confidence_base: 'high',
    serving_unit_description: '1 cuillère à soupe (15 g ≈ 1 g glucides)',
    glycemic_index: 25,
    glycemic_load: 0,
  },
];

/**
 * Catégorie de l'Index Glycémique
 */
export function getGlycemicCategory(ig?: number): {
  label: string;
  color: 'emerald' | 'amber' | 'rose' | 'slate';
  description: string;
} {
  if (typeof ig !== 'number' || ig <= 0) {
    return { label: 'Non mesuré', color: 'slate', description: 'Donnée en cours de validation' };
  }
  if (ig < 55) {
    return { label: 'IG Bas', color: 'emerald', description: 'Absorption lente, élévation glycémique modérée' };
  }
  if (ig <= 69) {
    return { label: 'IG Moyen', color: 'amber', description: 'Absorption intermédiaire' };
  }
  return { label: 'IG Élevé', color: 'rose', description: 'Pic glycémique rapide, ajuster le timing du bolus' };
}

/**
 * Calcul automatique de la charge glycémique
 */
export function calculateGlycemicLoad(carbsG: number, ig?: number): number {
  if (!ig || carbsG <= 0) return 0;
  return Math.round((ig * carbsG) / 100);
}

/**
 * Calcule la Charge Glycémique totale et l'Index Glycémique moyen d'un repas
 */
export function calculateMealGlycemicMetrics(
  items: { calculated_carbs: number; glycemic_index?: number; confirmed_weight_g: number; carbs_per_100g: number }[]
): {
  totalGlycemicLoad: number;
  averageGlycemicIndex: number;
  speedCategory: 'slow' | 'medium' | 'fast';
  speedLabel: string;
} {
  let totalCarbs = 0;
  let weightedIGSum = 0;
  let totalLoad = 0;

  for (const item of items) {
    const carbs = item.calculated_carbs;
    totalCarbs += carbs;
    const ig = item.glycemic_index || 55; // Default average if not specifically measured
    weightedIGSum += ig * carbs;
    totalLoad += (ig * carbs) / 100;
  }

  const averageIG = totalCarbs > 0 ? Math.round(weightedIGSum / totalCarbs) : 50;
  const roundedLoad = Math.round(totalLoad);

  let speedCategory: 'slow' | 'medium' | 'fast' = 'medium';
  let speedLabel = 'Absorption Intermédiaire (Standard)';

  if (averageIG < 50 && roundedLoad < 20) {
    speedCategory = 'slow';
    speedLabel = 'Absorption Lente (Élévation progressive)';
  } else if (averageIG >= 65 || roundedLoad >= 30) {
    speedCategory = 'fast';
    speedLabel = 'Absorption Rapide (Pic précoce, pré-bolus 15-20 min conseillé)';
  }

  return {
    totalGlycemicLoad: roundedLoad,
    averageGlycemicIndex: averageIG,
    speedCategory,
    speedLabel,
  };
}

/**
 * Détection de repas riche en graisses et protéines tunisiens (FPU)
 * et suggestion d'un double bolus (Dual-Wave / Bolus carré)
 */
export function evaluateDualWaveBolus(
  items: { name_fr: string; confirmed_weight_g: number; carbs_per_100g: number; category?: string }[],
  totalBolusUnits: number
): {
  is_recommended: boolean;
  immediate_pct: number;
  immediate_units: number;
  extended_pct: number;
  extended_units: number;
  duration_hours: number;
  reason: string;
} | undefined {
  const highFatProteinKeywords = [
    'agneau',
    'merguez',
    'kadid',
    'fromage',
    'frit',
    'huile',
    'brik',
    'mlawi',
    'bazine',
    'chapati',
    'makloub',
    'kafteji',
    'viande',
    'plat riche',
    'thon',
    'tajine',
  ];

  const matchingItem = items.find((it) =>
    highFatProteinKeywords.some((kw) => it.name_fr.toLowerCase().includes(kw))
  );

  if (matchingItem && totalBolusUnits >= 3.0) {
    const immediateUnits = Math.round(totalBolusUnits * 0.6 * 2) / 2;
    const extendedUnits = Number((totalBolusUnits - immediateUnits).toFixed(1));

    return {
      is_recommended: true,
      immediate_pct: 60,
      immediate_units: immediateUnits,
      extended_pct: 40,
      extended_units: extendedUnits,
      duration_hours: 2.5,
      reason: `Repas tunisien riche en lipides/protéines (${matchingItem.name_fr}) retardant la vidange gastrique et provoquant une élévation glycémique tardive (2h–4h).`,
    };
  }

  return undefined;
}

/**
 * Arabic and Derja phonetic normalizer for resilient culinary matching
 */
export function normalizeCulinaryTerm(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove Arabic tashkeel / harakat
    .replace(/[ڤ]/g, 'ق') // map Tunisian 'ڤ' to 'ق' (ڤازوزة -> قازوزة)
    .replace(/(?:غ|ك)ازوز/g, 'قازوز') // map غازوزة / كازوزة -> قازوزة
    .replace(/[إأآا]/g, 'ا')
    .replace(/[ةه]/g, 'ة')
    .replace(/[ىي]/g, 'ي')
    .replace(/[_\-+/]/g, ' ')
    .trim();
}

/**
 * Deterministic helper to lookup food by French, Arabic, Derja or alias
 */
export function findFoodInDatabase(query: string): FoodItem | undefined {
  if (!query) return undefined;
  const rawQ = query.toLowerCase().trim();
  const normQ = normalizeCulinaryTerm(query);

  // 1. Specific High-Priority Tunisian Food & Beverage Matches
  // Gazouza / Soda detection (Crucial for T1D fast-sugar bolus calculation)
  const isSoda =
    normQ.includes('قازوز') || // catches ڤازوزة, قازوزة, غازوزة, ڤازوز, قازوز, غازوز
    rawQ.includes('gazouz') ||
    rawQ.includes('gazouza') ||
    rawQ.includes('soda') ||
    rawQ.includes('coca') ||
    rawQ.includes('boga') ||
    rawQ.includes('boisson gazeuse') ||
    rawQ.includes('canette');

  if (isSoda) {
    const isLight =
      normQ.includes('لايت') ||
      normQ.includes('زيرو') ||
      normQ.includes('بدون سكر') ||
      normQ.includes('بلا سكر') ||
      rawQ.includes('light') ||
      rawQ.includes('zero') ||
      rawQ.includes('zéro') ||
      rawQ.includes('sans sucre');

    const found = TUNISIAN_FOOD_DATABASE.find((i) => i.id === (isLight ? 'div-08' : 'div-07'));
    if (found) return found;
  }

  // Poulet / Viande de poulet
  if (normQ.includes('دجاج') || rawQ.includes('poulet') || rawQ.includes('djej')) {
    const found = TUNISIAN_FOOD_DATABASE.find((i) => i.id === 'div-16');
    if (found) return found;
  }

  // Couscous (Semoule de couscous)
  const isCouscous =
    normQ.includes('كسكسي') ||
    rawQ.includes('couscous') ||
    rawQ.includes('kousksi');

  const isStrictlyVegetables =
    normQ.startsWith('خضرة') ||
    normQ.startsWith('خضار') ||
    rawQ.startsWith('legume') ||
    rawQ.startsWith('légume') ||
    rawQ.includes('légumes de') ||
    rawQ.includes('legumes de');

  if (isCouscous && !isStrictlyVegetables) {
    const found = TUNISIAN_FOOD_DATABASE.find((i) => i.id === 'fec-07' || i.id === 'plat-01');
    if (found) return found;
  }

  // Légumes mijotés de couscous
  if (
    normQ.includes('خضرة') ||
    normQ.includes('خضار') ||
    rawQ.includes('legume') ||
    rawQ.includes('légume') ||
    rawQ.includes('khodhra')
  ) {
    const found = TUNISIAN_FOOD_DATABASE.find((i) => i.id === 'div-17');
    if (found) return found;
  }

  // 2. Direct Aliases Match
  for (const item of TUNISIAN_FOOD_DATABASE) {
    if (item.aliases && item.aliases.length > 0) {
      for (const alias of item.aliases) {
        const normAlias = normalizeCulinaryTerm(alias);
        if (normQ === normAlias || normQ.includes(normAlias) || normAlias.includes(normQ)) {
          return item;
        }
      }
    }
  }

  // 3. Name Match in Arabic, French, Tunisian Derja
  return TUNISIAN_FOOD_DATABASE.find((item) => {
    const itemNormAr = normalizeCulinaryTerm(item.name_ar || '');
    const itemNormFr = item.name_fr.toLowerCase();
    const itemNormTn = item.name_tn.toLowerCase();

    return (
      itemNormFr.includes(rawQ) ||
      itemNormTn.includes(rawQ) ||
      rawQ.includes(itemNormFr) ||
      rawQ.includes(itemNormTn) ||
      (itemNormAr && (normQ.includes(itemNormAr) || itemNormAr.includes(normQ)))
    );
  });
}

/**
 * Deterministic calculation formula:
 * Carbs are never floating decimals in user output.
 * Output is strictly rounded integer approximating real-life measurement.
 */
export function calculateCarbsDeterministically(
  weight_g: number,
  carbs_per_100g: number
): number {
  if (weight_g <= 0 || carbs_per_100g <= 0) return 0;
  return Math.round((weight_g * carbs_per_100g) / 100);
}
