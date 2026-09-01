// Site-wide constants: navigation, contact details and the curated homepage copy.
// Navigation mirrors the menu structure of the original fosco.edu.gh site.

export const SITE = {
  name: 'Foso College of Education',
  short: 'FOSCO',
  tagline: 'Training quality teachers since 1965',
  motto: 'Character, Wisdom, Knowledge',
  logo: '/media/2021/12/FOSCO-LOGO-HEAD-new-1.svg',
  logoLight: '/media/2021/12/FOSCO-LOGO-HEAD-new-1.svg',
  established: 1965,
};

export const CAMPUS_HIGHLIGHTS = [
  {
    title: 'Fully residential',
    text: 'A welcoming campus with halls of residence and student support close at hand.',
    icon: 'building',
    href: '/campus-life',
  },
  {
    title: 'Quality programmes',
    text: 'Teacher education programmes affiliated to the University of Cape Coast.',
    icon: 'book',
    href: '/academic-programmes',
  },
  {
    title: 'Seven departments',
    text: 'Specialist departments prepare confident, capable teachers for Ghanaian schools.',
    icon: 'users',
    href: '/departments',
  },
  {
    title: 'Student wellbeing',
    text: 'Guidance, counselling and an inclusive community support every student.',
    icon: 'heart',
    href: '/counselling',
  },
];

export const CONTACT = {
  phone: '+233 303-981-273',
  phoneHref: 'tel:+233303981273',
  email: 'info@fosco.edu.gh',
  address: ['Assin Fosu–Kumasi Road', 'P.O. Box 87, Assin Fosu', 'Central Region, Ghana'],
  social: [
    { label: 'Facebook', href: 'https://www.facebook.com/fosocollegeofficial/', icon: 'facebook' },
  ],
};

export const ADMISSIONS = {
  academicYear: '2026/2027',
  deadline: '30 September 2026',
  fee: 'GHS 350',
  portal: 'https://admission.coeportal.edu.gh/',
};

export const NAV = [
  { label: 'Home', href: '/' },
  {
    label: 'About',
    children: [
      { label: 'About Us', href: '/about-us' },
      { label: 'Mission & Vision', href: '/mission-vision' },
      { label: 'Principal', href: '/principal' },
      { label: 'Management', href: '/management' },
      { label: 'Officers', href: '/officers' },
      { label: 'Accreditation', href: '/accreditation' },
    ],
  },
  {
    label: 'Academics',
    children: [
      { label: 'Departments', href: '/departments' },
      { label: 'Academic Programmes', href: '/academic-programmes' },
      { label: 'Academic Calendar', href: '/academic-calendar' },
      { label: 'Primary Education', href: '/primary-education' },
      { label: 'JHS Education', href: '/jhs-education' },
      { label: 'Library', href: '/library' },
    ],
  },
  {
    label: 'Admissions',
    children: [
      { label: 'Admission to FOSCO', href: '/admission-to-foso-college-of-education' },
      { label: 'Admission List', href: '/admission-list' },
      { label: 'Admission Policy', href: '/admission-policy' },
      { label: 'Fees Schedule', href: '/fees-schedule' },
    ],
  },
  {
    label: 'Students',
    children: [
      { label: 'Campus Life', href: '/campus-life' },
      { label: 'Counselling', href: '/counselling' },
      { label: 'Student Handbook', href: '/student_handbook' },
      { label: 'Policies', href: '/policies' },
      { label: 'Alumni', href: '/alumni' },
    ],
  },
  {
    label: 'News',
    children: [
      { label: 'News', href: '/news' },
      { label: 'Events', href: '/events' },
      { label: 'Gallery', href: '/gallery' },
    ],
  },
  { label: 'Contact', href: '/contact-us' },
];

export const FOOTER_LINKS = [
  { label: 'About Us', href: '/about-us' },
  { label: 'Departments', href: '/departments' },
  { label: 'Admissions', href: '/admission-to-foso-college-of-education' },
  { label: 'Fees Schedule', href: '/fees-schedule' },
  { label: 'Academic Calendar', href: '/academic-calendar' },
  { label: 'Campus Life', href: '/campus-life' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'News', href: '/news' },
];

/** Homepage hero rotation — headlines from the original slider, over campus photography. */
export const HERO_SLIDES = [
  {
    image: '/media/2022/07/99A5086-scaled.jpg',
    eyebrow: `Established since ${SITE.established}`,
    title: 'A centre of excellence for training quality teachers',
    lead: 'Foso College of Education has been a place of learning, expression, innovation and discourse since its opening in 1965.',
  },
  {
    image: '/media/2022/07/99A5211-2.jpg',
    eyebrow: 'Fully residential',
    title: 'We are a fully residential teacher training college',
    lead: 'Well equipped halls of residence, a modern library and an e-learning centre supporting every student on campus.',
  },
  {
    image: '/media/2022/07/99A5038-scaled-e1658783648572.jpg',
    eyebrow: 'Welcoming & diverse',
    title: 'Become a dedicated and functional basic school teacher',
    lead: 'Affiliated to the University of Cape Coast, running a four-year Bachelor of Education programme.',
  },
];

