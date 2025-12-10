import { NextResponse } from 'next/server'
import sharp from 'sharp'

export async function GET() {
  const svg = `<svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="180" height="180" rx="40" fill="#1E1B2E"/>
    <rect x="40" y="110" width="20" height="50" rx="5" fill="#A78BFA"/>
    <rect x="70" y="70" width="20" height="90" rx="5" fill="#A78BFA"/>
    <rect x="100" y="20" width="20" height="140" rx="5" fill="#A78BFA"/>
  </svg>`
  
  try {
    const png = await sharp(Buffer.from(svg))
      .resize(180, 180)
      .png()
      .toBuffer()
    
    return new NextResponse(png, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    // Fallback to SVG if sharp fails
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  }
}

