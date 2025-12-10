import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vocabstudy',
    short_name: 'Vocabstudy',
    description: 'Master vocabulary with AI-powered quizzes and personalized learning',
    start_url: '/',
    display: 'standalone',
    background_color: '#1E1B2E',
    theme_color: '#8B5CF6',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/apple-icon.svg',
        sizes: '180x180',
        type: 'image/svg+xml',
      },
    ],
  }
}
