export interface PresetMealSample {
  id: string;
  name: string;
  name_ar: string;
  category: string;
  description: string;
  sample_image_url: string;
  default_items: {
    name_fr: string;
    name_ar: string;
    estimated_weight_g: number;
    carbs_per_100g: number;
    confidence: 'high' | 'medium' | 'low';
  }[];
}

export const SAMPLE_MEAL_PRESETS: PresetMealSample[] = [
  {
    id: 'sample-couscous',
    name: 'Couscous agneau, légumes et pois chiches',
    name_ar: 'كسكسي بلحم الخروف والخضار',
    category: 'Plat tunisien familial',
    description: 'Assiette traditionnelle de semoule fine vapeur avec carottes, courgettes, pois chiches et morceau d’agneau.',
    sample_image_url: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=800&auto=format&fit=crop&q=80',
    default_items: [
      { name_fr: 'Couscous (semoule cuite vapeur)', name_ar: 'كسكسي مطبوخ', estimated_weight_g: 220, carbs_per_100g: 28, confidence: 'high' },
      { name_fr: 'Pois chiches cuits', name_ar: 'حمص مسلوق', estimated_weight_g: 40, carbs_per_100g: 20, confidence: 'high' },
      { name_fr: 'Légumes mijotés (carottes & courgettes)', name_ar: 'خضار مطبوخة', estimated_weight_g: 80, carbs_per_100g: 6, confidence: 'medium' },
      { name_fr: 'Viande d’agneau', name_ar: 'لحم خروف', estimated_weight_g: 90, carbs_per_100g: 0, confidence: 'high' },
    ],
  },
  {
    id: 'sample-lablabi',
    name: 'Lablabi tunisien complet au thon et œuf poché',
    name_ar: 'لبلابي تونسي كامل بالعظمة والتن',
    category: 'Street food traditionnel',
    description: 'Bol de pois chiches parfumés au cumin et harissa, morceaux de pain rassis trempés, œuf mi-cuit et thon.',
    sample_image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
    default_items: [
      { name_fr: 'Pois chiches en bouillon', name_ar: 'حمص في المرق', estimated_weight_g: 180, carbs_per_100g: 19, confidence: 'high' },
      { name_fr: 'Pain rassis trempé', name_ar: 'خبز يابس منقوع', estimated_weight_g: 75, carbs_per_100g: 48, confidence: 'medium' },
      { name_fr: 'Œuf poché', name_ar: 'بيضة مسلوقة', estimated_weight_g: 50, carbs_per_100g: 1, confidence: 'high' },
      { name_fr: 'Thon à l’huile', name_ar: 'تن بالزيت', estimated_weight_g: 35, carbs_per_100g: 0, confidence: 'high' },
    ],
  },
  {
    id: 'sample-ojja',
    name: 'Ojja merguez avec pain Tabouna',
    name_ar: 'عجة بالمرقاز والبيض مع خبز طابونة',
    category: 'Plat mijoté rapide',
    description: 'Poêlon de sauce tomate relevée aux piments avec merguez, 2 œufs fondants et 1/2 pain tabouna chaud.',
    sample_image_url: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&auto=format&fit=crop&q=80',
    default_items: [
      { name_fr: 'Ojja sauce tomate & piments', name_ar: 'صلصة العجة', estimated_weight_g: 180, carbs_per_100g: 4, confidence: 'high' },
      { name_fr: 'Merguez & 2 œufs', name_ar: 'مرقاز وبيض', estimated_weight_g: 140, carbs_per_100g: 1, confidence: 'high' },
      { name_fr: 'Pain Tabouna traditionnel', name_ar: 'خبز طابونة', estimated_weight_g: 75, carbs_per_100g: 48, confidence: 'high' },
    ],
  },
  {
    id: 'sample-makrouna',
    name: 'Makrouna bel salsa (Pâtes sauce rouge piquante)',
    name_ar: 'مقرونة بالصلصة التونسية الحارة',
    category: 'Plat quotidien',
    description: 'Pâtes penne, sauce rouge tomate ail harissa, poulet et piment frit.',
    sample_image_url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?w=800&auto=format&fit=crop&q=80',
    default_items: [
      { name_fr: 'Pâtes cuites en sauce tomate', name_ar: 'مقرونة بالصلصة', estimated_weight_g: 270, carbs_per_100g: 22, confidence: 'high' },
      { name_fr: 'Poulet rôti mijoté', name_ar: 'دجاج محمر', estimated_weight_g: 90, carbs_per_100g: 0, confidence: 'high' },
      { name_fr: 'Pain blanc d’accompagnement', name_ar: 'قطعة خبز أبيض', estimated_weight_g: 40, carbs_per_100g: 50, confidence: 'high' },
    ],
  },
  {
    id: 'sample-brik',
    name: 'Brik à l’œuf, thon et Salade Méchouia',
    name_ar: 'بريكة بالعظمة وسلاطة مشوية',
    category: 'Entrée / Ramadan',
    description: 'Brik croustillante à la feuille de malsouka avec salade méchouia tunisienne.',
    sample_image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
    default_items: [
      { name_fr: 'Brik à l’œuf et au thon', name_ar: 'بريكة بالعظمة والتن', estimated_weight_g: 90, carbs_per_100g: 16, confidence: 'high' },
      { name_fr: 'Salade Méchouia au thon', name_ar: 'سلاطة مشوية', estimated_weight_g: 120, carbs_per_100g: 3.5, confidence: 'high' },
      { name_fr: 'Pain Tabouna', name_ar: 'خبز طابونة', estimated_weight_g: 35, carbs_per_100g: 48, confidence: 'high' },
    ],
  },
  {
    id: 'sample-dessert',
    name: 'Makroudh de Kairouan et Dattes Deglet Nour',
    name_ar: 'مقروض قيرواني وتمر دقلة النور',
    category: 'Pâtisserie & collation',
    description: 'Pâtisseries tunisiennes aux dattes dorées au miel avec thé à la menthe.',
    sample_image_url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&auto=format&fit=crop&q=80',
    default_items: [
      { name_fr: 'Makroudh kairouanais aux dattes', name_ar: 'مقروض قيرواني', estimated_weight_g: 80, carbs_per_100g: 65, confidence: 'high' },
      { name_fr: 'Dattes Deglet Nour (3 pièces)', name_ar: 'تمر دقلة النور', estimated_weight_g: 35, carbs_per_100g: 68, confidence: 'high' },
    ],
  }
];
