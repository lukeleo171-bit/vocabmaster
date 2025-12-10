import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vocabstudy',
    short_name: 'Vocabstudy',
    description: 'Master vocabulary with AI-powered quizzes and personalized learning',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#1E1B2E',
    theme_color: '#8B5CF6',
    icons: [
      {
        src: '/api/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/api/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/api/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
