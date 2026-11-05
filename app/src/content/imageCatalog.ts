export type SiteImageKey =
  | 'heroDesktop'
  | 'heroMobile'
  | 'workDiscover'
  | 'workDocument'
  | 'workRecognise'
  | 'workPromote'
  | 'workPromoteMobile'
  | 'artistVocalist'
  | 'artistInstrumentalist'
  | 'artistDancer'
  | 'artistPercussionist'
  | 'heritageMusic'
  | 'heritageInstruments'
  | 'heritageDance'
  | 'heritageOralTraditions'

export type ImageGroup = 'Homepage' | 'What we do' | 'Artists' | 'Cultural heritage'

export type ImageDefinition = {
  key: SiteImageKey
  label: string
  description: string
  group: ImageGroup
  defaultSrc: string
  ratio: 'landscape' | 'portrait'
}

export const imageGroups: ImageGroup[] = ['Homepage', 'What we do', 'Artists', 'Cultural heritage']

export const imageCatalog: ImageDefinition[] = [
  { key: 'heroDesktop', label: 'Homepage — desktop', description: 'Primary cinematic hero photograph', group: 'Homepage', defaultSrc: '/images/dvp-hero.avif', ratio: 'landscape' },
  { key: 'heroMobile', label: 'Homepage — mobile', description: 'Portrait composition for smaller screens', group: 'Homepage', defaultSrc: '/images/dvp-hero-mobile-full.avif', ratio: 'portrait' },
  { key: 'workDiscover', label: 'Discover', description: 'Field research and artist outreach', group: 'What we do', defaultSrc: '/images/work-discover.avif', ratio: 'landscape' },
  { key: 'workDocument', label: 'Document', description: 'Interviews and cultural documentation', group: 'What we do', defaultSrc: '/images/work-document.avif', ratio: 'landscape' },
  { key: 'workRecognise', label: 'Recognise', description: 'Editorial recognition portrait', group: 'What we do', defaultSrc: '/images/work-recognise.avif', ratio: 'landscape' },
  { key: 'workPromote', label: 'Promote — desktop', description: 'Performance and cultural visibility', group: 'What we do', defaultSrc: '/images/work-promote.avif', ratio: 'landscape' },
  { key: 'workPromoteMobile', label: 'Promote — mobile', description: 'Mobile performance composition', group: 'What we do', defaultSrc: '/images/work-promote-mobile.avif', ratio: 'portrait' },
  { key: 'artistVocalist', label: 'Manganiyar voices', description: 'Vocal tradition portrait', group: 'Artists', defaultSrc: '/images/artist-vocalist.avif', ratio: 'portrait' },
  { key: 'artistInstrumentalist', label: 'Folk instrumentalists', description: 'Instrumental tradition portrait', group: 'Artists', defaultSrc: '/images/artist-instrumentalist.avif', ratio: 'portrait' },
  { key: 'artistDancer', label: 'Folk dancers', description: 'Dance tradition portrait', group: 'Artists', defaultSrc: '/images/artist-dancer.avif', ratio: 'portrait' },
  { key: 'artistPercussionist', label: 'Rhythm keepers', description: 'Percussion tradition portrait', group: 'Artists', defaultSrc: '/images/artist-percussionist.avif', ratio: 'portrait' },
  { key: 'heritageMusic', label: 'Folk music', description: 'Music heritage feature image', group: 'Cultural heritage', defaultSrc: '/images/heritage-music.avif', ratio: 'portrait' },
  { key: 'heritageInstruments', label: 'Instruments & craft', description: 'Instrument heritage feature image', group: 'Cultural heritage', defaultSrc: '/images/heritage-instruments.avif', ratio: 'portrait' },
  { key: 'heritageDance', label: 'Dance & movement', description: 'Dance heritage feature image', group: 'Cultural heritage', defaultSrc: '/images/heritage-dance.avif', ratio: 'portrait' },
  { key: 'heritageOralTraditions', label: 'Oral traditions', description: 'Oral history feature image', group: 'Cultural heritage', defaultSrc: '/images/heritage-oral-traditions.avif', ratio: 'portrait' },
]