/** The seven teaching departments, with the summaries used on the original homepage. */
export const DEPARTMENTS = [
  {
    name: 'Languages Department',
    href: '/languages-department',
    image: '/media/2022/07/99A5227-scaled-e1658944150880.jpg',
    summary:
      'The department aims at helping students to improve on their English and Ghanaian Language competencies for effective teaching and learning.',
  },
  {
    name: 'Creative Arts Department',
    href: '/creative-arts-department',
    image: '/media/2022/07/99A5066-e1658700530534.jpg',
    summary:
      'Developing creativity and aesthetic appreciation through music, visual art and performing arts for the basic school classroom.',
  },
  {
    name: 'Social Sciences Department',
    href: '/social-sciences-department',
    image: '/media/2022/07/99A5225-scaled-e1658946321859.jpg',
    summary:
      'The main aim of the department is to model students morally to enable them function effectively in society as teachers and citizens.',
  },
  {
    name: 'Mathematics & ICT Department',
    href: '/mathematics-ict',
    image: '/media/2022/07/99A5198-2-e1659381756541.jpg',
    summary:
      'The ultimate aim of the department is to equip students with the professional training to meet the demands of teaching mathematics and ICT.',
  },
  {
    name: 'Science Department',
    href: '/science-department',
    image: '/media/2022/07/99A5245-e1658947387434.jpg',
    summary:
      'The aim of the department is to equip students with professional skills to meet the challenges of teaching integrated science.',
  },
  {
    name: 'Vocational Skills Department',
    href: '/vocational-skills-department',
    image: '/media/2022/07/99A5267-scaled-e1658947990259.jpg',
    summary:
      'We focus on equipping students with the knowledge, skills and attitude needed to aid the teaching of vocational and technical subjects.',
  },
  {
    name: 'Education Studies Department',
    href: '/education-department',
    image: '/media/2022/07/99A5038-scaled-e1658783648572.jpg',
    summary:
      'Grounding trainees in the principles of education, child development, assessment and professional teaching practice.',
  },
];

export const STUDENT_GUIDE = [
  {
    title: 'Campus Facilities',
    href: '/campus-life',
    text: 'The College has well equipped halls of residence for all students.',
    icon: 'building',
  },
  {
    title: 'Policies & Regulations',
    href: '/policies',
    text: 'The institution is well managed and guided by these policies.',
    icon: 'shield',
  },
  {
    title: 'Counselling & Guidance',
    href: '/counselling',
    text: 'Staff and students are encouraged to seek guidance and counselling.',
    icon: 'heart',
  },
];

export const PILLARS = [
  { title: 'Fully residential', text: 'A fully residential teacher training college with halls for every student.' },
  { title: 'Welcoming & diverse', text: 'We are welcoming, diverse and passionate about training teachers.' },
  { title: 'Functional teachers', text: 'Become a dedicated and functional basic school teacher.' },
  { title: 'Centre of excellence', text: 'A centre of excellence for training quality teachers.' },
];

export const STATS = [
  { value: '1965', label: 'Established' },
  { value: '4', label: 'Year B.Ed. programme' },
  { value: '7', label: 'Departments' },
  { value: '60+', label: 'Years of service' },
];

/** Ticker copy — the College's motto and defining facts. */
export const MARQUEE = [
  'Character',
  'Wisdom',
  'Knowledge',
  'Established 1965',
  'Affiliated to the University of Cape Coast',
  'Fully residential',
  'Four-year Bachelor of Education',
  'Assin Fosu · Central Region',
];

/** Milestones drawn from the College's own history pages. */
export const TIMELINE = [
  {
    year: '1965',
    title: 'Founded as Foso Training College',
    text: 'Opened on 15 November as one of the Ghana Education Trust complexes by Ghana’s first President, Dr. Kwame Nkrumah — 240 students and 9 teaching staff under Mr. R. R. Essah.',
  },
  {
    year: '1965–2011',
    title: 'Every national programme, run here',
    text: 'From the Post-Middle and Post-‘B’ Certificate ‘A’ groups through specialist programmes in Agricultural Science, Mathematics and Science, to the Diploma in Basic Education.',
  },
  {
    year: '2018',
    title: 'Dr. Anthony Baabereyir becomes Principal',
    text: 'Formerly of the University of Education, Winneba, where he led the departments of Business Education, Geography Education and the Centre for African Studies.',
  },
  {
    year: '2025',
    title: 'Strategic Plan 2024–2028 launched',
    text: 'A roadmap for institutional growth and academic excellence, launched at the College in February 2025.',
  },
  {
    year: 'Today',
    title: 'A four-year Bachelor of Education',
    text: 'Affiliated to the University of Cape Coast, running the Bachelor of Education (JHS) and the Diploma in Basic Education for 1,185 students.',
  },
];

/**
 * Campus-life photo strip: one lead image plus four tiles, which fills the
 * 4x2 mosaic grid exactly (see .mosaic in decor.css).
 */
export const MOSAIC = [
  '/media/2022/07/99A5086-scaled.jpg',
  '/media/2022/07/99A4990.jpg',
  '/media/2022/07/99A5028-scaled.jpg',
  '/media/2022/07/99A5211-3.jpg',
  '/media/2022/07/99A4987-scaled.jpg',
];

export const PRINCIPAL = {
  name: 'Dr. Anthony Baabereyir',
  role: 'Principal, Foso College of Education',
  image: '/media/2022/08/99A6098-e1659698517746.jpg',
  quote:
    'At Foso College of Education, we are immensely passionate about shaping the next generation of teachers for Ghana’s basic schools.',
  detail:
    'PhD in Geography (Nottingham), MPhil (Trondheim). He assumed the role of Principal on 1 November 2018.',
};

/** The three words of the College motto, expanded. */
export const MOTTO_PILLARS = [
  {
    word: 'Character',
    text: 'Trainees are modelled morally to function effectively in society as teachers and as citizens.',
  },
  {
    word: 'Wisdom',
    text: 'Professional competence and sound judgement, built through practice in real basic-school classrooms.',
  },
  {
    word: 'Knowledge',
    text: 'Deep subject grounding across seven departments, from languages and science to vocational skills.',
  },
];
